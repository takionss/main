// UI Elements
const uploadSection = document.getElementById('upload-section');
const loadingSection = document.getElementById('loading-section');
const resultSection = document.getElementById('result-section');
const fileInput = document.getElementById('file-input');
const progressBar = document.getElementById('progress-bar');
const originalPreview = document.getElementById('original-preview');
const resultPreview = document.getElementById('result-preview');
const downloadBtn = document.getElementById('download-btn');

let resultBlob = null;
let originalFileName = "";

// Drag and Drop Events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    window.addEventListener(eventName, preventDefaults, false);
    uploadSection.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    uploadSection.addEventListener(eventName, () => uploadSection.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    uploadSection.addEventListener(eventName, () => uploadSection.classList.remove('dragover'), false);
});

uploadSection.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
});

// File Input Event
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

async function handleFiles(files) {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
    }

    originalFileName = file.name;
    showSection('loading');
    
    // Display original preview
    const reader = new FileReader();
    reader.onload = (e) => {
        originalPreview.src = e.target.result;
    };
    reader.readAsDataURL(file);

    try {
        // Update status text in UI (assuming you might want to add a status element, 
        // but for now we'll change the progress bar behavior)
        
        // Use the bundle's global function
        const blob = await imglyRemoveBackground(file, {
            progress: (p, status) => {
                const percent = Math.round(p * 100);
                progressBar.style.width = `${percent}%`;
                
                // If there's a status available, we could show it. 
                // imgly often has "fetching" or "processing" stages.
                const statusElement = document.querySelector('#loading-section h2');
                if (statusElement) {
                    if (p < 0.9) statusElement.textContent = 'AI 모델 다운로드 중... (약 40MB)';
                    else statusElement.textContent = '이미지 분석 및 배경 제거 중...';
                }
            },
            model: 'medium'
        });

        resultBlob = blob;
        const url = URL.createObjectURL(blob);
        resultPreview.src = url;
        
        showSection('result');
    } catch (error) {
        console.error('Background removal failed:', error);
        alert('배경 제거 중 오류가 발생했습니다. 브라우저가 최신 버전인지 확인해 주세요.');
        resetApp();
    }
}

function showSection(name) {
    uploadSection.classList.add('hidden');
    loadingSection.classList.add('hidden');
    resultSection.classList.add('hidden');

    if (name === 'upload') uploadSection.classList.remove('hidden');
    else if (name === 'loading') {
        loadingSection.classList.remove('hidden');
        progressBar.style.width = '0%';
    }
    else if (name === 'result') resultSection.classList.remove('hidden');
}

function resetApp() {
    fileInput.value = '';
    resultBlob = null;
    originalPreview.src = '';
    resultPreview.src = '';
    showSection('upload');
}

// Expose resetApp to window because of onclick in HTML
window.resetApp = resetApp;

// Download Button
downloadBtn.addEventListener('click', () => {
    if (!resultBlob) return;
    
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    const fileNameWithoutExt = originalFileName.split('.').slice(0, -1).join('.');
    
    a.href = url;
    a.download = `${fileNameWithoutExt}_nobg.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});