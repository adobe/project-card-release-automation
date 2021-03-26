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
    const patchBranch = `${versionParts[0]}.${versionParts[1]}.x`;
    const minorBranch = `${versionParts[0]}.x`;

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
  softAssert(columnName !== "New", "Nothing to do when name moved to \"New\"");
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