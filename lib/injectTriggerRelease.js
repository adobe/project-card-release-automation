const assert = require("./assert");

module.exports = ({ eventName, githubFacade, workflowId, ...container }) => async () => {
  assert(eventName === "project_card" || eventName === "push", `Unknown event: ${eventName}.`);

  const handler = eventName === "project_card" ? container.handleProjectCardMove : container.handlePush;

  const { ref, inputs } = await handler();
  await githubFacade.dispatchWorkflow(workflowId, ref, inputs);
}