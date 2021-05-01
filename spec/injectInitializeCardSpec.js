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

const injectInitializeCard = require("../lib/injectInitializeCard");
const expectError = require("./helpers/expectError");

describe("initializeCard", () => {
  let packageVersion;
  let githubFacade;
  const projectNumber = 42;
  let core;
  let releaseType;
  let initializeCard;
  let ref;

  beforeEach(() => {
    packageVersion = "1.2.3";
    ref = "refs/heads/mybranch";
    githubFacade = jasmine.createSpyObj("githubFacade", [
      "createIssue",
      "fetchProjectId",
      "fetchColumnIdByName",
      "createIssueCard",
      "getPackageVersion",
    ]);
    githubFacade.createIssue.and.returnValue(Promise.resolve("myissueid"));
    githubFacade.fetchProjectId.and.returnValue(Promise.resolve("myprojectid"));
    githubFacade.fetchColumnIdByName.and.returnValue(
      Promise.resolve("mycolumnid")
    );

    core = jasmine.createSpyObj("core", ["info"]);
  });

  const build = () => {
    githubFacade.getPackageVersion.and.returnValue(
      Promise.resolve(packageVersion)
    );
    initializeCard = injectInitializeCard({
      githubFacade,
      projectNumber,
      core,
      releaseType,
      ref,
    });
  };

  it("checks for invalid release types", async () => {
    releaseType = "prerelease";
    build();
    expectError(
      initializeCard,
      "`releaseType` must be major, minor, or patch."
    );
  });

  it("checks for prerelease qualifiers on the existing package version", async () => {
    packageVersion = "1.2.3-alpha.1";
    releaseType = "minor";
    build();
    expectError(
      initializeCard,
      "Package.json should contain a version with no prerelease qualifiers, got 1.2.3-alpha.1"
    );
  });

  it("increments major", async () => {
    releaseType = "major";
    build();
    await initializeCard();
    expect(githubFacade.createIssue).toHaveBeenCalledOnceWith({
      title: "2.0.0",
      body: jasmine.anything(),
      labels: ["release", "branch:mybranch"],
    });
  });

  it("increments minor", async () => {
    releaseType = "minor";
    build();
    await initializeCard();
    expect(githubFacade.createIssue).toHaveBeenCalledOnceWith({
      title: "1.3.0",
      body: jasmine.anything(),
      labels: ["release", "branch:mybranch"],
    });
  });

  it("increments patch", async () => {
    releaseType = "patch";
    build();
    await initializeCard();
    expect(githubFacade.createIssue).toHaveBeenCalledOnceWith({
      title: "1.2.4",
      body: jasmine.anything(),
      labels: ["release", "branch:mybranch"],
    });
  });

  it("creates the card", async () => {
    releaseType = "major";
    build();
    await initializeCard();
    expect(githubFacade.createIssueCard).toHaveBeenCalledOnceWith(
      "mycolumnid",
      "myissueid"
    );
  });

  it("logs a message", async () => {
    releaseType = "major";
    build();
    await initializeCard();
    expect(core.info).toHaveBeenCalledWith("Created card: 2.0.0");
  });

  it("gets the package version with the correct ref", async () => {
    releaseType = "major";
    build();
    await initializeCard();
    expect(githubFacade.getPackageVersion).toHaveBeenCalledOnceWith(
      "refs/heads/mybranch"
    );
  });
});
