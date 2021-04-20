const semver = require("semver");

module.exports = ({ githubFacade, version, artifactClient }) => async () => {

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
  downloadResponse.forEach(response => {
    githubFacade.uploadReleaseAsset(uploadUrl, response.downloadPath);
  });
}