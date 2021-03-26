const assert = require("./assert");

module.exports = ({ eventName, core, ...container }) => async () => {
  assert(eventName === "project_card" || eventName === "push", `Unknown event: ${eventName}.`);

  const handler = eventName === "project_card" ? container.handleProjectCardMove : container.handlePush;

  try {
    const { ref, inputs } = await handler();
    core.setOutput("triggerWorkflow", "true");
    core.setOutput("ref", ref);
    core.setOutput("inputs", JSON.stringify(inputs));
  } catch (error) {
    core.setOutput("triggerWorkflow", "false");
    throw error;
  }
}