const injectHandlePush = require("../lib/injectHandlePush");
const expectSoftError = require("./helpers/expectSoftError");

describe("handlePush", () => {
  it("checks for invalid release versions in package.json", async () => {
    const handlePush = injectHandlePush({ packageVersion: "foo.bar" });
    await expectSoftError(handlePush,"Invalid release version in package.json: foo.bar");
  });
  it("checks that there is a prerelease version already in package.json", async () => {
    const handlePush = injectHandlePush({ packageVersion: "1.2.3" });
    await expectSoftError(handlePush,"No pre-release candidate to release.");
  });

  it("checks that the prerelease format has at least two parts", async () => {
    const handlePush = injectHandlePush({ packageVersion: "1.2.3-0" });
    await expectSoftError(handlePush, "Pre-release part of the version must have at least 2 parts.");
  });

  it("increments the version", async () => {
    const handlePush = injectHandlePush({ packageVersion: "1.2.3-alpha.1", ref: "myref" });
    expect(await handlePush()).toEqual({
      ref: "myref",
      inputs: {
        version: "1.2.3-alpha.2"
      }
    });
  });
});