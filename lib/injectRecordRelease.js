const semver = require("semver");
const path = require("path");

module.exports = ({ githubFacade, version, artifactClient, core, fs }) => async () => {

  const issueTitle = semver.coerce(version).raw;
  const issueNumber = await githubFacade.findIssueNumberByIssueTitle(issueTitle);
  core.info("Creating release comment");
  await githubFacade.createIssueComment(issueNumber, `Released ${version}`);

  const prerelease = semver.prerelease(version) !== null;
  if (!prerelease) {
    core.info("Closing issue");
    await githubFacade.closeIssue(issueNumber);
  }

  const uploadUrl = await githubFacade.createRelease({
    tag_name: `v${version}`,
    name: version,
    body: version,
    prerelease
  });
  const downloadResponse = await artifactClient.downloadAllArtifacts();

  for (const response of downloadResponse) {
    const files = await fs.readdir(response.downloadPath);
    for (const filename of files) {
      const fullPath = path.join(response.downloadPath, filename);
      core.info(`Uploading ${fullPath} to release.`);
      githubFacade.uploadReleaseAsset(uploadUrl, fullPath);
    }
  }
}