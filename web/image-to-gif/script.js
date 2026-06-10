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
        // Reorder frames array based on DOM order
        const newOrderIds = Array.from(timelineGrid.querySelectorAll('.frame-item')).map(el => el.dataset.id);
        const reorderedFrames = newOrderIds.map(id => frames.find(f => f.id === id));
        frames = reorderedFrames;
        resetPreview();
    }
});

// Drag and Drop Events
const dropZone = document.getElementById('timeline-grid'); // Or another appropriate zone

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    window.addEventListener(eventName, preventDefaults, false);
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('bg-indigo-50/50'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('bg-indigo-50/50'), false);
});

dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFileUpload({ target: { files: files } });
});

// Event Listeners
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
            const frameId = Date.now() + Math.random().toString(36).substr(2, 9);
            const frame = {
                id: frameId,
                dataUrl: event.target.result,
                file: file
            };
            frames.push(frame);
            renderTimeline();
            if (frames.length === 1) startPreview();
        };
        reader.readAsDataURL(file);
    });
    fileInput.value = ''; // Reset for same file upload
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
    
    // Efficiently update timeline (simple version: full re-render)
    timelineGrid.innerHTML = '';
    frames.forEach(frame => {
        const div = document.createElement('div');
        div.className = 'frame-item bg-slate-100 rounded-xl overflow-hidden aspect-square border border-slate-200 shadow-sm';
        div.dataset.id = frame.id;
        div.innerHTML = `
            <img src="${frame.dataUrl}" class="w-full h-full object-cover">
            <button class="delete-btn absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-lg flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition-colors" onclick="deleteFrame('${frame.id}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        timelineGrid.appendChild(div);
    });
}

window.deleteFrame = function(id) {
    frames = frames.filter(f => f.id !== id);
    renderTimeline();
    resetPreview();
};

function clearAllFrames() {
    if (confirm('모든 이미지를 삭제하시겠습니까?')) {
        frames = [];
        renderTimeline();
        resetPreview();
    }
}

// Preview Logic
function startPreview() {
    if (previewInterval) clearInterval(previewInterval);
    noPreviewOverlay.classList.add('hidden');
    
    function step() {
        if (frames.length === 0) {
            stopPreview();
            return;
        }
        drawPreviewFrame(frames[currentPreviewIndex]);
        currentPreviewIndex = (currentPreviewIndex + 1) % frames.length;
    }

    step();
    const delay = parseInt(delaySlider.value);
    previewInterval = setInterval(step, delay);
}

function stopPreview() {
    if (previewInterval) clearInterval(previewInterval);
    previewInterval = null;
    noPreviewOverlay.classList.remove('hidden');
    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
}

function resetPreview() {
    currentPreviewIndex = 0;
    if (frames.length > 0) startPreview();
    else stopPreview();
}

function drawPreviewFrame(frame) {
    const img = new Image();
    img.onload = () => {
        const sizeMode = sizeSelect.value;
        let targetWidth, targetHeight;

        if (sizeMode === 'original') {
            targetWidth = img.width;
            targetHeight = img.height;
        } else {
            targetWidth = parseInt(sizeMode);
            targetHeight = (img.height / img.width) * targetWidth;
        }

        previewCanvas.width = targetWidth;
        previewCanvas.height = targetHeight;
        const ctx = previewCanvas.getContext('2d');
        ctx.clearRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    };
    img.src = frame.dataUrl;
}

// GIF Generation
async function generateGif() {
    if (frames.length < 2) {
        alert('최소 2개 이상의 이미지가 필요합니다.');
        return;
    }

    isGenerating = true;
    showModal();
    updateProgress(5); // Start immediately
    
    const delay = parseInt(delaySlider.value);
    const sizeMode = sizeSelect.value;
    
    // Improved Worker Loading: Fetch, convert to Blob, and use URL.createObjectURL
    // This is the most reliable way for GitHub Pages CORS
    let workerUrl = 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js';
    try {
        const response = await fetch(workerUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const scriptText = await response.text();
        const blob = new Blob([scriptText], { type: 'application/javascript' });
        workerUrl = URL.createObjectURL(blob);
        console.log("Worker blob created successfully");
    } catch (e) {
        console.error('Failed to create worker blob:', e);
        // Fallback to a different CDN if the first one fails
        workerUrl = 'https://unpkg.com/gif.js@0.2.0/dist/gif.worker.js';
    }

    // Initialize GIF.js
    const gif = new GIF({
        workers: 4, // Increase workers for speed
        quality: 10,
        workerScript: workerUrl,
        debug: true // Enable for console monitoring
    });

    const offCanvas = document.createElement('canvas');
    const ctx = offCanvas.getContext('2d');

    // Load and add all frames
    for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const img = await loadImage(frame.dataUrl);
        
        let targetWidth, targetHeight;
        if (sizeMode === 'original') {
            targetWidth = img.width;
            targetHeight = img.height;
        } else {
            targetWidth = parseInt(sizeMode);
            targetHeight = (img.height / img.width) * targetWidth;
        }

        offCanvas.width = targetWidth;
        offCanvas.height = targetHeight;
        ctx.clearRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        gif.addFrame(ctx, { copy: true, delay: delay });
        
        // Update progress during setup
        const progress = Math.round(((i + 1) / frames.length) * 30); // Setup is first 30%
        updateProgress(progress);
    }

    gif.on('progress', (p) => {
        const progress = 10 + Math.round(p * 90); // 10% was worker load, now 90% is rendering
        updateProgress(progress);
    });

    gif.on('finished', (blob) => {
        updateProgress(100);
        resultBlob = blob;
        const url = URL.createObjectURL(blob);
        resultGifImg.src = url;
        
        generatingState.classList.add('hidden');
        finishedState.classList.remove('hidden');
        isGenerating = false;
    });

    gif.render();
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Modal & UI Utilities
function showModal() {
    resultModal.classList.remove('hidden');
    generatingState.classList.remove('hidden');
    finishedState.classList.add('hidden');
    updateProgress(0);
}

window.closeModal = function() {
    if (isGenerating) return;
    resultModal.classList.add('hidden');
}

function updateProgress(p) {
    renderProgressBar.style.width = `${p}%`;
    progressText.textContent = `${p}%`;
}

downloadBtn.addEventListener('click', () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-awesome-animation.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});