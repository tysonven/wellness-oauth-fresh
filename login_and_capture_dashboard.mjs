// login_and_capture_dashboard.mjs

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';

dotenv.config();
puppeteer.use(StealthPlugin());

const LOGIN_URL = 'https://ds.wellnessliving.com/login';
const CLIENTS_URL = 'https://ds.wellnessliving.com/Wl/Member/Report/MemberReport.html?s=2OB05EoaIKfD8vqouq';
const EMAIL = process.env.WL_EMAIL;
const PASSWORD = process.env.WL_PASSWORD;

async function run() {
  console.log('🌐 Launching browser...');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  // ✅ Set interceptors BEFORE any navigation
  await page.setRequestInterception(true);

  page.on('request', request => {
    if (request.resourceType() === 'xhr' || request.url().includes('MemberReport')) {
      console.log('🔍 Request:', request.url());
    }
    request.continue();
  });

  page.on('response', async response => {
  const url = response.url();
  const ct = response.headers()['content-type'] || '';

  if (ct.includes('application/json') && url.includes('Member') || url.includes('ReportCore')) {
    try {
      const json = await response.json();
      console.log('📦 Client Data Response:', JSON.stringify(json, null, 2));
    } catch (err) {
      console.log('⚠️ Failed to parse JSON:', err);
    }
  }
});

  try {
    console.log('🔐 Navigating to login...');
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('input[name="login"]', { timeout: 20000 });
    await page.type('input[name="login"]', EMAIL, { delay: 50 });
    await page.type('input[name="pwd"]', PASSWORD, { delay: 50 });

    console.log('🚀 Submitting login...');
    await Promise.all([
      page.click('button[type="submit"], button.login-btn, input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    console.log('✅ Login successful! Current URL:', page.url());

    // ✅ Navigate to clients page AFTER login
    await page.goto(CLIENTS_URL, { waitUntil: 'domcontentloaded' });
    console.log('📋 Navigated to Clients page...');
    await new Promise(resolve => setTimeout(resolve, 6000));

  } catch (err) {
    console.error('🔥 Error during Puppeteer login:', err);
  } finally {
    // Keep browser open for debugging
    // await browser.close();
  }
}

run();
