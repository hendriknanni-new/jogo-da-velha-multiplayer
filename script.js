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
    if (digits.length === 0) return;
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
        if (data.line) drawWinLine(data.line, data.winner);
    }
});

function drawWinLine(indices, winner) {
    const svg = document.getElementById('winLineSvg');
    const line = document.getElementById('winLine');
    const board = document.getElementById('board');
    const startCell = cells[indices[0]];
    const endCell = cells[indices[2]];

    const startRect = startCell.getBoundingClientRect();
    const endRect = endCell.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();

    const x1 = (startRect.left + startRect.width / 2) - boardRect.left;
    const y1 = (startRect.top + startRect.height / 2) - boardRect.top;
    const x2 = (endRect.left + endRect.width / 2) - boardRect.left;
    const y2 = (endRect.top + endRect.height / 2) - boardRect.top;

    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    
    line.className.baseVal = winner === 'X' ? 'line-x' : 'line-o';
    svg.style.display = 'block';
}

socket.on('restartGame', (scores) => {
    cells.forEach(c => { c.innerText = ""; });
    document.getElementById('winLineSvg').style.display = 'none';
    if(scores) { scoreXText.innerText = scores.X; scoreOText.innerText = scores.O; }
    currentTurn = 'X';
    active = true;
    updateStatus();
});

document.getElementById('resetBtn').addEventListener('click', () => socket.emit('requestRestart', roomID));
