// netlify/functions/check.js
// Полностью чистый код БЕЗ внешних модулей (используем нативный fetch в Node.js)

exports.handler = async (event, context) => {
    const username = event.queryStringParameters.username;
    
    if (!username || username.length < 4) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid username pattern" })
        };
    }

    try {
        // Используем встроенный в Node.js глобальный fetch
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
        let isAvailable = false;

        // Проверка структуры страницы
        if (html.includes("If you have Telegram, you can contact") || 
            html.includes("Form link") || 
            (!html.includes("tgme_page_extra") && !html.includes("tgme_action_button_new"))) {
            isAvailable = true;
        }

        if (html.includes("vcard") || html.includes("tgme_page_title")) {
            isAvailable = false;
        }

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
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
