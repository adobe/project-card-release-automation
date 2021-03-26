module.exports = ({ core }) => async func => {
  try {
    await func();
  } catch (e) {
    if (e.exitCode !== undefined) {
      // These are errors from assert and softAssert so just log the message.
      if (e.exitCode === 0) {
        core.info(e.message);
      } else {
        core.setFailed(e.message);
      }
    } else {
      // These are unexpected errors so log the whole error.
      core.setFailed(e);
    }
  }
};