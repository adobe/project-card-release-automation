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

const injectGetReleaseNotes = require("../lib/injectGetReleaseNotes");

describe("getReleaseNotes", () => {
  const PR10 = {
    number: 10,
    permalink: "pullrequest10url",
    title: "pullrequest10title",
    author: { login: "pullrequest10username" },
    body: "pullrequest10body"
  };
  const PR20 = {
    number: 20,
    permalink: "pullrequest20url",
    title: "pullrequest20title",
    author: { login: "pullrequest20username" },
    body: "pullrequest20body"
  };
  const COMMIT1 = {
    oid: "1commitsha",
    url: "commit1url",
    message: "commit1message\n\nmore message",
    author: { user: { login: "commit1username" } },
    associatedPullRequests: { nodes: [] }
  };
  const COMMIT2 = {
    oid: "2commitsha",
    url: "commit2url",
    message: "commit2message",
    author: { user: { login: "commit2username" } },
    associatedPullRequests: { nodes: [PR10] }
  };
  const COMMIT3 = {
    oid: "3commitsha",
    url: "commit3url",
    message: "commit3message",
    author: { user: { login: "commit3username" } },
    associatedPullRequests: { nodes: [] }
  };
  const COMMIT4 = {
    oid: "4commitsha",
    url: "commit4url",
    message: "commit4message",
    author: { user: { login: "commit4username" } },
    associatedPullRequests: { nodes: [PR10] }
  };
  const COMMIT5 = {
    oid: "5commitsha",
    url: "commit5url",
    message: "commit5message",
    author: { user: { login: "commit5username" } },
    associatedPullRequests: { nodes: [PR20] }
  };

  it("works", async () => {
    const githubFacade = jasmine.createSpyObj("githubFacade", [
      "findCommitWhereVersionChanged",
      "fetchCommitHistoryUntil"
    ]);
    const ref = "refs/heads/mybranch";
    const extractReferences = (...text) => {
      if (text[0] === "commit1message\n\nmore message") {
        return "reference1";
      }
      if (text[0] === "pullrequest10title") {
        return "reference10";
      }
      return "";
    };
    const extractPullRequestType = body => {
      if (body === "pullrequest10body") {
        return "type10";
      }
      return "";
    };
    const getReleaseNotes = injectGetReleaseNotes({
      githubFacade,
      ref,
      extractReferences,
      extractPullRequestType
    });
    githubFacade.findCommitWhereVersionChanged.and.returnValue(
      Promise.resolve("commitsha")
    );
    githubFacade.fetchCommitHistoryUntil.and.returnValue(
      Promise.resolve([COMMIT1, COMMIT2, COMMIT3, COMMIT4, COMMIT5])
    );
    const releaseNotes = await getReleaseNotes();
    expect(
      releaseNotes
        .trim()
        .split("\n")
        .map(row => row.split("|"))
    ).toEqual([
      ["Link", "Description", "Author", "Type", "Issue(s)"],
      ["---", "---", "---", "---", "---"],
      [
        "[1commit](commit1url)",
        "commit1message",
        "commit1username",
        "",
        "reference1"
      ],
      [
        "[#10](pullrequest10url)",
        "pullrequest10title",
        "pullrequest10username",
        "type10",
        "reference10"
      ],
      ["[3commit](commit3url)", "commit3message", "commit3username", "", ""],
      [
        "[#20](pullrequest20url)",
        "pullrequest20title",
        "pullrequest20username",
        "",
        ""
      ]
    ]);
  });
});
