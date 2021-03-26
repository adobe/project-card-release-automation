const semver = require("semver");
const softAssert = require("./softAssert");

module.exports = ({ packageVersion, ref }) => () => {

  softAssert(semver.valid(packageVersion), `Invalid release version in package.json: ${packageVersion}`);
  const prerelease = semver.prerelease(packageVersion);
  softAssert(prerelease, "No pre-release candidate to release.");
  softAssert(prerelease.length >= 2, "Pre-release part of the version must have at least 2 parts.");

  // increment version string
  const newVersion = semver.inc(packageVersion, "prerelease");
  // todo: find the issue url
  return { ref, inputs: { version: newVersion } };
};