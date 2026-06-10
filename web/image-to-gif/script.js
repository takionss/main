// Application State
let frames = []; // Array of { id, dataUrl, file }
let currentPreviewIndex = 0;
let previewInterval = null;
let isGenerating = false;

// DOM Elements
const fileInput = document.getElementById('file-input');
const timelineGrid = document.getElementById('timeline-grid');
const emptyState = document.getElementById('empty-state');
const delaySlider = document.getElementById('delay-slider');
const delayValText = document.getElementById('delay-val');
const sizeSelect = document.getElementById('size-select');
const generateBtn = document.getElementById('generate-btn');
const clearAllBtn = document.getElementById('clear-all');
const previewCanvas = document.getElementById('preview-canvas');
const noPreviewOverlay = document.getElementById('no-preview');

const resultModal = document.getElementById('result-modal');
const generatingState = document.getElementById('generating-state');
const finishedState = document.getElementById('finished-state');
const renderProgressBar = document.getElementById('render-progress');
const progressText = document.getElementById('progress-text');
const resultGifImg = document.getElementById('result-gif');
const downloadBtn = document.getElementById('download-btn');

let resultBlob = null;

// Initialize SortableJS
const sortable = new Sortable(timelineGrid, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: () => {
        const newOrderIds = Array.from(timelineGrid.querySelectorAll('.frame-item')).map(el => el.dataset.id);
        const reorderedFrames = newOrderIds.map(id => frames.find(f => f.id === id));
        frames = reorderedFrames;
        resetPreview();
    }
});

// Global Drag & Drop Prevention
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    window.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

const dropZone = document.getElementById('drop-zone');
['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('bg-indigo-50/30', 'border-2', 'border-dashed', 'border-indigo-400'), false);
});
['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('bg-indigo-50/30', 'border-2', 'border-dashed', 'border-indigo-400'), false);
});
dropZone.addEventListener('drop', (e) => {
    handleFileUpload({ target: { files: e.dataTransfer.files } });
});

fileInput.addEventListener('change', handleFileUpload);
delaySlider.addEventListener('input', (e) => {
    delayValText.textContent = `${e.target.value}ms`;
    resetPreview();
});
sizeSelect.addEventListener('change', resetPreview);
generateBtn.addEventListener('click', generateGif);
clearAllBtn.addEventListener('click', clearAllFrames);

function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    files.forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            frames.push({ id: Date.now() + Math.random().toString(36).substr(2, 9), dataUrl: event.target.result, file: file });
            renderTimeline();
            if (frames.length === 1) startPreview();
        };
        reader.readAsDataURL(file);
    });
    fileInput.value = '';
}

function renderTimeline() {
    if (frames.length === 0) {
        emptyState.classList.remove('hidden');
        timelineGrid.innerHTML = '';
        generateBtn.disabled = true;
        stopPreview();
        return;
    }
    emptyState.classList.add('hidden');
    generateBtn.disabled = false;
    timelineGrid.innerHTML = '';
    frames.forEach(frame => {
        const div = document.createElement('div');
        div.className = 'frame-item bg-slate-100 rounded-xl overflow-hidden aspect-square border border-slate-200 shadow-sm';
        div.dataset.id = frame.id;
        div.innerHTML = `<img src="${frame.dataUrl}" class="w-full h-full object-cover"><button class="delete-btn absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-lg flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition-colors" onclick="deleteFrame('${frame.id}')"><i class="fas fa-times"></i></button>`;
        timelineGrid.appendChild(div);
    });
}

window.deleteFrame = function(id) {
    frames = frames.filter(f => f.id !== id);
    renderTimeline();
    resetPreview();
};

function clearAllFrames() {
    if (confirm('모든 이미지를 삭제하시겠습니까?')) { frames = []; renderTimeline(); resetPreview(); }
}

function startPreview() {
    if (previewInterval) clearInterval(previewInterval);
    noPreviewOverlay.classList.add('hidden');
    function step() {
        if (frames.length === 0) { stopPreview(); return; }
        drawPreviewFrame(frames[currentPreviewIndex]);
        currentPreviewIndex = (currentPreviewIndex + 1) % frames.length;
    }
    step();
    previewInterval = setInterval(step, parseInt(delaySlider.value));
}

function stopPreview() {
    if (previewInterval) clearInterval(previewInterval);
    previewInterval = null;
    noPreviewOverlay.classList.remove('hidden');
    previewCanvas.getContext('2d').clearRect(0, 0, previewCanvas.width, previewCanvas.height);
}

function resetPreview() { currentPreviewIndex = 0; if (frames.length > 0) startPreview(); else stopPreview(); }

function drawPreviewFrame(frame) {
    const img = new Image();
    img.onload = () => {
        const sizeMode = sizeSelect.value;
        const targetWidth = sizeMode === 'original' ? img.width : parseInt(sizeMode);
        const targetHeight = (img.height / img.width) * targetWidth;
        previewCanvas.width = targetWidth;
        previewCanvas.height = targetHeight;
        previewCanvas.getContext('2d').drawImage(img, 0, 0, targetWidth, targetHeight);
    };
    img.src = frame.dataUrl;
}

// THE ULTIMATE GIF FIX: USE IMAGE ELEMENT DIRECTLY
async function generateGif() {
    if (frames.length < 2) { alert('최소 2개 이상의 이미지가 필요합니다.'); return; }
    isGenerating = true;
    showModal();
    updateProgress(5);

    let workerUrl = 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js';
    try {
        const response = await fetch(workerUrl);
        workerUrl = URL.createObjectURL(new Blob([await response.text()], { type: 'application/javascript' }));
    } catch (e) { console.error("Worker blob failed"); }

    const gif = new GIF({ workers: 2, quality: 10, workerScript: workerUrl });

    try {
        for (let i = 0; i < frames.length; i++) {
            const img = await loadImage(frames[i].dataUrl);
            const sizeMode = sizeSelect.value;
            const tw = Math.floor(sizeMode === 'original' ? img.width : parseInt(sizeMode));
            const th = Math.floor((img.height / img.width) * tw);
            
            // Create a dedicated canvas for each frame to avoid type issues
            const fCanvas = document.createElement('canvas');
            fCanvas.width = tw;
            fCanvas.height = th;
            fCanvas.getContext('2d').drawImage(img, 0, 0, tw, th);
            
            // Pass the CANVAS element directly. gif.js likes this better than context.
            gif.addFrame(fCanvas, { copy: true, delay: parseInt(delaySlider.value) });
            updateProgress(5 + Math.round(((i + 1) / frames.length) * 20));
        }

        gif.on('progress', (p) => updateProgress(25 + Math.round(p * 75)));
        gif.on('finished', (blob) => {
            updateProgress(100);
            resultBlob = blob;
            resultGifImg.src = URL.createObjectURL(blob);
            generatingState.classList.add('hidden');
            finishedState.classList.remove('hidden');
            isGenerating = false;
        });
        gif.render();
    } catch (err) {
        alert("오류 발생: " + err.message);
        closeModal();
    }
}

function loadImage(src) { return new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = src; }); }
function showModal() { resultModal.classList.remove('hidden'); generatingState.classList.remove('hidden'); finishedState.classList.add('hidden'); updateProgress(0); }
window.closeModal = function() { if (!isGenerating) resultModal.classList.add('hidden'); }
function updateProgress(p) { renderProgressBar.style.width = `${p}%`; progressText.textContent = `${p}%`; }
downloadBtn.addEventListener('click', () => {
    if (!resultBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(resultBlob);
    a.download = `smileslife_animation.gif`;
    a.click();
});