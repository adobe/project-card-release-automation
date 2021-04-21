const assert = require("./assert");
const mime = require("mime-types");
const path = require("path");
const { coerce } = require("semver");

module.exports = ({ octokit, owner, repo, fs, core }) => {
  return {
    /**
     * @param {string} branch
     * @returns {boolean} true if the branch exists
     */
    async hasBranch(branch) {
      const { data } = await octokit.git.listMatchingRefs({
        owner,
        repo,
        ref: `heads/${branch}`,
        per_page: 1
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
    async createIssue({ title, body, label }) {
      const { data: { id } } = await octokit.issues.create({
        owner,
        repo,
        title,
        body,
        labels: [label]
      });
      return id;
    },
    async fetchProjectId(projectNumber) {
      const { data } = await octokit.projects.listForRepo({
        owner, repo, state: "open"
      });
      const project = data.find(project => project.number === projectNumber);
      assert(project, `Project with number ${projectNumber} not found.`);
      return project.id;
    },
    async fetchColumnIdByName(projectId, columnName) {
      const { data } = await octokit.projects.listColumns({ project_id: projectId });
      const column = data.find(column => column.name === columnName);
      assert(column, `Could not find project column with name "${columnName}".`)
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
      const { data: { content, encoding } } = await octokit.repos.getContent({
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
    async dispatchWorkflow(workflow_id, ref, inputs) {
      await octokit.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id,
        ref,
        inputs
      });
    },
    async findIssueNumberByIssueTitle(title) {
      const { data: { items } } = await octokit.search.issuesAndPullRequests({
        q: `repo:${owner}/${repo} is:issue is:open in:title ${title}`
      });
      const issue = items.find(issue => issue.title === title);
      if (issue) {
        return issue.number;
      }
      throw new Error(`Could not find issue with title ${title}`);
    },
    async createIssueComment(issue_number, body) {
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number,
        body
      });
    },
    async closeIssue(issue_number) {
      await octokit.issues.update({
        owner,
        repo,
        issue_number,
        state: "closed"
      });
    },
    async createRelease({ tag_name, name, body, prerelease }) {
      const { data: { upload_url } } = await octokit.repos.createRelease({
        owner,
        repo,
        tag_name,
        name,
        body,
        prerelease
      });
      return upload_url;
    },
    async uploadReleaseAsset(url, filename) {
      const headers = {
        "content-type": mime.lookup(filename) || "application/octet-stream",
        "content-length": (await fs.stat(filename)).size
      };
      const file = await fs.readFile(filename);

      /*core.info(JSON.stringify({
        url,
        headers,
        name: path.basename(filename),
        file
      }, null, 2));*/

      await octokit.repos.uploadReleaseAsset({
        url,
        headers,
        name: path.basename(filename),
        file
      });
    }

  }
};