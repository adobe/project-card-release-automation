const github = require("@actions/github");
const assert = require("./assert");
const createGithubFacade = require("./createGithubFacade");
const injectHandleProjectCardMove = require("./injectHandleProjectCardMove");
const injectHandlePush = require("./injectHandlePush");
const injectInitializeCard = require("./injectInitializeCard");
const injectRun = require("./injectRun");
const injectTriggerRelease = require("./injectTriggerRelease");
const injectValidateNewVersion = require("./injectValidateNewVersion");
const memoizeGetters = require("./memoizeGetters");
const process = require("process");
const core = require("@actions/core");

const readEnvironmentVariable = name => {
  assert(process.env[name] != null, `The environment variable ${name} is required`);
  return process.env[name];
}

module.exports = memoizeGetters({
  get githubContext() {
    const {
      ref,
      eventName,
      payload: {
        project_card: {
          project_url: projectUrl,
          column_url: columnUrl,
          content_url: contentUrl,
        } = {}
      } = {}
     } = github.context;
    return {
      ref,
      eventName,
      projectUrl,
      columnUrl,
      contentUrl
    };
  },
  get token() {
    return this.core.getInput("token");
  },
  get ownerAndRepo() {
    const repository = readEnvironmentVariable("GITHUB_REPOSITORY");
    assert(repository.includes("/"), "The GITHUB_REPOSITORY environment variable should be of the form ${owner}/${repo}");
    return repository.split("/");
  },
  get owner() {
    return this.ownerAndRepo[0];
  },
  get repo() {
    return this.ownerAndRepo[1];
  },
  get octokit() {
    return github.getOctokit(this.auth, {
      previews: ["inertia-preview"] // inertia is the github codename for Projects
    });
  },
  get githubFacade() {
    return createGithubFacade(this);
  },
  get projectUrl() {
    return this.githubContext.projectUrl;
  },
  get contentUrl() {
    return this.githubContext.contentUrl;
  },
  get columnUrl() {
    return this.githubContext.columnUrl;
  },
  get ref() {
    return this.githubContext.ref;
  },
  get eventName() {
    return this.githubContext.eventName;
  },
  get workflowId() {
    return this.core.getInput("workflowId");
  },
  get releaseType() {
    return this.core.getInput("releaseType");
  },
  get newVersion() {
    return this.core.getInput("newVersion");
  },
  get handleProjectCardMove() {
    return injectHandleProjectCardMove(this);
  },
  get projectNumber() {
    return 1;
  },
  get handlePush() {
    return injectHandlePush(this);
  },
  get initializeCard() {
    return injectInitializeCard(this);
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
  get core() {
    return core;
  }
});