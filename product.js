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
    id: 'manual-entry',
    name: 'Новый продукт',
    caloriesPer100: 0,
    proteinsPer100: 0,
    fatsPer100: 0,
    carbsPer100: 0,
    defaultWeight: 100,
};

const weightInput = document.getElementById('product-weight');
const caloriesInput = document.getElementById('product-calories');
const proteinsInput = document.getElementById('product-proteins');
const fatsInput = document.getElementById('product-fats');
const carbsInput = document.getElementById('product-carbs');
const saveButton = document.getElementById('save-product');
const deleteButton = document.getElementById('delete-product');
const productTitle = document.querySelector('.product-container h1');

let baseProduct = { ...DEFAULT_PRODUCT };

function normalizeNumber(value) {
    const normalized = parseFloat(value);
    return Number.isFinite(normalized) ? normalized : 0;
}

function findProductFromParams() {
    const params = new URLSearchParams(window.location.search);
    const barcode = params.get('barcode');
    const manual = params.get('manual');

    if (manual) {
        return { ...DEFAULT_PRODUCT };
    }

    if (barcode) {
        const found = PRODUCT_CATALOG.find((item) => item.barcode === barcode);
        if (found) return { ...found };
    }

    try {
        const stored = localStorage.getItem('selectedProduct');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Не удалось прочитать сохраненный продукт', e);
    }

    return { ...DEFAULT_PRODUCT };
}

function updateBaseFromFields() {
    const weight = normalizeNumber(weightInput.value);
    if (!weight) return;

    baseProduct.caloriesPer100 = (normalizeNumber(caloriesInput.value) / weight) * 100;
    baseProduct.proteinsPer100 = (normalizeNumber(proteinsInput.value) / weight) * 100;
    baseProduct.fatsPer100 = (normalizeNumber(fatsInput.value) / weight) * 100;
    baseProduct.carbsPer100 = (normalizeNumber(carbsInput.value) / weight) * 100;
}

function updatePortion(weight) {
    const portionFactor = weight / 100;
    caloriesInput.value = Math.round(baseProduct.caloriesPer100 * portionFactor);
    proteinsInput.value = +(baseProduct.proteinsPer100 * portionFactor).toFixed(1);
    fatsInput.value = +(baseProduct.fatsPer100 * portionFactor).toFixed(1);
    carbsInput.value = +(baseProduct.carbsPer100 * portionFactor).toFixed(1);
}

function fillProduct(product) {
    baseProduct = {
        ...DEFAULT_PRODUCT,
        ...product,
    };

    const initialWeight = product.defaultWeight || 100;
    weightInput.value = initialWeight;
    productTitle.textContent = product.name || DEFAULT_PRODUCT.name;
    updatePortion(initialWeight);
}

function saveProduct() {
    const payload = {
        id: baseProduct.id || `custom-${Date.now()}`,
        name: productTitle.textContent,
        weight: normalizeNumber(weightInput.value),
        calories: normalizeNumber(caloriesInput.value),
        proteins: normalizeNumber(proteinsInput.value),
        fats: normalizeNumber(fatsInput.value),
        carbs: normalizeNumber(carbsInput.value),
        base: { ...baseProduct },
    };

    const saved = JSON.parse(localStorage.getItem('savedProducts') || '[]');
    const existingIndex = saved.findIndex((item) => item.id === payload.id);

    if (existingIndex >= 0) {
        saved[existingIndex] = payload;
    } else {
        saved.unshift(payload);
    }

    localStorage.setItem('savedProducts', JSON.stringify(saved));
    localStorage.setItem('selectedProduct', JSON.stringify(payload.base));
    alert('Продукт сохранен');
}

function deleteProduct() {
    const saved = JSON.parse(localStorage.getItem('savedProducts') || '[]');
    const filtered = saved.filter((item) => item.id !== baseProduct.id);
    localStorage.setItem('savedProducts', JSON.stringify(filtered));
    localStorage.removeItem('selectedProduct');
    alert('Продукт удален');
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    if (!weightInput || !caloriesInput || !proteinsInput || !fatsInput || !carbsInput) {
        return;
    }

    const product = findProductFromParams();
    fillProduct(product);

    weightInput.addEventListener('input', () => {
        const weight = normalizeNumber(weightInput.value);
        updatePortion(weight);
    });

    [caloriesInput, proteinsInput, fatsInput, carbsInput].forEach((input) => {
        input.addEventListener('input', updateBaseFromFields);
    });

    if (saveButton) {
        saveButton.addEventListener('click', saveProduct);
    }

    if (deleteButton) {
        deleteButton.addEventListener('click', deleteProduct);
    }
});
