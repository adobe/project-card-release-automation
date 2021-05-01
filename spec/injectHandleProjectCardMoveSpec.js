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

const injectHandleProjectCardMove = require("../lib/injectHandleProjectCardMove");
const expectError = require("./helpers/expectError");
const expectSoftError = require("./helpers/expectSoftError");

describe("handleProjectCardMove", () => {
  let githubFacade;
  const projectUrl = "myprojecturl";
  const contentUrl = "mycontenturl";
  const columnUrl = "mycolumnurl";
  const ref = "myref";
  const projectNumber = 42;
  let handleProjectCardMove;

  let projectResponse;
  let contentResponse;
  let columnResponse;

  beforeEach(() => {
    githubFacade = jasmine.createSpyObj("githubFacade", [
      "hasBranch",
      "getByUrl",
    ]);
    handleProjectCardMove = injectHandleProjectCardMove({
      githubFacade,
      projectUrl,
      contentUrl,
      columnUrl,
      ref,
      projectNumber,
    });
    projectResponse = { data: { number: 42 } };
    contentResponse = {
      data: { title: "1.2.3", labels: [{ name: "branch:main" }] },
    };
    columnResponse = { data: { name: "Alpha" } };

    githubFacade.getByUrl.and.callFake((url) => {
      if (url === projectUrl) {
        return Promise.resolve(projectResponse);
      }
      if (url === contentUrl) {
        return Promise.resolve(contentResponse);
      }
      if (url === columnUrl) {
        return Promise.resolve(columnResponse);
      }
      return Promise.reject(new Error(`unknown url ${url}`));
    });
    githubFacade.hasBranch.and.returnValue(Promise.resolve(true));
  });

  it("verifies the project number matches", async () => {
    projectResponse = { data: { number: 1 } };
    await expectSoftError(
      async () => handleProjectCardMove(),
      "Card moved on non-release project."
    );
  });

  it("verifies the issue on the project card is a semantic version", async () => {
    contentResponse = { data: { title: "foo.bar" } };
    await expectError(
      () => handleProjectCardMove(),
      "Issue name in project card is not a semantic version: foo.bar"
    );
  });

  it("verifies the issue in the project card doesn't have a prerelease suffix", async () => {
    contentResponse = { data: { title: "1.2.3-alpha.0" } };
    await expectError(
      () => handleProjectCardMove(),
      "Issue name in project card should not have prerelease version: 1.2.3-alpha.0"
    );
  });

  it("verifies the card wasn't moved to new", async () => {
    columnResponse = { data: { name: "New" } };
    await expectSoftError(
      () => handleProjectCardMove(),
      'Nothing to do when card moved to "New"'
    );
  });

  it("uses the card title as the version when moved to the Release column", async () => {
    columnResponse = { data: { name: "Release" } };
    const {
      inputs: { version },
    } = await handleProjectCardMove();
    expect(version).toEqual("1.2.3");
  });

  it("creates a prerelease version", async () => {
    columnResponse = { data: { name: "Beta" } };
    const {
      inputs: { version },
    } = await handleProjectCardMove();
    expect(version).toEqual("1.2.3-beta.0");
  });

  it("uses the branch from the label", async () => {
    contentResponse = {
      data: {
        title: "1.2.3",
        labels: [{ name: "release" }, { name: "branch:mybranch" }],
      },
    };
    const { ref: returnedRef } = await handleProjectCardMove();
    expect(returnedRef).toEqual("refs/heads/mybranch");
  });

  it("throws an error when there is no branch label", async () => {
    contentResponse = {
      data: { title: "1.2.3", labels: [{ name: "release" }] },
    };
    await expectError(
      async () => handleProjectCardMove(),
      "Could not find label with branch name"
    );
  });

  it("throws an error when the branch doesn't exist", async () => {
    githubFacade.hasBranch.and.returnValue(Promise.resolve(false));
    await expectError(
      async () => handleProjectCardMove(),
      "Could not find branch named: main"
    );
  });

  it("throws an error when the column name has a space in it.", async () => {
    columnResponse = { data: { name: "My Column" } };
    await expectSoftError(
      async () => handleProjectCardMove(),
      "Invalid prerelease version: 1.2.3-my column.0"
    );
  });
});
