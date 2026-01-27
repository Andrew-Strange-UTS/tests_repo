const { By, until } = require("selenium-webdriver");

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

module.exports = async function (driver, parameters = {}) {
  const whatToSearch = parameters.whatToSearch || "whatToSearch";
  const url =
    "https://login.uts.edu.au/home/atlassian/0oa264vuohF3jyekI3l7/aln1aqcs055ZRoizW0g8";

  const searchContainerLocator = By.css('[data-testid="search-input-container"]');
  const searchLocator = By.css('input[data-testid="search-input"]');

  try {
    log(`🌏 Navigating to ${url}`);
    await driver.get(url);

    await driver.wait(
      async () => (await driver.executeScript("return document.readyState")) === "complete",
      15000
    );

    log("🔎 Waiting for search input to exist + be visible...");

    const search = await driver.wait(
      until.elementLocated(By.css('[data-testid="search-input"]')),
      10000
    );
    await driver.wait(until.elementIsVisible(search), 10000);
    await driver.wait(until.elementIsEnabled(search), 10000);
  
    // clear + type + submit
    await search.clear();
    await search.sendKeys(whatToSearch, Key.ENTER);

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
