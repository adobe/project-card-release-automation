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

const buildMarkdownTable = require("../../lib/utils/buildMarkdownTable");

describe("buildMarkdownTable", () => {
  it("builds a small table", () => {
    expect(
      buildMarkdownTable(
        ["a", "b", "c"],
        [
          ["a1", "b1", "c1"],
          ["a2", "b2", "c2"]
        ]
      )
    ).toEqual("a|b|c\n---|---|---\na1|b1|c1\na2|b2|c2\n");
  });
  it("escapes pipes", () => {
    expect(buildMarkdownTable(["a||", "|b"], [["a||", "|b"]])).toEqual(
      "a||||b\n---|---\na||||b\n"
    );
  });
  it("escapes newlines", () => {
    expect(buildMarkdownTable(["a\n\n", "\r\nb"], [["a\r", "\nb"]])).toEqual(
      "a<br/><br/>|<br/>b\n---|---\na<br/>|<br/>b\n"
    );
  });
});
