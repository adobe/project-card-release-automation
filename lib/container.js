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

const fs = require("fs").promises;
const github = require("@actions/github");
const artifact = require("@actions/artifact");
const core = require("@actions/core");

const assert = require("./assert");
const injectGithubFacade = require("./injectGithubFacade");
const injectHandleProjectCardMove = require("./injectHandleProjectCardMove");
const injectHandlePush = require("./injectHandlePush");
const injectInitializeCard = require("./injectInitializeCard");
const injectRecordRelease = require("./injectRecordRelease");
const injectRun = require("./injectRun");
const injectTriggerRelease = require("./injectTriggerRelease");
const injectValidateNewVersion = require("./injectValidateNewVersion");
const memoizeGetters = require("./memoizeGetters");

const readEnvironmentVariable = (name) => {
  assert(
    process.env[name] != null,
    `The environment variable ${name} is required`
  );
  return process.env[name];
};

module.exports = memoizeGetters({
  // Action Inputs:
  get projectNumber() {
    return Number(this.core.getInput("projectNumber"));
  },
  get releaseType() {
    return this.core.getInput("releaseType");
  },
  get token() {
    return this.core.getInput("token");
  },
  get version() {
    return this.core.getInput("version");
  },
  get workflowId() {
    return this.core.getInput("workflowId");
  },
  // Github Context Inputs:
  get githubContext() {
    const {
      ref,
      eventName,
      payload: {
        project_card: {
          project_url: projectUrl,
          column_url: columnUrl,
          content_url: contentUrl,
        } = {},
      } = {},
    } = github.context;
    const repository = readEnvironmentVariable("GITHUB_REPOSITORY");
    assert(
      repository.includes("/"),
      "The GITHUB_REPOSITORY environment variable should be of the form owner/repo"
    );
    const [owner, repo] = repository.split("/");

    return {
      ref,
      eventName,
      projectUrl,
      columnUrl,
      contentUrl,
      repo,
      owner,
    };
  },
  get contentUrl() {
    return this.githubContext.contentUrl;
  },
  get columnUrl() {
    return this.githubContext.columnUrl;
  },
  get eventName() {
    return this.githubContext.eventName;
  },
  get projectUrl() {
    return this.githubContext.projectUrl;
  },
  get ref() {
    return this.githubContext.ref;
  },
  get owner() {
    return this.githubContext.owner;
  },
  get repo() {
    return this.githubContext.repo;
  },
  // Github objects
  get core() {
    return core;
  },
  get octokit() {
    return github.getOctokit(this.token, {
      previews: ["inertia-preview"], // inertia is the github codename for Projects
    });
  },
  get artifactClient() {
    return artifact.create();
  },
  get fs() {
    return fs;
  },
  // Injected objects
  get githubFacade() {
    return injectGithubFacade(this);
  },
  get handleProjectCardMove() {
    return injectHandleProjectCardMove(this);
  },
  get handlePush() {
    return injectHandlePush(this);
  },
  get initializeCard() {
    return injectInitializeCard(this);
  },
  get recordRelease() {
    return injectRecordRelease(this);
  },
  get run() {
    return injectRun(this);
  },
  get triggerRelease() {
    return injectTriggerRelease(this);
  },
  get validateNewVersion() {
    return injectValidateNewVersion(this);
  },
});
