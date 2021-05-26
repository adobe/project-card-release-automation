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

const PULL_REQUEST_TYPES = [
  { name: "Breaking Change", regex: /- \[x\] Breaking change/ },
  { name: "Feature", regex: /- \[x\] New feature/ },
  { name: "Bug Fix", regex: /- \[x\] Bug fix/ },
  { name: "Improvement", regex: /- \[x\] Improvement/ }
];

module.exports = body => {
  const pullRequestType = PULL_REQUEST_TYPES.find(({ regex }) =>
    regex.test(body)
  );
  return pullRequestType ? pullRequestType.name : "";
};
