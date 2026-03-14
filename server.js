const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer();
const io = new Server(server, { cors: { origin: "*" } });

let rooms = {};

const checkWinner = (board) => {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let p of wins) {
        if (board[p[0]] && board[p[0]] === board[p[1]] && board[p[0]] === board[p[2]]) {
            return board[p[0]];
        }
    }
    return board.includes("") ? null : "draw";
};

io.on('connection', (socket) => {
    socket.on('joinRoom', (roomID) => {
        const id = String(roomID); 
        socket.join(id);
        
        if (!rooms[id]) {
            rooms[id] = { players: {}, board: Array(9).fill(""), currentTurn: 'X', active: true };
        }
        
        const room = rooms[id];
        const symbols = Object.values(room.players);
        
        if (!symbols.includes('X')) room.players[socket.id] = 'X';
        else if (!symbols.includes('O')) room.players[socket.id] = 'O';
        else room.players[socket.id] = null;

        socket.emit('playerAssignment', room.players[socket.id]);
    });

    socket.on('makeMove', (data) => {
        const id = String(data.roomID);
        const room = rooms[id];
        if (room && room.active && data.symbol === room.currentTurn && room.board[data.index] === "" && room.players[socket.id] === data.symbol) {
            room.board[data.index] = data.symbol;
            const result = checkWinner(room.board);
            
            io.to(id).emit('moveMade', { 
                index: data.index, 
                symbol: data.symbol, 
                nextTurn: data.symbol === 'X' ? 'O' : 'X' 
            });

            if (result) {
                room.active = false;
                io.to(id).emit('gameOver', result);
            } else {
                room.currentTurn = data.symbol === 'X' ? 'O' : 'X';
            }
        }
    });

    socket.on('requestRestart', (roomID) => {
        const id = String(roomID);
        if (rooms[id]) {
            rooms[id].board = Array(9).fill("");
            rooms[id].currentTurn = 'X';
            rooms[id].active = true;
            io.to(id).emit('restartGame');
        }
    });

    socket.on('disconnecting', () => {
        socket.rooms.forEach(r => { if(rooms[r]) delete rooms[r].players[socket.id]; });
    });
});

server.listen(process.env.PORT || 3000);
