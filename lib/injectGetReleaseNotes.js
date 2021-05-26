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

const buildMarkdownTable = require("./utils/buildMarkdownTable");
const buildMarkdownLink = require("./utils/buildMarkdownLink");
const firstLine = require("./utils/firstLine");

module.exports =
  ({ githubFacade, ref, extractReferences, extractPullRequestType }) =>
  async () => {
    const lastReleaseCommit = await githubFacade.findCommitWhereVersionChanged(
      ref
    );
    const history = await githubFacade.fetchCommitHistoryUntil(
      ref,
      lastReleaseCommit.oid
    );
    const pullRequestNumbersAlreadyProcessed = [];
    const header = ["Link", "Description", "Author", "Type", "Issue(s)"];
    const rows = [];
    history.forEach(commit => {
      if (commit.associatedPullRequests.nodes.length === 0) {
        // commit with no PR
        rows.push([
          buildMarkdownLink(commit.oid.substring(0, 7), commit.url),
          firstLine(commit.message),
          commit.author.user.login,
          "",
          extractReferences(commit.message)
        ]);
      } else {
        // commit with PR(s)
        commit.associatedPullRequests.nodes.forEach(pr => {
          if (!pullRequestNumbersAlreadyProcessed.includes(pr.number)) {
            pullRequestNumbersAlreadyProcessed.push(pr.number);
            rows.push([
              buildMarkdownLink(`#${pr.number}`, pr.permalink),
              pr.title,
              pr.author.login,
              extractPullRequestType(pr.body),
              extractReferences(pr.title, pr.body)
            ]);
          }
        });
      }
    });

    return buildMarkdownTable(header, rows);
  };
