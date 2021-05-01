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

const injectValidateNewVersion = require("../lib/injectValidateNewVersion");
const expectError = require("./helpers/expectError");

describe("validateNewVersion", () => {
  const run = async (packageVersion, newVersion) => {
    const githubFacade = jasmine.createSpyObj("githubFacade", [
      "getPackageVersion",
    ]);
    githubFacade.getPackageVersion.and.returnValue(
      Promise.resolve(packageVersion)
    );
    const validateNewVersion = injectValidateNewVersion({
      githubFacade,
      ref: "myref",
      version: newVersion,
    });
    await validateNewVersion();
  };

  it("checks package version is valid", async () => {
    await expectError(
      () => run("1.2.3", "foo"),
      "New version is not a valid semantic version: foo"
    );
  });
  it("checks new version > package version", async () => {
    await expectError(
      () => run("1.2.3-beta.1", "1.2.3-alpha.2"),
      "Versions must be increasing. Attempted 1.2.3-beta.1 => 1.2.3-alpha.2"
    );
  });
});
