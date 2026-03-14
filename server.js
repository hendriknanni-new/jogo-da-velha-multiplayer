const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer();
const io = new Server(server, { cors: { origin: "*" } });

let rooms = {};

io.on('connection', (socket) => {
    socket.on('joinRoom', (roomID) => {
        socket.join(roomID);
        if (!rooms[roomID]) {
            rooms[roomID] = { players: {}, board: Array(9).fill(""), currentTurn: 'X', active: true };
        }
        const room = rooms[roomID];
        const symbols = Object.values(room.players);
        if (!symbols.includes('X')) room.players[socket.id] = 'X';
        else if (!symbols.includes('O')) room.players[socket.id] = 'O';
        
        socket.emit('playerAssignment', room.players[socket.id]);
    });

    socket.on('makeMove', (data) => {
        const room = rooms[data.roomID];
        if (room && room.active && data.symbol === room.currentTurn && room.board[data.index] === "") {
            room.board[data.index] = data.symbol;
            const nextTurn = data.symbol === 'X' ? 'O' : 'X';
            room.currentTurn = nextTurn;
            io.to(data.roomID).emit('moveMade', { index: data.index, symbol: data.symbol, nextTurn });
            
            // Lógica de vitória simplificada aqui (opcional no server)
        }
    });

    socket.on('requestRestart', (roomID) => {
        if (rooms[roomID]) {
            rooms[roomID].board = Array(9).fill("");
            rooms[roomID].currentTurn = 'X';
            rooms[roomID].active = true;
            io.to(roomID).emit('restartGame');
        }
    });

    socket.on('disconnecting', () => {
        socket.rooms.forEach(r => { if(rooms[r]) delete rooms[r].players[socket.id]; });
    });
});

server.listen(process.env.PORT || 3000);
