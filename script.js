const socket = io('https://jogo-da-velha-multiplayer.onrender.com'); 

const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
let playerSymbol = ''; 
let boardState = ["", "", "", "", "", "", "", "", ""]; // Guarda o estado do jogo
let gameActive = true;

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontais
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Verticais
    [0, 4, 8], [2, 4, 6]             // Diagonais
];

socket.on('playerAssignment', (symbol) => {
    playerSymbol = symbol;
    statusText.innerText = `Você é o jogador: ${playerSymbol}`;
});

cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const index = cell.getAttribute('data-index');
        
        // Só joga se o quadrado estiver vazio e o jogo não acabou
        if (boardState[index] === "" && gameActive && playerSymbol !== '') {
            socket.emit('makeMove', { index, symbol: playerSymbol });
        }
    });
});

socket.on('moveMade', (data) => {
    const { index, symbol } = data;
    boardState[index] = symbol;
    cells[index].innerText = symbol;
    cells[index].style.color = symbol === 'X' ? '#ff4757' : '#2e96ff';
    
    checkResult();
});

function checkResult() {
    let roundWon = false;

    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        statusText.innerText = "Fim de jogo! Alguém venceu!";
        statusText.style.color = "yellow";
        gameActive = false;
        return;
    }

    if (!boardState.includes("")) {
        statusText.innerText = "Empate!";
        gameActive = false;
    }
}

// Escuta o comando de reiniciar que vamos criar
socket.on('restartGame', () => {
    boardState = ["", "", "", "", "", "", "", "", ""];
    gameActive = true;
    cells.forEach(cell => cell.innerText = "");
    statusText.innerText = `Você é o jogador: ${playerSymbol}`;
    statusText.style.color = "#00ff00";
});
// Adicione isso na última linha do seu script.js
document.getElementById('resetBtn').addEventListener('click', () => {
    socket.emit('requestRestart');
});
