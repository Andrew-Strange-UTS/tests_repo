const { By, until } = require("selenium-webdriver");

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

/**
 * Test: Google Australia Search Textarea Population
 * @param {WebDriver} driver   - Provided by your sequence runner, should be a fresh driver.
 * @param {object} parameters  - { whatToSay: string }
 */
module.exports = async function (driver, parameters = {}) {
  const whatToSay = parameters.whatToSay || "Hi My Name Is Andrew!!";

  try {
    // Step 1: Go to Google Australia
    log("🌏 Navigating to https://www.google.com.au/");
    await driver.get("https://www.google.com.au/");
    await driver.sleep(1200);

    // Step 2: Handle consent popups (if present)
    try {
      const agreeBtns = await driver.findElements(
        By.xpath("//button[.//div[contains(.,'Agree') or contains(.,'accept') or contains(.,'Accept')]]")
      );
      if (agreeBtns.length > 0) {
        log("⚠️ Clicking consent/agree button...");
        await agreeBtns[0].click();
        await driver.sleep(800);
      }
    } catch (e) {
      log("ℹ️ Consent popup skipped or failed to handle (continuing).");
    }

    // Step 3: Wait for search textarea
    log("🔎 Waiting for search textarea...");
    let textarea;
    try {
      textarea = await driver.wait(until.elementLocated(By.name("q")), 8000);
      await driver.wait(until.elementIsVisible(textarea), 5000);
    } catch (e) {
      log("❌ FAIL: Search textarea not found or not visible.");
      throw new Error("Google search textarea not found/visible");
    }

    // Step 4: Type into textarea
    await textarea.clear();
    await textarea.sendKeys(whatToSay);
    log("⌨️ Typed into textarea.");
    await driver.sleep(450);

    // Step 5: Check value
    const val = await textarea.getAttribute("value");
    log(`🟢 Textarea value is now: ${val}`);
    if (val === whatToSay) {
      log("✅ PASS: Textarea contains the right value.");
    } else {
      log(`❌ FAIL: Textarea does NOT contain the expected value!`);
      throw new Error("Textarea does not contain the expected value.");
    }

  } catch (err) {
    process.stderr.write(`🔥 Fatal test error: ${err && err.message}\n`);
    throw err; // Let the runner handle session closure, etc.
  }
};
