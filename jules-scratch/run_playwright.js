const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
const browser = await chromium.launch();
const page = await browser.newPage();
try {
await page.goto('https://github-repo-timeline.vercel.app/');
await page.fill('input[placeholder="GitHub username, for eg., torvalds"]', '1kaiser');
await page.click('button:has-text("Submit")');
const selector = '#__layout > div > div.px-8.md\\:px-32.lg\\:px-64.pt-8.md\\:pt-16.mx-auto > div:nth-child(2) > div > section';
await page.waitForSelector(selector, { timeout: 120000 });

// Save the "all repos" state
const allReposText = await page.innerText(selector);
fs.writeFileSync('all_repos.txt', allReposText);
console.log('Saved all repos state.');

// Uncheck the "Display forks" checkbox and wait for the page to update
await page.uncheck('input[type="checkbox"]');
await page.waitForTimeout(5000); // Wait 5 seconds for the page to react

// Save the "non-forked repos" state
const nonForkedReposText = await page.innerText(selector);
fs.writeFileSync('non_forked_repos.txt', nonForkedReposText);
console.log('Saved non-forked repos state.');

} catch (e) {
console.error(`An error occurred: ${e}`);
await page.screenshot({ path: 'get_both_error.png' });
console.log('Took a screenshot on error: get_both_error.png');
} finally {
await browser.close();
}
})();