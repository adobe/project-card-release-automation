const injectValidateNewVersion = require("../lib/injectValidateNewVersion");
const expectError = require("./helpers/expectError");

describe("validateNewVersion", () => {
  const run = async (packageVersion, newVersion) => {
    const githubFacade = jasmine.createSpyObj("githubFacade", ["getPackageVersion"]);
    githubFacade.getPackageVersion.and.returnValue(packageVersion);
    const validateNewVersion = injectValidateNewVersion({
      githubFacade, ref: "myref", newVersion
    })
    await validateNewVersion();
  }

  it("checks package version is valid", async () => {
    await expectError(() => run("1.2.3", "foo"),
      "New version is not a valid semantic version: foo"
    );
  });
  it("checks new version > package version", async () => {
    await expectError(() => run("1.2.3-beta.1", "1.2.3-alpha.2"),
      "Versions must be increasing. Attempted 1.2.3-beta.1 => 1.2.3-alpha.2"
    );
  });
});