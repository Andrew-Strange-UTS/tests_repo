const { By, until } = require("selenium-webdriver");

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

module.exports = async function (driver, parameters = {}) {
  try {
    const url =
      "https://login.uts.edu.au/home/atlassian/0oa264vuohF3jyekI3l7/aln1aqcs055ZRoizW0g8";

    log(`🌏 Navigating to ${url}`);
    await driver.get(url);

    // Element: <a data-testid="NAV4_for-you" ...>
    const navForYou = By.css('a[data-testid="NAV4_for-you"]');

    log('🔎 Waiting for "For you" nav to be visible...');
    const el = await driver.wait(until.elementLocated(navForYou), 20000);
    await driver.wait(until.elementIsVisible(el), 20000);

    log('✅ PASS: "For you" element is visible.');
  } catch (err) {
    process.stderr.write(`🔥 Fatal test error: ${err && err.message}\n`);
    throw err;
  }
};
