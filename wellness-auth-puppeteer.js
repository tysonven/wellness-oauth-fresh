// wellness-auth-puppeteer.js (rename to .js and use "type": "module" in package.json)
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN_URL = 'https://uat-api.wellnessliving.io/oauth2/token';
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Missing CLIENT_ID or CLIENT_SECRET in environment variables.');
  process.exit(1);
}

const formParams = new URLSearchParams();
formParams.append('grant_type', 'client_credentials');
formParams.append('client_id', CLIENT_ID);
formParams.append('client_secret', CLIENT_SECRET);

async function fetchOAuthToken() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setRequestInterception(true);

  page.on('request', interceptedRequest => {
    if (interceptedRequest.url() === TOKEN_URL) {
      interceptedRequest.continue({
        method: 'POST',
        postData: formParams.toString(),
        headers: {
          ...interceptedRequest.headers(),
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
    } else {
      interceptedRequest.continue();
    }
  });

  console.log('🌐 Navigating to token URL...');
  await page.goto(TOKEN_URL, { waitUntil: 'networkidle2' });

  const response = await page.waitForResponse(TOKEN_URL);
  const data = await response.json();

  await browser.close();

  if (data.access_token) {
    console.log('✅ Access Token:', data.access_token);
    await fs.writeFile('access_token.json', JSON.stringify(data, null, 2));
  } else {
    console.error('❌ Failed to retrieve token:', data);
  }
}

fetchOAuthToken();
