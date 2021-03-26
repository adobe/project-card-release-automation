const memoizeGetters = require("../lib/memoizeGetters");

describe("memoizeGetters", () => {
  it("works", () => {
    let calls = 0;
    let obj = {
      get a() {
        calls++;
        return "a";
      }
    };
    memoizeGetters(obj);
    expect(obj.a).toEqual("a");
    expect(obj.a).toEqual("a");
    expect(calls).toEqual(1);
  });
});