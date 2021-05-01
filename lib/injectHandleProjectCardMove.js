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
const softAssert = require("./softAssert");

module.exports = ({
  githubFacade,
  projectUrl,
  contentUrl,
  columnUrl,
  projectNumber,
}) => async () => {
  const {
    data: { number: contextProjectNumber },
  } = await githubFacade.getByUrl(projectUrl);
  softAssert(
    contextProjectNumber === projectNumber,
    "Card moved on non-release project."
  );

  const {
    data: { title: issueTitle, labels },
  } = await githubFacade.getByUrl(contentUrl);
  assert(
    semver.valid(issueTitle),
    `Issue name in project card is not a semantic version: ${issueTitle}`
  );
  assert(
    semver.prerelease(issueTitle) === null,
    `Issue name in project card should not have prerelease version: ${issueTitle}`
  );
  const branchLabel = labels
    .map(({ name }) => name)
    .find((label) => label.startsWith("branch:"));
  assert(branchLabel !== undefined, "Could not find label with branch name");
  const branchName = branchLabel.substring(7);
  assert(
    await githubFacade.hasBranch(branchName),
    `Could not find branch named: ${branchName}`
  );
  const ref = `refs/heads/${branchName}`;

  const {
    data: { name: columnName },
  } = await githubFacade.getByUrl(columnUrl);
  softAssert(columnName !== "New", 'Nothing to do when card moved to "New"');
  let newVersion;
  if (columnName === "Release") {
    newVersion = issueTitle;
  } else {
    newVersion = `${issueTitle}-${columnName.toLowerCase()}.0`;
  }

  softAssert(
    semver.valid(newVersion),
    `Invalid prerelease version: ${newVersion}`
  );

  return { ref, inputs: { version: newVersion } };
};
