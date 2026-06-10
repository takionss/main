// UI Elements
const uploadSection = document.getElementById('upload-section');
const loadingSection = document.getElementById('loading-section');
const resultSection = document.getElementById('result-section');
const statusBar = document.getElementById('status-bar');
const statusText = document.getElementById('status-text');
const statusSpinner = document.getElementById('status-spinner');
const fileInput = document.getElementById('file-input');
const selectBtn = document.getElementById('select-btn');
const retryBtn = document.getElementById('retry-btn');
const progressBar = document.getElementById('progress-bar');
const procMsg = document.getElementById('proc-msg');
const originalPreview = document.getElementById('original-preview');
const resultPreview = document.getElementById('result-preview');
const downloadBtn = document.getElementById('download-btn');

let resultBlob = null;
let originalFileName = "";

// 1. 전역 드래그 차단 (무조건 실행)
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    window.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

// 2. 엔진 로딩 감시 루프
function checkEngine() {
    console.log("Checking for AI engine...");
    if (typeof imglyRemoveBackground !== 'undefined') {
        console.log("AI Engine Detected!");
        statusText.textContent = "AI 엔진이 준비되었습니다. 이미지를 선택해 주세요.";
        statusSpinner.classList.add('hidden');
        statusBar.classList.replace('bg-blue-50', 'bg-green-50');
        statusBar.classList.replace('text-blue-800', 'text-green-800');
        statusBar.classList.replace('border-blue-100', 'border-green-100');
        
        // 업로드 섹션 활성화
        uploadSection.classList.remove('opacity-50', 'pointer-events-none');
        selectBtn.disabled = false;
        
        // 5초 후 안내바 숨김 (깔끔한 UI를 위해)
        setTimeout(() => statusBar.classList.add('hidden'), 5000);
    } else {
        // 아직 로드 안됨 -> 1초 후 재확인
        setTimeout(checkEngine, 1000);
    }
}

// 즉시 감시 시작
checkEngine();

// 3. 버튼 및 드롭 이벤트
selectBtn.addEventListener('click', () => fileInput.click());
retryBtn.addEventListener('click', () => resetApp());
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFiles(e.target.files);
});

uploadSection.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFiles(files);
});

async function handleFiles(files) {
    const file = files[0];
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
    }

    originalFileName = file.name;
    showSection('loading');
    
    // 원본 미리보기
    const reader = new FileReader();
    reader.onload = (e) => originalPreview.src = e.target.result;
    reader.readAsDataURL(file);

    try {
        // AI 실행 (전역 함수 호출)
        const blob = await imglyRemoveBackground(file, {
            progress: (p) => {
                const percent = Math.round(p * 100);
                progressBar.style.width = `${percent}%`;
                if (p < 0.9) {
                    procMsg.textContent = `AI 모델 다운로드 중... (${percent}%)`;
                } else {
                    procMsg.textContent = '이미지 분석 및 배경 제거 중...';
                }
            },
            model: 'medium'
        });

        resultBlob = blob;
        resultPreview.src = URL.createObjectURL(blob);
        showSection('result');
    } catch (error) {
        console.error('AI Error:', error);
        alert('작업 중 오류가 발생했습니다. 브라우저를 새로고침(F5) 해주세요.');
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

downloadBtn.addEventListener('click', () => {
    if (!resultBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(resultBlob);
    a.download = `${originalFileName.split('.').slice(0, -1).join('.')}_nobg.png`;
    a.click();
});