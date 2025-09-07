const TelegramBot = require('node-telegram-bot-api');

// ЗАМЕНИТЕ НА СВОИ ДАННЫЕ:
const BOT_TOKEN = process.env.BOT_TOKEN || '8057296938:AAEfMRWB0bY0NLvKFcV_YxaVaTqrw6SVbos';
const CHANNEL_ID = process.env.CHANNEL_ID || '@rinok_onlinebot';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Хранилище данных пользователей
let userData = {};

// Категории товаров
const categories = {
    '📱': 'Электроника',
    '🚗': 'Транспорт',
    '🏠': 'Недвижимость',
    '👕': 'Одежда и обувь',
    '🎮': 'Хобби и спорт',
    '💼': 'Работа',
    '🛍️': 'Другое'
};

// Главное меню
const mainMenu = {
    reply_markup: {
        inline_keyboard: [
            [{ text: '➕ Подать объявление', callback_data: 'add_ad' }],
            [{ text: '📋 Правила', callback_data: 'rules' }],
            [{ text: '❓ Помощь', callback_data: 'help' }]
        ]
    }
};

// Меню категорий
const categoryMenu = {
    reply_markup: {
        inline_keyboard: [
            [{ text: '📱 Электроника', callback_data: 'cat_📱' }],
            [{ text: '🚗 Транспорт', callback_data: 'cat_🚗' }],
            [{ text: '🏠 Недвижимость', callback_data: 'cat_🏠' }],
            [{ text: '👕 Одежда и обувь', callback_data: 'cat_👕' }],
            [{ text: '🎮 Хобби и спорт', callback_data: 'cat_🎮' }],
            [{ text: '💼 Работа', callback_data: 'cat_💼' }],
            [{ text: '🛍️ Другое', callback_data: 'cat_🛍️' }],
            [{ text: '🔙 Назад', callback_data: 'back_to_menu' }]
        ]
    }
};

// Команда /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'друг';
    
    const welcomeText = `
👋 Привет, ${firstName}!

🎯 Я помогу разместить ваше объявление в канале!

📢 Канал: ${CHANNEL_ID}

Нажмите кнопку ниже, чтобы начать:`;

    bot.sendMessage(chatId, welcomeText, mainMenu);
});

// Обработка кнопок
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;

    bot.answerCallbackQuery(query.id);

    if (data === 'add_ad') {
        bot.sendMessage(chatId, '📋 Выберите категорию для вашего объявления:', categoryMenu);
    }
    
    else if (data === 'rules') {
        const rulesText = `
📋 **ПРАВИЛА РАЗМЕЩЕНИЯ**

✅ **Разрешено:**
• Реальные товары и услуги
• Честные фото и описания
• Актуальные цены
• Вежливое общение

❌ **Запрещено:**
• Мошенничество
• Неприличный контент
• Спам и реклама
• Нарушение законов

⚠️ **Нарушители будут заблокированы**`;

        bot.sendMessage(chatId, rulesText, { 
            parse_mode: 'Markdown',
            ...mainMenu 
        });
    }
    
    else if (data === 'help') {
        const helpText = `
❓ **КАК ПОДАТЬ ОБЪЯВЛЕНИЕ:**

1️⃣ Нажмите "Подать объявление"
2️⃣ Выберите категорию
3️⃣ Отвечайте на вопросы бота
4️⃣ Проверьте и опубликуйте!

📞 **Поддержка:** @admin

🔄 Объявления публикуются автоматически`;

        bot.sendMessage(chatId, helpText, { 
            parse_mode: 'Markdown',
            ...mainMenu 
        });
    }
    
    else if (data === 'back_to_menu') {
        bot.sendMessage(chatId, '🏠 Главное меню:', mainMenu);
    }
    
    else if (data.startsWith('cat_')) {
        const category = data.replace('cat_', '');
        startAdCreation(chatId, userId, category);
    }
    
    else if (data === 'publish_ad') {
        publishAd(chatId, userId);
    }
    
    else if (data === 'cancel_ad') {
        cancelAd(chatId, userId);
    }
});

// Начало создания объявления
function startAdCreation(chatId, userId, category) {
    userData[userId] = {
        category: category,
        step: 'waiting_title'
    };
    
    bot.sendMessage(chatId, 
        `${category} **${categories[category]}**\n\n📝 Напишите название товара:\n\n*Например: iPhone 14 Pro 128GB*`,
        { parse_mode: 'Markdown' }
    );
}

// Обработка сообщений пользователей
bot.on('message', (msg) => {
    if (msg.text && msg.text.startsWith('/')) return;
    
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const user = userData[userId];
    
    if (!user) return;

    switch (user.step) {
        case 'waiting_title':
            user.title = msg.text;
            user.step = 'waiting_description';
            bot.sendMessage(chatId, 
                '📄 **Описание товара**\n\nРасскажите подробнее:\n\n*Состояние, особенности, причина продажи...*',
                { parse_mode: 'Markdown' }
            );
            break;

        case 'waiting_description':
            user.description = msg.text;
            user.step = 'waiting_price';
            bot.sendMessage(chatId, 
                '💰 **Цена**\n\nУкажите стоимость:\n\n*Например: 15000 грн или 500$ или Договорная*',
                { parse_mode: 'Markdown' }
            );
            break;

        case 'waiting_price':
            user.price = msg.text;
            user.step = 'waiting_location';
            bot.sendMessage(chatId, 
                '📍 **Местоположение**\n\nВаш город:\n\n*Например: Днепр, Киев, Харьков*',
                { parse_mode: 'Markdown' }
            );
            break;

        case 'waiting_location':
            user.location = msg.text;
            user.step = 'waiting_contact';
            bot.sendMessage(chatId, 
                '📱 **Контакты**\n\nКак с вами связаться:\n\n*Телефон, Telegram, Viber*',
                { parse_mode: 'Markdown' }
            );
            break;

        case 'waiting_contact':
            user.contact = msg.text;
            user.userName = msg.from.first_name || 'Пользователь';
            user.userTag = msg.from.username ? `@${msg.from.username}` : '';
            showPreview(chatId, userId);
            break;
    }
});

// Предпросмотр объявления
function showPreview(chatId, userId) {
    const user = userData[userId];
    
    const adText = `${user.category} **${user.title}**

📋 ${user.description}

💰 **Цена:** ${user.price}
📍 **Город:** ${user.location}
📞 **Контакт:** ${user.contact}

👤 ${user.userName} ${user.userTag}

#объявление #продажа`;

    const confirmButtons = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ Опубликовать', callback_data: 'publish_ad' },
                    { text: '❌ Отмена', callback_data: 'cancel_ad' }
                ]
            ]
        }
    };

    bot.sendMessage(chatId, 
        `📋 **ПРЕДПРОСМОТР ОБЪЯВЛЕНИЯ:**\n\n${adText}`, 
        { parse_mode: 'Markdown', ...confirmButtons }
    );
}

// Публикация объявления
async function publishAd(chatId, userId) {
    const user = userData[userId];
    
    const adText = `${user.category} **${user.title}**

📋 ${user.description}

💰 **Цена:** ${user.price}
📍 **Город:** ${user.location}
📞 **Контакт:** ${user.contact}

👤 ${user.userName} ${user.userTag}

#объявление #продажа`;

    try {
        // Публикуем в канал
        await bot.sendMessage(CHANNEL_ID, adText, { parse_mode: 'Markdown' });
        
        // Уведомляем пользователя
        bot.sendMessage(chatId, 
            '✅ **ОБЪЯВЛЕНИЕ ОПУБЛИКОВАНО!**\n\n🎉 Ваше объявление появилось в канале!\n\nХотите добавить еще одно?',
            { parse_mode: 'Markdown', ...mainMenu }
        );
        
        // Очищаем данные
        delete userData[userId];
        
    } catch (error) {
        console.error('Ошибка публикации:', error);
        bot.sendMessage(chatId, 
            '❌ **Ошибка!**\n\nНе удалось опубликовать объявление.\nПопробуйте еще раз или обратитесь к администратору.',
            { parse_mode: 'Markdown', ...mainMenu }
        );
    }
}

// Отмена объявления
function cancelAd(chatId, userId) {
    delete userData[userId];
    bot.sendMessage(chatId, '❌ Создание объявления отменено.', mainMenu);
}

// Обработка ошибок
bot.on('polling_error', (error) => {
    console.log('Ошибка polling:', error);
});

console.log('🤖 Бот запущен и работает!');
