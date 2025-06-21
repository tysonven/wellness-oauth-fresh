// test_authenticated_request.js
import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const URL = 'https://uat-api.wellnessliving.io/v1/location/view?id_region=1&k_business=50312&k_location=5000000296&i_logo_height=100&i_logo_width=220';
const COOKIES_FILE_PATH = './cookies.json';

async function makeAuthenticatedRequest() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const cookies = JSON.parse(await fs.readFile(COOKIES_FILE_PATH));
    await page.setCookie(...cookies);
    console.log('🍪 Cookies loaded into page context\n');

    console.log(`🌐 Navigating to: ${URL}\n`);
    const response = await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });

    await new Promise(resolve => setTimeout(resolve, 8000)); // wait for potential CF JS challenge

    const content = await page.content();

    // Try to extract JSON from body if it's a raw JSON response
    const json = await page.evaluate(() => {
      try {
        return JSON.parse(document.querySelector('pre')?.innerText || '{}');
      } catch (e) {
        return { error: 'Could not parse JSON', raw: document.body.innerText };
      }
    });

    console.log('✅ JSON Response Intercepted:');
    console.log(json);
  } catch (err) {
    console.error('❌ Error during request:', err.message);
  } finally {
    await browser.close();
  }
}

makeAuthenticatedRequest();
