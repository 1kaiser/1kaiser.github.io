import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Get the absolute path to the README.md file
        file_path = os.path.abspath('README.md')

        # Go to the local HTML file
        await page.goto(f'file://{file_path}')

        # Take a screenshot of the README file
        await page.screenshot(path='jules-scratch/verification/verification.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
