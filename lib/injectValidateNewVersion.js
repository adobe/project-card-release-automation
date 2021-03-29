
const semver = require("semver");
const assert = require("./assert");

module.exports = ({ githubFacade, version, ref }) => async () => {

  assert(semver.valid(version), `New version is not a valid semantic version: ${version}`);

  const packageVersion = await githubFacade.getPackageVersion(ref);

  assert(semver.gt(version, packageVersion), `Versions must be increasing. Attempted ${packageVersion} => ${version}`);
}