// test_wellness_living.js (ESM-compatible + validated cookies)
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cookiesPath = path.resolve(__dirname, 'cookies.json');

async function run() {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Validate cookie structure before applying
    const cookies = JSON.parse(await fs.readFile(cookiesPath, 'utf-8'));
    const validCookies = cookies.filter(cookie => cookie.name && cookie.value);

    await page.setCookie(...validCookies);

    const url = 'https://uat-api.wellnessliving.io/v1/location/view?id_region=1&k_business=50312&k_location=5000000296&i_logo_height=100&i_logo_width=220';
    console.log(`🌐 Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    const content = await page.content();
    console.log('✅ Page content loaded');
    console.log(content);

    await browser.close();
  } catch (err) {
    console.error('❌ Final Error:', err);
  }
}

run();