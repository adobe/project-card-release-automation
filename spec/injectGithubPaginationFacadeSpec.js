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

const injectGithubPaginationFacade = require("../lib/injectGithubPaginationFacade");

describe("githubPaginationFacade", () => {
  let pages;
  let octokit;
  let endpoint;
  let getAllMatching;
  let getOneMatching;

  beforeEach(() => {
    pages = [];
    endpoint = jasmine.createSpy();
    octokit = {
      paginate(paginateEndpoint, options, callback) {
        return new Promise(resolve => {
          let isDone = false;
          const done = () => {
            isDone = true;
          };
          for (const page of pages) {
            callback(page, done);
            if (isDone) {
              break;
            }
          }
          resolve();
        });
      }
    };
    spyOn(octokit, "paginate").and.callThrough();
    ({ getAllMatching, getOneMatching } = injectGithubPaginationFacade({
      octokit
    }));
  });

  describe("getAllMatching", () => {
    it("calls paginate with the correct params", async () => {
      pages = [{ data: [] }];
      await getAllMatching(endpoint, { my: "options" }, undefined);
      expect(octokit.paginate).toHaveBeenCalledOnceWith(
        endpoint,
        { my: "options" },
        jasmine.any(Function)
      );
    });
    it("gets none", async () => {
      pages = [{ data: [] }];
      const all = await getAllMatching(null, null, () => true);
      expect(all).toEqual([]);
    });
    it("gets all from only page", async () => {
      pages = [{ data: [1, 2] }];
      const all = await getAllMatching(null, null, () => true);
      expect(all).toEqual([1, 2]);
    });
    it("gets all from two pages", async () => {
      pages = [{ data: [1, 2] }, { data: [3, 4] }];
      const all = await getAllMatching(null, null, () => true);
      expect(all).toEqual([1, 2, 3, 4]);
    });
    it("stops paging when predicate does not match", async () => {
      const predicate = jasmine.createSpy().and.callThrough(x => x < 4);
      pages = [{ data: [1, 2] }, { data: [3, 4] }, { data: [5, 6] }];
      const all = await getAllMatching(null, null, x => x < 4);
      expect(all).toEqual([1, 2, 3]);
      expect(predicate).not.toHaveBeenCalledWith(5);
    });
  });

  describe("getOneMatching", () => {
    it("calls paginate with the correct params", async () => {
      pages = [{ data: [] }];
      await getOneMatching(endpoint, { my: "options" }, undefined);
      expect(octokit.paginate).toHaveBeenCalledOnceWith(
        endpoint,
        { my: "options" },
        jasmine.any(Function)
      );
    });
    it("gets none", async () => {
      pages = [{ data: [] }];
      const one = await getOneMatching(null, null, () => true);
      expect(one).toEqual(null);
    });
    it("gets the first item", async () => {
      pages = [{ data: [1, 2] }];
      const one = await getOneMatching(null, null, () => true);
      expect(one).toEqual(1);
    });
    it("gets one from the second page", async () => {
      pages = [{ data: [1, 2] }, { data: [3, 4] }];
      const one = await getOneMatching(null, null, x => x === 3);
      expect(one).toEqual(3);
    });
    it("stops paging when item found", async () => {
      const predicate = jasmine.createSpy().and.callThrough(x => x < 4);
      pages = [{ data: [1, 2] }, { data: [3, 4] }, { data: [5, 6] }];
      const all = await getAllMatching(null, null, x => x < 4);
      expect(all).toEqual([1, 2, 3]);
      expect(predicate).not.toHaveBeenCalledWith(5);
    });
    it("returns null when it doesn't find the one", async () => {
      pages = [{ data: [1, 2] }, { data: [3, 4] }];
      const one = await getOneMatching(null, null, () => false);
      expect(one).toEqual(null);
    });
  });
});
