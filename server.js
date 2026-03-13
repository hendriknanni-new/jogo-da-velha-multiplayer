const http = require('http');
const { Server } = require('socket.io');

// Cria o servidor
const server = http.createServer();
const io = new Server(server, {
    cors: { origin: "*" } // Isso permite que qualquer site acesse o servidor
});

let players = [];

io.on('connection', (socket) => {
    // Quando alguém conecta, damos um símbolo (X ou O)
    if (players.length < 2) {
        const symbol = players.length === 0 ? 'X' : 'O';
        players.push({ id: socket.id, symbol });
        socket.emit('playerAssignment', symbol);
        console.log(`Jogador ${symbol} conectado`);
    }

    // Quando o servidor recebe uma jogada, ele avisa TODO MUNDO
    socket.on('makeMove', (data) => {
        io.emit('moveMade', data); 
    });

    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        console.log('Jogador saiu');
    });
});

// O Render vai escolher a porta automaticamente
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
