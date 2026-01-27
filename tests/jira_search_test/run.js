// https://login.uts.edu.au/home/atlassian/0oa264vuohF3jyekI3l7/aln1aqcs055ZRoizW0g8

// placeholder="Search"




const { By, until } = require("selenium-webdriver");

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

/**
 * Test: UTS Login Page - Search Field Population
 * @param {WebDriver} driver
 * @param {object} parameters  - { whatToSearch: string }
 */
module.exports = async function (driver, parameters = {}) {
  const whatToSearch = parameters.whatToSearch || "whatToSearch";

  try {
    const url =
      "https://login.uts.edu.au/home/atlassian/0oa264vuohF3jyekI3l7/aln1aqcs055ZRoizW0g8";

    log(`🌏 Navigating to ${url}`);
    await driver.get(url);

    log('🔎 Waiting for search input...');
    let searchInput;
    try {
      searchInput = await driver.wait(
        until.elementLocated(By.css('input[data-testid="search-input"]')),
        15000
      );
      await driver.wait(until.elementIsVisible(searchInput), 8000);
      await driver.wait(until.elementIsEnabled(searchInput), 8000);
    } catch (e) {
      log('❌ FAIL: Search input not found/visible/enabled.');
      throw new Error("Search input not found/visible/enabled");
    }

    // Type into the search field
    await searchInput.click();
    await searchInput.clear();
    await searchInput.sendKeys(whatToSearch);
    log("⌨️ Typed into search input.");
    await driver.sleep(300);

    // Verify value
    const val = await searchInput.getAttribute("value");
    log(`🟢 Search input value is now: ${val}`);

    if (val === whatToSearch) {
      log("✅ PASS: Search field contains the expected value.");
    } else {
      throw new Error(
        `Search field value mismatch. Expected "${whatToSearch}" but got "${val}"`
      );
    }
  } catch (err) {
    process.stderr.write(`🔥 Fatal test error: ${err && err.message}\n`);
    throw err;
  }
};
