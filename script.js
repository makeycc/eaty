// Главная страница
const supabaseClient = window.supabase
    ? window.supabase.createClient(
        'https://iglrrvgntvlubynkzptj.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnbHJydmdudHZsdWJ5bmt6cHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDgwMjAsImV4cCI6MjA3OTk4NDAyMH0.mg_E8yT8yXOcbQDc2C_9oHZCIfNurEFvJKxFZtBjj5w'
    )
    : null;

const MOCK_PRODUCTS = [
    {
        id: 'chicken-breast-120',
        name: 'Грудки Цыпленка-Бройлера Кубик',
        weight: 120,
        calories: 198,
        proteins: 37,
        fats: 4,
    },
    {
        id: 'global-village-bulgur',
        name: 'Global Village Булгур',
        weight: 80,
        calories: 274,
        proteins: 9.6,
        fats: 1.1,
    },
];

async function getProducts() {
    if (!supabaseClient) {
        return MOCK_PRODUCTS;
    }

    const { data, error } = await supabaseClient.from('products').select('*');

    if (error) {
        console.error('Ошибка при загрузке данных:', error);
        return MOCK_PRODUCTS;
    }

    return data;
}

async function loadProducts() {
    const productList = document.querySelector('.product-list');
    if (!productList) return;

    const products = await getProducts();
    productList.innerHTML = '';

    products.forEach((product) => {
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

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();

    const addProductButton = document.querySelector('.add-product-btn');
    if (addProductButton) {
        addProductButton.addEventListener('click', () => {
            window.location.href = 'add-product.html';
        });
    }
});
