const WebSocket = require('ws');
const net = require('net');

const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port });

wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const target = url.searchParams.get('target');

    if (!target) {
        console.log("Ошибка: не указан target");
        ws.close();
        return;
    }

    const [host, targetPort] = target.split(':');
    const mcPort = targetPort || 25565;

    console.log(`Прокси: соединение с ${host}:${mcPort}`);

    const client = new net.Socket();
    
    client.connect(mcPort, host, () => {
        console.log('Подключено к MC серверу');
    });

    ws.on('message', (data) => {
        if (client.writable) client.write(Buffer.from(data));
    });

    client.on('data', (data) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    ws.on('close', () => client.end());
    client.on('close', () => ws.close());
    client.on('error', (err) => {
        console.error('Ошибка TCP:', err.message);
        ws.close();
    });
});

console.log(`AutoTelly Proxy запущен на порту ${port}`);
