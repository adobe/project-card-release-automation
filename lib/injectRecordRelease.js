const semver = require("semver");

module.exports = ({ githubFacade, version, artifactClient, core }) => async () => {

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
  downloadResponse.forEach(response => {
    githubFacade.uploadReleaseAsset(uploadUrl, response.downloadPath);
  });
}