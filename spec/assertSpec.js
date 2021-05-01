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

const assert = require("../lib/assert");

describe("assert", () => {
  it("doesn't throw error", () => {
    assert(true, "Should not be thrown");
  });
  it("throws an error", () => {
    expect(() => assert(false, "Should be thrown")).toThrowError(
      "Should be thrown"
    );
  });
  it("sets the exitCode on the error", () => {
    try {
      assert(false, "Should be thrown", 42);
    } catch (e) {
      expect(e.exitCode).toBe(42);
    }
  });
  it("Sets a non-zero default exit code", () => {
    try {
      assert(false, "Should be thrown");
    } catch (e) {
      expect(e.exitCode).not.toBe(0);
    }
  });
});
