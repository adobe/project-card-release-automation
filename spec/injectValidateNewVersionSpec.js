const injectValidateNewVersion = require("../lib/injectValidateNewVersion");
const expectError = require("./helpers/expectError");

describe("validateNewVersion", () => {
  const run = (packageVersion, newVersion) => {
    injectValidateNewVersion({ packageVersion })(newVersion);
  }

  it("checks package version is valid", () => {
    expectError(() => run("1.2.3", "foo"),
      "New version is not a valid semantic version: foo"
    );
  });
  it("checks new version > package version", () => {
    expectError(() => run("1.2.3-beta.1", "1.2.3-alpha.2"),
      "Versions must be increasing. Attempted 1.2.3-beta.1 => 1.2.3-alpha.2"
    );
  });
});