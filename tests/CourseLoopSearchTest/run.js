const { By, until } = require("selenium-webdriver");

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

module.exports = async function (driver, parameters = {}) {
  const url =
    "https://login.uts.edu.au/home/uts_courseloop_1/0oa28iy8taYWJ18LN3l7/aln28j1y4bfiqSrwE3l7";

  const whatToSearch =
    parameters.whatToSearch || "Teaching English for Academic Purposes";
  const courseCode = parameters.courseCode || "010030";

  const STEP_DELAY_MS = 2000;
  const delay = () => driver.sleep(STEP_DELAY_MS);

  try {
    // Step 1: Navigate
    log(`Navigating to ${url}`);
    await driver.get(url);
    await delay();

    // Step 2: Wait for search input
    log("Waiting for search input...");
    const searchInput = await driver.wait(
      until.elementLocated(By.css('input[data-id="searchInput"]')),
      20000
    );
    await driver.wait(until.elementIsVisible(searchInput), 10000);
    await delay();

    // Step 3: Type into search input
    await searchInput.click();
    await delay();

    await searchInput.clear();
    await delay();

    await searchInput.sendKeys(whatToSearch);
    log(`Typed: ${whatToSearch}`);
    await delay();

    // Step 4: Wait for academic item with the course code to appear
    log(`Waiting for academic item with course code ${courseCode}...`);

    const itemXpath =
      `//div[contains(@class,'AcademicItem') and ` +
      `starts-with(@aria-label, ${JSON.stringify(courseCode + " ")})]`;

    const item = await driver.wait(until.elementLocated(By.xpath(itemXpath)), 20000);
    await driver.wait(until.elementIsVisible(item), 10000);
    await delay();

    // Step 5: Ensure code text is visible within the item
    const codeEl = await item.findElement(
      By.xpath(`.//div[normalize-space(.)=${JSON.stringify(courseCode)}]`)
    );
    await driver.wait(until.elementIsVisible(codeEl), 5000);
    await delay();

    log(`✅ PASS: Course code ${courseCode} is visible on screen.`);
  } catch (err) {
    process.stderr.write(`❌ FAIL: ${err?.message}\n`);
    throw err;
  }
};
