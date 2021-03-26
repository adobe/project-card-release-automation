module.exports = ({ command, run, ...container }) => async () => {
  if (command === "initialize-card") {
    const { initializeCard } = container;
    await run(initializeCard);
  } else if (command === "trigger-release") {
    const { setOutputVars } = container;
    await run(setOutputVars);
  } else if (command === "validate-version") {
    const { validateNewVersion } = container;
    await run(validateNewVersion);
  }
}