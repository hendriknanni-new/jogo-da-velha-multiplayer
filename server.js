const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, {
    cors: { origin: "*" } 
});

let players = [];

io.on('connection', (socket) => {
    // Atribuição de X ou O
    if (players.length < 2) {
        const symbol = players.length === 0 ? 'X' : 'O';
        players.push({ id: socket.id, symbol });
        socket.emit('playerAssignment', symbol);
        console.log(`Jogador ${symbol} conectado`);
    }

    // Escuta as jogadas e repassa para todos
    socket.on('makeMove', (data) => {
        io.emit('moveMade', data); 
    });

    // --- ESSA É A PARTE NOVA ---
    // Quando alguém clica em reiniciar, o servidor avisa todos os apps
    socket.on('requestRestart', () => {
        console.log("Reiniciando partida...");
        io.emit('restartGame'); 
    });
    // ---------------------------

    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        console.log('Jogador saiu');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
