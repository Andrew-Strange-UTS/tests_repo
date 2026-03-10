const { By, until } = require("selenium-webdriver");

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

module.exports = async function (driver, parameters = {}, zephyrLog) {
  if (typeof zephyrLog !== "function") zephyrLog = function () {};

  const EMAIL = parameters.ANDREW_STRANGE_EMAIL;
  const PASSWORD = parameters.ANDREW_STRANGE_PASSWORD;

  try {
    // Step 1: Navigate to login page and verify username field
    log("Step 1: Navigating to https://login.uts.edu.au/");
    await driver.get("https://login.uts.edu.au/");

    let usernameField;
    try {
      usernameField = await driver.wait(
        until.elementLocated(By.css('input[name="identifier"]')),
        10000
      );
    } catch {
      throw new Error("FAIL: Can't see username field on login.uts.edu.au");
    }
    log("PASS: Username field found.");

    // Step 2: Enter email and submit
    log("Step 2: Entering email address...");
    await usernameField.clear();
    await usernameField.sendKeys(EMAIL);
    await usernameField.sendKeys("\n");

    // Step 3: Verify email identifier appears on next page
    log("Step 3: Waiting for email identifier to appear...");
    try {
      await driver.wait(
        until.elementLocated(By.css('span.identifier[data-se="identifier"]')),
        10000
      );
    } catch {
      throw new Error("FAIL: Email identifier span not found after submitting username.");
    }
    log("PASS: Email identifier confirmed on page.");

    // Step 4: Click the Select button for Password authenticator
    log("Step 4: Selecting Password authenticator...");
    try {
      const passwordAuthDiv = await driver.wait(
        until.elementLocated(By.css('div.authenticator-button[data-se="okta_password"]')),
        10000
      );
      const selectBtn = await passwordAuthDiv.findElement(By.css('a[data-se="button"]'));
      await selectBtn.click();
    } catch {
      throw new Error("FAIL: Could not find or click the Password authenticator Select button.");
    }
    log("PASS: Password authenticator selected.");

    // Step 5: Enter password and submit
    log("Step 5: Entering password...");
    let passwordField;
    try {
      passwordField = await driver.wait(
        until.elementLocated(By.css('input[name="credentials.passcode"]')),
        10000
      );
    } catch {
      throw new Error("FAIL: Password input field not found.");
    }
    await passwordField.clear();
    await passwordField.sendKeys(PASSWORD);
    await passwordField.sendKeys("\n");
    log("PASS: Password entered and submitted.");

    // Step 6: Click the Select button for "Get a push notification" (Okta Verify push)
    log("Step 6: Selecting 'Get a push notification' MFA option...");
    try {
      const pushAuthDiv = await driver.wait(
        until.elementLocated(By.css('div.authenticator-button[data-se="okta_verify-push"]')),
        10000
      );
      const pushSelectBtn = await pushAuthDiv.findElement(By.css('a[data-se="button"]'));
      await pushSelectBtn.click();
    } catch {
      throw new Error("FAIL: Could not find or click the 'Get a push notification' Select button.");
    }
    log("PASS: 'Get a push notification' selected.");

  } catch (err) {
    log(err.message);
    throw err;
  }
};
