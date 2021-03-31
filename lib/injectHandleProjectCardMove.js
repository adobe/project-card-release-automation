const semver = require("semver");
const softAssert = require("./softAssert");

module.exports = ({
  githubFacade,
  projectUrl,
  contentUrl,
  columnUrl,
  ref: contextRef,
  projectNumber }) => async () => {

  const findVersionBranch = async version => {
    const versionParts = version.split(".");
    const patchBranch = `v${versionParts[0]}.${versionParts[1]}`;
    const minorBranch = `v${versionParts[0]}`;

    if (await githubFacade.hasBranch(patchBranch)) {
      return `refs/heads/${patchBranch}`;
    }
    if (await githubFacade.hasBranch(minorBranch)) {
      return `refs/heads/${minorBranch}`;
    }
    return contextRef;
  };

  const { data: { number: contextProjectNumber } } = await githubFacade.getByUrl(projectUrl);
  softAssert(contextProjectNumber === projectNumber, "Card moved on non-release project.");

  const { data: { title: issueTitle } } = await githubFacade.getByUrl(contentUrl);
  softAssert(semver.valid(issueTitle), `Issue name in project card is not a semantic version: ${issueTitle}`);
  softAssert(semver.prerelease(issueTitle) === null, `Issue name in project card should not have prerelease version: ${issueTitle}`);

  const { data: { name: columnName } } = await githubFacade.getByUrl(columnUrl);
  softAssert(columnName !== "New", "Nothing to do when card moved to \"New\"");
  let newVersion;
  if (columnName === "Release") {
    newVersion = issueTitle;
  } else {
    newVersion = `${issueTitle}-${columnName.toLowerCase()}.0`;
  }

  softAssert(semver.valid(newVersion), `Invalid prerelease version: ${newVersion}`);

  const ref = await findVersionBranch(issueTitle);

  return { ref, inputs: { version: newVersion } };
}