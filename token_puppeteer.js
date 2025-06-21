require('dotenv').config();
const puppeteer = require('puppeteer');
const qs = require('querystring');

const clientId = process.env.WL_PROXY_UAT_CLIENT_ID;
const clientSecret = process.env.WL_PROXY_UAT_CLIENT_SECRET;
const tokenUrl = 'https://access.uat-api.wellnessliving.io/oauth2/token';

(async () => {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const formData = qs.stringify({ grant_type: 'client_credentials' });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setExtraHTTPHeaders({
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'x-firewall-rule': process.env.WL_CLOUDFLARE_HEADER_VALUE,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
  });

  await page.goto('https://access.uat-api.wellnessliving.io/oauth2/token', {
    waitUntil: 'networkidle2'
  });

  const response = await page.evaluate(async (url, body) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': document.querySelector('meta[name="Authorization"]')?.content || '',
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-firewall-rule': document.querySelector('meta[name="x-firewall-rule"]')?.content || ''
      },
      body
    });
    return await res.json();
  }, tokenUrl, formData);

  console.log('Access Token Response:', response);
  await browser.close();
})();
