// Conecta ao seu servidor que está online
const socket = io('https://jogo-da-velha-multiplayer.onrender.com'); 

const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
let playerSymbol = ''; 

// Quando o servidor conecta
socket.on('connect', () => {
    console.log('Conectado ao servidor!');
});

// O servidor diz se você é X ou O
socket.on('playerAssignment', (symbol) => {
    playerSymbol = symbol;
    statusText.innerText = `Você é o jogador: ${playerSymbol}`;
    statusText.style.color = "#00ff00"; // Fica verde quando conecta
});

// Lógica de clicar
cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const index = cell.getAttribute('data-index');
        if (cell.innerText === '' && playerSymbol !== '') {
            socket.emit('makeMove', { index, symbol: playerSymbol });
        }
    });
});

// Quando alguém joga
socket.on('moveMade', (data) => {
    cells[data.index].innerText = data.symbol;
    cells[data.index].style.color = data.symbol === 'X' ? '#ff4757' : '#2e96ff';
});
