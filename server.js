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
            rooms[id] = { 
                players: {}, board: Array(9).fill(""), 
                currentTurn: 'X', active: true,
                scores: { X: 0, O: 0 } // Placar inicial
            };
        }
        const room = rooms[id];
        const symbols = Object.values(room.players);
        if (!symbols.includes('X')) room.players[socket.id] = 'X';
        else if (!symbols.includes('O')) room.players[socket.id] = 'O';
        
        socket.emit('playerAssignment', room.players[socket.id]);
        // Envia o placar atual assim que alguém entra
        io.to(id).emit('updateScore', room.scores);
    });

    socket.on('makeMove', (data) => {
        const room = rooms[data.roomID];
        if (room && room.active && data.symbol === room.currentTurn && room.board[data.index] === "") {
            room.board[data.index] = data.symbol;
            const result = checkWinner(room.board);
            
            io.to(data.roomID).emit('moveMade', { 
                index: data.index, symbol: data.symbol, 
                nextTurn: data.symbol === 'X' ? 'O' : 'X' 
            });

            if (result) {
                room.active = false;
                if (result !== "draw") {
                    room.scores[result]++; // Soma ponto para o vencedor
                }
                io.to(data.roomID).emit('gameOver', { winner: result, scores: room.scores });
            } else {
                room.currentTurn = data.symbol === 'X' ? 'O' : 'X';
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
        socket.rooms.forEach(r => { if(rooms[r]) delete rooms[r].players[socket.id]; });
    });
});

server.listen(process.env.PORT || 3000);
