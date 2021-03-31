#!/usr/bin/env node

const createGithubFacade = require("./lib/createGithubFacade");

const { Octokit } = require("@octokit/rest");

const owner = "jonsnyder";
const repo = "actions-sandbox";

const auth = process.env.GITHUB_AUTH;

const octokit = new Octokit({
  auth
});

const githubFacade = createGithubFacade({ octokit, owner, repo });

//githubFacade.getPackageVersion("refs/heads/main").then(version => {
//  console.log(version);
//})

(async () => {
  const issueNumber = await githubFacade.findIssueNumberByIssueTitle("2.2.0");
  //await githubFacade.createIssueComment(issueNumber, "Released 2.2.0-alpha.1");
  //await githubFacade.closeIssue(issueNumber);
  console.log(issueNumber);
  await githubFacade.addLabelToIssue(issueNumber, "release");
})();


