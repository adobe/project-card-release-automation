const injectHandlePush = require("../lib/injectHandlePush");
const expectSoftError = require("./helpers/expectSoftError");

describe("handlePush", () => {
  let githubFacade;
  let ref = "myref";
  let handlePush;

  beforeEach(() => {
    githubFacade = jasmine.createSpyObj("githubFacade", ["getPackageVersion"]);
    handlePush = injectHandlePush({ githubFacade, ref });
  })

  it("checks for invalid release versions in package.json", async () => {
    githubFacade.getPackageVersion.and.returnValue("foo.bar");
    await expectSoftError(handlePush,"Invalid release version in package.json: foo.bar");
  });
  it("checks that there is a prerelease version already in package.json", async () => {
    githubFacade.getPackageVersion.and.returnValue("1.2.3");
    await expectSoftError(handlePush,"No pre-release candidate to release.");
  });

  it("checks that the prerelease format has at least two parts", async () => {
    githubFacade.getPackageVersion.and.returnValue("1.2.3-0");
    await expectSoftError(handlePush, "Pre-release part of the version must have at least 2 parts.");
  });

  it("increments the version", async () => {
    githubFacade.getPackageVersion.and.returnValue("1.2.3-alpha.1");
    expect(await handlePush()).toEqual({
      ref: "myref",
      inputs: {
        version: "1.2.3-alpha.2"
      }
    });
  });
});