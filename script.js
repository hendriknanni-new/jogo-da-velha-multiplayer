// Conecta ao seu servidor que acabou de ficar online
const socket = io('https://jogo-da-velha-multiplayer.onrender.com'); 

const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
let playerSymbol = ''; 

socket.on('playerAssignment', (symbol) => {
    playerSymbol = symbol;
    statusText.innerText = `Você é o jogador: ${playerSymbol}`;
});

cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const index = cell.getAttribute('data-index');
        if (cell.innerText === '') {
            socket.emit('makeMove', { index, symbol: playerSymbol });
        }
    });
});

socket.on('moveMade', (data) => {
    cells[data.index].innerText = data.symbol;
    cells[data.index].style.color = data.symbol === 'X' ? '#ff4757' : '#2e96ff';
});
