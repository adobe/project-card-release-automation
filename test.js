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

githubFacade.getPackageVersion("refs/heads/main").then(version => {
  console.log(version);
})

