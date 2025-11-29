const MOCK_PRODUCTS = [
    {
        id: 'chicken-breast-120',
        name: 'Грудки Цыпленка-Бройлера Кубик',
        barcode: '4601234567890',
        caloriesPer100: 165,
        proteinsPer100: 31,
        fatsPer100: 3.6,
        carbsPer100: 0,
        defaultWeight: 120,
    },
    {
        id: 'global-village-bulgur',
        name: 'Global Village Булгур',
        barcode: '4609876543210',
        caloriesPer100: 342,
        proteinsPer100: 12,
        fatsPer100: 1.3,
        carbsPer100: 75,
        defaultWeight: 80,
    },
    {
        id: 'cottage-cheese',
        name: 'Творог 5%',
        barcode: '4699999999999',
        caloriesPer100: 121,
        proteinsPer100: 17,
        fatsPer100: 5,
        carbsPer100: 3.4,
        defaultWeight: 200,
    },
];

const BARCODE_FORMATS = ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'];

let cameraStream;
let scanning = false;
let barcodeDetector;
let zxingReader;
let zxingLoadingPromise;

function getDateParam() {
    const params = new URLSearchParams(window.location.search);
    return params.get('date') || localStorage.getItem('selectedDate') || new Date().toISOString().slice(0, 10);
}

function loadHistory() {
    try {
        return JSON.parse(localStorage.getItem('searchHistory')) || [];
    } catch (e) {
        console.error('Не удалось загрузить историю поиска', e);
        return [];
    }
}

function saveHistory(history) {
    localStorage.setItem('searchHistory', JSON.stringify(history.slice(0, 8)));
}

function addToHistory(query) {
    const normalized = query.trim();
    if (!normalized) return;
    const current = loadHistory();
    const updated = [normalized, ...current.filter((item) => item !== normalized)];
    saveHistory(updated);
}

function readDiary() {
    try {
        return JSON.parse(localStorage.getItem('diaryEntries')) || {};
    } catch (e) {
        console.error('Не удалось прочитать дневник', e);
        return {};
    }
}

function findLocalProductByBarcode(barcode) {
    const diary = readDiary();
    const days = Object.values(diary);
    for (const day of days) {
        const match = day.products?.find((item) => item.barcode === barcode);
        if (match) {
            return {
                ...match.base,
                ...match,
                caloriesPer100: match.base?.caloriesPer100 ?? match.caloriesPer100 ?? match.calories,
                proteinsPer100: match.base?.proteinsPer100 ?? match.proteinsPer100 ?? match.proteins,
                fatsPer100: match.base?.fatsPer100 ?? match.fatsPer100 ?? match.fats,
                carbsPer100: match.base?.carbsPer100 ?? match.carbsPer100 ?? match.carbs,
            };
        }
    }
    return null;
}

function renderHistory(container) {
    const history = loadHistory();
    container.innerHTML = '';
    if (!history.length) {
        container.innerHTML = '<span class="muted-label">История пуста</span>';
        return;
    }
    history.forEach((item) => {
        const pill = document.createElement('button');
        pill.className = 'history-pill';
        pill.textContent = item;
        pill.addEventListener('click', () => performSearch(item));
        container.appendChild(pill);
    });
}

function renderResults(results, listElement) {
    listElement.innerHTML = '';
    if (!results.length) {
        const empty = document.createElement('li');
        empty.className = 'results-item muted';
        empty.textContent = 'Ничего не найдено';
        listElement.appendChild(empty);
        return;
    }

    results.forEach((product) => {
        const item = document.createElement('li');
        item.className = 'results-item';
        item.innerHTML = `
            <div class="result-title">${product.name}</div>
            <div class="muted-label">${product.caloriesPer100} ккал · ${product.proteinsPer100} Б · ${product.fatsPer100} Ж · ${product.carbsPer100} У</div>
        `;
        item.addEventListener('click', () => {
            localStorage.setItem('selectedProduct', JSON.stringify(product));
            window.location.href = `product.html?date=${getDateParam()}`;
        });
        listElement.appendChild(item);
    });
}

function performSearch(rawQuery) {
    const query = rawQuery.trim().toLowerCase();
    const list = document.getElementById('results-list');

    if (!query) {
        renderResults([], list);
        return;
    }

    const matches = MOCK_PRODUCTS.filter(
        (product) => product.name.toLowerCase().includes(query) || product.barcode.includes(query)
    );
    addToHistory(rawQuery);
    renderHistory(document.getElementById('history-items'));
    renderResults(matches, list);
}

function stopScan() {
    scanning = false;
    document.getElementById('scanner-preview')?.classList.remove('visible');
    if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        cameraStream = null;
    }
    zxingReader?.reset?.();
    const video = document.getElementById('scan-video');
    if (video) video.srcObject = null;
}

async function ensureZXingBundle() {
    if (window.ZXingBrowser?.BrowserMultiFormatReader) {
        zxingReader = zxingReader || new window.ZXingBrowser.BrowserMultiFormatReader();
        return true;
    }

    if (!zxingLoadingPromise) {
        zxingLoadingPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@zxing/browser@0.1.4/umd/index.min.js';
            script.async = true;
            script.onload = () => {
                if (window.ZXingBrowser?.BrowserMultiFormatReader) {
                    zxingReader = zxingReader || new window.ZXingBrowser.BrowserMultiFormatReader();
                    resolve(true);
                } else {
                    reject(new Error('ZXing bundle unavailable'));
                }
            };
            script.onerror = () => reject(new Error('Не удалось загрузить ZXing'));
            document.head.appendChild(script);
        }).catch((e) => {
            console.error('ZXing load failed', e);
            return false;
        });
    }

    return zxingLoadingPromise;
}

async function requestCameraPermission(statusEl) {
    if (!navigator.mediaDevices?.getUserMedia) {
        statusEl.textContent = 'Доступ к камере не поддерживается';
        return false;
    }

    try {
        const permission = navigator.permissions?.query ? await navigator.permissions.query({ name: 'camera' }) : null;
        if (permission?.state === 'denied') {
            statusEl.textContent = 'Разрешите доступ к камере в настройках устройства';
            return false;
        }

        const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
        testStream.getTracks().forEach((track) => track.stop());
        return true;
    } catch (e) {
        console.error('Permission error', e);
        statusEl.textContent = 'Разрешите доступ к камере';
        return false;
    }
}

async function findKnownProduct(barcode) {
    const catalogMatch = MOCK_PRODUCTS.find((item) => item.barcode === barcode);
    if (catalogMatch) return catalogMatch;

    const localMatch = findLocalProductByBarcode(barcode);
    if (localMatch) return localMatch;

    if (window.diaryApi?.fetchLatestEntryByBarcode) {
        const remote = await window.diaryApi.fetchLatestEntryByBarcode(barcode);
        if (remote) {
            return {
                ...remote.base,
                ...remote,
                caloriesPer100: remote.base?.caloriesPer100 ?? remote.caloriesPer100 ?? remote.calories,
                proteinsPer100: remote.base?.proteinsPer100 ?? remote.proteinsPer100 ?? remote.proteins,
                fatsPer100: remote.base?.fatsPer100 ?? remote.fatsPer100 ?? remote.fats,
                carbsPer100: remote.base?.carbsPer100 ?? remote.carbsPer100 ?? remote.carbs,
                defaultWeight: remote.base?.defaultWeight || remote.weight || 100,
            };
        }
    }

    return null;
}

async function persistFoundProduct(barcode) {
    const match = await findKnownProduct(barcode);
    const payload =
        match || {
            id: `barcode-${barcode}`,
            name: '',
            barcode,
            caloriesPer100: 0,
            proteinsPer100: 0,
            fatsPer100: 0,
            carbsPer100: 0,
            defaultWeight: 100,
        };

    localStorage.setItem('selectedProduct', JSON.stringify(payload));
    const manualFlag = match ? '' : '&manual=1';
    window.location.href = `product.html?date=${getDateParam()}&barcode=${barcode}${manualFlag}`;
}

async function scanFrame(video) {
    if (!scanning) return;
    try {
        if (barcodeDetector) {
            const detected = await barcodeDetector.detect(video);
            if (detected.length) {
                const code = detected[0]?.rawValue;
                if (code) {
                    document.getElementById('scan-status').textContent = `Код: ${code}`;
                    stopScan();
                    await persistFoundProduct(code);
                    return;
                }
            }
        } else if (zxingReader) {
            const result = await zxingReader.decodeFromVideoElement(video);
            if (result?.text) {
                document.getElementById('scan-status').textContent = `Код: ${result.text}`;
                stopScan();
                await persistFoundProduct(result.text);
                return;
            }
        }
    } catch (e) {
        if (e && e.name === 'NotFoundException') {
            // просто продолжаем сканирование, когда код не найден на текущем кадре
        } else {
            console.error('Ошибка сканирования', e);
            document.getElementById('scan-status').textContent = 'Не удалось считать код';
        }
    }

    if (scanning) requestAnimationFrame(() => scanFrame(video));
}

async function startBarcodeScan() {
    const status = document.getElementById('scan-status');
    const preview = document.getElementById('scanner-preview');
    const video = document.getElementById('scan-video');

    const hasBarcodeDetector = 'BarcodeDetector' in window;
    if (!barcodeDetector && hasBarcodeDetector) {
        barcodeDetector = new window.BarcodeDetector({ formats: BARCODE_FORMATS });
    }

    if (!hasBarcodeDetector) {
        const loaded = await ensureZXingBundle();
        if (!loaded) {
            status.textContent = 'Сканирование штрихкодов не поддерживается';
            return;
        }
    }

    try {
        const permissionGranted = await requestCameraPermission(status);
        if (!permissionGranted) return;

        stopScan();
        scanning = true;
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
        });
        video.srcObject = cameraStream;
        await video.play();
        preview.classList.add('visible');
        status.textContent = 'Наведите камеру на штрихкод';
        requestAnimationFrame(() => scanFrame(video));
    } catch (e) {
        console.error('Ошибка доступа к камере', e);
        status.textContent = 'Нет доступа к камере';
        stopScan();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('product-search');
    const searchButton = document.getElementById('search-btn');
    const historyContainer = document.getElementById('history-items');
    const manualButton = document.getElementById('manual-entry');
    const clearHistoryButton = document.getElementById('clear-history');

    renderHistory(historyContainer);

    searchButton?.addEventListener('click', () => performSearch(searchInput.value));
    searchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performSearch(searchInput.value);
    });

    manualButton?.addEventListener('click', () => {
        localStorage.removeItem('selectedProduct');
        window.location.href = `product.html?date=${getDateParam()}&manual=1`;
    });

    clearHistoryButton?.addEventListener('click', () => {
        saveHistory([]);
        renderHistory(historyContainer);
    });

    document.getElementById('scan-btn')?.addEventListener('click', startBarcodeScan);
    document.getElementById('stop-scan')?.addEventListener('click', stopScan);
    document.getElementById('back-home')?.addEventListener('click', () => {
        stopScan();
        window.location.href = 'index.html';
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopScan();
    });
});
