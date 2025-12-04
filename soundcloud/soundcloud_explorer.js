const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Helper to download a file
const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {}); // Delete the file async. (But we don't check result)
            reject(err);
        });
    });
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  });
  const page = await context.newPage();

  const years = [];
  for (let y = 2025; y >= 2017; y--) {
      years.push(y);
  }

  const allData = {};
  const downloadsDir = 'downloads';
  if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir);
  }

  for (const year of years) {
      const yearDir = path.join(downloadsDir, year.toString());
      if (!fs.existsSync(yearDir)) {
          fs.mkdirSync(yearDir);
      }

      const url = `https://soundcloud.com/discover/sets/your-playback::0cater:${year}`;
      console.log(`Processing ${year}: ${url}`);

      try {
          await page.goto(url, { timeout: 60000, waitUntil: 'domcontentloaded' });

          try {
              await page.waitForSelector('.systemPlaylistTrackList__item', { timeout: 10000 });
          } catch (e) {
              console.log(`  No tracks found for ${year} or timeout waiting for selector.`);
              continue;
          }

          // Scroll to bottom
          let previousHeight = 0;
          for(let i=0; i<10; i++) {
             previousHeight = await page.evaluate('document.body.scrollHeight');
             await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
             await page.waitForTimeout(1000);
             const newHeight = await page.evaluate('document.body.scrollHeight');
             if (newHeight === previousHeight) break;
          }

          const tracks = await page.$$eval('.systemPlaylistTrackList__item', (items) => {
              return items.map(item => {
                  const titleEl = item.querySelector('.trackItem__trackTitle');
                  const artistEl = item.querySelector('.trackItem__username');
                  const linkEl = item.querySelector('.trackItem__trackTitle');
                  const artworkSpan = item.querySelector('.image__full');
                  let artworkUrl = null;
                  if (artworkSpan) {
                      const style = artworkSpan.getAttribute('style');
                      if (style) {
                          const match = style.match(/url\("?(.*?)"?\)/);
                          if (match) artworkUrl = match[1];
                      }
                  }

                  return {
                      title: titleEl ? titleEl.innerText.trim() : 'Unknown Title',
                      artist: artistEl ? artistEl.innerText.trim() : 'Unknown Artist',
                      url: linkEl ? linkEl.href : null,
                      artwork: artworkUrl
                  };
              });
          });

          console.log(`  Found ${tracks.length} tracks for ${year}. Downloading images...`);

          const processedTracks = [];
          for (let i = 0; i < tracks.length; i++) {
              const track = tracks[i];
              let localPath = null;
              if (track.artwork) {
                  // Upgrade quality
                  const highResUrl = track.artwork.replace('t50x50', 't500x500');
                  const filename = `track_${i + 1}.jpg`;
                  const dest = path.join(yearDir, filename);

                  try {
                      await downloadFile(highResUrl, dest);
                      localPath = dest;
                  } catch (err) {
                      console.log(`    Failed to download image for ${track.title}: ${err.message}`);
                  }
              }

              processedTracks.push({
                  ...track,
                  local_artwork: localPath
              });
          }

          if (processedTracks.length > 0) {
              allData[year] = processedTracks;
          }

      } catch (e) {
          console.log(`  Error processing ${year}:`, e.message);
      }
  }

  fs.writeFileSync('playback_data.json', JSON.stringify(allData, null, 2));
  console.log('Data saved to playback_data.json');

  await browser.close();
})();
