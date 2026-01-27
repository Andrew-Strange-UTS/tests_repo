// https://login.uts.edu.au/home/atlassian/0oa264vuohF3jyekI3l7/aln1aqcs055ZRoizW0g8

// placeholder="Search"



// function log(msg) {
//   process.stdout.write(`${msg}\n`);
// }

// /**
//  * Test: UTS Login Page - Search Field Population
//  * @param {WebDriver} driver   - Provided by your sequence runner (framework handles browser lifecycle)
//  * @param {object} parameters  - { whatToSearch: string }
//  */
// module.exports = async function (driver, parameters = {}) {
//   const whatToSearch = parameters.whatToSearch || "whatToSearch";

//   try {
//     // Step 1: Go to target page
//     const url =
//       "https://login.uts.edu.au/home/atlassian/0oa264vuohF3jyekI3l7/aln1aqcs055ZRoizW0g8";
//     log(`🌏 Navigating to ${url}`);
//     await driver.get(url);

//     // Step 2: Wait for the search field (placeholder="Search")
//     log('🔎 Waiting for search input with placeholder="Search"...');

//     // Prefer CSS selector for placeholder match
//     const searchInput = await driver.wait(
//         until.elementLocated(By.css('input[data-testid="search-input"]')),
//         15000
//     );
//     await driver.wait(until.elementIsVisible(searchInput), 8000);

//     } catch (e) {
//       log('❌ FAIL: Search input (placeholder="Search") not found/visible/enabled.');
//       throw new Error('Search input (placeholder="Search") not found/visible/enabled');
//     }

//     // Step 3: Type into the search field
//     await searchInput.clear();
//     await searchInput.sendKeys(whatToSearch);
//     log("⌨️ Typed into search input.");
//     await driver.sleep(300);

//     // Step 4: Verify the value is present
//     const val = await searchInput.getAttribute("value");
//     log(`🟢 Search input value is now: ${val}`);

//     if (val === whatToSearch) {
//       log("✅ PASS: Search field contains the expected value.");
//     } else {
//       log("❌ FAIL: Search field does NOT contain the expected value.");
//       throw new Error(
//         `Search field value mismatch. Expected "${whatToSearch}" but got "${val}"`
//       );
//     }
//   } catch (err) {
//     process.stderr.write(`🔥 Fatal test error: ${err && err.message}\n`);
//     throw err; // runner/framework handles cleanup
//   }
// };

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
      "https://uts-edu.atlassian.net/jira/";

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
