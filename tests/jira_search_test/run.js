const { By, until } = require("selenium-webdriver");

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

module.exports = async function (driver, parameters = {}) {
  const whatToSearch = parameters.whatToSearch || "whatToSearch";
  const url =
    "https://login.uts.edu.au/home/atlassian/0oa264vuohF3jyekI3l7/aln1aqcs055ZRoizW0g8";

  // Use a locator (not an element) so we can re-find it any time
  const searchLocator = By.css('input[data-testid="search-input"]');

  try {
    log(`🌏 Navigating to ${url}`);
    await driver.get(url);

    // Wait for page to be ready-ish (helps with SPAs)
    await driver.wait(
      async () => (await driver.executeScript("return document.readyState")) === "complete",
      15000
    );

    log("🔎 Waiting for search input to exist + be visible...");
    await driver.wait(until.elementLocated(searchLocator), 20000);
    await driver.wait(until.elementIsVisible(driver.findElement(searchLocator)), 20000);

    // Helper: type with a stale-element retry
    const typeAndVerify = async () => {
      const el = await driver.findElement(searchLocator); // re-find fresh
      await driver.wait(until.elementIsVisible(el), 10000);
      await driver.wait(until.elementIsEnabled(el), 10000);

      await el.click();
      await el.clear();
      await el.sendKeys(whatToSearch);

      const val = await el.getAttribute("value");
      log(`🟢 Search input value is now: ${val}`);
      if (val !== whatToSearch) {
        throw new Error(`Value mismatch. Expected "${whatToSearch}" but got "${val}"`);
      }
    };

    log(`🟡 Will enter into search field: ${whatToSearch}`);

    try {
      await typeAndVerify();
    } catch (e) {
      // Retry once if the DOM re-rendered mid-action
      const msg = (e && e.message) || "";
      if (msg.toLowerCase().includes("stale element reference")) {
        log("⚠️ Stale element detected, retrying once...");
        await driver.sleep(500);
        await typeAndVerify();
      } else {
        throw e;
      }
    }

    log("✅ PASS: Search field contains the expected value.");
  } catch (err) {
    process.stderr.write(`🔥 Fatal test error: ${err && err.message}\n`);
    throw err;
  }
};
