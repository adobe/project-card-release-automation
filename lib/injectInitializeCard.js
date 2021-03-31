const assert = require("./assert");
const semver = require("semver");

module.exports = ({ githubFacade, projectNumber, core, ref, releaseType }) => async () => {

  assert(
    releaseType === "major" || releaseType === "minor" || releaseType === "patch",
    "`releaseType` must be major, minor, or patch."
  );

  const packageVersion = await githubFacade.getPackageVersion(ref);

  assert(
    semver.prerelease(packageVersion) === null,
    `Package.json should contain a version with no prerelease qualifiers, got ${packageVersion}`
  );

  const newVersion = semver.inc(packageVersion, releaseType);

  const issueId = await githubFacade.createIssue({
    title: newVersion,
    body: `Track progress of release ${newVersion}.`,
    label: "release"
  });
  const projectId = await githubFacade.fetchProjectId(projectNumber);
  const columnId = await githubFacade.fetchColumnIdByName(projectId, "New");
  await githubFacade.createIssueCard(columnId, issueId);
  core.info(`Created release card: ${newVersion}`);
};