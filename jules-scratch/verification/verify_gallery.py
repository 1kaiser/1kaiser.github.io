import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:8000/index.html", wait_until="domcontentloaded")

        # Give the particles some time to appear
        await page.wait_for_timeout(10000)

        await page.screenshot(path="jules-scratch/verification/gallery_with_particles.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
