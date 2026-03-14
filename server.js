const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer();
const io = new Server(server, { cors: { origin: "*" } });

let rooms = {};

const checkWinner = (board) => {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let p of wins) {
        if (board[p[0]] && board[p[0]] === board[p[1]] && board[p[0]] === board[p[2]]) return board[p[0]];
    }
    return board.includes("") ? null : "draw";
};

io.on('connection', (socket) => {
    socket.on('joinRoom', (roomID) => {
        const id = String(roomID);
        socket.join(id);
        if (!rooms[id]) {
            rooms[id] = { players: {}, board: Array(9).fill(""), currentTurn: 'X', active: true, scores: { X: 0, O: 0 } };
        }
        const room = rooms[id];
        const symbols = Object.values(room.players);
        if (!symbols.includes('X')) room.players[socket.id] = 'X';
        else if (!symbols.includes('O')) room.players[socket.id] = 'O';
        
        socket.emit('playerAssignment', room.players[socket.id]);
        io.to(id).emit('updateScore', room.scores); // Envia placar ao entrar
    });

    socket.on('makeMove', (data) => {
        const room = rooms[data.roomID];
        if (room && room.active && data.symbol === room.currentTurn && room.board[data.index] === "") {
            room.board[data.index] = data.symbol;
            const result = checkWinner(room.board);
            const nextTurn = data.symbol === 'X' ? 'O' : 'X';
            room.currentTurn = nextTurn;

            io.to(data.roomID).emit('moveMade', { index: data.index, symbol: data.symbol, nextTurn });

            if (result) {
                room.active = false;
                if (result !== "draw") room.scores[result]++;
                io.to(data.roomID).emit('gameOver', { winner: result, scores: room.scores });
            }
        }
    });

    socket.on('requestRestart', (roomID) => {
        const room = rooms[roomID];
        if (room) {
            room.board = Array(9).fill("");
            room.currentTurn = 'X';
            room.active = true;
            io.to(roomID).emit('restartGame', room.scores); // Garante que o placar continue o mesmo
        }
    });

    socket.on('disconnecting', () => {
        socket.rooms.forEach(r => { if(rooms[r]) delete rooms[r].players[socket.id]; });
    });
});

server.listen(process.env.PORT || 3000);
