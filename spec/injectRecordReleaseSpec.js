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

const { default: defer } = require("promise.defer");
const flushPromises = require("flush-promises");
const injectRecordRelease = require("../lib/injectRecordRelease");

describe("recordRelease", () => {
  let githubFacade;
  let artifactClient;
  let version;
  let fs;
  let core;

  beforeEach(() => {
    githubFacade = jasmine.createSpyObj("githubFacade", [
      "findIssueNumberByIssueTitle",
      "createIssueComment",
      "closeIssue",
      "createRelease",
      "uploadReleaseAsset",
    ]);
    artifactClient = jasmine.createSpyObj("artifactClient", [
      "downloadAllArtifacts",
    ]);
    artifactClient.downloadAllArtifacts.and.returnValue(Promise.resolve([]));
    fs = jasmine.createSpyObj("fs", ["readdir"]);
    core = jasmine.createSpyObj("core", ["info"]);
    githubFacade.uploadReleaseAsset.and.returnValue(Promise.resolve);
  });

  const run = async () => {
    const recordRelease = injectRecordRelease({
      githubFacade,
      version,
      artifactClient,
      core,
      fs,
    });
    await recordRelease();
  };

  it("finds the issue when there is a prerelease qualifier", async () => {
    version = "1.2.3-alpha.0";
    await run();
    expect(githubFacade.findIssueNumberByIssueTitle).toHaveBeenCalledOnceWith(
      "1.2.3"
    );
  });

  it("finds the issue when there is no prerelease qualifier", async () => {
    version = "1.2.3";
    await run();
    expect(githubFacade.findIssueNumberByIssueTitle).toHaveBeenCalledOnceWith(
      "1.2.3"
    );
  });

  it("comments on the release", async () => {
    version = "1.2.3-alpha.0";
    githubFacade.findIssueNumberByIssueTitle.and.returnValue(
      Promise.resolve(42)
    );
    await run();
    expect(githubFacade.createIssueComment).toHaveBeenCalledOnceWith(
      42,
      "Released 1.2.3-alpha.0"
    );
  });

  it("closes the issue", async () => {
    version = "1.2.3";
    githubFacade.findIssueNumberByIssueTitle.and.returnValue(
      Promise.resolve(42)
    );
    await run();
    expect(githubFacade.closeIssue).toHaveBeenCalledOnceWith(42);
  });

  it("doesn't close the issue", async () => {
    version = "1.2.3-alpha.0";
    githubFacade.findIssueNumberByIssueTitle.and.returnValue(
      Promise.resolve(42)
    );
    await run();
    expect(githubFacade.closeIssue).not.toHaveBeenCalled();
  });

  it("creates a final release", async () => {
    version = "1.2.3";
    await run();
    expect(githubFacade.createRelease).toHaveBeenCalledOnceWith({
      tagName: "v1.2.3",
      name: "1.2.3",
      body: "1.2.3",
      prerelease: false,
    });
  });

  it("creates a prerelease", async () => {
    version = "1.2.3-beta.3";
    await run();
    expect(githubFacade.createRelease).toHaveBeenCalledOnceWith({
      tagName: "v1.2.3-beta.3",
      name: "1.2.3-beta.3",
      body: "1.2.3-beta.3",
      prerelease: true,
    });
  });

  it("uploads artifacts", async () => {
    version = "1.2.3";
    githubFacade.createRelease.and.returnValue(Promise.resolve("myuploadurl"));
    artifactClient.downloadAllArtifacts.and.returnValue(
      Promise.resolve([
        { downloadPath: "/my/path/myartifact1" },
        { downloadPath: "/my/path/myartifact2" },
      ])
    );
    fs.readdir.and.returnValues(
      Promise.resolve(["index.js"]),
      Promise.resolve(["index.zip"])
    );
    await run();
    expect(githubFacade.uploadReleaseAsset).toHaveBeenCalledWith(
      "myuploadurl",
      "/my/path/myartifact1/index.js"
    );
    expect(githubFacade.uploadReleaseAsset).toHaveBeenCalledWith(
      "myuploadurl",
      "/my/path/myartifact2/index.zip"
    );
  });

  it("waits for the release assets to be done", async () => {
    version = "1.2.3";
    githubFacade.createRelease.and.returnValue(Promise.resolve("myuploadurl"));
    artifactClient.downloadAllArtifacts.and.returnValue(
      Promise.resolve([{ downloadPath: "/my/path/myartifact1" }])
    );
    const deferUpload = defer();
    fs.readdir.and.returnValue(Promise.resolve(["index.js"]));
    githubFacade.uploadReleaseAsset.and.returnValue(deferUpload.promise);
    let runDone = false;
    const runPromise = run().then(() => {
      runDone = true;
    });
    await flushPromises();
    expect(runDone).toBe(false);
    deferUpload.resolve();
    await runPromise;
  });
});
