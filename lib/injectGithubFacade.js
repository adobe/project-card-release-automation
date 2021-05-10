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
const assert = require("./assert");

module.exports = ({ octokit, owner, repo, fs }) => ({
  /**
   * @param {string} branch
   * @returns {boolean} true if the branch exists
   */
  async hasBranch(branch) {
    const { data } = await octokit.git.listMatchingRefs({
      owner,
      repo,
      ref: `heads/${branch}`,
      per_page: 1,
    });
    // This returns branches that start with the ref, so we still need to check the name matches.
    return data.length > 0 && data[0].ref === `refs/heads/${branch}`;
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
      data: { id },
    } = await octokit.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    });
    return id;
  },
  async fetchProjectId(projectNumber) {
    const { data } = await octokit.projects.listForRepo({
      owner,
      repo,
      state: "open",
    });
    const project = data.find((p) => p.number === projectNumber);
    assert(project, `Project with number ${projectNumber} not found.`);
    return project.id;
  },
  async fetchColumnIdByName(projectId, columnName) {
    const { data } = await octokit.projects.listColumns({
      project_id: projectId,
    });
    const column = data.find((c) => c.name === columnName);
    assert(column, `Could not find project column with name "${columnName}".`);
    return column.id;
  },
  async createIssueCard(columnId, issueId) {
    await octokit.projects.createCard({
      column_id: columnId,
      content_id: issueId,
      content_type: "Issue",
    });
  },
  async getPackageVersion(ref) {
    const {
      data: { content, encoding },
    } = await octokit.repos.getContent({
      owner,
      repo,
      path: "package.json",
      ref,
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
      inputs,
    });
  },
  async findIssueNumberByIssueTitle(title) {
    const {
      data: { items },
    } = await octokit.search.issuesAndPullRequests({
      q: `repo:${owner}/${repo} is:issue is:open in:title ${title}`,
    });
    const issue = items.find((i) => i.title === title);
    if (issue) {
      return issue.number;
    }
    throw new Error(`Could not find issue with title ${title}`);
  },
  async createIssueComment(issueNumber, body) {
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body,
    });
  },
  async closeIssue(issueNumber) {
    await octokit.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      state: "closed",
    });
  },
  async createRelease({ tagName, name, body, prerelease }) {
    const {
      data: { upload_url: uploadUrl },
    } = await octokit.repos.createRelease({
      owner,
      repo,
      tag_name: tagName,
      name,
      body,
      prerelease,
    });
    return uploadUrl;
  },
  async uploadReleaseAsset(url, filename) {
    const headers = {
      "content-type": mime.lookup(filename) || "application/octet-stream",
      "content-length": (await fs.lstat(filename)).size,
    };
    const data = await fs.readFile(filename);

    await octokit.repos.uploadReleaseAsset({
      url,
      headers,
      name: path.basename(filename),
      data,
    });
  },
});
