/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const injectTriggerRelease = require("../lib/injectTriggerRelease");
const expectError = require("./helpers/expectError");
const expectSoftError = require("./helpers/expectSoftError");

describe("triggerRelease", () => {
  let handleProjectCardMove;
  let handlePush;
  let workflowId;
  let eventName;
  let githubFacade;
  let triggerRelease;

  beforeEach(() => {
    handleProjectCardMove = jasmine.createSpy("handleProjectCardMove");
    handleProjectCardMove.and.returnValue(Promise.resolve({}));
    handlePush = jasmine.createSpy("handlePush");
    handlePush.and.returnValue(Promise.resolve({}));
    eventName = "project_card";
    githubFacade = jasmine.createSpyObj("githubFacade", ["dispatchWorkflow"]);
    workflowId = "myworkflowid";
  });

  const build = () => {
    triggerRelease = injectTriggerRelease({
      handleProjectCardMove,
      handlePush,
      eventName,
      githubFacade,
      workflowId,
    });
  };

  it("checks the eventName and throws an error", async () => {
    eventName = "foo";
    build();
    expectError(triggerRelease, "Unknown event: foo.");
  });

  it("handles project_card event", async () => {
    eventName = "project_card";
    build();
    await triggerRelease();
    expect(handleProjectCardMove).toHaveBeenCalledOnceWith();
    expect(handlePush).not.toHaveBeenCalled();
    expect(githubFacade.dispatchWorkflow).toHaveBeenCalled();
  });

  it("handles push event", async () => {
    eventName = "push";
    build();
    await triggerRelease();
    expect(handleProjectCardMove).not.toHaveBeenCalled();
    expect(handlePush).toHaveBeenCalledOnceWith();
    expect(githubFacade.dispatchWorkflow).toHaveBeenCalled();
  });

  it("calls dispatchWorkflow with the correct variables", async () => {
    eventName = "project_card";
    handleProjectCardMove.and.returnValue(
      Promise.resolve({ ref: "myref", inputs: { version: "1.2.3-alpha.1" } })
    );
    build();
    await triggerRelease();
    expect(githubFacade.dispatchWorkflow).toHaveBeenCalledOnceWith(
      workflowId,
      "myref",
      { version: "1.2.3-alpha.1" }
    );
  });

  it("handles an error", async () => {
    const error = new Error("My Error");
    error.exitCode = 0;
    eventName = "push";
    handlePush.and.throwError(error);
    build();
    expectSoftError(triggerRelease, "My Error");
    expect(githubFacade.dispatchWorkflow).not.toHaveBeenCalled();
  });
});
