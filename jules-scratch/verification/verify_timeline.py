from playwright.sync_api import sync_playwright, Page, expect
import os

def test_timeline_visualization():
    """
    This test verifies that the timeline visualization on the projects page
    is rendered correctly and that the images are visible.
    """
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            print("Navigating to projects.html...")
            page.goto(f"file://{os.getcwd()}/projects.html")
            print("Navigation complete.")

            print("Looking for timeline...")
            timeline = page.locator("#timeline")
            expect(timeline).to_be_visible()
            print("Timeline is visible.")

            print("Looking for images...")
            images = timeline.locator("img")
            expect(images).to_have_count(4)
            for i in range(4):
                expect(images.nth(i)).to_be_visible()
            print("Images are visible.")

            print("Taking screenshot...")
            page.screenshot(path="jules-scratch/verification/timeline.png")
            print("Screenshot complete.")

            browser.close()
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_timeline_visualization()