// Инициализация Supabase
const supabaseUrl = 'https://iglrrvgntvlubynkzptj.supabase.co'; // Заменить на свой URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnbHJydmdudHZsdWJ5bmt6cHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDgwMjAsImV4cCI6MjA3OTk4NDAyMH0.mg_E8yT8yXOcbQDc2C_9oHZCIfNurEFvJKxFZtBjj5w'; // Заменить на свой ключ
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Главная страница - Загрузка продуктов
async function getProducts() {
    const { data, error } = await supabase
        .from('products') // Название таблицы
        .select('*');

    if (error) {
        console.error('Ошибка при загрузке данных:', error);
        return [];
    }

    return data || [];
}

// Функция для отображения продуктов на главной странице
async function loadProducts() {
    const products = await getProducts();
    const productList = document.querySelector('.product-list');

    if (!productList) return;

    productList.innerHTML = ''; // Очистить список перед добавлением новых продуктов

    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.classList.add('product-item');

        productItem.innerHTML = `
            <div class="product-row product-main-row">
                <span class="product-name">${product.name}</span>
                <span class="product-weight">${product.weight} г</span>
                <button class="delete-btn" data-id="${product.id}" aria-label="Удалить продукт">×</button>
            </div>
            <div class="product-row product-sub-row">
                <span class="product-kbiju">${product.calories} · ${product.proteins} · ${product.fats}</span>
                <span class="product-calories">${product.calories} Ккал</span>
            </div>
        `;

        productList.appendChild(productItem);
    });
}

// Загружаем продукты при старте главной страницы
if (document.querySelector('.product-list')) {
    loadProducts();
}

// Обработчик для добавления нового продукта на главной странице
const addProductBtn = document.querySelector('.add-product-btn');
if (addProductBtn) {
    addProductBtn.addEventListener('click', function () {
        window.location.href = 'add-product.html';
    });
}

// Страница продукта - сохранение и удаление
const saveProductBtn = document.getElementById('save-product');
if (saveProductBtn) {
    saveProductBtn.addEventListener('click', function () {
        const calories = document.getElementById('product-calories').value;
        const proteins = document.getElementById('product-proteins').value;
        const fats = document.getElementById('product-fats').value;
        const carbs = document.getElementById('product-carbs').value;
        const weight = document.getElementById('product-weight').value;

        console.log(`Сохранено: Калории: ${calories}, Белки: ${proteins}, Жиры: ${fats}, Углеводы: ${carbs}, Вес: ${weight}`);
        alert('Продукт сохранен');
    });
}

const deleteProductBtn = document.getElementById('delete-product');
if (deleteProductBtn) {
    deleteProductBtn.addEventListener('click', function () {
        alert('Продукт удален');
    });
}

// Страница поиска и ручного ввода
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('product-search');
const resultsList = document.getElementById('results-list');
const searchHistoryContainer = document.querySelector('.search-history-items');
const clearHistoryBtn = document.getElementById('clear-history');
const manualEntryBtn = document.getElementById('manual-entry');
const cameraButton = document.getElementById('camera-button');
const scannerStatus = document.getElementById('scanner-status');
let searchHistory = ['Гречка', 'Кефир 1%', 'Яйцо куриное'];

function renderHistory() {
    if (!searchHistoryContainer) return;

    searchHistoryContainer.innerHTML = '';

    if (searchHistory.length === 0) {
        const emptyState = document.createElement('span');
        emptyState.textContent = 'Нет запросов';
        emptyState.className = 'history-empty';
        searchHistoryContainer.appendChild(emptyState);
        return;
    }

    searchHistory.forEach((term) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'history-pill';
        pill.textContent = term;
        pill.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = term;
                performSearch(term);
            }
        });
        searchHistoryContainer.appendChild(pill);
    });
}

function performSearch(query) {
    if (!resultsList) return;

    const cleanQuery = query.trim();
    resultsList.innerHTML = '';

    if (!cleanQuery) {
        resultsList.innerHTML = '<li>Введите запрос для поиска продукта</li>';
        return;
    }

    const listItem = document.createElement('li');
    listItem.textContent = `Результаты по запросу: "${cleanQuery}" (заглушка)`;
    resultsList.appendChild(listItem);
}

if (searchForm && searchInput) {
    searchForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const query = searchInput.value;
        if (!query.trim()) {
            performSearch('');
            return;
        }

        performSearch(query);

        if (!searchHistory.includes(query)) {
            searchHistory = [query, ...searchHistory].slice(0, 10);
            renderHistory();
        }
    });
}

if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
        searchHistory = [];
        renderHistory();
    });
}

if (manualEntryBtn) {
    manualEntryBtn.addEventListener('click', () => {
        window.location.href = 'product.html';
    });
}

if (cameraButton && scannerStatus) {
    cameraButton.addEventListener('click', () => {
        scannerStatus.textContent = 'Идёт сканирование штрих-кода...';
        console.log('Запуск сканера: инициализация камеры или вызов SDK');

        setTimeout(() => {
            scannerStatus.textContent = 'Штрих-код не найден. Попробуйте ещё раз.';
        }, 1500);
    });
}

renderHistory();
