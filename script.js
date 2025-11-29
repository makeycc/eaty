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
        return;
    }
    
    return data;
}

// Функция для отображения продуктов на главной странице
async function loadProducts() {
    const products = await getProducts();
    const productList = document.querySelector('.product-list');
    
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
document.querySelector('.add-product-btn').addEventListener('click', function() {
    alert('Перехожу на страницу добавления продукта');
});

// Страница продукта - сохранение и удаление
document.getElementById('save-product').addEventListener('click', function() {
    const calories = document.getElementById('product-calories').value;
    const proteins = document.getElementById('product-proteins').value;
    const fats = document.getElementById('product-fats').value;
    const carbs = document.getElementById('product-carbs').value;
    const weight = document.getElementById('product-weight').value;

    console.log(`Сохранено: Калории: ${calories}, Белки: ${proteins}, Жиры: ${fats}, Углеводы: ${carbs}, Вес: ${weight}`);
    alert('Продукт сохранен');
});

document.getElementById('delete-product').addEventListener('click', function() {
    alert('Продукт удален');
});

// Страница поиска и ручного ввода
document.getElementById('search-btn').addEventListener('click', function() {
    const searchQuery = document.getElementById('product-search').value;
    alert('Поиск по запросу: ' + searchQuery);

    // Здесь можно добавить логику для обработки поисковых запросов
    // Пример: отображение результатов поиска на основе введённого запроса
});

document.getElementById('manual-entry').addEventListener('click', function() {
    alert('Перехожу в форму ручного ввода');
});
