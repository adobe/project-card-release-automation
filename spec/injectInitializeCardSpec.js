const injectInitializeCard = require("../lib/injectInitializeCard");
const expectError = require("./helpers/expectError");

describe("initializeCard", () => {
  let packageVersion;
  let githubFacade;
  const projectNumber = 42;
  let core;
  let initializeCard;

  beforeEach(() => {
    packageVersion = "1.2.3";
    githubFacade = jasmine.createSpyObj("githubFacade", [
      "createIssue",
      "fetchProjectId",
      "fetchColumnIdByName",
      "createIssueCard"
    ]);
    githubFacade.createIssue.and.returnValue("myissueid");
    githubFacade.fetchProjectId.and.returnValue("myprojectid");
    githubFacade.fetchColumnIdByName.and.returnValue("mycolumnid");

    core = jasmine.createSpyObj("core", ["info"]);
  });

  const build = () => {
    initializeCard = injectInitializeCard({
      packageVersion,
      githubFacade,
      projectNumber,
      core
    });
  }

  it("checks for invalid release types", async () => {
    build();
    expectError(
      () => initializeCard("prerelease"),
      "`releaseType` must be major, minor, or patch."
    );
  });

  it("checks for prerelease qualifiers on the existing package version", async () => {
    packageVersion = "1.2.3-alpha.1";
    build();
    expectError(
      () => initializeCard("minor"),
      "Package.json should contain a version with no prerelease qualifiers, got 1.2.3-alpha.1"
    );
  });

  it("increments major", async () => {
    build();
    await initializeCard("major");
    expect(githubFacade.createIssue).toHaveBeenCalledOnceWith({
      title: "2.0.0",
      body: jasmine.anything()
    });
  });

  it("increments minor", async () => {
    build();
    await initializeCard("minor");
    expect(githubFacade.createIssue).toHaveBeenCalledOnceWith({
      title: "1.3.0",
      body: jasmine.anything()
    });
  });

  it("increments patch", async () => {
    build();
    await initializeCard("patch");
    expect(githubFacade.createIssue).toHaveBeenCalledOnceWith({
      title: "1.2.4",
      body: jasmine.anything()
    });
  });

  it("creates the card", async () => {
    build();
    await initializeCard("major");
    expect(githubFacade.createIssueCard).toHaveBeenCalledOnceWith("mycolumnid", "myissueid");
  });

  it("logs a message", async () => {
    build();
    await initializeCard("major");
    expect(core.info).toHaveBeenCalledOnceWith("Created release card: 2.0.0");
  });
});