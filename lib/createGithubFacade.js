const assert = require("./assert");

module.exports = ({ octokit, owner, repo }) => {
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
    async createIssue({ title, body }) {
      const { data: { id } } = await octokit.issues.create({
        owner,
        repo,
        title,
        body
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
      const package = JSON.parse(packageJson);
      return package.version;
    }
  }
};