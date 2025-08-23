import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:8000/index.html", wait_until="domcontentloaded")

        # Add a class to the body to disable animations
        await page.evaluate("document.body.classList.add('no-animations')")

        # Wait for the gallery to be ready, but with a generous timeout
        await page.wait_for_selector(".gallery-container", timeout=60000)

        # Give the models some time to load
        await page.wait_for_timeout(5000)

        # Hover over the model-viewer inside the first card to make the download button appear
        await page.hover(".model-card model-viewer", force=True)
        await page.wait_for_timeout(500) # wait for the button to appear

        await page.screenshot(path="jules-scratch/verification/gallery_sticky_hover.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
