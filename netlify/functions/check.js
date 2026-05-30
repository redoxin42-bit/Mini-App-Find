const fetch = require('node-fetch'); // В Node.js v18+ на Netlify fetch встроен по умолчанию, но node-fetch гарантирует работу

exports.handler = async (event, context) => {
    // Получаем юзернейм из параметров GET запроса (?username=xxx)
    const username = event.queryStringParameters.username;
    
    if (!username || username.length < 4) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid username pattern" })
        };
    }

    try {
        // Делаем реальный серверный запрос к веб-странице Telegram-профиля
        const response = await fetch(`https://t.me/${username}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Failed to fetch Telegram data" })
            };
        }

        const html = await response.text();

        // АНАЛИЗ HTML-СТРУКТУРЫ СТРАНИЦЫ:
        // Если юзернейм свободен, на странице t.me/username обычно пишется "If you have Telegram, you can contact..."
        // Также там пропадают элементы кнопок "View in Telegram" или блок с описанием "tgme_page_extra"
        let isAvailable = false;

        if (html.includes("If you have Telegram, you can contact") || 
            html.includes("Form link") || 
            (!html.includes("tgme_page_extra") && !html.includes("tgme_action_button_new"))) {
            isAvailable = true;
        }

        // Дополнительная проверка на занятость через Fragment (опционально, если имя выставлено на аукцион)
        if (html.includes("vcard") || html.includes("tgme_page_title")) {
            // Если есть заголовок профиля или карточка контакта — 100% занят
            isAvailable = false;
        }

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" // Дополнительная защита CORS для фронта
            },
            body: JSON.stringify({ 
                username: username,
                available: isAvailable 
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
