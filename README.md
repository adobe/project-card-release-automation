# Project Card Release Automation

<p align="center">
  <a href="https://github.com/actions/javascript-action/actions"><img alt="javscript-action status" src="https://github.com/actions/javascript-action/workflows/units-test/badge.svg"></a>
</p>

This repo contains a set of Github actions that can be used to automate release processes using semantic versioning of projects with a versioned package.json. The actions work off of a Github issue created for each release version, a card put into a Github project, and finally a Github release record.

## General overview

To use these actions in your repo follow these setup steps:
1. Create a Github project with columns "New", "Alpha", "Beta", and "Release"
2. Create workflows for initializing a release, triggering a release, and deploying a release. These are detailed more below.

Once implemented in your repo, the general release process would look like this:
1. Decide on what kind of release you want to do (major, minor, or patch), and which branch you would like to work off of.
1. Manually run a workflow to initialize a release issue and project card with the target version. The new card should appear in the "New" column of the Github project. The new issue will have a title corresponding to the desired release number (i.e. "1.2.0")
1. Move the card to the "Alpha" column. This will trigger a prerelease version build (i.e. "1.2.0-alpha.0")
1. Now new commits or PR merges to the branch will trigger a new prerelease build (i.e. "1.2.0-alpha.1")
1. When all the features for the targeted release are complete, move the project card to the "Beta" column. This will trigger a beta build (i.e. "1.2.0-beta.0")
1. New commits or PR merges to the branch will trigger a new beta build (i.e. "1.2.0-beta.1")
1. when you are satisfied with the release, move the project card to "Release". This triggers a release build (i.e. "1.2.0")
1. Start the process again for the next release.

## Setting up the Github workflows

First create the workflow you will use to create the issue and release card. Be sure to replace the projectNumber.

```yaml
name: Initialize Intended Release
on:
  workflow_dispatch:
    inputs:
      type:
        description: "Release Type [major|minor|patch]"
        required: true

jobs:
  initializeIntendedRelease:
    name: "Initialize Intended Release"
    runs-on: ubuntu-latest
    steps:
      - uses: jonsnyder/project-card-release-automation/initialize-card@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          releaseType: ${{ github.event.inputs.type }}
          projectNumber: 1
```

Next create the workflow to run the release process:

```yaml
name: Deploy Release
on:
  workflow_dispatch:
    inputs:
      version:
        description: "Version"
        required: true

jobs:
  release:
    name: "Release"
    runs-on: ubuntu-latest
    steps:
      - uses: jonsnyder/project-card-release-automation/validate-version@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          version: ${{ github.event.inputs.version }}
      - uses: actions/checkout@v2
      - run: |
          git config user.name $GITHUB_ACTOR
          git config user.email gh-actions-${GITHUB_ACTOR}@github.com
          git remote add gh-origin https://${GITHUB_ACTOR}:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git/
          npm version ${{ github.event.inputs.version }}
          git push gh-origin HEAD:${GITHUB_REF} --follow-tags
      - uses: jonsnyder/project-card-release-automation/record-release@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          version: ${{ github.event.inputs.version }}
```

The run step in the workflow code above simply increments the version in package.json, and commits the change. This is where you would put the logic to preform the release process for your repo.

Next create the workflow to trigger releases:

```yaml
name: Trigger Release
on:
  project_card:
    types: [moved]
  push:
    branch:
      - "**"
jobs:
  triggerReleaseIfNeeded:
    name: "Trigger Release If Needed"
    runs-on: ubuntu-latest
    steps:
      - uses: jonsnyder/project-card-release-automation/trigger-release@v1
        with:
          token: ${{ secrets.BOT_GITHUB_TOKEN }}
          workflowId: "deployRelease.yml"
          projectNumber: 1
```

You can change the branch section to only trigger based on the branches that you will use for releases. Be sure to change the workflowId to be the name of the deploy release YAML file, and change the projectNumber as before.

## Development

Install the dependencies

```bash
npm install
```

Run the tests:

```bash
npm test
```

Build the combined javascript files with ncc:

```bash
npm run build
```

## Contributing

Contributions are welcomed! Read the [Contributing Guide](./.github/CONTRIBUTING.md) for more information.

## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.