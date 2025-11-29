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
    const video = document.getElementById('scan-video');
    if (video) video.srcObject = null;
}

function persistFoundProduct(barcode) {
    const match = MOCK_PRODUCTS.find((item) => item.barcode === barcode);
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
    if (!scanning || !barcodeDetector) return;
    try {
        const detected = await barcodeDetector.detect(video);
        if (detected.length) {
            const code = detected[0]?.rawValue;
            if (code) {
                document.getElementById('scan-status').textContent = `Код: ${code}`;
                stopScan();
                persistFoundProduct(code);
                return;
            }
        }
    } catch (e) {
        console.error('Ошибка сканирования', e);
        document.getElementById('scan-status').textContent = 'Не удалось считать код';
    }

    if (scanning) requestAnimationFrame(() => scanFrame(video));
}

async function startBarcodeScan() {
    const status = document.getElementById('scan-status');
    const preview = document.getElementById('scanner-preview');
    const video = document.getElementById('scan-video');

    if (!navigator.mediaDevices?.getUserMedia) {
        status.textContent = 'Доступ к камере не поддерживается';
        return;
    }

    if (!('BarcodeDetector' in window)) {
        status.textContent = 'Сканирование штрихкодов не поддерживается';
        return;
    }

    if (!barcodeDetector) {
        barcodeDetector = new window.BarcodeDetector({ formats: BARCODE_FORMATS });
    }

    try {
        stopScan();
        scanning = true;
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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
