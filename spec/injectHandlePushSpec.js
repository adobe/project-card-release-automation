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

const injectHandlePush = require("../lib/injectHandlePush");
const expectSoftError = require("./helpers/expectSoftError");

describe("handlePush", () => {
  let githubFacade;
  const ref = "myref";
  let handlePush;

  beforeEach(() => {
    githubFacade = jasmine.createSpyObj("githubFacade", ["getPackageVersion"]);
    handlePush = injectHandlePush({ githubFacade, ref });
  });

  it("checks for invalid release versions in package.json", async () => {
    githubFacade.getPackageVersion.and.returnValue(Promise.resolve("foo.bar"));
    await expectSoftError(
      handlePush,
      "Invalid release version in package.json: foo.bar"
    );
  });
  it("checks that there is a prerelease version already in package.json", async () => {
    githubFacade.getPackageVersion.and.returnValue(Promise.resolve("1.2.3"));
    await expectSoftError(handlePush, "No pre-release candidate to release.");
  });

  it("checks that the prerelease format has at least two parts", async () => {
    githubFacade.getPackageVersion.and.returnValue(Promise.resolve("1.2.3-0"));
    await expectSoftError(
      handlePush,
      "Pre-release part of the version must have at least 2 parts."
    );
  });

  it("increments the version", async () => {
    githubFacade.getPackageVersion.and.returnValue(
      Promise.resolve("1.2.3-alpha.1")
    );
    expect(await handlePush()).toEqual({
      ref: "myref",
      inputs: {
        version: "1.2.3-alpha.2",
      },
    });
  });
});
