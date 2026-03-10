const { By, until } = require("selenium-webdriver");

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

// ─── Site list for Step 8 ────────────────────────────────────────────────────
const SITES = [
  { url: "https://cad.uts.edu.au/fds",             isTst: false },
  { url: "https://tstcad.uts.edu.au/fds",          isTst: true  },
  { url: "https://cad.uts.edu.au/foh",             isTst: false },
  { url: "https://tstcad.uts.edu.au/foh",          isTst: true  },
  { url: "https://cad.uts.edu.au/sci",             isTst: false },
  { url: "https://tstcad.uts.edu.au/sci",          isTst: true  },
  { url: "https://busresearch.uts.edu.au/hdreoi",  isTst: false },
  { url: "https://tstbusresearch.uts.edu.au/hdreoi", isTst: true },
];

// ─── Helper: run the Okta login flow (Steps 1–6) ────────────────────────────
async function performLogin(driver, EMAIL, PASSWORD) {
  // Step 1
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

  // Step 2
  log("Step 2: Entering email address...");
  await usernameField.clear();
  await usernameField.sendKeys(EMAIL);
  await usernameField.sendKeys("\n");

  // Step 3
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

  // Step 4
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

  // Step 5
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

  // Step 6
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
}

// ─── Helper: poll for MFA approval (Step 7) ─────────────────────────────────
// Returns true if approved, false if session expired (caller should retry).
// Throws on hard timeout.
async function waitForMFAApproval(driver) {
  const POLL_INTERVAL_MS = 20000; // 20 seconds between checks
  const MAX_POLLS = 15;           // 15 × 20s = 5 minutes
  const USER_HOME_URL = "https://login.uts.edu.au/app/UserHome";

  for (let poll = 1; poll <= MAX_POLLS; poll++) {
    log(`Step 7: Waiting for MFA approval... (check ${poll}/${MAX_POLLS}, ~${poll * 20}s elapsed)`);
    await driver.sleep(POLL_INTERVAL_MS);

    const currentUrl = await driver.getCurrentUrl();

    // Success — UserHome loaded
    if (currentUrl.includes(USER_HOME_URL) || currentUrl.includes("UserHome")) {
      log("PASS: MFA approved — UserHome page loaded.");
      return true;
    }

    // Check for session-expired error
    const errorContainers = await driver.findElements(
      By.css('div[data-se="o-form-error-container"]')
    );
    if (errorContainers.length > 0) {
      const errorText = await errorContainers[0].getText();
      if (errorText.includes("session has expired")) {
        log("Session expired waiting for MFA. Will retry login.");
        return false;
      }
    }
  }

  throw new Error("FAIL: MFA approval timed out after 5 minutes.");
}

// ─── Helper: test a TST site ─────────────────────────────────────────────────
// Throws on failure so the retry wrapper can catch it.
async function testTstSite(driver, url) {
  await driver.get(url);
  let labelText;
  try {
    await driver.wait(
      until.elementLocated(By.css('label[for="logon"]')),
      10000
    );
    const label = await driver.findElement(By.css('label[for="logon"]'));
    labelText = await label.getText();
  } catch {
    throw new Error(`User Id login label not found on ${url}`);
  }

  if (!labelText.includes("User Id")) {
    throw new Error(`Login label found but text was "${labelText}" on ${url}`);
  }
}

// ─── Helper: test a non-TST (production) site ────────────────────────────────
// Throws on failure so the retry wrapper can catch it.
async function testProdSite(driver, url, EMAIL) {
  await driver.get(url);

  // Try at 10s then 20s to detect the Microsoft login redirect
  for (const waitMs of [10000, 10000]) {
    await driver.sleep(waitMs);

    const currentUrl = await driver.getCurrentUrl();

    if (currentUrl.includes("login.microsoftonline.com")) {
      log(`Microsoft login page detected for ${url}. Entering email...`);

      try {
        const emailInput = await driver.wait(
          until.elementLocated(By.css('input[name="loginfmt"]')),
          10000
        );
        await emailInput.clear();
        await emailInput.sendKeys(EMAIL);
        await emailInput.sendKeys("\n");
      } catch {
        throw new Error(`Microsoft login page loaded but email input not found for ${url}`);
      }

      // Wait for the "Invalid Application user" response page
      let invalidAppFound = false;
      for (const msWaitMs of [10000, 20000]) {
        await driver.sleep(msWaitMs);
        const src = await driver.getPageSource();
        if (src.includes("Invalid Application user")) {
          invalidAppFound = true;
          break;
        }
      }

      if (!invalidAppFound) {
        throw new Error(`"Invalid Application user" not found after Microsoft login for ${url}`);
      }
      return; // PASS
    }

    // Also handle the unlikely case where "Invalid Application user" loads without MS login
    const src = await driver.getPageSource();
    if (src.includes("Invalid Application user")) {
      return; // PASS
    }
  }

  // Neither Microsoft login nor the expected page appeared within 20s
  throw new Error(`Microsoft login page not detected within 20s for ${url}`);
}

// ─── Main export ─────────────────────────────────────────────────────────────
module.exports = async function (driver, parameters = {}, zephyrLog) {
  if (typeof zephyrLog !== "function") zephyrLog = function () {};

  const EMAIL    = parameters.ANDREW_STRANGE_EMAIL;
  const PASSWORD = parameters.ANDREW_STRANGE_PASSWORD;

  // ── Steps 1–7: Login + MFA, up to 3 attempts ──────────────────────────────
  const MAX_LOGIN_ATTEMPTS = 3;
  let loggedIn = false;

  for (let attempt = 1; attempt <= MAX_LOGIN_ATTEMPTS; attempt++) {
    log(`\n--- Login attempt ${attempt}/${MAX_LOGIN_ATTEMPTS} ---`);
    try {
      await performLogin(driver, EMAIL, PASSWORD);

      // Step 7
      log("Step 7: Push notification sent — waiting for user to approve MFA...");
      const approved = await waitForMFAApproval(driver);

      if (approved) {
        loggedIn = true;
        zephyrLog(`Steps 1–7: Login + MFA approved on attempt ${attempt}.`, "Pass");
        break;
      } else {
        // Session expired — loop back and retry (if attempts remain)
        zephyrLog(`Steps 1–7: Session expired during MFA on attempt ${attempt}.`, "Fail");
        if (attempt === MAX_LOGIN_ATTEMPTS) {
          const msg = "FAIL: MFA session expired on all 3 attempts.";
          zephyrLog(msg, "Fail");
          throw new Error(msg);
        }
        log(`Retrying login (attempt ${attempt + 1})...`);
      }
    } catch (err) {
      if (attempt === MAX_LOGIN_ATTEMPTS) {
        zephyrLog("FAIL: " + (err && err.message), "Fail");
        throw err;
      }
      log(`Attempt ${attempt} failed: ${err.message}. Retrying...`);
    }
  }

  if (!loggedIn) {
    const msg = "FAIL: Could not complete MFA login after 3 attempts.";
    zephyrLog(msg, "Fail");
    throw new Error(msg);
  }

  // ── Step 8: Test all 8 sites in individual tabs ────────────────────────────
  log("\n--- Step 8: Testing 8 sites ---");
  const mainWindow = await driver.getWindowHandle();
  const SITE_RETRIES = 3; // 1 attempt + 2 retries
  const siteFailures = [];

  for (let i = 0; i < SITES.length; i++) {
    const site = SITES[i];
    const stepLabel = `Step 8-${i + 1}`;
    log(`\n${stepLabel}: Testing ${site.url} (${site.isTst ? "TST" : "production"})`);

    let passed = false;
    let lastError = null;

    for (let attempt = 1; attempt <= SITE_RETRIES; attempt++) {
      if (attempt > 1) {
        log(`${stepLabel}: Retry ${attempt - 1}/2 for ${site.url}...`);
      }

      let tabOpened = false;
      try {
        await driver.executeScript("window.open('');");
        tabOpened = true;
        const handles = await driver.getAllWindowHandles();
        await driver.switchTo().window(handles[handles.length - 1]);

        if (site.isTst) {
          await testTstSite(driver, site.url);
        } else {
          await testProdSite(driver, site.url, EMAIL);
        }

        // If we reach here, the test passed
        log(`PASS: ${stepLabel} — ${site.url}`);
        zephyrLog(`${site.url} — Login page verified successfully.`, "Pass");
        passed = true;
      } catch (err) {
        lastError = err;
        log(`FAIL (attempt ${attempt}/${SITE_RETRIES}): ${stepLabel} — ${err.message}`);
      } finally {
        if (tabOpened) {
          try { await driver.close(); } catch { /* ignore */ }
          try { await driver.switchTo().window(mainWindow); } catch { /* ignore */ }
        }
      }

      if (passed) break;
    }

    if (!passed) {
      const failMsg = `${stepLabel} FAILED after ${SITE_RETRIES} attempts — ${lastError && lastError.message}`;
      log(`FAIL: ${failMsg}`);
      zephyrLog(`${site.url} — ${failMsg}`, "Fail");
      siteFailures.push(failMsg);
    }
  }

  log("\n--- All Step 8 site tests complete ---");

  if (siteFailures.length > 0) {
    const summary = `FAIL: ${siteFailures.length} site(s) failed:\n  ${siteFailures.join("\n  ")}`;
    log(summary);
    throw new Error(summary);
  }

  log("PASS: All 8 sites verified successfully.");
};
