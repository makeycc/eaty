const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function formatDateKey(date) {
    return date.toISOString().slice(0, 10);
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

function getSelectedDate() {
    const stored = localStorage.getItem('selectedDate');
    return stored || formatDateKey(new Date());
}

function setSelectedDate(dateKey) {
    localStorage.setItem('selectedDate', dateKey);
}

function getDatesWindow(centerDateKey) {
    const center = new Date(centerDateKey);
    const dates = [];
    for (let offset = -3; offset <= 3; offset += 1) {
        const d = new Date(center);
        d.setDate(center.getDate() + offset);
        dates.push(d);
    }
    return dates;
}

function renderDays(centerDateKey) {
    const daysContainer = document.getElementById('days');
    if (!daysContainer) return;
    daysContainer.innerHTML = '';
    const dates = getDatesWindow(centerDateKey);

    dates.forEach((date) => {
        const button = document.createElement('button');
        const dateKey = formatDateKey(date);
        const dayLabel = DAY_LABELS[(date.getDay() + 6) % 7];
        button.className = `day-chip ${dateKey === centerDateKey ? 'active' : ''}`;
        button.innerHTML = `<span class="day-name">${dayLabel}</span><span class="day-number">${date.getDate()}</span>`;
        button.addEventListener('click', () => {
            setSelectedDate(dateKey);
            renderDays(dateKey);
            renderDiary(dateKey);
        });
        daysContainer.appendChild(button);
    });

    const active = daysContainer.querySelector('.day-chip.active');
    active?.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
}

function sumMacros(entries) {
    return entries.reduce(
        (acc, item) => {
            acc.calories += item.calories || 0;
            acc.proteins += item.proteins || 0;
            acc.fats += item.fats || 0;
            acc.carbs += item.carbs || 0;
            return acc;
        },
        { calories: 0, proteins: 0, fats: 0, carbs: 0 }
    );
}

function renderStats(entries) {
    const totals = sumMacros(entries);
    document.getElementById('stat-calories').textContent = Math.round(totals.calories);
    document.getElementById('stat-proteins').textContent = totals.proteins.toFixed(1);
    document.getElementById('stat-fats').textContent = totals.fats.toFixed(1);
    document.getElementById('stat-carbs').textContent = totals.carbs.toFixed(1);
}

function renderProducts(dateKey) {
    const diary = readDiary();
    const products = diary[dateKey]?.products || [];
    const list = document.getElementById('product-list');
    const counter = document.getElementById('entry-count');
    if (!list) return;

    counter.textContent = `${products.length} продукт${products.length === 1 ? '' : 'ов'}`;
    list.innerHTML = '';

    if (!products.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = '<p>Нет записей за этот день</p><p class="muted-label">Добавьте продукт, чтобы рассчитать КБЖУ</p>';
        list.appendChild(empty);
        return;
    }

    products.forEach((product) => {
        const item = document.createElement('div');
        item.className = 'product-row-card';
        item.innerHTML = `
            <div class="row-top">
                <div>
                    <p class="product-name">${product.name}</p>
                    <p class="muted-label">${product.weight} г · ${product.base?.name ? 'найдено' : 'вручную'}</p>
                </div>
                <div class="actions">
                    <button class="ghost-btn" data-entry="${product.id}">Редактировать</button>
                    <button class="icon-btn" aria-label="Удалить" data-delete="${product.id}">✕</button>
                </div>
            </div>
            <div class="row-bottom">
                <span>${Math.round(product.calories)} ккал</span>
                <span>${product.proteins.toFixed(1)} Б</span>
                <span>${product.fats.toFixed(1)} Ж</span>
                <span>${product.carbs.toFixed(1)} У</span>
            </div>
        `;
        list.appendChild(item);
    });

    list.querySelectorAll('[data-delete]').forEach((btn) => {
        btn.addEventListener('click', () => deleteProduct(dateKey, btn.dataset.delete));
    });
    list.querySelectorAll('[data-entry]').forEach((btn) => {
        btn.addEventListener('click', () => {
            localStorage.setItem('selectedProduct', JSON.stringify(products.find((p) => p.id === btn.dataset.entry)));
            window.location.href = `product.html?date=${dateKey}&entryId=${btn.dataset.entry}`;
        });
    });
}

function deleteProduct(dateKey, entryId) {
    const diary = readDiary();
    const existing = diary[dateKey]?.products || [];
    diary[dateKey] = { products: existing.filter((item) => item.id !== entryId) };
    persistDiary(diary);
    renderDiary(dateKey);
}

function renderDiary(dateKey) {
    renderProducts(dateKey);
    const diary = readDiary();
    renderStats(diary[dateKey]?.products || []);
}

function navigateDate(offset) {
    const current = new Date(getSelectedDate());
    current.setDate(current.getDate() + offset);
    const nextKey = formatDateKey(current);
    setSelectedDate(nextKey);
    renderDays(nextKey);
    renderDiary(nextKey);
}

document.addEventListener('DOMContentLoaded', () => {
    const selectedDate = getSelectedDate();
    renderDays(selectedDate);
    renderDiary(selectedDate);

    document.getElementById('prev-day')?.addEventListener('click', () => navigateDate(-1));
    document.getElementById('next-day')?.addEventListener('click', () => navigateDate(1));
    document.getElementById('today-btn')?.addEventListener('click', () => {
        const today = formatDateKey(new Date());
        setSelectedDate(today);
        renderDays(today);
        renderDiary(today);
    });

    document.getElementById('add-product')?.addEventListener('click', () => {
        const date = getSelectedDate();
        window.location.href = `add-product.html?date=${date}`;
    });
});
