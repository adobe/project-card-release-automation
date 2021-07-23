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

const assert = require("./utils/assert");

module.exports =
  ({ eventName, githubFacade, workflowId, ...container }) =>
  async () => {
    assert(
      eventName === "project_card" ||
        eventName === "push" ||
        eventName === "workflow_dispatch",
      `Unknown event: ${eventName}.`
    );

    // Don't include the handlers in the function signature so that the
    // container only builds the necessary handler.
    const handler =
      eventName === "project_card"
        ? container.handleProjectCardMove
        : container.handlePushOrDispatch;

    const { ref, inputs } = await handler();
    await githubFacade.dispatchWorkflow(workflowId, ref, inputs);
  };
