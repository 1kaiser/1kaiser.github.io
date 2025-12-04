
document.addEventListener('DOMContentLoaded', () => {
    loadSoundCloudData();
});

async function loadSoundCloudData() {
    const container = document.getElementById('soundcloud-container');
    if (!container) return;

    try {
        const response = await fetch('soundcloud/playback_data.json');
        if (!response.ok) throw new Error('Failed to load data');
        const data = await response.json();

        // Sort years descending
        const years = Object.keys(data).sort((a, b) => b - a);

        years.forEach(year => {
            const tracks = data[year];
            if (!tracks || tracks.length === 0) return;

            const yearSection = document.createElement('div');
            yearSection.className = 'sc-year-section';

            const yearTitle = document.createElement('div');
            yearTitle.className = 'sc-year-title';
            yearTitle.textContent = year;
            yearSection.appendChild(yearTitle);

            const grid = document.createElement('div');
            grid.className = 'sc-bento-grid';

            // Top 5 tracks
            tracks.slice(0, 5).forEach((track, index) => {
                const card = document.createElement('a');
                card.className = 'sc-track-card';

                if (index === 0) card.classList.add('hero');
                else card.classList.add('standard');

                card.href = track.url || '#';
                card.target = '_blank';

                const bgDiv = document.createElement('div');
                bgDiv.className = 'sc-track-bg';

                // Handle image logic
                let remoteUrl = track.artwork;
                if (remoteUrl && remoteUrl.startsWith('http') && remoteUrl.includes('t50x50')) {
                    remoteUrl = remoteUrl.replace('t50x50', 't500x500');
                }

                // Adjust local path to be relative to root
                let localPath = track.local_artwork ? `soundcloud/${track.local_artwork}` : null;

                // Load image logic with fallback
                if (localPath) {
                     // Check if local image exists/loads
                     const img = new Image();
                     img.src = localPath;

                     // Set local path initially
                     bgDiv.style.backgroundImage = `url('${localPath}')`;

                     img.onerror = () => {
                         if (remoteUrl) {
                             bgDiv.style.backgroundImage = `url('${remoteUrl}')`;
                         } else {
                             bgDiv.style.backgroundColor = '#2a2a2a';
                             bgDiv.style.backgroundImage = 'none';
                         }
                     };
                } else if (remoteUrl) {
                    bgDiv.style.backgroundImage = `url('${remoteUrl}')`;
                } else {
                    bgDiv.style.backgroundColor = '#2a2a2a';
                }

                const overlay = document.createElement('div');
                overlay.className = 'sc-track-overlay';

                const badge = document.createElement('div');
                badge.className = 'sc-rank-badge';
                badge.textContent = `#${index + 1}`;

                const title = document.createElement('div');
                title.className = 'sc-track-title';
                title.textContent = track.title;
                title.title = track.title; // Tooltip

                const artist = document.createElement('div');
                artist.className = 'sc-track-artist';
                artist.textContent = track.artist;

                overlay.appendChild(badge);
                overlay.appendChild(title);
                overlay.appendChild(artist);

                card.appendChild(bgDiv);
                card.appendChild(overlay);
                grid.appendChild(card);
            });

            yearSection.appendChild(grid);
            container.appendChild(yearSection);
        });

    } catch (error) {
        console.error('Error loading SoundCloud data:', error);
        container.innerHTML = '<p style="padding: 20px;">Failed to load SoundCloud data.</p>';
    }
}
