
const semver = require("semver");
const assert = require("./assert");

module.exports = ({ githubFacade, newVersion, ref }) => async () => {

  assert(semver.valid(newVersion), `New version is not a valid semantic version: ${newVersion}`);

  const packageVersion = await githubFacade.getPackageVersion(ref);

  assert(semver.gt(newVersion, packageVersion), `Versions must be increasing. Attempted ${packageVersion} => ${newVersion}`);
}