// cloudflare_bypass_proxy.js
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const url = 'https://uat-api.wellnessliving.io/v1/location/view?id_region=1&k_business=50312&k_location=5000000296&i_logo_height=100&i_logo_width=220';

  try {
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    console.log('[🔍] Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const cookies = await page.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 2));

    console.log('✅ Cloudflare bypass complete. Cookies saved to cookies.json');
  } catch (err) {
    console.error('❌ Failed to bypass Cloudflare:', err.message);
  } finally {
    await browser.close();
  }
})();
