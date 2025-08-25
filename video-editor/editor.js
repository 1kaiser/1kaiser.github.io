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

    const isValidTimeFormat = (time) => {
        // Regex to validate HH:MM:SS or HH:MM:SS.ms format
        const timeRegex = /^(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?$/;
        return timeRegex.test(time);
    };

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
                    el.innerHTML = `Processing: ${Math.round(progress * 100)}% (transcoded time: ${time / 1000000}s)`;
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
        await load();
        const inputFilename = inputFile.name;
        await ffmpeg.writeFile(inputFilename, await fetchFile(inputFile));

        const command = ['-i', inputFilename, ...args, outputFilename];
        await ffmpeg.exec(command);

        const data = await ffmpeg.readFile(outputFilename);

        if (video.src) {
            URL.revokeObjectURL(video.src);
        }
        video.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));

        await ffmpeg.deleteFile(inputFilename);
        await ffmpeg.deleteFile(outputFilename);
        message.textContent = 'Processing complete.';
    };

    uploader.addEventListener('change', async (e) => {
        inputFile = e.target.files[0];
        if (inputFile) {
            if (inputFile.size > 100 * 1024 * 1024) { // 100MB
                message.textContent = `Warning: Large file (${(inputFile.size/1024/1024).toFixed(1)}MB). Processing may be slow or fail.`;
            } else {
                message.textContent = `File "${inputFile.name}" selected.`;
            }
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
        const spinner = document.getElementById('spinner');

        if (!inputFile) {
            alert('Please upload a video file first.');
            return;
        }

        if (!startTime || !isValidTimeFormat(startTime)) {
            alert('Invalid or missing start time. Please use HH:MM:SS format.');
            return;
        }

        if (endTime && !isValidTimeFormat(endTime)) {
            alert('Invalid end time format. Please use HH:MM:SS format.');
            return;
        }

        if (!endTime && !duration) {
            alert('Please specify either an end time or a duration.');
            return;
        }

        const args = ['-ss', startTime];
        if (duration) {
            args.push('-t', duration);
        } else if (endTime) {
            args.push('-to', endTime);
        }

        const outputFilename = 'clipped.mp4';

        try {
            spinner.classList.remove('hidden');
            message.textContent = 'Starting processing...';
            await processVideo(args, outputFilename);
        } catch (error) {
            message.textContent = `An error occurred: ${error.message}`;
        } finally {
            spinner.classList.add('hidden');
        }
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
