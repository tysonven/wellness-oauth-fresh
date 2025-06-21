const puppeteer = require('puppeteer');
const qs = require('querystring');

const clientId = process.env.WL_PROXY_UAT_CLIENT_ID;
const clientSecret = process.env.WL_PROXY_UAT_CLIENT_SECRET;
const tokenUrl = 'https://access.uat-api.wellnessliving.io/oauth2/token';

async function getAccessTokenWithPuppeteer() {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const formData = qs.stringify({
    grant_type: 'client_credentials'
  });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.isNavigationRequest() && request.redirectChain().length) {
      request.abort();
    } else {
      request.continue();
    }
  });

  await page.setExtraHTTPHeaders({
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'x-firewall-rule': process.env.WL_CLOUDFLARE_HEADER_VALUE,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
  });

  const response = await page.evaluate(async (url, formData) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': document.querySelector('meta[name="Authorization"]').content,
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-firewall-rule': document.querySelector('meta[name="x-firewall-rule"]').content
      },
      body: formData
    });
    const data = await res.json();
    return data;
  }, tokenUrl, formData);

  await browser.close();
  return response;
}

getAccessTokenWithPuppeteer()
  .then(token => console.log('Access Token:', token))
  .catch(err => console.error('Failed to get token via Puppeteer:', err));
