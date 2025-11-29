(function () {
    const caloriesInput = document.getElementById('product-calories');
    const proteinsInput = document.getElementById('product-proteins');
    const fatsInput = document.getElementById('product-fats');
    const carbsInput = document.getElementById('product-carbs');
    const weightInput = document.getElementById('product-weight');
    const manualEntryBtn = document.getElementById('manual-entry-toggle');
    const saveButton = document.getElementById('save-product');
    const deleteButton = document.getElementById('delete-product');
    const titleElement = document.getElementById('product-title');
    const saveStatus = document.getElementById('save-status');

    const portionFields = {
        calories: document.getElementById('portion-calories'),
        proteins: document.getElementById('portion-proteins'),
        fats: document.getElementById('portion-fats'),
        carbs: document.getElementById('portion-carbs')
    };

    if (!caloriesInput || !proteinsInput || !fatsInput || !carbsInput || !weightInput) {
        return;
    }

    const baseFields = [caloriesInput, proteinsInput, fatsInput, carbsInput];

    function parseValue(value) {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function formatValue(value) {
        if (!Number.isFinite(value) || value <= 0) {
            return '—';
        }

        const rounded = Math.round(value * 10) / 10;
        return rounded % 1 === 0 ? String(rounded.toFixed(0)) : rounded.toFixed(1);
    }

    function updatePortionValues() {
        const weight = parseValue(weightInput.value);

        ['calories', 'proteins', 'fats', 'carbs'].forEach(key => {
            const input = {
                calories: caloriesInput,
                proteins: proteinsInput,
                fats: fatsInput,
                carbs: carbsInput
            }[key];

            const per100 = parseValue(input.value);
            const portionValue = weight > 0 ? (per100 * weight) / 100 : NaN;
            portionFields[key].textContent = formatValue(portionValue);
        });
    }

    function toggleManualEntry() {
        const isReadOnly = caloriesInput.hasAttribute('readonly');

        baseFields.forEach(field => {
            if (isReadOnly) {
                field.removeAttribute('readonly');
                field.placeholder = 'Введите значение';
            } else {
                field.setAttribute('readonly', 'readonly');
                field.placeholder = '';
            }
        });

        manualEntryBtn.textContent = isReadOnly ? 'Заблокировать поля' : 'Заполнить вручную';
    }

    function showStatus(message, isError = false) {
        if (!saveStatus) return;
        saveStatus.textContent = message;
        saveStatus.className = isError ? 'status error' : 'status success';
    }

    function handleSave() {
        const productData = {
            name: titleElement ? titleElement.textContent : 'Новый продукт',
            per100: {
                calories: parseValue(caloriesInput.value),
                proteins: parseValue(proteinsInput.value),
                fats: parseValue(fatsInput.value),
                carbs: parseValue(carbsInput.value)
            },
            weight: parseValue(weightInput.value),
            portion: {
                calories: parseValue(portionFields.calories.textContent),
                proteins: parseValue(portionFields.proteins.textContent),
                fats: parseValue(portionFields.fats.textContent),
                carbs: parseValue(portionFields.carbs.textContent)
            }
        };

        try {
            const savedProducts = JSON.parse(localStorage.getItem('savedProducts') || '[]');
            const existingIndex = savedProducts.findIndex(item => item.name === productData.name);

            if (existingIndex >= 0) {
                savedProducts[existingIndex] = productData;
            } else {
                savedProducts.push(productData);
            }

            localStorage.setItem('savedProducts', JSON.stringify(savedProducts));
            showStatus('Данные продукта сохранены');
        } catch (error) {
            console.error('Ошибка при сохранении', error);
            showStatus('Не удалось сохранить данные', true);
        }
    }

    function handleDelete() {
        if (!deleteButton) return;
        deleteButton.addEventListener('click', () => {
            showStatus('Продукт удален');
        });
    }

    weightInput.addEventListener('input', updatePortionValues);
    baseFields.forEach(field => field.addEventListener('input', updatePortionValues));
    manualEntryBtn.addEventListener('click', toggleManualEntry);
    saveButton.addEventListener('click', handleSave);
    handleDelete();

    updatePortionValues();
})();
