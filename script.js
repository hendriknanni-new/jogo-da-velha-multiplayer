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

    if (digits.length === 0) {
        alert("Digite 4 números!");
        return;
    }

    // Padroniza sempre para 4 dígitos (ex: 7 vira 0007)
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
        statusText.innerText = "Observando jogo...";
        statusText.style.color = "#888";
    } else {
        statusText.innerText = (mySymbol === currentTurn) ? `SUA VEZ (${mySymbol})` : `Aguarde oponente...`;
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

document.getElementById('resetBtn').addEventListener('click', () => socket.emit('requestRestart', roomID));
