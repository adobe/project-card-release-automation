const injectRecordRelease = require("../lib/injectRecordRelease");

describe("recordRelease", () => {
  let githubFacade;
  let artifactClient;
  let version;

  beforeEach(() => {
    githubFacade = jasmine.createSpyObj("githubFacade", [
      "findIssueNumberByIssueTitle",
      "createIssueComment",
      "closeIssue",
      "createRelease",
      "uploadReleaseAsset"
    ]);
    artifactClient = jasmine.createSpyObj("artifactClient", [
      "downloadAllArtifacts"
    ]);
    artifactClient.downloadAllArtifacts.and.returnValue(Promise.resolve([]));
  });

  const run = async () => {
    const recordRelease = injectRecordRelease({
      githubFacade, version, artifactClient
    });
    await recordRelease();
  };

  it("finds the issue when there is a prerelease qualifier", async () => {
    version = "1.2.3-alpha.0";
    await run();
    expect(githubFacade.findIssueNumberByIssueTitle).toHaveBeenCalledOnceWith("1.2.3");
  });

  it("finds the issue when there is no prerelease qualifier", async () => {
    version = "1.2.3";
    await run();
    expect(githubFacade.findIssueNumberByIssueTitle).toHaveBeenCalledOnceWith("1.2.3");
  })

  it("comments on the release", async () => {
    version = "1.2.3-alpha.0";
    githubFacade.findIssueNumberByIssueTitle.and.returnValue(42);
    await run();
    expect(githubFacade.createIssueComment).toHaveBeenCalledOnceWith(42, "Released 1.2.3-alpha.0");
  });

  it("closes the issue", async () => {
    version = "1.2.3";
    githubFacade.findIssueNumberByIssueTitle.and.returnValue(42);
    await run();
    expect(githubFacade.closeIssue).toHaveBeenCalledOnceWith(42);
  });

  it("doesn't close the issue", async () => {
    version = "1.2.3-alpha.0";
    githubFacade.findIssueNumberByIssueTitle.and.returnValue(42);
    await run();
    expect(githubFacade.closeIssue).not.toHaveBeenCalled();
  });

  it("creates a final release", async () => {
    version = "1.2.3";
    await run();
    expect(githubFacade.createRelease).toHaveBeenCalledOnceWith({
      tag_name: "v1.2.3",
      name: "1.2.3",
      body: "1.2.3",
      prerelease: false
    });
  });

  it("creates a prerelease", async () => {
    version = "1.2.3-beta.3";
    await run();
    expect(githubFacade.createRelease).toHaveBeenCalledOnceWith({
      tag_name: "v1.2.3-beta.3",
      name: "1.2.3-beta.3",
      body: "1.2.3-beta.3",
      prerelease: true
    });
  });

  it("uploads artifacts", async () => {
    version = "1.2.3";
    githubFacade.createRelease.and.returnValue(Promise.resolve("myuploadurl"));
    artifactClient.downloadAllArtifacts.and.returnValue(Promise.resolve([
      { downloadPath: "./myartifact1/index.js" },
      { downloadPath: "./myartifact2/index.zip" }
    ]));
    await run();
    expect(githubFacade.uploadReleaseAsset).toHaveBeenCalledWith(
      "myuploadurl", "./myartifact1/index.js"
    );
    expect(githubFacade.uploadReleaseAsset).toHaveBeenCalledWith(
      "myuploadurl", "./myartifact2/index.zip"
    );

  })

});