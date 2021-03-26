module.exports = async (func, message, nonZeroExitCode = true) => {
  try {
    await func();
    fail(`Expected "${message}", but no error was thrown`);
  } catch (e) {
    expect(e.message).toEqual(message);
    if (nonZeroExitCode) {
      expect(e.exitCode).not.toEqual(0);
    } else {
      expect(e.exitCode).toEqual(0);
    }
  }
}