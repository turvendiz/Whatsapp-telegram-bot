const { Client, LocalAuth } = require('whatsapp-web.js');
const TelegramBot = require('node-telegram-bot-api');
const qrcode = require('qrcode-terminal');

// Получаем переменные окружения
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Пожалуйста, установите переменные окружения TELEGRAM_TOKEN и TELEGRAM_CHAT_ID');
        process.exit(1);
        }

        // Инициализация Telegram бота
        const telegramBot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

        // Инициализация WhatsApp клиента
        const whatsappClient = new Client({
            authStrategy: new LocalAuth(),
                puppeteer: {
                        headless: true,
                                args: [
                                            '--no-sandbox',
                                                        '--disable-setuid-sandbox',
                                                                    '--disable-dev-shm-usage',
                                                                                '--disable-accelerated-2d-canvas',
                                                                                            '--no-first-run',
                                                                                                        '--no-zygote',
                                                                                                                    '--single-process',
                                                                                                                                '--disable-gpu'
                                                                                                                                        ]
                                                                                                                                            }
                                                                                                                                            });

                                                                                                                                            // WhatsApp QR-код для авторизации
                                                                                                                                            whatsappClient.on('qr', qr => {
                                                                                                                                                console.log('=== СКАНИРУЙТЕ QR-КОД В WHATSAPP ===');
                                                                                                                                                    qrcode.generate(qr, { small: true });
                                                                                                                                                        console.log('QR-код выше. Откройте WhatsApp → Настройки → WhatsApp Web → Сканируйте');
                                                                                                                                                        });

                                                                                                                                                        // WhatsApp готов
                                                                                                                                                        whatsappClient.on('ready', () => {
                                                                                                                                                            console.log('✅ WhatsApp клиент готов!');
                                                                                                                                                                telegramBot.sendMessage(TELEGRAM_CHAT_ID, '✅ Бот запущен! WhatsApp подключен.');
                                                                                                                                                                });

                                                                                                                                                                // Получение сообщений WhatsApp
                                                                                                                                                                whatsappClient.on('message', async message => {
                                                                                                                                                                    try {
                                                                                                                                                                            const chat = await message.getChat();
                                                                                                                                                                                    const contact = await message.getContact();
                                                                                                                                                                                            
                                                                                                                                                                                                    // Игнорируем сообщения от самого себя
                                                                                                                                                                                                            if (contact.id._serialized.includes('@c.us')) {
                                                                                                                                                                                                                        const text = `📱 *WhatsApp* от ${contact.pushname || contact.number}:\n${message.body}`;
                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                await telegramBot.sendMessage(TELEGRAM_CHAT_ID, text, { parse_mode: 'Markdown' });
                                                                                                                                                                                                                                                            console.log('📤 Отправлено в Telegram:', message.body);
                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                        } catch (error) {
                                                                                                                                                                                                                                                                                console.error('❌ Ошибка:', error);
                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                    });

                                                                                                                                                                                                                                                                                    // Обработка команд Telegram
                                                                                                                                                                                                                                                                                    telegramBot.onText(/\/start/, (msg) => {
                                                                                                                                                                                                                                                                                        const chatId = msg.chat.id;
                                                                                                                                                                                                                                                                                            telegramBot.sendMessage(chatId, `👋 Ваш Chat ID: ${chatId}\nСохраните его для использования в переменных окружения`);
                                                                                                                                                                                                                                                                                            });

                                                                                                                                                                                                                                                                                            telegramBot.onText(/\/status/, async (msg) => {
                                                                                                                                                                                                                                                                                                const chatId = msg.chat.id;
                                                                                                                                                                                                                                                                                                    telegramBot.sendMessage(chatId, '✅ Бот работает. Проверяю соединение...');
                                                                                                                                                                                                                                                                                                    });

                                                                                                                                                                                                                                                                                                    // Запуск WhatsApp клиента
                                                                                                                                                                                                                                                                                                    whatsappClient.initialize();

                                                                                                                                                                                                                                                                                                    console.log('🚀 Бот запускается...');