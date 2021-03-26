
const semver = require("semver");
const assert = require("./assert");

module.exports = ({ packageVersion }) => newVersion => {

  assert(semver.valid(newVersion), `New version is not a valid semantic version: ${newVersion}`);
  assert(semver.gt(newVersion, packageVersion), `Versions must be increasing. Attempted ${packageVersion} => ${newVersion}`);

}