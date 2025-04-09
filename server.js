const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Middleware para servir arquivos estáticos
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Rota para a página de login/cadastro
app.get('/', (req, res) => res.sendFile(__dirname + '/public/login.html'));

// Rota para a página do chat (após login)
app.get('/chat', (req, res) => res.sendFile(__dirname + '/public/chat.html'));

// Rota para processar o login
app.post('/login', (req, res) => {
    const username = req.body.username;
    if (username) {
        res.redirect('/chat?username=' + encodeURIComponent(username));
    } else {
        res.redirect('/');
    }
});

// Objeto para armazenar usuários conectados
const users = {};

io.on('connection', (socket) => {
    console.log('Novo usuário conectado');
    
    // Evento para quando o usuário entra no chat
    socket.on('join', (username) => {
        users[socket.id] = username;
        socket.broadcast.emit('user joined', username);
        io.emit('update users', Object.values(users));
        console.log(`${username} entrou no chat`);
    });

    // Evento para mensagens do chat
    socket.on('chat message', (data) => {
        const username = users[socket.id] || 'Anônimo';
        io.emit('chat message', { username, message: data.message });
    });

    // Evento para quando o usuário se desconecta
    socket.on('disconnect', () => {
        const username = users[socket.id];
        if (username) {
            socket.broadcast.emit('user left', username);
            delete users[socket.id];
            io.emit('update users', Object.values(users));
            console.log(`${username} saiu do chat`);
        }
    });
});

http.listen(3000, () => {
    console.log('Servidor rodando na porta 3000 - http://localhost:3000');
});