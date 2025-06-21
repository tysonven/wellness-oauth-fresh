import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const targetUrl = 'https://access.uat-api.wellnessliving.io/oauth2/token';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🌐 Launching Puppeteer with Stealth plugin...');

  // Go to the token page (Cloudflare will likely challenge here)
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });

  // Wait until Cloudflare has passed (detect by checking title or body content)
  await page.waitForFunction(
    () => !document.title.includes('Just a moment...'),
    { timeout: 20000 }
  );

  console.log('✅ Cloudflare challenge passed. Making token request...');

  // Send token request from within browser context
  const result = await page.evaluate(async () => {
    const res = await fetch('https://access.uat-api.wellnessliving.io/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: '53lgp30qbq509e1lt528q4impb',
        client_secret: 'h3e9t5543uoa241dikhi5rotaab85m08dk7oincmr9rgruqj2ao'
      })
    });

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: 'Invalid JSON', body: text };
    }
  });

  console.log('✅ Token Response:');
  console.log(result);

  await browser.close();
})();
