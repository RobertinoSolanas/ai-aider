// Game Board
const COLS = 10, ROWS = 20;
const BLOCK_SIZE = 30;
let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));

// Tetrominoes (shapes and colors)
const SHAPES = [
    { shape: [[1, 1, 1, 1]], color: '#00FFFF' },    // I (cyan)
    { shape: [[1, 1], [1, 1]], color: '#FFFF00' },  // O (yellow)
    { shape: [[1, 1, 1], [0, 1, 0]], color: '#800080' }, // T (purple)
    { shape: [[1, 1, 1], [1, 0, 0]], color: '#FFA500' }, // L (orange)
    { shape: [[1, 1, 1], [0, 0, 1]], color: '#0000FF' }, // J (blue)
    { shape: [[0, 1, 1], [1, 1, 0]], color: '#FF0000' }, // S (red)
    { shape: [[1, 1, 0], [0, 1, 1]], color: '#00FF00' }  // Z (green)
];

// Game state
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let gameOver = false;

// Canvas setup
const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

function newPiece() {
    if (!nextPiece) {
        const randomIndex = Math.floor(Math.random() * SHAPES.length);
        nextPiece = {
            shape: SHAPES[randomIndex].shape,
            color: SHAPES[randomIndex].color,
            x: Math.floor(COLS / 2) - 1,
            y: 0
        };
    }
    
    currentPiece = nextPiece;
    const randomIndex = Math.floor(Math.random() * SHAPES.length);
    nextPiece = {
        shape: SHAPES[randomIndex].shape,
        color: SHAPES[randomIndex].color,
        x: Math.floor(COLS / 2) - 1,
        y: 0
    };
    drawNextPiece();
    
    // Game over if collision immediately
    if (collide()) {
        gameOver = true;
        alert('Game Over! Score: ' + score);
        resetGame();
    }
}

function draw() {
    // Clear board
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, COLS, ROWS);

    // Draw board
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = value;
                ctx.fillRect(x, y, 1, 1);
            }
        });
    });

    // Draw current piece
    if (currentPiece) {
        drawPiece(currentPiece);
    }
}

function drawPiece(piece) {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const posX = piece.x + x;
                const posY = piece.y + y;
                
                // Main block
                const gradient = ctx.createLinearGradient(posX, posY, posX + 1, posY + 1);
                gradient.addColorStop(0, piece.color);
                gradient.addColorStop(1, darkenColor(piece.color, 20));
                
                ctx.fillStyle = gradient;
                ctx.fillRect(posX, posY, 1, 1);
                
                // Highlight
                ctx.fillStyle = lightenColor(piece.color, 30);
                ctx.fillRect(posX + 0.1, posY + 0.1, 0.8, 0.2);
                
                // Border
                ctx.strokeStyle = darkenColor(piece.color, 30);
                ctx.lineWidth = 0.05;
                ctx.strokeRect(posX, posY, 1, 1);
            }
        });
    });
}

function lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return `#${(
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1)}`;
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return `#${(
        0x1000000 +
        (R > 0 ? (R < 255 ? R : 255) : 0) * 0x10000 +
        (G > 0 ? (G < 255 ? G : 255) : 0) * 0x100 +
        (B > 0 ? (B < 255 ? B : 255) : 0)
    ).toString(16).slice(1)}`;
}

function drawNextPiece() {
    const nextCtx = document.getElementById('next-piece').getContext('2d');
    nextCtx.fillStyle = '#111';
    nextCtx.fillRect(0, 0, 100, 100);
    nextCtx.scale(20, 20);
    
    if (nextPiece) {
        nextCtx.fillStyle = nextPiece.color;
        nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    nextCtx.fillRect(x + 1, y + 1, 1, 1);
                }
            });
        });
    }
}

function collide() {
    return currentPiece.shape.some((row, y) => {
        return row.some((value, x) => {
            return (
                value !== 0 &&
                (board[currentPiece.y + y] === undefined ||
                board[currentPiece.y + y][currentPiece.x + x] === undefined ||
                board[currentPiece.y + y][currentPiece.x + x] !== 0)
            );
        });
    });
}

// Game loop
let lastTime = 0;
let dropInterval = 1000; // ms
let dropCounter = 0;

function update(time = 0) {
    if (gameOver) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        moveDown();
        dropCounter = 0;
    }
    
    draw();
    requestAnimationFrame(update);
}

function moveDown() {
    currentPiece.y++;
    if (collide()) {
        currentPiece.y--;
        mergePiece();
        clearLines();
        newPiece();
    }
}

function rotate() {
    const originalShape = currentPiece.shape;
    // Transpose matrix
    currentPiece.shape = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i])
    );
    // Reverse each row to get a 90deg rotation
    currentPiece.shape.forEach(row => row.reverse());
    
    if (collide()) {
        currentPiece.shape = originalShape; // Revert if collision
    }
}

function mergePiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[currentPiece.y + y][currentPiece.x + x] = currentPiece.color;
            }
        });
    });
}

function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++; // Check same row again
        }
    }
    
    // Update score
    if (linesCleared > 0) {
        score += [0, 40, 100, 300, 1200][linesCleared] * level;
        document.getElementById('score').textContent = score;
        
        // Increase level every 10 lines
        const newLevel = Math.floor(score / 1000) + 1;
        if (newLevel > level) {
            level = newLevel;
            document.getElementById('level').textContent = level;
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        }
    }
}

function resetGame() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    score = 0;
    level = 1;
    gameOver = false;
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    newPiece();
}

// Controls
document.addEventListener('keydown', (e) => {
    if (gameOver) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            currentPiece.x--;
            if (collide()) currentPiece.x++;
            break;
        case 'ArrowRight':
            currentPiece.x++;
            if (collide()) currentPiece.x--;
            break;
        case 'ArrowDown':
            moveDown();
            break;
        case 'ArrowUp':
            rotate();
            break;
        case ' ':
            // Hard drop
            while (!collide()) {
                currentPiece.y++;
            }
            currentPiece.y--;
            mergePiece();
            clearLines();
            newPiece();
            break;
    }
});

// Start game
resetGame();
update();
