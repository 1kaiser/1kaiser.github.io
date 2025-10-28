import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    # Create the directory for screenshots if it doesn't exist
    if not os.path.exists("jules-scratch"):
        os.makedirs("jules-scratch")

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Get the absolute path to the index.html file
        file_path = os.path.abspath('index.html')

        # Go to the local HTML file
        await page.goto(f'file://{file_path}')

        # Wait for the gallery to be visible
        await page.wait_for_selector('.gallery-container')

        # Take a screenshot of the initial gallery view
        await page.screenshot(path='jules-scratch/screenshot-00.png')

        # Hover over the first model card to trigger the hover effect
        await page.hover('.model-card > model-viewer', force=True)
        await asyncio.sleep(1)  # Wait for the animation to complete
        await page.screenshot(path='jules-scratch/screenshot-01.png')

        # Click the first model card to open the modal
        await page.click('.model-card > model-viewer', force=True)
        await page.wait_for_selector('.overlay', state='visible')
        await asyncio.sleep(1)
        await page.screenshot(path='jules-scratch/screenshot-02.png')

        # Close the modal
        await page.click('.close-button')
        await page.wait_for_selector('.overlay', state='hidden')
        await asyncio.sleep(1)
        await page.screenshot(path='jules-scratch/screenshot-03.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
