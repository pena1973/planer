import express from 'express';
import next from 'next';
// Определяем, находимся ли мы в режиме разработки
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
app.prepare().then(() => {
    const server = express();
    // Пример кастомного маршрута
    server.get('/api/hello', (req, res) => {
        res.json({ message: 'Hello from Express API' });
    });
    // Все остальные маршруты обрабатываются Next.js
    server.all('*', (req, res) => {
        return handle(req, res);
    });
    // Запуск сервера на порту 3000
    server.listen(3000, (err) => {
        if (err)
            throw err;
        console.log('> Ready on http://localhost:3000');
    });
});
