
const assert = require("../lib/assert");

describe("assert", () => {
  it("doesn't throw error", () => {
    assert(true, "Should not be thrown");
  });
  it("throws an error", () => {
    expect(() => assert(false, "Should be thrown")).toThrowError("Should be thrown");
  });
  it("sets the exitCode on the error", () => {
    try {
      assert(false, "Should be thrown", 42);
    } catch (e) {
      expect(e.exitCode).toBe(42);
    }
  });
  it ("Sets a non-zero default exit code", () => {
    try {
      assert(false, "Should be thrown");
    } catch (e) {
      expect(e.exitCode).not.toBe(0);
    }
  });
});