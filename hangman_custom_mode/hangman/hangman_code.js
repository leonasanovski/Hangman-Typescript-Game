"use strict";
// INITIALIZATION
const FINAL_STAGE = 6; //the number of mistakes allowed until loosing
let currentWord = ""; // the word to guess
let guessedLetters = []; // letters guessed so far
let MISSES = 0; // count wrong guesses
//this function returns random triple
async function randomTriple() {
    const triples = await loadWordTriples();
    let random_triple_index = Math.floor(Math.random() * triples.length);
    return triples[random_triple_index];
}
//this function disables the buttons when win/loose
function disableAllButtons() {
    const container = document.getElementById("letter-buttons");
    if (!container)
        return;
    const buttons = container.querySelectorAll("button");
    buttons.forEach(btn => btn.setAttribute("disabled", "true"));
}
//this function for getting the 2D context
function getCanvasContext() {
    const canvas = document.getElementById("hangman-canvas");
    if (!canvas) {
        console.error("There is no canvas context. Please make a <canvas> tag with the proper id given!");
        return null;
    }
    return canvas.getContext("2d");
}
//this function maps json -> triples (JsonToTripleObj)
async function loadWordTriples() {
    const response = await fetch("association_words.json");
    if (!response.ok) {
        throw new Error("Failed to load JSON");
    }
    return await response.json();
}
//this function draws the lines for the words ____ ____ ____
function drawWordLinesOnCanvas(ctx, word, guesses) {
    const startX = 100;
    const baseY = 450;
    const letterSpacing = 50;
    const lineWidth = 30;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#001e9a";
    ctx.font = "28px Arial";
    ctx.fillStyle = "#000";
    for (let i = 0; i < word.length; i++) {
        const charX = startX + i * letterSpacing;
        const char = word[i];
        if (char === " ") {
            continue; //leave space if there is noun contained of 2 words
        }
        //draw the underline
        ctx.beginPath();
        ctx.moveTo(charX, baseY);
        ctx.lineTo(charX + lineWidth, baseY);
        ctx.stroke();
        //draw the letter if guessed
        if (guesses.includes(char.toUpperCase())) {
            ctx.fillText(char.toUpperCase(), charX + 5, baseY - 10);
        }
    }
}
//this function draws the buttons under canvas that can be clicked for entering some alphanumeric characters
function createAlphabetButtons(word, onCorrect, onWrong) {
    const container = document.getElementById("letter-buttons");
    if (!container)
        return;
    container.innerHTML = "";
    for (let i = 65; i <= 90; i++) {
        const letter = String.fromCharCode(i);
        const button = document.createElement("button");
        button.className = "btn btn-outline-warning text-dark fw-bolder py-2 px-2 border border-dark border-sm";
        button.textContent = letter;
        button.style.margin = "4px";
        button.onclick = () => {
            button.disabled = true;
            const upperWord = word.toUpperCase();
            if (upperWord.includes(letter)) {
                guessedLetters.push(letter);
                onCorrect();
            }
            else {
                MISSES++;
                onWrong();
            }
        };
        container.appendChild(button);
    }
}
//this function is drawing the hangman
function drawHangman(stage, random_guessing_object) {
    //here we draw the canvas first
    const canvas_context = getCanvasContext();
    const canvas = document.getElementById("hangman-canvas");
    const canvas_width = canvas.width;
    const canvas_height = canvas.height;
    //retrieving info for image and setting its sizes
    const image_path = random_guessing_object.image_hint;
    const imgWidth = canvas_width * 0.25;
    const imgHeight = canvas_height * 0.35;
    const img = new Image();
    if (!canvas_context)
        return;
    //draw the hanger
    const shift_x = 50;
    canvas_context.clearRect(0, 0, canvas_width, canvas_height);
    canvas_context.lineWidth = 3;
    canvas_context.strokeStyle = "#000";
    canvas_context.beginPath();
    canvas_context.moveTo(50 + shift_x, 280);
    canvas_context.lineTo(230 + shift_x, 280);
    canvas_context.moveTo(100 + shift_x, 280);
    canvas_context.lineTo(100 + shift_x, 50);
    canvas_context.lineTo(200 + shift_x, 50);
    canvas_context.lineTo(200 + shift_x, 80);
    canvas_context.stroke();
    //drawing the hangman
    if (stage >= 1) {
        // Head
        canvas_context.beginPath();
        canvas_context.arc(200 + shift_x, 100, 20, 0, Math.PI * 2);
        canvas_context.stroke();
    }
    if (stage >= 2) {
        // Body
        canvas_context.moveTo(200 + shift_x, 120);
        canvas_context.lineTo(200 + shift_x, 180);
        canvas_context.stroke();
    }
    if (stage >= 3) {
        // Left arm
        canvas_context.moveTo(200 + shift_x, 140);
        canvas_context.lineTo(170 + shift_x, 160);
        canvas_context.stroke();
    }
    if (stage >= 4) {
        // Right arm
        canvas_context.moveTo(200 + shift_x, 140);
        canvas_context.lineTo(230 + shift_x, 160);
        canvas_context.stroke();
        const additional_hint = random_guessing_object.hint;
        canvas_context.font = "bold 30px Arial";
        canvas_context.fillStyle = "#ff0000";
        canvas_context.fillText("Additional Hint:", canvas_width - imgWidth - 30, 275);
        canvas_context.font = "italic 27px Arial";
        canvas_context.fillStyle = "#000000";
        canvas_context.fillText(`'${additional_hint}'`, canvas_width - imgWidth - 30, 300);
    }
    if (stage >= 5) {
        // Left leg
        canvas_context.moveTo(200 + shift_x, 180);
        canvas_context.lineTo(180 + shift_x, 220);
        canvas_context.stroke();
    }
    if (stage >= 6) {
        // Right leg
        canvas_context.moveTo(200 + shift_x, 180);
        canvas_context.lineTo(220 + shift_x, 220);
        canvas_context.stroke();
    }
    //draw image hint
    img.onload = () => {
        const x = canvas_width - imgWidth - 30;
        const y = 60;
        canvas_context.font = "bold 25px Arial";
        canvas_context.fillText("Image Hint", canvas_width - imgWidth + 30, 45);
        canvas_context.drawImage(img, x, y, imgWidth, imgHeight);
    };
    img.src = image_path;
    drawWordLinesOnCanvas(canvas_context, random_guessing_object.label.toUpperCase(), guessedLetters);
}
//main function for game starting
async function startGame() {
    try {
        const random_item = await randomTriple();
        currentWord = random_item.label.toUpperCase();
        guessedLetters = [];
        MISSES = 0;
        const update = () => {
            drawHangman(MISSES, random_item);
            const allGuessed = currentWord
                .replace(" ", "")
                .split("")
                .every(c => guessedLetters.includes(c));
            if (allGuessed) {
                alert("You guessed the word! CONGRATULATIONS!");
                disableAllButtons();
            }
            else if (MISSES >= FINAL_STAGE) {
                disableAllButtons();
                alert(`Game Over! Word was: ${currentWord.toUpperCase()}`);
            }
        };
        createAlphabetButtons(currentWord, update, update);
        update();
    }
    catch (error) {
        console.error("Error starting game:", error);
    }
}
//main part
function main_run_game() {
    window.addEventListener("DOMContentLoaded", startGame);
    window.addEventListener("keydown", (event) => {
        if (event.key === "Tab") {
            event.preventDefault();
            startGame();
        }
    });
    const info_btn = document.getElementById("info_btn");
    const info_div = document.getElementById("info_div");
    info_btn.addEventListener("click", (event) => {
        alert("You need to guess the right word, that firstly is associated with the image, but later on, after several misses there is a bonus hint shown.\nIf you want to restart, click TAB key.\nENJOY!");
    });
    info_btn.addEventListener("mouseout", (event) => {
        info_div.style.display = "none";
    });
}
main_run_game();
