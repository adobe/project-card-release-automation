const injectHandleProjectCardMove = require("../lib/injectHandleProjectCardMove");
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
    githubFacade = jasmine.createSpyObj("githubFacade", ["hasBranch", "getByUrl"]);
    handleProjectCardMove = injectHandleProjectCardMove({
      githubFacade,
      projectUrl,
      contentUrl,
      columnUrl,
      ref,
      projectNumber
    });
    projectResponse = { data: { number: 42 } };
    contentResponse = { data: { title: "1.2.3" } };
    columnResponse = { data: { name: "Alpha" } };
    githubFacade.getByUrl.and.callFake(url => {
      if (url === projectUrl) {
        return Promise.resolve(projectResponse);
      }
      if (url === contentUrl) {
        return Promise.resolve(contentResponse);
      }
      if (url === columnUrl) {
        return Promise.resolve(columnResponse);
      }
    });
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
    await expectSoftError(
      () => handleProjectCardMove(),
      "Issue name in project card is not a semantic version: foo.bar"
    );
  });

  it("verifies the issue in the project card doesn't have a prerelease suffix", async () => {
    contentResponse = { data: { title: "1.2.3-alpha.0" } };
    await expectSoftError(
      () => handleProjectCardMove(),
      "Issue name in project card should not have prerelease version: 1.2.3-alpha.0"
    );
  });

  it("verifies the card wasn't moved to new", async () => {
    columnResponse = { data: { name: "New" } };
    await expectSoftError(
      () => handleProjectCardMove(),
      "Nothing to do when name moved to \"New\""
    );
  });

  it("uses the card title as the version when moved to the Release column", async () => {
    columnResponse = { data: { name: "Release" } };
    const { inputs: { version } } = await handleProjectCardMove();
    expect(version).toEqual("1.2.3");
  });

  it("creates a prerelease version", async () => {
    columnResponse = { data: { name: "Beta" } };
    const { inputs: { version } } = await handleProjectCardMove();
    expect(version).toEqual("1.2.3-beta.0");
  });

  it("uses the 1.x branch", async () => {
    githubFacade.hasBranch.and.callFake(branchName => Promise.resolve(branchName === "1.x"));
    const { ref } = await handleProjectCardMove();
    expect(ref).toEqual("refs/heads/1.x");
  });

  it("uses the 1.2.x branch when 1.x and 1.2.x are defined", async () => {
    githubFacade.hasBranch.and.returnValue(Promise.resolve(true))
    const { ref } = await handleProjectCardMove();
    expect(ref).toEqual("refs/heads/1.2.x");
  });

  it("throws an error when the column name has a space in it.", async () => {
    columnResponse = { data: { name: "My Column" } };
    await expectSoftError(
      () => handleProjectCardMove(),
      "Invalid prerelease version: 1.2.3-my column.0"
    );
  });
});