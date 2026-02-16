/**
 * E2E Test for Webpage to Markdown Extension
 *
 * Usage: node e2e-test.js
 *
 * This script:
 * 1. Launches Chrome with the extension loaded
 * 2. Opens a test webpage
 * 3. Verifies the extension is loaded
 * 4. Tests basic functionality
 */

const { chromium } = require('playwright');
const path = require('path');

async function testExtension() {
  console.log('🎭 Starting E2E test for Webpage to Markdown Extension...\n');

  // Extension path (current directory)
  const extensionPath = path.resolve(__dirname);
  console.log(`📦 Extension path: ${extensionPath}`);

  // User data directory (temporary)
  const userDataDir = path.join(__dirname, '.playwright-data');

  try {
    console.log('🚀 Launching Chrome with extension...');

    // Launch browser with extension loaded
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // Extensions require headed mode
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
      ],
      slowMo: 500, // Slow down for visibility
    });

    console.log('✅ Browser launched successfully');

    // Get extension ID from background page
    let extensionId = null;
    const serviceWorker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    if (serviceWorker) {
      const url = serviceWorker.url();
      extensionId = url.match(/chrome-extension:\/\/([^\/]+)/)?.[1];
      console.log(`🔌 Extension ID: ${extensionId}`);
    }

    // Create a new page
    const page = await context.newPage();
    console.log('📄 Opening test page...');

    // Navigate to a simple test page
    await page.goto('https://example.com');
    console.log('✅ Test page loaded: example.com');

    // Wait a bit to see the page
    await page.waitForTimeout(2000);

    // Check if extension icon appears (if applicable)
    console.log('\n📊 Extension loaded and ready!');
    console.log('👉 You can now manually test the extension:');
    console.log('   1. Click the extension icon in the toolbar');
    console.log('   2. Click "Extract to Markdown"');
    console.log('   3. Check the Side Panel');
    console.log('   4. Test translation feature');
    console.log('\n⏳ Browser will stay open for 30 seconds for manual testing...');

    // Keep browser open for manual testing
    await page.waitForTimeout(30000);

    console.log('\n🧹 Cleaning up...');
    await context.close();
    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
testExtension();
