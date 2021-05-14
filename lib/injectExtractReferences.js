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

const buildMarkdownLink = require("./utils/buildMarkdownLink");

const NON_BREAKING_HYPHEN = "&#x2011;";

module.exports = ({ referencePrefixes, referenceTargetUrlPrefix }) => {
  if (!Array.isArray(referencePrefixes)) {
    return () => "";
  }

  const referenceRegex = new RegExp(
    `(${referencePrefixes.join("|")})[0-9]+`,
    "g"
  );

  return (...texts) =>
    texts
      .reduce((references, text) => {
        (text.match(referenceRegex) || []).forEach(match => {
          if (!references.includes(match)) {
            references.push(match);
          }
        });
        return references;
      }, [])
      .map(reference =>
        buildMarkdownLink(
          reference.replace("-", NON_BREAKING_HYPHEN),
          `${referenceTargetUrlPrefix}${reference}`
        )
      )
      .join("\n");
};
