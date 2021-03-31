const semver = require("semver");

module.exports = ({ githubFacade, version }) => async () => {

  const issueTitle = semver.coerce(version).raw;
  const issueNumber = await githubFacade.findIssueNumberByIssueTitle(issueTitle);
  await githubFacade.createIssueComment(issueNumber, `Released ${version}`);

  if (semver.prerelease(version) === null) {
    await githubFacade.closeIssue(issueNumber);
  }
}