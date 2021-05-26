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

module.exports = ({ octokit: { paginate } }) => ({
  async getAllMatching(endpoint, options, predicate) {
    const matchingItems = [];
    await paginate(endpoint, options, ({ data: items }, done) => {
      for (const item of items) {
        if (predicate(item)) {
          matchingItems.push(item);
        } else {
          done();
          break;
        }
      }
    });
    return matchingItems;
  },
  async getOneMatching(endpoint, options, predicate) {
    let matchingItem = null;
    await paginate(endpoint, options, ({ data: items }, done) => {
      for (const item of items) {
        if (predicate(item)) {
          matchingItem = item;
          done();
          break;
        }
      }
    });
    return matchingItem;
  },
  async getAllMatchingGraphql(query, predicate) {
    const matchingItems = [];
    let cursor = null;
    let done = false;
    while (!done) {
      const { nodes, pageInfo } = await query(cursor);
      for (const node of nodes) {
        if (!predicate(node)) {
          done = true;
          break;
        }
        matchingItems.push(node);
      }
      cursor = pageInfo.endCursor;
      if (!pageInfo.hasNextPage || !cursor) {
        break;
      }
    }
    return matchingItems;
  },
  async getOneMatchingGraphql(query, predicate) {
    let matchingItem = null;
    let cursor = null;
    while (matchingItem === null) {
      const { nodes, pageInfo } = await query(cursor);
      for (const node of nodes) {
        if (predicate(node)) {
          matchingItem = node;
          break;
        }
      }
      cursor = pageInfo.endCursor;
      if (!pageInfo.hasNextPage || !cursor) {
        break;
      }
    }
    return matchingItem;
  }
});
