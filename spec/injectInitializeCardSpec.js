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
    ref = "myref";
    githubFacade = jasmine.createSpyObj("githubFacade", [
      "createIssue",
      "fetchProjectId",
      "fetchColumnIdByName",
      "createIssueCard",
      "getPackageVersion"
    ]);
    githubFacade.createIssue.and.returnValue("myissueid");
    githubFacade.fetchProjectId.and.returnValue("myprojectid");
    githubFacade.fetchColumnIdByName.and.returnValue("mycolumnid");

    core = jasmine.createSpyObj("core", ["info"]);
  });

  const build = () => {
    githubFacade.getPackageVersion.and.returnValue(packageVersion);
    initializeCard = injectInitializeCard({
      githubFacade,
      projectNumber,
      core,
      releaseType,
      ref
    });
  }

  it("checks for invalid release types", async () => {
    releaseType = "prerelease";
    build();
    expectError(initializeCard,
      "`releaseType` must be major, minor, or patch."
    );
  });

  it("checks for prerelease qualifiers on the existing package version", async () => {
    packageVersion = "1.2.3-alpha.1";
    releaseType = "minor";
    build();
    expectError(initializeCard,
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
      label: "release"
    });
  });

  it("increments minor", async () => {
    releaseType = "minor";
    build();
    await initializeCard();
    expect(githubFacade.createIssue).toHaveBeenCalledOnceWith({
      title: "1.3.0",
      body: jasmine.anything(),
      label: "release"
    });
  });

  it("increments patch", async () => {
    releaseType = "patch";
    build();
    await initializeCard();
    expect(githubFacade.createIssue).toHaveBeenCalledOnceWith({
      title: "1.2.4",
      body: jasmine.anything(),
      label: "release"
    });
  });

  it("creates the card", async () => {
    releaseType = "major";
    build();
    await initializeCard();
    expect(githubFacade.createIssueCard).toHaveBeenCalledOnceWith("mycolumnid", "myissueid");
  });

  it("logs a message", async () => {
    releaseType = "major";
    build();
    await initializeCard();
    expect(core.info).toHaveBeenCalledOnceWith("Created release card: 2.0.0");
  });

  it("gets the package version with the correct ref", async () => {
    releaseType = "major";
    build();
    await initializeCard();
    expect(githubFacade.getPackageVersion).toHaveBeenCalledOnceWith("myref");
  })
});