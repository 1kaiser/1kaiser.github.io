import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Navigate to the local web server
        await page.goto("http://localhost:8000/index.html")

        # Wait for the gallery to be populated with at least one card
        await page.wait_for_selector(".model-card", timeout=10000)

        # Give some time for the models to potentially load and render
        await page.wait_for_timeout(5000)

        # Take a screenshot
        await page.screenshot(path="jules-scratch/verification/gallery_screenshot.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
