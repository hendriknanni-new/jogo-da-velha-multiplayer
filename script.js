const socket = io('https://jogo-da-velha-multiplayer.onrender.com'); 

const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
let mySymbol = null;
let currentTurn = 'X';
let active = true;

socket.on('playerAssignment', (symbol) => {
    mySymbol = symbol;
    updateStatus();
});

function updateStatus() {
    if (!active) return;
    if (!mySymbol) {
        statusText.innerText = "Observando...";
    } else {
        statusText.innerText = (mySymbol === currentTurn) ? `SUA VEZ (${mySymbol})` : `Vez do oponente (${currentTurn})`;
        statusText.style.color = (mySymbol === currentTurn) ? "#2ecc71" : "#f1c40f";
    }
}

cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const idx = cell.getAttribute('data-index');
        if (active && mySymbol === currentTurn && cell.innerText === "") {
            socket.emit('makeMove', { index: idx, symbol: mySymbol });
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
    if (result === "draw") {
        statusText.innerText = "EMPATE!";
    } else {
        statusText.innerText = `VITÓRIA DO ${result}!`;
    }
    statusText.style.color = "#ffffff";
});

socket.on('restartGame', () => {
    cells.forEach(c => c.innerText = "");
    currentTurn = 'X';
    active = true;
    updateStatus();
});

document.getElementById('resetBtn').addEventListener('click', () => socket.emit('requestRestart'));
