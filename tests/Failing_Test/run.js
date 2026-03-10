const { By } = require("selenium-webdriver");

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

module.exports = async function (driver, parameters = {}, zephyrLog) {
  if (typeof zephyrLog !== "function") zephyrLog = function () {};

  try {
    log("Running intentional fail test...");
    throw new Error("Intentional failure: this test is designed to fail.");
  } catch (err) {
    log("FAIL: " + err.message);
    throw err;
  }
};
