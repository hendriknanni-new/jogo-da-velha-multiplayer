const socket = io('https://jogo-da-velha-multiplayer.onrender.com'); 

let roomID = '';
let mySymbol = null;
let currentTurn = 'X';
let active = true;

const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');

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

function updateStatus() {
    if (!active) return;
    if (!mySymbol) {
        statusText.innerText = "MODO OBSERVADOR";
        statusText.style.color = "#64748b";
    } else {
        const isMyTurn = (mySymbol === currentTurn);
        statusText.innerText = isMyTurn ? `SUA VEZ (${mySymbol})` : `VEZ DO OPONENTE...`;
        statusText.style.color = isMyTurn ? "#22c55e" : "#f59e0b";
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
    cell.style.textShadow = `0 0 15px ${data.symbol === 'X' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)'}`;
    
    currentTurn = data.nextTurn;
    updateStatus();
});

socket.on('gameOver', (result) => {
    active = false;
    if (result === "draw") {
        statusText.innerText = "EMPATE!";
        statusText.style.color = "#94a3b8";
    } else {
        statusText.innerText = `VITÓRIA DO ${result}!`;
        statusText.style.color = result === 'X' ? '#ef4444' : '#3b82f6';
    }
});

socket.on('restartGame', () => {
    cells.forEach(c => {
        c.innerText = "";
        c.style.textShadow = "none";
    });
    currentTurn = 'X';
    active = true;
    updateStatus();
});

document.getElementById('resetBtn').addEventListener('click', () => socket.emit('requestRestart', roomID));
