const semver = require("semver");
const path = require("path");

module.exports = ({ githubFacade, version, artifactClient, core, fs }) => async () => {

  const issueTitle = semver.coerce(version).raw;
  const issueNumber = await githubFacade.findIssueNumberByIssueTitle(issueTitle);
  await githubFacade.createIssueComment(issueNumber, `Released ${version}`);

  const prerelease = semver.prerelease(version) !== null;
  if (!prerelease) {
    await githubFacade.closeIssue(issueNumber);
  }

  const uploadUrl = await githubFacade.createRelease({
    tag_name: `v${version}`,
    name: version,
    body: version,
    prerelease
  });
  const downloadResponse = await artifactClient.downloadAllArtifacts();
  core.info("Downloaded artifacts");
  core.info(JSON.stringify(downloadResponse, null, 2));
  for (const response of downloadResponse) {
    const files = await fs.readdir(response.downloadPath);
    for (const filename of files) {
      core.info(path.join(response.downloadPath, filename));
      githubFacade.uploadReleaseAsset(
        uploadUrl,
        path.join(response.downloadPath, filename)
      );
    }
  }
}