// Translation Dictionary
const TRANSLATIONS = {
    ko: {
        title: "오디오 만능 변환기 (MP3, WAV, AAC, OGG 포맷 변환) | SmilesLife",
        header_title: "오디오 만능 변환기",
        header_desc: "MP3, WAV, AAC 등 모든 오디오 파일을 브라우저에서 즉시 변환하세요.",
        upload_title: "오디오 파일을 업로드하세요",
        upload_desc: "또는 여기로 드래그 앤 드롭 하세요",
        btn_select_file: "파일 선택하기",
        label_convert_to: "변환할 형식 선택",
        btn_convert: "지금 변환하기",
        result_title: "변환이 완료되었습니다!",
        btn_download: "변환된 파일 다운로드",
        init_engine_title: "엔진 초기화 중...",
        init_engine_desc: "최초 실행 시 변환 엔진(WASM)을 다운로드하느라<br>몇 초 정도 시간이 걸릴 수 있습니다.",
        footer_text: "© 2026 AI Utility Web. 브라우저 내장 기술을 사용하여 안전하게 변환합니다.",
        status_analyzing: "파일 분석 중...",
        status_decoding: "오디오 디코딩 중...",
        status_encoding: "인코딩 진행 중...",
        status_finished: "변환 완료!",
        alert_soon: "이 형식은 곧 지원될 예정입니다!",
        alert_error: "변환 중 오류가 발생했습니다. 파일 형식을 확인해 주세요."
    },
    en: {
        title: "Universal Audio Converter (MP3, WAV, AAC, OGG Conversion) | SmilesLife",
        header_title: "Universal Audio Converter",
        header_desc: "Convert all audio files like MP3, WAV, AAC instantly in your browser.",
        upload_title: "Upload your audio file",
        upload_desc: "or drag and drop it here",
        btn_select_file: "Select File",
        label_convert_to: "Select Format to Convert",
        btn_convert: "Convert Now",
        result_title: "Conversion Complete!",
        btn_download: "Download Converted File",
        init_engine_title: "Initializing Engine...",
        init_engine_desc: "On first run, it might take a few seconds<br>to download the translation engine (WASM).",
        footer_text: "© 2026 AI Utility Web. Converted securely using built-in browser technologies.",
        status_analyzing: "Analyzing file...",
        status_decoding: "Decoding audio...",
        status_encoding: "Encoding in progress...",
        status_finished: "Conversion complete!",
        alert_soon: "This format will be supported soon!",
        alert_error: "An error occurred during conversion. Please check the file format."
    },
    es: {
        title: "Convertidor de Audio Universal (Conversión MP3, WAV, AAC, OGG) | SmilesLife",
        header_title: "Convertidor de Audio Universal",
        header_desc: "Convierta todos los archivos de audio como MP3, WAV, AAC al instante en su navegador.",
        upload_title: "Suba su archivo de audio",
        upload_desc: "o arrástrelo y suéltelo aquí",
        btn_select_file: "Seleccionar archivo",
        label_convert_to: "Seleccionar formato para convertir",
        btn_convert: "Convertir ahora",
        result_title: "¡Conversión completa!",
        btn_download: "Descargar archivo convertido",
        init_engine_title: "Inicializando motor...",
        init_engine_desc: "En la primera ejecución, puede tardar unos segundos<br>en descargar el motor de traducción (WASM).",
        footer_text: "© 2026 AI Utility Web. Convertido de forma segura utilizando tecnologías integradas del navegador.",
        status_analyzing: "Analizando archivo...",
        status_decoding: "Decodificando audio...",
        status_encoding: "Codificación en curso...",
        status_finished: "¡Conversión completa!",
        alert_soon: "¡Este formato será compatible pronto!",
        alert_error: "Ocurrió un error durante la conversión. Compruebe el formato del archivo."
    },
    ja: {
        title: "万能オーディオ変換器 (MP3, WAV, AAC, OGG フォーマット変換) | SmilesLife",
        header_title: "万能オーディオ変換器",
        header_desc: "MP3, WAV, AACなど、すべてのオーディオファイルをブラウザで即座に変換します。",
        upload_title: "オーディオファイルをアップロードしてください",
        upload_desc: "またはここにドラッグ＆ドロップしてください",
        btn_select_file: "ファイルを選択する",
        label_convert_to: "変換するフォーマットを選択",
        btn_convert: "今すぐ変換する",
        result_title: "変換が完了しました！",
        btn_download: "変換されたファイルをダウンロード",
        init_engine_title: "エンジン初期化中...",
        init_engine_desc: "初回実行時は、変換エンジン (WASM) のダウンロードに<br>数秒かかる場合があります。",
        footer_text: "© 2026 AI Utility Web. ブラウザ内蔵技術を使用して安全に変換します。",
        status_analyzing: "ファイルを分析中...",
        status_decoding: "オーディオをデコード中...",
        status_encoding: "エンコード進行中...",
        status_finished: "変換完了！",
        alert_soon: "このフォーマットは間もなくサポートされる予定です！",
        alert_error: "変換中にエラーが発生しました。ファイル形式を確認してください。"
    },
    'zh-TW': {
        title: "萬能音訊轉換器 (MP3, WAV, AAC, OGG 格式轉換) | SmilesLife",
        header_title: "萬能音訊轉換器",
        header_desc: "在瀏覽器中立即轉換 MP3、WAV、AAC 等所有音訊檔案。",
        upload_title: "上傳您的音訊檔案",
        upload_desc: "或將檔案拖曳至此處",
        btn_select_file: "選擇檔案",
        label_convert_to: "選擇要轉換的格式",
        btn_convert: "立即轉換",
        result_title: "轉換完成！",
        btn_download: "下載已轉換的檔案",
        init_engine_title: "引擎初始化中...",
        init_engine_desc: "首次執行時，下載轉換引擎 (WASM) 可能需要<br>幾秒鐘的時間。",
        footer_text: "© 2026 AI Utility Web. 使用瀏覽器內建技術安全進行轉換。",
        status_analyzing: "正在分析檔案...",
        status_decoding: "正在解碼音訊...",
        status_encoding: "正在進行編碼...",
        status_finished: "轉換完成！",
        alert_soon: "此格式即將支援！",
        alert_error: "轉換時發生錯誤。請檢查檔案格式。"
    }
};

window.l10n = {
    currentLang: 'ko',
    t: function(key) {
        return TRANSLATIONS[this.currentLang]?.[key] || TRANSLATIONS['en']?.[key] || key;
    }
};

function initLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    let lang = urlParams.get('lang');
    if (!lang) {
        lang = localStorage.getItem('smileslife-preferred-lang');
    }
    if (!lang && navigator.language) {
        const navLang = navigator.language.toLowerCase();
        if (navLang.startsWith('ko')) lang = 'ko';
        else if (navLang.startsWith('es')) lang = 'es';
        else if (navLang.startsWith('ja')) lang = 'ja';
        else if (navLang.startsWith('zh-tw') || navLang.startsWith('zh-hk')) lang = 'zh-TW';
        else lang = 'en';
    }
    if (!['ko', 'en', 'es', 'ja', 'zh-TW'].includes(lang)) {
        lang = 'ko';
    }
    
    const langSelect = document.getElementById('lang-select');
    if (langSelect) langSelect.value = lang;
    
    applyLanguage(lang);
}

function applyLanguage(lang) {
    window.l10n.currentLang = lang;
    document.documentElement.lang = lang;
    localStorage.setItem('smileslife-preferred-lang', lang);
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const text = TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key];
        if (text) {
            if (el.tagName === 'TITLE') {
                document.title = text;
            } else if (el.innerHTML.includes('<br>') || text.includes('<br>')) {
                el.innerHTML = text;
            } else {
                el.textContent = text;
            }
        }
    });
}

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
    statusText.textContent = window.l10n.t('status_analyzing');

    try {
        const arrayBuffer = await currentFile.arrayBuffer();
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        statusText.textContent = window.l10n.t('status_decoding');
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        statusText.textContent = window.l10n.t('status_encoding');
        
        if (targetFormat === 'mp3') {
            resultBlob = await encodeMp3(audioBuffer);
        } else if (targetFormat === 'wav') {
            resultBlob = await encodeWav(audioBuffer);
        } else if (targetFormat === 'aac' || targetFormat === 'm4a' || targetFormat === 'ogg') {
            resultBlob = await encodeNative(audioBuffer, targetFormat);
        } else {
            alert(window.l10n.t('alert_soon'));
            throw new Error('Unsupported format');
        }

        // Show download
        resultContainer.classList.remove('hidden');
        statusText.textContent = window.l10n.t('status_finished');
        updateProgress(100);

    } catch (err) {
        console.error('Conversion Error:', err);
        alert(window.l10n.t('alert_error'));
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

// Init language selector event listener and run initial check
document.addEventListener('DOMContentLoaded', () => {
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            applyLanguage(e.target.value);
        });
    }
    initLanguage();
});