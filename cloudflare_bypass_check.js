// cloudflare_bypass_check.js
import puppeteer from 'puppeteer';
import fs from 'fs';

const URL = 'https://uat-api.wellnessliving.io/v1/location/view?id_region=1&k_business=50312&k_location=5000000296&i_logo_height=100&i_logo_width=220';

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // set to false for manual solving if needed
  const page = await browser.newPage();

  console.log('🌐 Navigating to:', URL);
  await page.goto(URL, { waitUntil: 'domcontentloaded' });

  console.log('✅ Page loaded, attempting to bypass Cloudflare...');
  await new Promise(resolve => setTimeout(resolve, 8000)); // wait 8 seconds for CF to challenge

  const pageContent = await page.content();

  if (pageContent.includes('Just a moment') || pageContent.includes('cf-challenge')) {
    console.error('⚠️ Still blocked by Cloudflare');
  } else {
    const cookies = await page.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 2));
    console.log('🎉 Cloudflare bypass successful. Cookies saved to cookies.json');
  }

  await browser.close();
})();
