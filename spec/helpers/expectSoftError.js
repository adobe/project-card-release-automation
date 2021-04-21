const expectError = require("./expectError");

module.exports = async (func, message) => {
  await expectError(func, message, false);
}