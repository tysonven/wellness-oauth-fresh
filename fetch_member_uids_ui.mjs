// fetch_member_uids_ui.mjs

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';
dotenv.config();

puppeteer.use(StealthPlugin());

const STAGING_URL = 'https://ds.wellnessliving.com/';
const LOGIN_URL = 'https://ds.wellnessliving.com/Login';

const EMAIL = process.env.WL_EMAIL;
const PASSWORD = process.env.WL_PASSWORD;

(async () => {
  console.log('🌐 Launching browser...');
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔐 Navigating to login...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

    // Wait for login form
    await page.waitForSelector('input[name="login"]');
    await page.type('input[name="login"]', EMAIL, { delay: 50 });
    await page.type('input[name="pwd"]', PASSWORD, { delay: 50 });

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    console.log('✅ Logged in successfully. Navigating to client list...');

    await page.goto('https://ds.wellnessliving.com/Wl/Clients', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.wl-client-list'); // Adjust if needed

    const clients = await page.evaluate(() => {
      const rows = document.querySelectorAll('.wl-client-list tr');
      return Array.from(rows).map(row => {
        const name = row.querySelector('td:nth-child(2)')?.innerText;
        const email = row.querySelector('td:nth-child(3)')?.innerText;
        const uidMatch = row.innerHTML.match(/uid=(\d+)/);
        return {
          name,
          email,
          uid: uidMatch ? uidMatch[1] : 'N/A'
        };
      }).filter(entry => entry.name && entry.uid);
    });

    console.log('📋 Extracted Clients:');
    console.table(clients);

    await browser.close();
  } catch (err) {
    console.error('🔥 Error during Puppeteer run:', err);
    await browser.close();
  }
})();
