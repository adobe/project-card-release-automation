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

const mime = require("mime-types");
const path = require("path");
const assert = require("./utils/assert");

module.exports = ({
  octokit,
  owner,
  repo,
  fs,
  githubPaginationFacade: {
    getOneMatching,
    getOneMatchingGraphql,
    getAllMatchingGraphql
  }
}) => ({
  /**
   * @param {string} branch
   * @returns {boolean} true if the branch exists
   */
  async hasBranch(branch) {
    // This returns branches that start with the ref, so we still need to check the name matches.
    return !!(await getOneMatching(
      octokit.git.listMatchingRefs,
      { owner, repo, ref: `heads/${branch}` },
      item => item.ref === `refs/heads/${branch}`
    ));
  },
  /**
   * @param {string} url
   * @returns {object} the resource at that url
   */
  getByUrl(url) {
    return octokit.request(`GET ${url}`);
  },
  async createIssue({ title, body, labels }) {
    const {
      data: { id }
    } = await octokit.issues.create({
      owner,
      repo,
      title,
      body,
      labels
    });
    return id;
  },
  async fetchProjectId(projectNumber) {
    const project = await getOneMatching(
      octokit.projects.listForRepo,
      { owner, repo, state: "open" },
      p => p.number === projectNumber
    );
    assert(project, `Project with number ${projectNumber} not found.`);
    return project.id;
  },
  async fetchColumnIdByName(projectId, columnName) {
    const column = await getOneMatching(
      octokit.projects.listColumns,
      { project_id: projectId },
      c => c.name === columnName
    );
    assert(column, `Could not find project column with name "${columnName}".`);
    return column.id;
  },
  async createIssueCard(columnId, issueId) {
    await octokit.projects.createCard({
      column_id: columnId,
      content_id: issueId,
      content_type: "Issue"
    });
  },
  async getPackageVersion(ref) {
    const {
      data: { content, encoding }
    } = await octokit.repos.getContent({
      owner,
      repo,
      path: "package.json",
      ref
    });
    // The content is base 64 encoded.
    const packageJson = Buffer.from(content, encoding).toString();
    const packageObj = JSON.parse(packageJson);
    return packageObj.version;
  },
  async dispatchWorkflow(workflowId, ref, inputs) {
    await octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflowId,
      ref,
      inputs
    });
  },
  async findIssueNumberByIssueTitle(title) {
    const issue = await getOneMatching(
      octokit.search.issuesAndPullRequests,
      { q: `repo:${owner}/${repo} is:issue is:open in:title ${title}` },
      i => i.title === title
    );
    assert(issue, `Could not find issue with title ${title}.`);
    return issue.number;
  },
  async createIssueComment(issueNumber, body) {
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body
    });
  },
  async closeIssue(issueNumber) {
    await octokit.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      state: "closed"
    });
  },
  async createRelease({ tagName, name, body, prerelease }) {
    const {
      data: { upload_url: uploadUrl }
    } = await octokit.repos.createRelease({
      owner,
      repo,
      tag_name: tagName,
      name,
      body,
      prerelease
    });
    return uploadUrl;
  },
  async uploadReleaseAsset(url, filename) {
    const headers = {
      "content-type": mime.lookup(filename) || "application/octet-stream",
      "content-length": (await fs.lstat(filename)).size
    };
    const data = await fs.readFile(filename);

    await octokit.repos.uploadReleaseAsset({
      url,
      headers,
      name: path.basename(filename),
      data
    });
  },
  async findCommitWhereVersionChanged(ref) {
    const fetchChangesToPackageJson = await fs.readFile(
      path.resolve(__dirname, "graphql", "fetchChangesToPackageJson.graphql"),
      "utf8"
    );

    let newVersion = null;
    let lastVersion = null;
    return getOneMatchingGraphql(
      async cursor => {
        const {
          repository: {
            ref: {
              target: { history }
            }
          }
        } = await octokit.graphql(fetchChangesToPackageJson, {
          owner,
          repo,
          ref,
          cursor
        });
        return history;
      },
      ({
        file: {
          object: { text }
        }
      }) => {
        const { version } = JSON.parse(text);
        if (newVersion === null) {
          newVersion = version;
        } else if (lastVersion === null && newVersion !== version) {
          lastVersion = version;
        }
        return lastVersion !== null && lastVersion !== version;
      }
    );
  },
  async fetchCommitHistoryUntil(ref, sha) {
    const fetchCommitHistory = await fs.readFile(
      path.resolve(__dirname, "graphql", "fetchCommitHistory.graphql"),
      "utf8"
    );

    return getAllMatchingGraphql(
      async cursor => {
        const {
          repository: {
            ref: {
              target: { history }
            }
          }
        } = await octokit.graphql(fetchCommitHistory, {
          owner,
          repo,
          ref,
          cursor
        });
        return history;
      },
      ({ oid }) => oid !== sha
    );
  }
});
