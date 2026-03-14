const socket = io('https://jogo-da-velha-multiplayer.onrender.com'); 

let roomID = '';
let mySymbol = null;
let currentTurn = 'X';
let active = true;

const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const scoreXText = document.getElementById('scoreX');
const scoreOText = document.getElementById('scoreO');

function joinRoom() {
    const input = document.getElementById('roomInput');
    let digits = input.value.replace(/[^0-9]/g, '');
    if (digits.length === 0) return alert("Digite o PIN!");

    roomID = digits.padStart(4, '0');
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('gameArea').style.display = 'flex';
    document.getElementById('roomDisplay').innerText = roomID;
    socket.emit('joinRoom', roomID);
}

socket.on('playerAssignment', (symbol) => {
    mySymbol = symbol;
    updateStatus();
});

socket.on('updateScore', (scores) => {
    scoreXText.innerText = scores.X;
    scoreOText.innerText = scores.O;
});

function updateStatus() {
    if (!active) return;
    if (!mySymbol) {
        statusText.innerText = "MODO OBSERVADOR";
    } else {
        const isMyTurn = (mySymbol === currentTurn);
        statusText.innerText = isMyTurn ? `SUA VEZ (${mySymbol})` : `VEZ DO OPONENTE...`;
        statusText.style.color = isMyTurn ? "#22c55e" : "#f1c40f";
    }
}

cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const idx = cell.getAttribute('data-index');
        if (active && mySymbol === currentTurn && cell.innerText === "") {
            socket.emit('makeMove', { roomID, index: idx, symbol: mySymbol });
        }
    });
});

socket.on('moveMade', (data) => {
    const cell = cells[data.index];
    cell.innerText = data.symbol;
    cell.style.color = data.symbol === 'X' ? '#ef4444' : '#3b82f6';
    currentTurn = data.nextTurn;
    updateStatus();
});

socket.on('gameOver', (data) => {
    active = false;
    scoreXText.innerText = data.scores.X;
    scoreOText.innerText = data.scores.O;
    if (data.winner === "draw") {
        statusText.innerText = "EMPATE!";
        statusText.style.color = "#94a3b8";
    } else {
        statusText.innerText = `VITÓRIA DO ${data.winner}!`;
        statusText.style.color = data.winner === 'X' ? '#ef4444' : '#3b82f6';
    }
});

socket.on('restartGame', (scores) => {
    cells.forEach(c => { c.innerText = ""; c.style.color = "white"; });
    if(scores) {
        scoreXText.innerText = scores.X;
        scoreOText.innerText = scores.O;
    }
    currentTurn = 'X';
    active = true;
    updateStatus();
});

document.getElementById('resetBtn').addEventListener('click', () => socket.emit('requestRestart', roomID));
