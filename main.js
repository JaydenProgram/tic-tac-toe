let board;
let winner;
let restartButton;
let gameChooser;
let box;
let player_1_turn = true; // Start with Player 1
let player_1_class = 'x';
let player_2_class = 'circle';
let boardState;

let normalboard = 360;
let crazyBoard = 720;

let depthSlider;
let depthValue;

let gameType = "normal";

const WINNING_COMBINATIONS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

const CRAZY_WINNING_COMBINATIONS = [
    // Horizontal rows
    [0, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16, 17],
    [18, 19, 20, 21, 22, 23],
    [24, 25, 26, 27, 28, 29],
    [30, 31, 32, 33, 34, 35],
    // Vertical columns
    [0, 6, 12, 18, 24, 30],
    [1, 7, 13, 19, 25, 31],
    [2, 8, 14, 20, 26, 32],
    [3, 9, 15, 21, 27, 33],
    [4, 10, 16, 22, 28, 34],
    [5, 11, 17, 23, 29, 35],
    // Diagonal from top-left to bottom-right
    [0, 7, 14, 21, 28, 35],
    // Diagonal from top-right to bottom-left
    [5, 10, 15, 20, 25, 30],
];

window.onload = function () {
    setGame();
}

function setGame() {
    board = document.getElementById("board");
    winner = document.getElementById("winner");
    restartButton = document.getElementById("restart");
    gameChooser = document.getElementById("game-chooser");
    depthSlider = document.getElementById("depth-slider");
    depthValue = document.getElementById("depth-value");

    board.innerHTML = ""; // Clear previous board

    // Set up board based on game type
    //normal games = 3x3 = 9
    if (gameType !== "crazy" && gameType !== "crazy-bot") {
        board.style.width = normalboard + "px";
        board.style.height = normalboard + "px";
        board.style.backgroundImage = "url('tic-tac-to-bg.png')";
        for (let i = 0; i < 9; i++) {
            box = document.createElement("div");
            box.id = i.toString();
            board.appendChild(box);
            box.addEventListener("click", clickEvent);
        }
        boardState = Array(9).fill(null); // Normal board
        //crazy games = 6x6 = 36
    } else {
        board.style.width = crazyBoard + "px";
        board.style.height = crazyBoard + "px";
        board.style.backgroundImage = "url('crazy-board.png')";
        for (let i = 0; i < 36; i++) {
            box = document.createElement("div");
            box.id = i.toString();
            board.appendChild(box);
            box.addEventListener("click", clickEvent);
        }
        boardState = Array(36).fill(null); // Crazy board
    }

    depthSlider.addEventListener("input", function () {
        depthValue.innerText = depthSlider.value; // Update displayed depth value
    });

    restartButton.addEventListener("click", restartGame);
    gameChooser.addEventListener("change", changeGame);
}

function changeGame() {
    gameType = gameChooser.value; // Directly assign the selected value
    console.log(gameType);
    setGame(); // Reinitialize the game
    restartGame(); // Reset the game state
}

function swapTurns() {
    player_1_turn = !player_1_turn; // Toggle turns
}

//checks if all boxes arent null(empty)
function checkTie() {
    return boardState.every(box => box !== null); // Check if all boxes are filled
}

//ai player using minimax

function aiPlayer() {
    if ((gameType === "bot" || gameType === "crazy-bot") && !player_1_turn) {
        console.log("AI's turn");
        const maxDepth = parseInt(depthSlider.value); // Get depth from slider
        let bestMove = -1;
        let bestScore = -Infinity;

        // Find the best move for AI
        for (let i = 0; i < boardState.length; i++) {
            if (boardState[i] === null) {
                boardState[i] = player_2_class; // AI's move
                let score = minimax(boardState, 0, false, maxDepth); // Call minimax
                boardState[i] = null; // Undo the move

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }

        if (bestMove >= 0) {
            let boxToFill = document.getElementById(bestMove.toString());
            if (boxToFill) {
                const img = document.createElement("img");
                img.src = "circle.png"; // AI's image
                boxToFill.appendChild(img);
                boxToFill.classList.add(player_2_class);
                boardState[bestMove] = player_2_class; // Update board state

                // Check for win or tie after AI's move
                if (checkCombination(player_2_class)) {
                    winner.innerText = "Player 2 wins!";
                    return; // Exit to prevent further moves
                } else if (checkTie()) {
                    winner.innerText = "It's a tie!";
                    return; // Exit to prevent further moves
                }
                swapTurns(); // Only swap if the game isn't over
            }
        }
    }
}

function heuristicEvaluation(boardState) {
    let score = 0;

    // Evaluate horizontal, vertical, and diagonal lines
    for (const combination of CRAZY_WINNING_COMBINATIONS) {
        const [aiCount, playerCount] = combination.reduce(([ai, player], index) => {
            if (boardState[index] === player_2_class) ai++;
            else if (boardState[index] === player_1_class) player++;
            return [ai, player];
        }, [0, 0]);

        // Adjust score based on counts
        if (aiCount === 5) score += 100; // AI can win in the next move
        else if (aiCount === 4) score += 10; // AI is close to winning
        else if (playerCount === 5) score -= 100; // Opponent can win in the next move
        else if (playerCount === 4) score -= 10; // Opponent is close to winning
    }

    return score; // Return the calculated score
}

function minimax(boardState, depth, isMaximizing, maxDepth) {

    const currentClass = isMaximizing ? player_2_class : player_1_class;

    if (depth >= maxDepth) {
        return heuristicEvaluation(boardState); // Use heuristic evaluation instead
    }

    // Base cases for the recursive function
    if (checkCombination(currentClass)) {
        return isMaximizing ? 100 - depth : depth - 100;
    } else if (checkTie()) {
        return 0; // Tie
    }

    let bestScore = isMaximizing ? -Infinity : Infinity;

    // Loop through available moves
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === null) {
            boardState[i] = currentClass; // Make the move
            let score = minimax(boardState, depth + 1, !isMaximizing, maxDepth); // Recursive call
            boardState[i] = null; // Undo the move

            if (isMaximizing) {
                bestScore = Math.max(score, bestScore);
            } else {
                bestScore = Math.min(score, bestScore);
            }
        }
    }
    return bestScore;
}

function checkCombination(className) {
    const combinations = (gameType === "crazy" || gameType === "crazy-bot") ? CRAZY_WINNING_COMBINATIONS : WINNING_COMBINATIONS;

    return combinations.some(combination => {
        return combination.every(index => {
            return boardState[index] === className;
        });
    });
}

function restartGame() {
    const boxCount = (gameType === "crazy" || gameType === "crazy-bot") ? 36 : 9;
    boardState = Array(boxCount).fill(null); // Reset the board state
    winner.innerText = "Who will win!"; // Reset winner text

    const boxes = board.querySelectorAll("div");
    boxes.forEach(box => {
        box.innerHTML = ""; // Clear each box
        box.classList.remove(player_1_class, player_2_class); // Remove player classes
    });

    player_1_turn = true; // Start with Player 1 again
}

function clickEvent() {
    box = this;
    let currentClass = player_1_turn ? player_1_class : player_2_class;

    if (!boardState[box.id]) { // Check if the box is empty
        const img = document.createElement("img");
        img.src = player_1_turn ? "cross.png" : "circle.png"; // Select correct image
        box.appendChild(img);
        box.classList.add(currentClass);
        boardState[box.id] = currentClass; // Update board state

        if (checkCombination(currentClass)) {
            winner.innerText = `${currentClass === player_1_class ? "Player 1" : "Player 2"} wins!`;
        } else if (checkTie()) {
            winner.innerText = `It's a tie!`;
        } else {
            swapTurns(); // Toggle turns after player move
            aiPlayer(); // Call AI after player's turn
        }
    }
}
