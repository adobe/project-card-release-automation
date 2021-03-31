const injectRecordRelease = require("../lib/injectRecordRelease");

describe("recordRelease", () => {
  let githubFacade;
  let version;

  beforeEach(() => {
    githubFacade = jasmine.createSpyObj("githubFacade", ["findIssueNumberByIssueTitle", "createIssueComment", "closeIssue"]);
  });

  const run = async () => {
    const recordRelease = injectRecordRelease({
      githubFacade, version
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
});