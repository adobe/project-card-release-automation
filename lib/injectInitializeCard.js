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

const semver = require("semver");
const assert = require("./assert");

module.exports = ({
  githubFacade,
  projectNumber,
  core,
  ref,
  releaseType,
}) => async () => {
  assert(ref.startsWith("refs/heads/"), `ref must be a branch, got ${ref}`);
  const branch = ref.substring(11);

  assert(
    releaseType === "major" ||
      releaseType === "minor" ||
      releaseType === "patch",
    "`releaseType` must be major, minor, or patch."
  );

  const packageVersion = await githubFacade.getPackageVersion(ref);

  assert(
    semver.prerelease(packageVersion) === null,
    `Package.json should contain a version with no prerelease qualifiers, got ${packageVersion}`
  );

  const newVersion = semver.inc(packageVersion, releaseType);

  const issueId = await githubFacade.createIssue({
    title: newVersion,
    body: `Track progress of release ${newVersion}.`,
    labels: ["release", `branch:${branch}`],
  });
  core.info(`Created issue with id: ${issueId}`);
  const projectId = await githubFacade.fetchProjectId(projectNumber);
  const columnId = await githubFacade.fetchColumnIdByName(projectId, "New");
  await githubFacade.createIssueCard(columnId, issueId);
  core.info(`Created card: ${newVersion}`);
};
