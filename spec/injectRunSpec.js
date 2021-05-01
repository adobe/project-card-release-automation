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

const injectRun = require("../lib/injectRun");

describe("run", () => {
  let core;
  let run;
  let func;

  beforeEach(() => {
    core = jasmine.createSpyObj("core", ["setFailed", "info"]);
    run = injectRun({ core });
    func = jasmine.createSpy("func");
  });

  it("runs a sync function", async () => {
    await run(func);
    expect(func).toHaveBeenCalledOnceWith();
  });

  it("runs an async function", async () => {
    func.and.returnValue(Promise.resolve());
    await run(func);
    expect(func).toHaveBeenCalledOnceWith();
  });

  it("handles sync errors with exitCodes", async () => {
    const error = new Error("myerror");
    error.exitCode = 42;
    func.and.throwError(error);
    await run(func);
    expect(core.setFailed).toHaveBeenCalledOnceWith("myerror");
  });

  it("handles async errors with exitCodes", async () => {
    const error = new Error("myerror");
    error.exitCode = 42;
    func.and.returnValue(Promise.reject(error));
    await run(func);
    expect(core.setFailed).toHaveBeenCalledOnceWith("myerror");
  });

  it("handles other errors", async () => {
    const error = new Error("myerror");
    func.and.returnValue(Promise.reject(error));
    await run(func);
    expect(core.setFailed).toHaveBeenCalledOnceWith(error);
  });

  it("handles a zero exitCode", async () => {
    const error = new Error("myerror");
    error.exitCode = 0;
    func.and.throwError(error);
    await run(func);
    expect(core.info).toHaveBeenCalledOnceWith("myerror");
  });
});
