const { By, until } = require("selenium-webdriver");

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

/**
 * Test: Search and PASS if course item with code 010030 is visible on screen
 * @param {WebDriver} driver
 * @param {object} parameters - { whatToSearch?: string, courseCode?: string }
 */
module.exports = async function (driver, parameters = {}) {
  const url =
    "https://login.uts.edu.au/home/uts_courseloop_1/0oa28iy8taYWJ18LN3l7/aln28j1y4bfiqSrwE3l7";

  const whatToSearch =
    parameters.whatToSearch || "Teaching English for Academic Purposes";
  const courseCode = parameters.courseCode || "010030";

  try {
    log(`Navigating to ${url}`);
    await driver.get(url);

    // 1) Type into search input
    log("Waiting for search input...");
    const searchInput = await driver.wait(
      until.elementLocated(By.css('input[data-id="searchInput"]')),
      20000
    );
    await driver.wait(until.elementIsVisible(searchInput), 10000);

    await searchInput.click();
    await searchInput.clear();
    await searchInput.sendKeys(whatToSearch);
    log(`Typed: ${whatToSearch}`);

    // 2) PASS if the academic item (by aria-label) is visible
    // Example aria-label:
    // "010030 Teaching English for Academic Purposes Active Subject"
    log(`Waiting for academic item with course code ${courseCode}...`);

    const itemXpath =
      `//div[contains(@class,'AcademicItem') and ` +
      `@aria-label=${JSON.stringify(
        `${courseCode} ${whatToSearch} Active Subject`
      )}]`;

    const item = await driver.wait(
      until.elementLocated(By.xpath(itemXpath)),
      20000
    );
    await driver.wait(until.elementIsVisible(item), 10000);

    // 3) Additionally ensure the code "010030" text is on screen within that item
    const codeEl = await item.findElement(
      By.xpath(`.//div[normalize-space(.)=${JSON.stringify(courseCode)}]`)
    );
    await driver.wait(until.elementIsVisible(codeEl), 5000);

    log(`✅ PASS: Course code ${courseCode} is visible on screen.`);
  } catch (err) {
    process.stderr.write(`❌ FAIL: ${err?.message}\n`);
    throw err;
  }
};
