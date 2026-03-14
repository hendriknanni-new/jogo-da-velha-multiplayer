const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, { cors: { origin: "*" } });

let players = {}; 
let currentTurn = 'X';
let board = Array(9).fill("");

io.on('connection', (socket) => {
    // Atribui símbolo fixo por ID de conexão
    const values = Object.values(players);
    if (!values.includes('X')) {
        players[socket.id] = 'X';
    } else if (!values.includes('O')) {
        players[socket.id] = 'O';
    }

    // Envia para o jogador qual símbolo ele é
    socket.emit('playerAssignment', players[socket.id]);

    // Quando alguém tenta jogar
    socket.on('makeMove', (data) => {
        // Validação: Só aceita se for a vez do símbolo e o espaço estiver vazio
        if (data.symbol === currentTurn && board[data.index] === "") {
            board[data.index] = data.symbol;
            io.emit('moveMade', data);
            currentTurn = currentTurn === 'X' ? 'O' : 'X';
        }
    });

    socket.on('requestRestart', () => {
        board = Array(9).fill("");
        currentTurn = 'X';
        io.emit('restartGame');
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor ON na porta ${PORT}`));
