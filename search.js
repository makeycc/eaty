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

function simulateScan() {
    const status = document.getElementById('scan-status');
    status.textContent = 'Сканируем...';
    const result = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
    setTimeout(() => {
        status.textContent = 'Код считан';
        localStorage.setItem('selectedProduct', JSON.stringify(result));
        window.location.href = `product.html?date=${getDateParam()}&barcode=${result.barcode}`;
    }, 600);
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

    document.getElementById('scan-btn')?.addEventListener('click', simulateScan);
    document.getElementById('back-home')?.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});
