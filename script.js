const socket = io('https://jogo-da-velha-multiplayer.onrender.com'); 

// Pega o ID da sala pela URL. Ex: site.com/?sala=123. Se não tiver, vira 'geral'
const urlParams = new URLSearchParams(window.location.search);
const roomID = urlParams.get('sala') || 'geral';

const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
let mySymbol = null;
let currentTurn = 'X';
let active = true;

// Entra na sala assim que conecta
socket.emit('joinRoom', roomID);

socket.on('playerAssignment', (symbol) => {
    mySymbol = symbol;
    updateStatus();
});

function updateStatus() {
    if (!active) return;
    if (!mySymbol) {
        statusText.innerText = `Observando Sala: ${roomID}`;
    } else {
        statusText.innerText = (mySymbol === currentTurn) ? `SUA VEZ (${mySymbol})` : `Vez do oponente (${currentTurn})`;
        statusText.style.color = (mySymbol === currentTurn) ? "#2ecc71" : "#f1c40f";
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
    cells[data.index].innerText = data.symbol;
    cells[data.index].style.color = data.symbol === 'X' ? '#ff4757' : '#2e96ff';
    currentTurn = data.nextTurn;
    updateStatus();
});

socket.on('gameOver', (result) => {
    active = false;
    statusText.innerText = result === "draw" ? "EMPATE!" : `VITÓRIA DO ${result}!`;
    statusText.style.color = "#fff";
});

socket.on('restartGame', () => {
    cells.forEach(c => c.innerText = "");
    currentTurn = 'X';
    active = true;
    updateStatus();
});

document.getElementById('resetBtn').addEventListener('click', () => socket.emit('requestRestart', roomID));
