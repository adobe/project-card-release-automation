const expectError = require("./expectError");

module.exports = (func, message) => {
  expectError(func, message, false);
}