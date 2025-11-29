const PRODUCT_CATALOG = [
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

const DEFAULT_PRODUCT = {
    id: `manual-${Date.now()}`,
    name: 'Новый продукт',
    caloriesPer100: 0,
    proteinsPer100: 0,
    fatsPer100: 0,
    carbsPer100: 0,
    defaultWeight: 100,
};

function normalizeNumber(value) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function resolveWeight(base, rawWeight) {
    const numeric = normalizeNumber(rawWeight);
    if (numeric > 0) return numeric;
    if (base.weight && base.weight > 0) return base.weight;
    if (base.defaultWeight && base.defaultWeight > 0) return base.defaultWeight;
    return 100;
}

function readDiary() {
    try {
        return JSON.parse(localStorage.getItem('diaryEntries')) || {};
    } catch (e) {
        console.error('Не удалось прочитать дневник', e);
        return {};
    }
}

function persistDiary(diary) {
    localStorage.setItem('diaryEntries', JSON.stringify(diary));
}

function getDateParam() {
    const params = new URLSearchParams(window.location.search);
    return params.get('date') || new Date().toISOString().slice(0, 10);
}

function findProductFromParams() {
    const params = new URLSearchParams(window.location.search);
    const entryId = params.get('entryId');
    const barcode = params.get('barcode');
    const manual = params.get('manual');
    const diary = readDiary();
    const dateKey = getDateParam();

    if (entryId && diary[dateKey]) {
        const found = diary[dateKey].products?.find((item) => item.id === entryId);
        if (found) {
            return {
                ...DEFAULT_PRODUCT,
                ...found.base,
                ...found,
                caloriesPer100: found.base?.caloriesPer100 ?? found.caloriesPer100 ?? found.calories,
                proteinsPer100: found.base?.proteinsPer100 ?? found.proteinsPer100 ?? found.proteins,
                fatsPer100: found.base?.fatsPer100 ?? found.fatsPer100 ?? found.fats,
                carbsPer100: found.base?.carbsPer100 ?? found.carbsPer100 ?? found.carbs,
            };
        }
    }

    if (barcode) {
        const catalogMatch = PRODUCT_CATALOG.find((item) => item.barcode === barcode);
        if (catalogMatch) return { ...catalogMatch };
    }

    if (manual) {
        return { ...DEFAULT_PRODUCT };
    }

    try {
        const stored = localStorage.getItem('selectedProduct');
        if (stored) return { ...JSON.parse(stored) };
    } catch (e) {
        console.error('Не удалось прочитать выбранный продукт', e);
    }

    return { ...DEFAULT_PRODUCT };
}

async function hydrateFromSupabaseIfNeeded(currentProduct) {
    const params = new URLSearchParams(window.location.search);
    const entryId = params.get('entryId');
    if (!entryId || !window.diaryApi?.fetchEntriesByDate) return currentProduct;

    const remoteEntries = await window.diaryApi.fetchEntriesByDate(getDateParam());
    if (!remoteEntries) return currentProduct;

    const diary = readDiary();
    diary[getDateParam()] = { products: remoteEntries };
    persistDiary(diary);

    const match = remoteEntries.find((item) => item.id === entryId);
    if (!match) return currentProduct;

    const merged = {
        ...DEFAULT_PRODUCT,
        ...match.base,
        ...match,
        caloriesPer100: match.base?.caloriesPer100 ?? match.base?.calories ?? match.calories,
        proteinsPer100: match.base?.proteinsPer100 ?? match.base?.proteins ?? match.proteins,
        fatsPer100: match.base?.fatsPer100 ?? match.fats,
        carbsPer100: match.base?.carbsPer100 ?? match.carbs,
    };

    hydrateForm(merged);
    return merged;
}

function updatePortionView(product, weightInputValue) {
    const weight = resolveWeight(product, weightInputValue);
    const factor = weight / 100;
    document.getElementById('portion-calories').textContent = Math.round(product.caloriesPer100 * factor) || 0;
    document.getElementById('portion-proteins').textContent = (product.proteinsPer100 * factor || 0).toFixed(1);
    document.getElementById('portion-fats').textContent = (product.fatsPer100 * factor || 0).toFixed(1);
    document.getElementById('portion-carbs').textContent = (product.carbsPer100 * factor || 0).toFixed(1);
}

function hydrateForm(product) {
    const nameInput = document.getElementById('product-name');
    const weightInput = document.getElementById('product-weight');
    const barcodeInput = document.getElementById('product-barcode');
    const caloriesInput = document.getElementById('product-calories');
    const proteinsInput = document.getElementById('product-proteins');
    const fatsInput = document.getElementById('product-fats');
    const carbsInput = document.getElementById('product-carbs');

    document.getElementById('product-title').textContent = product.name || 'Продукт';
    document.getElementById('mode-hint').textContent = product.barcode
        ? 'КБЖУ подгружены по штрихкоду'
        : 'Введите значения вручную, если продукт не найден';

    nameInput.value = product.name || '';
    weightInput.value = resolveWeight(product, product.weight || product.defaultWeight);
    barcodeInput.value = product.barcode || '';
    caloriesInput.value = product.caloriesPer100 ?? '';
    proteinsInput.value = product.proteinsPer100 ?? '';
    fatsInput.value = product.fatsPer100 ?? '';
    carbsInput.value = product.carbsPer100 ?? '';

    updatePortionView(product, weightInput.value);
}

function collectFormValues(baseProduct) {
    const weight = resolveWeight(baseProduct, document.getElementById('product-weight').value);
    const caloriesPer100 = normalizeNumber(document.getElementById('product-calories').value);
    const proteinsPer100 = normalizeNumber(document.getElementById('product-proteins').value);
    const fatsPer100 = normalizeNumber(document.getElementById('product-fats').value);
    const carbsPer100 = normalizeNumber(document.getElementById('product-carbs').value);

    const factor = weight / 100;

    return {
        id: baseProduct.id || `custom-${Date.now()}`,
        name: document.getElementById('product-name').value || baseProduct.name,
        barcode: document.getElementById('product-barcode').value || baseProduct.barcode,
        weight,
        calories: Math.round(caloriesPer100 * factor),
        proteins: +(proteinsPer100 * factor).toFixed(1),
        fats: +(fatsPer100 * factor).toFixed(1),
        carbs: +(carbsPer100 * factor).toFixed(1),
        base: {
            ...baseProduct,
            caloriesPer100,
            proteinsPer100,
            fatsPer100,
            carbsPer100,
        },
    };
}

async function saveProduct(baseProduct) {
    const diary = readDiary();
    const dateKey = getDateParam();
    const payload = collectFormValues(baseProduct);

    const day = diary[dateKey] || { products: [] };
    const existingIndex = day.products.findIndex((item) => item.id === payload.id);
    if (existingIndex >= 0) {
        day.products[existingIndex] = payload;
    } else {
        day.products.unshift(payload);
    }

    diary[dateKey] = day;
    persistDiary(diary);
    localStorage.setItem('selectedProduct', JSON.stringify(payload.base));

    if (window.diaryApi?.upsertEntry) {
        window.diaryApi.upsertEntry(dateKey, payload);
    }

    window.location.href = 'index.html';
}

async function deleteProduct(baseProduct) {
    const diary = readDiary();
    const dateKey = getDateParam();
    const day = diary[dateKey] || { products: [] };
    const filtered = day.products.filter((item) => item.id !== baseProduct.id);
    diary[dateKey] = { products: filtered };
    persistDiary(diary);

    if (window.diaryApi?.removeEntry) {
        window.diaryApi.removeEntry(baseProduct.id);
    }

    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    const weightInput = document.getElementById('product-weight');
    const caloriesInput = document.getElementById('product-calories');
    const proteinsInput = document.getElementById('product-proteins');
    const fatsInput = document.getElementById('product-fats');
    const carbsInput = document.getElementById('product-carbs');

    let product = findProductFromParams();
    hydrateForm(product);
    product = await hydrateFromSupabaseIfNeeded(product);

    weightInput?.addEventListener('input', () => {
        const updated = {
            ...product,
            caloriesPer100: normalizeNumber(caloriesInput.value),
            proteinsPer100: normalizeNumber(proteinsInput.value),
            fatsPer100: normalizeNumber(fatsInput.value),
            carbsPer100: normalizeNumber(carbsInput.value),
        };
        updatePortionView(updated, normalizeNumber(weightInput.value));
    });

    [caloriesInput, proteinsInput, fatsInput, carbsInput].forEach((input) => {
        input?.addEventListener('input', () => {
            const updated = {
                ...product,
                caloriesPer100: normalizeNumber(caloriesInput.value),
                proteinsPer100: normalizeNumber(proteinsInput.value),
                fatsPer100: normalizeNumber(fatsInput.value),
                carbsPer100: normalizeNumber(carbsInput.value),
            };
            updatePortionView(updated, normalizeNumber(weightInput.value));
        });
    });

    document.getElementById('save-product')?.addEventListener('click', () => saveProduct(product));
    document.getElementById('delete-product')?.addEventListener('click', () => deleteProduct(product));
    document.getElementById('cancel-btn')?.addEventListener('click', () => {
        window.history.length > 1 ? window.history.back() : (window.location.href = 'index.html');
    });
});
