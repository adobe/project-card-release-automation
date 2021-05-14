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

const injectExtractReferences = require("../lib/injectExtractReferences");

describe("extractReferences", () => {
  const referencePrefixes = ["ABC-", "DEF-"];
  const referenceTargetUrlPrefix = "https://myissuetracker.com/";
  let extractReferences;
  beforeEach(() => {
    extractReferences = injectExtractReferences({
      referencePrefixes,
      referenceTargetUrlPrefix
    });
  });

  it("extracts none", () => {
    expect(extractReferences("commit with no reference")).toEqual("");
  });
  it("extracts one", () => {
    expect(extractReferences("ABC-123 fix the bug")).toEqual(
      "[ABC&#x2011;123](https://myissuetracker.com/ABC-123)"
    );
  });
  it("deduplicates", () => {
    expect(
      extractReferences("ABC-123 fix the bug", "Description - ABC-123")
    ).toEqual("[ABC&#x2011;123](https://myissuetracker.com/ABC-123)");
  });
  it("extracts 2", () => {
    expect(
      extractReferences("ABC-123 fix the bug, DEF-456 and this one, ABC-123")
    ).toEqual(
      "[ABC&#x2011;123](https://myissuetracker.com/ABC-123)\n[DEF&#x2011;456](https://myissuetracker.com/DEF-456)"
    );
  });
});
