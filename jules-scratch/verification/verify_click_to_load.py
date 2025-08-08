import asyncio
import os
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Capture console output
        page.on("console", lambda msg: print(f"Browser console: {msg.text()}"))

        # Get the absolute path to the index.html file
        file_path = os.path.abspath('index.html')
        await page.goto(f"file://{file_path}")

        # 1. Take a screenshot of the initial state
        await page.screenshot(path="jules-scratch/verification/initial_state.png")

        # 2. Click on the first model tile
        await page.click('.model-card[data-index="0"]')

        # Give it a long time to load and print console messages
        await page.wait_for_timeout(30000) # 30 seconds

        # 3. Take a second screenshot
        await page.screenshot(path="jules-scratch/verification/after_click_state.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
