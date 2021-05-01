/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const semver = require("semver");
const softAssert = require("./softAssert");

module.exports = ({ githubFacade, ref }) => async () => {
  const packageVersion = await githubFacade.getPackageVersion(ref);

  softAssert(
    semver.valid(packageVersion),
    `Invalid release version in package.json: ${packageVersion}`
  );
  const prerelease = semver.prerelease(packageVersion);
  softAssert(prerelease, "No pre-release candidate to release.");
  softAssert(
    prerelease.length >= 2,
    "Pre-release part of the version must have at least 2 parts."
  );

  // increment version string
  const newVersion = semver.inc(packageVersion, "prerelease");
  // todo: find the issue url
  return { ref, inputs: { version: newVersion } };
};
