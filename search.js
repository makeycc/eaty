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

function loadHistory() {
    try {
        return JSON.parse(localStorage.getItem('searchHistory')) || [];
    } catch (e) {
        console.error('Не удалось загрузить историю поиска', e);
        return [];
    }
}

function persistHistory(history) {
    localStorage.setItem('searchHistory', JSON.stringify(history.slice(0, 10)));
}

function addHistoryEntry(query) {
    const trimmed = query.trim();
    if (!trimmed) return;

    const history = loadHistory();
    const updatedHistory = [trimmed, ...history.filter((item) => item !== trimmed)];
    persistHistory(updatedHistory);
}

function renderHistory(listElement) {
    const history = loadHistory();
    listElement.innerHTML = '';

    if (!history.length) {
        const emptyItem = document.createElement('li');
        emptyItem.classList.add('search-history-empty');
        emptyItem.textContent = 'История поиска пуста';
        listElement.appendChild(emptyItem);
        return;
    }

    history.forEach((entry) => {
        const item = document.createElement('li');
        item.classList.add('search-history-item');
        item.textContent = entry;
        item.addEventListener('click', () => {
            const searchInput = document.getElementById('product-search');
            searchInput.value = entry;
            performSearch(entry);
        });
        listElement.appendChild(item);
    });
}

function renderResults(results, listElement) {
    listElement.innerHTML = '';

    if (!results.length) {
        const emptyItem = document.createElement('li');
        emptyItem.classList.add('search-result-empty');
        emptyItem.textContent = 'Ничего не найдено';
        listElement.appendChild(emptyItem);
        return;
    }

    results.forEach((product) => {
        const item = document.createElement('li');
        item.classList.add('search-result-item');
        item.innerHTML = `
            <div class="result-title">${product.name}</div>
            <div class="result-meta">${product.caloriesPer100} Ккал · ${product.proteinsPer100} Б · ${product.fatsPer100} Ж · ${product.carbsPer100} У</div>
        `;
        item.addEventListener('click', () => selectProduct(product));
        listElement.appendChild(item);
    });
}

function selectProduct(product) {
    localStorage.setItem('selectedProduct', JSON.stringify(product));
    window.location.href = 'product.html?source=search';
}

function performSearch(query) {
    const normalized = query.trim().toLowerCase();
    const resultsList = document.getElementById('results-list');

    if (!normalized) {
        renderResults([], resultsList);
        return;
    }

    const results = MOCK_PRODUCTS.filter((product) => {
        return (
            product.name.toLowerCase().includes(normalized) ||
            product.barcode.toLowerCase().includes(normalized)
        );
    });

    addHistoryEntry(query);
    renderHistory(document.getElementById('history-list'));
    renderResults(results, resultsList);
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('product-search');
    const searchButton = document.getElementById('search-btn');
    const resultsList = document.getElementById('results-list');
    const historyList = document.getElementById('history-list');
    const manualEntryButton = document.getElementById('manual-entry');

    if (!searchInput || !searchButton || !resultsList || !historyList || !manualEntryButton) {
        return;
    }

    renderHistory(historyList);

    searchButton.addEventListener('click', () => performSearch(searchInput.value));
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });

    manualEntryButton.addEventListener('click', () => {
        localStorage.removeItem('selectedProduct');
        window.location.href = 'product.html?manual=1';
    });
});
