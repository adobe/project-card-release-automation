const semver = require("semver");
const assert = require("./assert");
const softAssert = require("./softAssert");

module.exports = ({
  githubFacade,
  projectUrl,
  contentUrl,
  columnUrl,
  projectNumber }) => async () => {

  const { data: { number: contextProjectNumber } } = await githubFacade.getByUrl(projectUrl);
  softAssert(contextProjectNumber === projectNumber, "Card moved on non-release project.");

  const { data: { title: issueTitle, labels } } = await githubFacade.getByUrl(contentUrl);
  assert(semver.valid(issueTitle), `Issue name in project card is not a semantic version: ${issueTitle}`);
  assert(semver.prerelease(issueTitle) === null, `Issue name in project card should not have prerelease version: ${issueTitle}`);
  const branchLabel = labels.map(({ name }) => name).find(label => label.startsWith("branch:"))
  assert(branchLabel !== undefined, "Could not find label with branch name");
  const branchName = branchLabel.substring(7);
  assert(githubFacade.hasBranch(branchName), `Could not find branch named: ${branchName}`);
  const ref = `refs/heads/${branchName}`;

  const { data: { name: columnName } } = await githubFacade.getByUrl(columnUrl);
  softAssert(columnName !== "New", "Nothing to do when card moved to \"New\"");
  let newVersion;
  if (columnName === "Release") {
    newVersion = issueTitle;
  } else {
    newVersion = `${issueTitle}-${columnName.toLowerCase()}.0`;
  }

  softAssert(semver.valid(newVersion), `Invalid prerelease version: ${newVersion}`);

  return { ref, inputs: { version: newVersion } };
}