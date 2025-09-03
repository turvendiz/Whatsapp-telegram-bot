const { Client, LocalAuth } = require('whatsapp-web.js');
const TelegramBot = require('node-telegram-bot-api');
const qrcode = require('qrcode-terminal');

// Получаем переменные окружения
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('❌ ОШИБКА: Установите переменные окружения TELEGRAM_TOKEN и TELEGRAM_CHAT_ID');
    process.exit(1);
}

console.log('🚀 Запуск бота...');

// Инициализация Telegram бота
const telegramBot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Настройки WhatsApp клиента с puppeteer-core
const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/google-chrome-stable', // Путь к Chrome в контейнере
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-software-rendering',
            '--disable-features=VizDisplayCompositor',
            '--disable-features=TranslateUI',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
        ]
    }
});

// Обработчики событий WhatsApp
whatsappClient.on('qr', qr => {
    console.log('\n=== СКАНИРУЙТЕ QR-КОД В WHATSAPP ===');
    qrcode.generate(qr, { small: true });
    console.log('Откройте WhatsApp → Настройки → WhatsApp Web → Сканируйте QR-код выше\n');
    
    // Отправляем QR в Telegram (в виде текста)
    telegramBot.sendMessage(TELEGRAM_CHAT_ID, `📱 *Сканируйте QR-код в WhatsApp:*\n\`${qr}\``, { parse_mode: 'Markdown' })
        .catch(err => console.error('Ошибка отправки QR в Telegram:', err));
});

whatsappClient.on('ready', () => {
    console.log('✅ WhatsApp клиент готов!');
    telegramBot.sendMessage(TELEGRAM_CHAT_ID, '✅ Бот запущен! WhatsApp подключен.')
        .catch(err => console.error('Ошибка отправки сообщения в Telegram:', err));
});

whatsappClient.on('authenticated', () => {
    console.log('🔐 WhatsApp аутентифицирован');
});

whatsappClient.on('auth_failure', msg => {
    console.error('❌ Ошибка аутентификации WhatsApp:', msg);
    telegramBot.sendMessage(TELEGRAM_CHAT_ID, '❌ Ошибка аутентификации WhatsApp')
        .catch(err => console.error('Ошибка отправки сообщения:', err));
});

whatsappClient.on('disconnected', (reason) => {
    console.log('🔌 WhatsApp отключен:', reason);
    telegramBot.sendMessage(TELEGRAM_CHAT_ID, `🔌 WhatsApp отключен: ${reason}`)
        .catch(err => console.error('Ошибка отправки сообщения:', err));
});

// Получение сообщений WhatsApp
whatsappClient.on('message', async message => {
    try {
        // Игнорируем сообщения от групп и статусов
        if (message.from === 'status@broadcast') return;
        
        const contact = await message.getContact();
        const chat = await message.getChat();
        
        // Игнорируем сообщения от самого себя
        if (contact.isMe) return;
        
        const senderName = contact.pushname || contact.shortName || contact.number;
        const text = `📱 *WhatsApp* от ${senderName}:\n${message.body || '(медиафайл)'}`;
        
        await telegramBot.sendMessage(TELEGRAM_CHAT_ID, text, { parse_mode: 'Markdown' });
        console.log('📤 Отправлено в Telegram:', message.body?.substring(0, 50) || '(медиа)');
        
    } catch (error) {
        console.error('❌ Ошибка обработки сообщения:', error);
    }
});

// Обработка команд Telegram
telegramBot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const response = `👋 Ваш Chat ID: \`${chatId}\`\nСохраните его в переменных окружения как TELEGRAM_CHAT_ID`;
    telegramBot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

telegramBot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    telegramBot.sendMessage(chatId, '✅ Бот активен. Проверяю соединение...');
});

// Обработка ошибок Telegram
telegramBot.on('error', (error) => {
    console.error('❌ Ошибка Telegram бота:', error);
});

telegramBot.on('polling_error', (error) => {
    console.error('❌ Ошибка polling Telegram:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Остановка бота...');
    await whatsappClient.destroy();
    process.exit(0);
});

// Запуск WhatsApp клиента
whatsappClient.initialize();

console.log('🚀 Бот инициализирован. Ожидание QR-кода...');
