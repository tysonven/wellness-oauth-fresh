import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';
dotenv.config();

puppeteer.use(StealthPlugin());

const WLL_LOGIN_URL = 'https://ds.wellnessliving.com/login';

const fetchAccessTokenViaPuppeteer = async () => {
  console.log('🌐 Navigating to login page...');

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.setExtraHTTPHeaders({
      'x-firewall-rule': process.env.WL_FIREWALL_HEADER || ''
    });

    await page.goto(WLL_LOGIN_URL, { waitUntil: 'networkidle2' });

    const inputs = await page.$$eval('input', elements =>
      elements.map(el => ({ name: el.name, id: el.id, type: el.type }))
    );
    console.log('🔍 Input fields found:', inputs);

    const emailSelector = 'input[name="login"]';
    const passwordSelector = 'input[name="pwd"]';

    console.log('🔐 Waiting for login input...');
    await page.waitForSelector(emailSelector, { timeout: 30000 });
    await page.waitForSelector(passwordSelector, { timeout: 30000 });

    await page.type(emailSelector, process.env.WL_EMAIL || '', { delay: 50 });
    await page.type(passwordSelector, process.env.WL_PASSWORD || '', { delay: 50 });

    // Submit form via click or Enter
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    console.log('✅ Logged in successfully.');

    // TODO: Extract token or proceed to API interaction
  } catch (error) {
    console.error('🔥 Error in Puppeteer login:', error);
  } finally {
    // await browser.close(); // Optionally keep open for debug
  }
};

fetchAccessTokenViaPuppeteer();
