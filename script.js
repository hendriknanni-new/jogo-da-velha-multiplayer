const socket = io('https://jogo-da-velha-multiplayer.onrender.com'); 

const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
let playerSymbol = ''; 
let boardState = ["", "", "", "", "", "", "", "", ""];
let gameActive = true;
let currentTurn = 'X'; // O jogo sempre começa pelo X

socket.on('playerAssignment', (symbol) => {
    playerSymbol = symbol;
    updateStatus();
});

function updateStatus() {
    if (!gameActive) return;
    if (currentTurn === playerSymbol) {
        statusText.innerText = `Sua vez (${playerSymbol})`;
        statusText.style.color = "#00ff00";
    } else {
        statusText.innerText = `Vez do oponente (${currentTurn})`;
        statusText.style.color = "#ffae00";
    }
}

cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const index = cell.getAttribute('data-index');
        
        // REGRA DE OURO: 
        // 1. O quadrado tem que estar vazio
        // 2. O jogo tem que estar ativo
        // 3. Tem que ser a sua vez de jogar!
        if (boardState[index] === "" && gameActive && currentTurn === playerSymbol) {
            socket.emit('makeMove', { index, symbol: playerSymbol });
        }
    });
});

socket.on('moveMade', (data) => {
    const { index, symbol } = data;
    boardState[index] = symbol;
    cells[index].innerText = symbol;
    cells[index].style.color = symbol === 'X' ? '#ff4757' : '#2e96ff';
    
    // Troca o turno: se era X, vira O. Se era O, vira X.
    currentTurn = (currentTurn === 'X') ? 'O' : 'X';
    
    if (!checkWinner()) {
        updateStatus();
    }
});

function checkWinner() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], 
        [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]
    ];

    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
            statusText.innerText = `O jogador ${boardState[a]} VENCEU!`;
            statusText.style.color = "#fff";
            gameActive = false;
            return true;
        }
    }

    if (!boardState.includes("")) {
        statusText.innerText = "Empate!";
        gameActive = false;
        return true;
    }
    return false;
}

// Botão reiniciar
document.getElementById('resetBtn').addEventListener('click', () => {
    socket.emit('requestRestart');
});

socket.on('restartGame', () => {
    boardState = ["", "", "", "", "", "", "", "", ""];
    gameActive = true;
    currentTurn = 'X';
    cells.forEach(cell => {
        cell.innerText = "";
    });
    updateStatus();
});
