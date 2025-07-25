// server/tests/google-secret-field/run.js
const { By, until } = require("selenium-webdriver");

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

/**
 * Test: Google Search Field Secret Value Check
 * @param {WebDriver} driver         <- Provided by your sequence runner
 * @param {object} parameters        <- Should include { TESTWORDS: "..." }
 */
module.exports = async function (driver, parameters = {}) {
  const secret = parameters.TESTWORDS || "";
  if (!secret) {
    log("❌ FAIL: No TESTWORDS secret provided in parameters");
    throw new Error("Missing TESTWORDS secret in parameters");
  }
  log(`🔑 Using TESTWORDS secret with length ${secret.length}`);
  try {
    // Go to Google
    log("🌏 Navigating to https://www.google.com.au/");
    await driver.get("https://www.google.com.au/");
    await driver.sleep(1200);

    // Handle consent pop-up if present
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
      log("ℹ️ Consent popup skipped or not present.");
    }

    // Wait for the search textarea
    log("🔎 Waiting for search textarea...");
    let textarea;
    try {
      textarea = await driver.wait(until.elementLocated(By.name("q")), 8000);
      await driver.wait(until.elementIsVisible(textarea), 5000);
    } catch (e) {
      log("❌ FAIL: Search textarea not found or not visible.");
      throw new Error("Search textarea not found/visible");
    }

    // Type the secret into textarea
    await textarea.clear();
    await textarea.sendKeys(secret);
    log("⌨️ Typed secret into search textarea.");

    // Wait for 5 seconds
    await driver.sleep(5000);

    // Check if textarea value is the secret
    const val = await textarea.getAttribute("value");
    log(`🟢 Textarea value is now: ${val}`);
    if (val === secret) {
      log("✅ PASS: Secret is present in the search textarea.");
    } else {
      log("❌ FAIL: Secret is missing or different in the search textarea.");
      throw new Error("Secret not present in search textarea");
    }

  } catch (err) {
    process.stderr.write(`🔥 Fatal test error: ${err && err.message}\n`);
    throw err;
  }
};