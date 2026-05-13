/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
    const { sale_price, discount, quantity } = purchase; // получение данных из покупки
    const revenue = sale_price * (1 - discount / 100) * quantity; // расчет выручки
    return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    if (index === 0) {
        return seller.profit * 0.15;
    } else if (index === 1 || index === 2) {
        return seller.profit * 0.1;
    } else if (index === total - 1) {
        return 0;
    } else {
        return seller.profit * 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid data'); 
    }
    
    if (!Array.isArray(data.sellers) || data.sellers.length === 0) {
        throw new Error('Invalid data');
    }
    
    if (!Array.isArray(data.products) || data.products.length === 0) {
        throw new Error('Invalid data');
    }
    
    if (!Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
        throw new Error('Invalid data');
    }

    // @TODO: Проверка наличия опций
    if (!options || typeof options !== 'object') {
        throw new Error('Options required'); // проверка наличия опций
    }
    
    if (typeof options.calculateRevenue !== 'function') { 
        throw new Error('Options required'); // проверка наличия функции расчета выручки
    }
    
    if (typeof options.calculateBonus !== 'function') {
        throw new Error('Options required'); // проверка наличия функции расчета бонуса
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({ // добавление статистики для каждого продавца
        id: seller.id, // добавление ID продавца
        name: `${seller.first_name} ${seller.last_name}`, // добавление имени продавца
        revenue: 0, // добавление выручки
        profit: 0, // добавление прибыли
        sales_count: 0, // добавление количества продаж
        products_sold: {} // добавление количества проданных товаров
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = {}; // создание объекта для хранения индекса продавцов
    sellerStats.forEach(seller => { // цикл по продавцам
        sellerIndex[seller.id] = seller; // добавление индекса продавца
    });

    const productsMap = {}; // создание объекта для хранения товаров
    data.products.forEach(product => { // цикл по товарам
        productsMap[product.sku] = product; // добавление товара по SKU
    });

    // @TODO: Расчет выручки и прибыли для каждого продавца
    // цикл по чекам
    data.purchase_records.forEach(record => {
        const sellerId = record.seller_id; // получение ID продавца
        const sellerStat = sellerIndex[sellerId]; // получение статистики продавца
        if (!sellerStat) return; 
        sellerStat.sales_count += 1; 
    
        // цикл по товарам в чеке
        record.items.forEach(item => {
            const product = productsMap[item.sku]; // получение товара по SKU
            if (!product) return;
            const revenue = options.calculateRevenue(item, product);
            sellerStat.revenue = +(sellerStat.revenue + revenue).toFixed(2);

            const cost = product.purchase_price * item.quantity;
            const profit = revenue - cost;
            sellerStat.profit = +(sellerStat.profit + profit).toFixed(2);
            
            // подсчет количества проданных товаров
            if (!sellerStat.products_sold[item.sku]) {
                sellerStat.products_sold[item.sku] = 0;
            }
            sellerStat.products_sold[item.sku] += item.quantity; // добавление количества проданных товаров к общему количеству проданных товаров
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    const sortedSellers = sellerStats.sort((a, b) => b.profit - a.profit); // сортировка продавцов по прибыли

    // @TODO: Назначение премий на основе ранжирования
    const bonuses = sortedSellers.map((seller, index) => {
        return { // добавление бонуса для каждого продавца
            name: seller.name, // добавление имени продавца
            bonus: options.calculateBonus(index, sortedSellers.length, seller) // добавление бонуса по функции расчета бонуса
        };
    });
    // @TODO: Подготовка итоговой коллекции с нужными полями
    const result = sortedSellers.map(seller => {
        const topProducts = Object.entries(seller.products_sold) // добавление SKU и количества
            .map(([sku, quantity]) => ({ sku, quantity })) // добавление SKU и количества
            .sort((a, b) => b.quantity - a.quantity) // сортировка по количеству
            .slice(0, 10); // выбор топ 10 товаров
        
        return { // добавление итоговой коллекции
            seller_id: seller.id, // добавление ID продавца
            name: seller.name, // добавление имени продавца
            revenue: seller.revenue, // добавление выручки
            profit: seller.profit, // добавление прибыли
            sales_count: seller.sales_count, // добавление количества продаж
            top_products: topProducts, // добавление топ 10 товаров
            bonus: +(bonuses.find(bonus => bonus.name === seller.name)?.bonus || 0).toFixed(2) // добавление бонуса по имени продавца
        };
    });
    return result;
}
