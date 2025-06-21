
// fetch_business_info_with_token_puppeteer.mjs
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const accessToken = 'eyJraWQiOiJNa0ZmOEYzaFJBczRqd3hGQ1VtdEx5Vk5NTE5GK1poeUJcLzA0aDZlMkJWND0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI1M2xncDMwcWJxNTA5ZTFsdDUyOHE0aW1wYiIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiZGVmYXVsdC1tMm0tcmVzb3VyY2Utc2VydmVyLXV6azl6ZlwvcmVhZCIsImF1dGhfdGltZSI6MTc1MDE2MTM5OSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfNTB2OXg3UjlKIiwiZXhwIjoxNzUwMTY0OTk5LCJpYXQiOjE3NTAxNjEzOTksInZlcnNpb24iOjIsImp0aSI6IjM1MTU4M2YwLWJkN2EtNDQ4My1iNTlmLTFjZWM3MjRjNDQxZSIsImNsaWVudF9pZCI6IjUzbGdwMzBxYnE1MDllMWx0NTI4cTRpbXBiIn0.Ahszpx-lSkgQJhFLosjEF3sKQckjhUsfpG_cj3pv95wnaIT5iL0n_9LAw2k4H-w8vT5KoVU3rz7Zv3ACbqgz-_KgZJUN6wffjav_F2w9Gh9YOBP1P0Q_WZR_ry161aWnTbik2jB6LQV7aynqkbyHLwXeAHJnd9wrb7ttmPjAZC3wCvIatom8qSVci1Z5VnnFm0-JR_uA6Xpa1HtN97ibU8E99KnPpmsw_6AfJYE8yASvGkvfWu06bpZ_GOg9y3g_h3mF-I6oLbRTcv8UcYhsn1u24wFHnBBWKL5HQtvWHrmNv0ApfsuZWH3r4mW0eXZX29DWKDlcplI1oj1SAFCtoQ'; // Full token inserted here
const regionId = 1;
const businessId = 50312;
const url = `https://uat-api.wellnessliving.io/v1/business?id_region=${regionId}&k_business=${businessId}`;

(async () => {
  console.log('🚀 Launching Puppeteer to fetch business info...');
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to bypass Cloudflare
  await page.goto('https://uat-api.wellnessliving.io', { waitUntil: 'networkidle2' });

  // Wait until the page isn't showing Cloudflare challenge
  await page.waitForFunction(() => !document.title.includes('Just a moment...'), { timeout: 20000 });

  const result = await page.evaluate(async (url, token) => {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: 'Invalid JSON', body: text };
    }
  }, url, accessToken);

  console.log('✅ Business Info Response:', result);

  await browser.close();
})();
