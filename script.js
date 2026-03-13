// Conecta com o servidor (Vou te ensinar a criar esse servidor no próximo passo)
const socket = io('https://seu-servidor-aqui.onrender.com'); 

const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
let playerSymbol = ''; // Define se você é X ou O

// O servidor avisa qual símbolo você é (o primeiro que entra é X)
socket.on('playerAssignment', (symbol) => {
    playerSymbol = symbol;
    statusText.innerText = `Você é o jogador: ${playerSymbol}`;
});

// Quando você clica em um quadradinho
cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const index = cell.getAttribute('data-index');
        
        // Só envia se o quadrado estiver vazio
        if (cell.innerText === '') {
            socket.emit('makeMove', { index, symbol: playerSymbol });
        }
    });
});

// Quando o servidor avisa que ALGUÉM jogou
socket.on('moveMade', (data) => {
    cells[data.index].innerText = data.symbol;
    // Muda a cor dependendo de quem jogou
    cells[data.index].style.color = data.symbol === 'X' ? '#ff4757' : '#2e96ff';
});
