// UI Elements
const uploadContainer = document.getElementById('upload-container');
const convertContainer = document.getElementById('convert-container');
const initOverlay = document.getElementById('init-overlay');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');

const fileNameText = document.getElementById('file-name');
const fileInfoText = document.getElementById('file-info');
const formatSelect = document.getElementById('format-select');
const convertBtn = document.getElementById('convert-btn');

const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressVal = document.getElementById('progress-val');
const statusText = document.getElementById('status-text');

const resultContainer = document.getElementById('result-container');
const downloadBtn = document.getElementById('download-btn');

let currentFile = null;
let resultBlob = null;

// Drag and Drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    window.addEventListener(eventName, preventDefaults, false);
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('bg-green-50', 'border-green-400'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('bg-green-50', 'border-green-400'), false);
});

dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length) handleFile(files[0]);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
});

function handleFile(file) {
    currentFile = file;
    const extension = file.name.split('.').pop().toLowerCase();
    fileNameText.textContent = file.name;
    fileInfoText.textContent = `${extension.toUpperCase()} • ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    
    // Dynamically update format list to hide original format
    const options = formatSelect.querySelectorAll('option');
    let firstVisible = null;
    options.forEach(opt => {
        // Simple mapping: if input is m4a, hide aac as well to avoid redundant conversion
        const isSameFormat = opt.value === extension || (extension === 'm4a' && opt.value === 'aac') || (extension === 'aac' && opt.value === 'm4a');
        
        if (isSameFormat) {
            opt.style.display = 'none';
        } else {
            opt.style.display = 'block';
            if (!firstVisible) firstVisible = opt.value;
        }
    });
    if (firstVisible) formatSelect.value = firstVisible;

    uploadContainer.classList.add('hidden');
    convertContainer.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    progressContainer.classList.add('hidden');
}

convertBtn.addEventListener('click', async () => {
    if (!currentFile) return;

    const targetFormat = formatSelect.value;
    
    // UI Update
    convertBtn.disabled = true;
    convertBtn.classList.add('opacity-50', 'cursor-not-allowed');
    progressContainer.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    updateProgress(0);
    statusText.textContent = '파일 분석 중...';

    try {
        const arrayBuffer = await currentFile.arrayBuffer();
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        statusText.textContent = '오디오 디코딩 중...';
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        statusText.textContent = '인코딩 진행 중...';
        
        if (targetFormat === 'mp3') {
            resultBlob = await encodeMp3(audioBuffer);
        } else if (targetFormat === 'wav') {
            resultBlob = await encodeWav(audioBuffer);
        } else if (targetFormat === 'aac' || targetFormat === 'm4a' || targetFormat === 'ogg') {
            resultBlob = await encodeNative(audioBuffer, targetFormat);
        } else {
            alert('이 형식은 곧 지원될 예정입니다!');
            throw new Error('Unsupported format');
        }

        // Show download
        resultContainer.classList.remove('hidden');
        statusText.textContent = '변환 완료!';
        updateProgress(100);

    } catch (err) {
        console.error('Conversion Error:', err);
        alert('변환 중 오류가 발생했습니다. 파일 형식을 확인해 주세요.');
    } finally {
        convertBtn.disabled = false;
        convertBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
});

// MP3 Encoder using lamejs
async function encodeMp3(audioBuffer) {
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const kbps = 128;
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);
    const mp3Data = [];

    const left = audioBuffer.getChannelData(0);
    const right = channels > 1 ? audioBuffer.getChannelData(1) : null;

    const leftInt16 = floatTo16BitPCM(left);
    const rightInt16 = right ? floatTo16BitPCM(right) : null;

    const sampleBlockSize = 1152;
    const totalBlocks = Math.ceil(leftInt16.length / sampleBlockSize);

    for (let i = 0; i < leftInt16.length; i += sampleBlockSize) {
        const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
        let mp3buf;
        if (channels === 2) {
            const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
            mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        } else {
            mp3buf = mp3encoder.encodeBuffer(leftChunk);
        }
        if (mp3buf.length > 0) mp3Data.push(mp3buf);
        const currentBlock = Math.floor(i / sampleBlockSize);
        if (currentBlock % 10 === 0) updateProgress(Math.round((currentBlock / totalBlocks) * 100));
    }
    const end = mp3encoder.flush();
    if (end.length > 0) mp3Data.push(end);
    return new Blob(mp3Data, { type: 'audio/mp3' });
}

// Simple WAV Encoder
async function encodeWav(audioBuffer) {
    const numOfChan = audioBuffer.numberOfChannels,
        length = audioBuffer.length * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [],
        sampleRate = audioBuffer.sampleRate;
    let offset = 0, i, sample;

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16); setUint16(1); setUint16(numOfChan);
    setUint32(sampleRate); setUint32(sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2); setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - offset - 4);

    for (i = 0; i < numOfChan; i++) channels.push(audioBuffer.getChannelData(i));
    while (offset < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][Math.floor((offset - 44) / (numOfChan * 2))]));
            sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
            view.setInt16(offset, sample, true);
            offset += 2;
        }
        if (Math.floor(offset / 1000) % 100 === 0) updateProgress(Math.round((offset / length) * 100));
    }
    return new Blob([buffer], { type: 'audio/wav' });
    function setUint16(data) { view.setUint16(offset, data, true); offset += 2; }
    function setUint32(data) { view.setUint32(offset, data, true); offset += 4; }
}

// Native Encoder (AAC, M4A, OGG) using MediaRecorder
async function encodeNative(audioBuffer, format) {
    return new Promise((resolve) => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        const destination = audioCtx.createMediaStreamDestination();
        source.connect(destination);

        let mimeType = 'audio/webm;codecs=opus'; // Default for OGG-like in browser
        if (format === 'aac' || format === 'm4a') {
            mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm;codecs=opus';
        } else if (format === 'ogg') {
            mimeType = MediaRecorder.isTypeSupported('audio/ogg') ? 'audio/ogg' : 'audio/webm;codecs=opus';
        }

        const recorder = new MediaRecorder(destination.stream, { mimeType });
        const chunks = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));

        recorder.start();
        source.start(0);
        setTimeout(() => { recorder.stop(); source.stop(); }, audioBuffer.duration * 1000 + 100);
        
        let p = 0;
        const interval = setInterval(() => {
            p += 2; if (p > 98) clearInterval(interval);
            updateProgress(p);
        }, (audioBuffer.duration * 1000) / 50);
    });
}

function floatTo16BitPCM(input) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
}

function updateProgress(p) {
    progressBar.style.width = `${p}%`;
    progressVal.textContent = `${p}%`;
}

downloadBtn.addEventListener('click', () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    const ext = formatSelect.value;
    const originalNameNoExt = currentFile.name.split('.').slice(0, -1).join('.');
    a.href = url;
    a.download = `${originalNameNoExt}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

window.resetApp = function() {
    currentFile = null;
    resultBlob = null;
    fileInput.value = '';
    uploadContainer.classList.remove('hidden');
    convertContainer.classList.add('hidden');
}