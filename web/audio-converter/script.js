const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

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
let isFFmpegLoaded = false;
let resultBlob = null;

// Drag and Drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
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
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|aac|m4a|flac|wma)$/i)) {
        alert('올바른 오디오 파일을 선택해 주세요.');
        return;
    }
    currentFile = file;
    fileNameText.textContent = file.name;
    fileInfoText.textContent = `${file.name.split('.').pop().toUpperCase()} • ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    
    uploadContainer.classList.add('hidden');
    convertContainer.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    progressContainer.classList.add('hidden');
}

async function loadFFmpeg() {
    if (isFFmpegLoaded) return;
    initOverlay.classList.remove('hidden');
    try {
        await ffmpeg.load();
        isFFmpegLoaded = true;
    } catch (err) {
        console.error('FFmpeg Load Error:', err);
        alert('변환 엔진을 불러오는 데 실패했습니다. 브라우저 보안 설정을 확인해 주세요.');
    } finally {
        initOverlay.classList.add('hidden');
    }
}

convertBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    if (!isFFmpegLoaded) await loadFFmpeg();
    if (!isFFmpegLoaded) return;

    const targetFormat = formatSelect.value;
    const inputName = 'input_' + currentFile.name;
    const outputName = `output.${targetFormat}`;

    // UI Update
    convertBtn.disabled = true;
    convertBtn.classList.add('opacity-50', 'cursor-not-allowed');
    progressContainer.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    updateProgress(0);

    try {
        // Write file to FS
        ffmpeg.FS('writeFile', inputName, await fetchFile(currentFile));

        // Track progress
        ffmpeg.setProgress(({ ratio }) => {
            updateProgress(Math.round(ratio * 100));
        });

        // Run conversion
        // Note: -y to overwrite if exists
        await ffmpeg.run('-i', inputName, outputName);

        // Read result
        const data = ffmpeg.FS('readFile', outputName);
        resultBlob = new Blob([data.buffer], { type: `audio/${targetFormat}` });
        
        // Show download
        resultContainer.classList.remove('hidden');
        statusText.textContent = '변환 완료!';
        updateProgress(100);

        // Cleanup FS
        ffmpeg.FS('unlink', inputName);
        ffmpeg.FS('unlink', outputName);

    } catch (err) {
        console.error('Conversion Error:', err);
        alert('변환 중 오류가 발생했습니다. 다른 포맷을 시도해 보세요.');
    } finally {
        convertBtn.disabled = false;
        convertBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
});

function updateProgress(p) {
    progressBar.style.width = `${p}%`;
    progressVal.textContent = `${p}%`;
    if (p < 100) statusText.textContent = '인코딩 진행 중...';
}

downloadBtn.addEventListener('click', () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    const originalNameNoExt = currentFile.name.split('.').slice(0, -1).join('.');
    a.href = url;
    a.download = `${originalNameNoExt}.${formatSelect.value}`;
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