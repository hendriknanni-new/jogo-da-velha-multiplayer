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
        statusText.innerText = "Sala cheia (Observador)";
        statusText.style.color = "gray";
    } else if (mySymbol === currentTurn) {
        statusText.innerText = `SUA VEZ (${mySymbol})`;
        statusText.style.color = "#2ecc71";
    } else {
        statusText.innerText = `AGUARDE... Vez do ${currentTurn}`;
        statusText.style.color = "#f1c40f";
    }
}

cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const idx = cell.getAttribute('data-index');
        // REGRAS: Tem que ser sua vez, o jogo ativo e a célula vazia
        if (active && mySymbol === currentTurn && cell.innerText === "") {
            socket.emit('makeMove', { index: idx, symbol: mySymbol });
        }
    });
});

socket.on('moveMade', (data) => {
    cells[data.index].innerText = data.symbol;
    cells[data.index].style.color = data.symbol === 'X' ? '#ff4757' : '#2e96ff';
    currentTurn = data.symbol === 'X' ? 'O' : 'X';
    checkWin();
    if (active) updateStatus();
});

function checkWin() {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let p of wins) {
        if (cells[p[0]].innerText && cells[p[0]].innerText === cells[p[1]].innerText && cells[p[0]].innerText === cells[p[2]].innerText) {
            statusText.innerText = `VITÓRIA DO ${cells[p[0]].innerText}!`;
            statusText.style.color = "#fff";
            active = false;
            return;
        }
    }
    if ([...cells].every(c => c.innerText !== "")) {
        statusText.innerText = "EMPATE!";
        active = false;
    }
}

document.getElementById('resetBtn').addEventListener('click', () => {
    socket.emit('requestRestart');
});

socket.on('restartGame', () => {
    cells.forEach(c => c.innerText = "");
    currentTurn = 'X';
    active = true;
    updateStatus();
});
