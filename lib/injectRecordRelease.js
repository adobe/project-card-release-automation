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
const path = require("path");

module.exports = ({
  githubFacade,
  version,
  artifactClient,
  core,
  fs,
}) => async () => {
  const issueTitle = semver.coerce(version).raw;
  const issueNumber = await githubFacade.findIssueNumberByIssueTitle(
    issueTitle
  );
  core.info("Creating release comment");
  await githubFacade.createIssueComment(issueNumber, `Released ${version}`);

  const prerelease = semver.prerelease(version) !== null;
  if (!prerelease) {
    core.info("Closing issue");
    await githubFacade.closeIssue(issueNumber);
  }

  const uploadUrl = await githubFacade.createRelease({
    tagName: `v${version}`,
    name: version,
    body: version,
    prerelease,
  });
  const downloadResponse = await artifactClient.downloadAllArtifacts();

  for (const response of downloadResponse) {
    const files = await fs.readdir(response.downloadPath);
    for (const filename of files) {
      const fullPath = path.join(response.downloadPath, filename);
      core.info(`Uploading ${fullPath} to release.`);
      await githubFacade.uploadReleaseAsset(uploadUrl, fullPath);
    }
  }
};
