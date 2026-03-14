const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer();
const io = new Server(server, { cors: { origin: "*" } });

// Objeto para guardar o estado de cada sala separadamente
let rooms = {};

io.on('connection', (socket) => {
    socket.on('joinRoom', (roomID) => {
        socket.join(roomID);
        
        if (!rooms[roomID]) {
            rooms[roomID] = {
                players: {},
                board: Array(9).fill(""),
                currentTurn: 'X',
                active: true
            };
        }

        const room = rooms[roomID];
        const occupied = Object.values(room.players);

        // Atribui X ou O dentro daquela sala específica
        if (!occupied.includes('X')) room.players[socket.id] = 'X';
        else if (!occupied.includes('O')) room.players[socket.id] = 'O';
        else room.players[socket.id] = null;

        socket.emit('playerAssignment', room.players[socket.id]);
        
        // Avisa a sala sobre o estado atual (caso alguém entre no meio)
        io.to(roomID).emit('updateBoard', { board: room.board, turn: room.currentTurn });
    });

    socket.on('makeMove', (data) => {
        const { roomID, index, symbol } = data;
        const room = rooms[roomID];

        if (room && room.active && symbol === room.currentTurn && room.board[index] === "" && room.players[socket.id] === symbol) {
            room.board[index] = symbol;
            
            const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
            let winner = null;
            for (let p of wins) {
                if (room.board[p[0]] && room.board[p[0]] === room.board[p[1]] && room.board[p[0]] === room.board[p[2]]) {
                    winner = room.board[p[0]];
                }
            }

            io.to(roomID).emit('moveMade', { index, symbol, nextTurn: symbol === 'X' ? 'O' : 'X' });

            if (winner || !room.board.includes("")) {
                room.active = false;
                io.to(roomID).emit('gameOver', winner || "draw");
            } else {
                room.currentTurn = symbol === 'X' ? 'O' : 'X';
            }
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
        socket.rooms.forEach(roomID => {
            if (rooms[roomID]) delete rooms[roomID].players[socket.id];
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT);
