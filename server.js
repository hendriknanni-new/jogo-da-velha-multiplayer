const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, { cors: { origin: "*" } });

let players = {}; 
let currentTurn = 'X';
let board = Array(9).fill("");
let gameActive = true;

const checkWin = (b) => {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let p of wins) {
        if (b[p[0]] && b[p[0]] === b[p[1]] && b[p[0]] === b[p[2]]) return b[p[0]];
    }
    return b.includes("") ? null : "draw";
};

io.on('connection', (socket) => {
    const occupied = Object.values(players);
    if (!occupied.includes('X')) players[socket.id] = 'X';
    else if (!occupied.includes('O')) players[socket.id] = 'O';
    else players[socket.id] = null;

    socket.emit('playerAssignment', players[socket.id]);

    socket.on('makeMove', (data) => {
        if (gameActive && data.symbol === currentTurn && board[data.index] === "" && players[socket.id] === data.symbol) {
            board[data.index] = data.symbol;
            const result = checkWin(board);
            
            io.emit('moveMade', { index: data.index, symbol: data.symbol, nextTurn: data.symbol === 'X' ? 'O' : 'X' });

            if (result) {
                gameActive = false;
                io.emit('gameOver', result);
            } else {
                currentTurn = data.symbol === 'X' ? 'O' : 'X';
            }
        }
    });

    socket.on('requestRestart', () => {
        board = Array(9).fill("");
        currentTurn = 'X';
        gameActive = true;
        io.emit('restartGame');
    });

    socket.on('disconnect', () => { delete players[socket.id]; });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT);
