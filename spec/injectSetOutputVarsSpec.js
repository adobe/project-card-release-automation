const injectSetOutputVars = require("../lib/injectSetOutputVars");
const expectError = require("./helpers/expectError");
const expectSoftError = require("./helpers/expectSoftError");

describe("setOutputVars", () => {
  let handleProjectCardMove;
  let handlePush;
  let eventName;
  let core;
  let setOutputVars;

  beforeEach(() => {
    handleProjectCardMove = jasmine.createSpy("handleProjectCardMove");
    handleProjectCardMove.and.returnValue(Promise.resolve({}));
    handlePush = jasmine.createSpy("handlePush");
    handlePush.and.returnValue(Promise.resolve({}));
    eventName = "project_card";
    core = jasmine.createSpyObj("core", ["setOutput"]);
  });

  const build = () => {
    setOutputVars = injectSetOutputVars({
      handleProjectCardMove,
      handlePush,
      eventName,
      core
    });
  };

  it("checks the eventName and throws an error", async () => {
    eventName = "foo";
    build();
    expectError(
      () => setOutputVars(),
      "Unknown event: foo."
    );
  });

  it("handles project_card event", async () => {
    eventName = "project_card";
    build();
    await setOutputVars();
    expect(handleProjectCardMove).toHaveBeenCalledOnceWith();
    expect(handlePush).not.toHaveBeenCalled();
  });

  it("handles push event", async () => {
    eventName = "push";
    build();
    await setOutputVars();
    expect(handleProjectCardMove).not.toHaveBeenCalled();
    expect(handlePush).toHaveBeenCalledOnceWith();
  });

  it("sets output variables", async () => {
    eventName = "project_card";
    handleProjectCardMove.and.returnValue({ ref: "myref", inputs: { version: "1.2.3-alpha.1" } });
    build();
    await setOutputVars();
    expect(core.setOutput).toHaveBeenCalledWith("triggerWorkflow", "true");
    expect(core.setOutput).toHaveBeenCalledWith("ref", "myref");
    expect(core.setOutput).toHaveBeenCalledWith("inputs", "{\"version\":\"1.2.3-alpha.1\"}");
  });

  it("handles an error", async () => {
    const error = new Error("My Error");
    error.exitCode = 0;
    eventName = "push";
    handlePush.and.throwError(error);
    build();
    expectSoftError(setOutputVars, "My Error")
    expect(core.setOutput).toHaveBeenCalledOnceWith("triggerWorkflow", "false");
  });
});