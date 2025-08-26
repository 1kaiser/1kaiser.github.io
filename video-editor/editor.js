// FFmpeg.wasm video processing logic
const initializeFFmpeg = () => {
    const { FFmpeg } = window.FFmpeg;
    const { fetchFile, toBlobURL } = window.FFmpegUtil;

    const ffmpeg = new FFmpeg();

    const uploader = document.getElementById('uploader');
    const video = document.getElementById('output-video');
    const message = document.getElementById('message');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const durationInput = document.getElementById('duration');
    const applyClipButton = document.getElementById('apply-clip-button');
    let inputFile = null;

    const formatTime = (timeInSeconds) => {
        const hh = Math.floor(timeInSeconds / 3600).toString().padStart(2, '0');
        const mm = Math.floor((timeInSeconds % 3600) / 60).toString().padStart(2, '0');
        const ss = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    };

    const load = async () => {
        if (!ffmpeg.loaded) {
            message.textContent = 'Loading ffmpeg-core.js...';
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            message.textContent = 'FFmpeg loaded. Please upload a video file.';
            ffmpeg.on('log', ({ message: msg }) => {
                const el = document.getElementById('message');
                el.innerHTML = msg;
                console.log(msg);
            });
            ffmpeg.on('progress', ({ progress, time }) => {
                const el = document.getElementById('message');
                if (progress < 1) {
                    el.innerHTML = `${Math.round(progress * 100)}% (transcoded time: ${time / 1000000}s)`;
                }
            });
        }
    };

    const getDuration = (file) => {
        return new Promise((resolve) => {
            const tempVideo = document.createElement('video');
            tempVideo.preload = 'metadata';
            tempVideo.onloadedmetadata = () => {
                window.URL.revokeObjectURL(tempVideo.src);
                resolve(tempVideo.duration);
            };
            tempVideo.src = window.URL.createObjectURL(file);
        });
    };

    const processVideo = async (args, outputFilename) => {
        if (!inputFile) {
            alert('Please upload a video file first.');
            return;
        }
        await load();
        message.textContent = 'Processing...';
        const inputFilename = inputFile.name;
        await ffmpeg.writeFile(inputFilename, await fetchFile(inputFile));

        const command = ['-i', inputFilename, ...args, outputFilename];
        await ffmpeg.exec(command);

        const data = await ffmpeg.readFile(outputFilename);
        video.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
        message.textContent = 'Processing complete.';
        await ffmpeg.deleteFile(inputFilename);
        await ffmpeg.deleteFile(outputFilename);
    };

    uploader.addEventListener('change', async (e) => {
        inputFile = e.target.files[0];
        if (inputFile) {
            message.textContent = `File "${inputFile.name}" selected.`;
            const duration = await getDuration(inputFile);
            startTimeInput.value = '00:00:00';
            endTimeInput.value = formatTime(duration);
            durationInput.value = ''; // Clear duration field
        }
    });

    applyClipButton.addEventListener('click', async () => {
        const startTime = startTimeInput.value.trim();
        const endTime = endTimeInput.value.trim();
        const duration = durationInput.value.trim();

        if (!inputFile) {
            alert('Please upload a video file first.');
            return;
        }

        if (!startTime) {
            alert('A start time is required for clipping.');
            return;
        }

        if (!endTime && !duration) {
            alert('Please specify either an end time or a duration.');
            return;
        }

        const args = ['-ss', startTime];
        // New logic: Prioritize duration over end time
        if (duration) {
            args.push('-t', duration);
        } else if (endTime) {
            args.push('-to', endTime);
        }

        const outputFilename = 'clipped.mp4';
        await processVideo(args, outputFilename);
    });

    // Lazy load ffmpeg on first interaction
    uploader.addEventListener('focus', load, { once: true });
    applyClipButton.addEventListener('focus', load, { once: true });
};

const pollForFFmpeg = () => {
    if (window.FFmpeg && window.FFmpegUtil) {
        initializeFFmpeg();
    } else {
        setTimeout(pollForFFmpeg, 100);
    }
};

pollForFFmpeg();
