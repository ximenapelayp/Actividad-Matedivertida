// GAME STATE
let maxCount = 5;
let currentCount = 0;
let activeAnimalIndex = 0; // 0: Oso, 1: Conejo, 2: Rana
let isMuted = false;
let isProcessing = false;
let audioCtx = null;
let spanishVoice = null;

// Confetti Variables
let confettiActive = false;
let confettiParticles = [];
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');

// DOM ELEMENTS
const menuScreen = document.getElementById('menu-screen');
const gameScreen = document.getElementById('game-screen');
const victoryModal = document.getElementById('victory-modal');
const levelBadge = document.getElementById('level-badge');
const instructionText = document.getElementById('instruction-text');
const currentCountEl = document.getElementById('current-count');
const targetCountEl = document.getElementById('target-count');
const starsContainer = document.getElementById('stars-container');
const foodContainer = document.getElementById('food-container');
const activeAnimalWrapper = document.getElementById('active-animal');

const osoSvg = document.getElementById('oso-svg');
const conejoSvg = document.getElementById('conejo-svg');
const ranaSvg = document.getElementById('rana-svg');

// BUTTONS
const btnHome = document.getElementById('btn-home');
const btnSound = document.getElementById('btn-sound');
const btnRepeatVoice = document.getElementById('btn-repeat-voice');
const btnNextAnimal = document.getElementById('btn-next-animal');
const btnPlayAgain = document.getElementById('btn-play-again');

// ANIMALS DATA
const animals = [
    {
        name: "oso",
        displayName: "el Oso Goloso 🐻",
        foodName: "manzanas",
        foodSingular: "manzana",
        svgEl: osoSvg,
        foodColor: "#FF2A2A",
        victoryMsg: "¡El oso se ha comido todas sus manzanas! ¡Está muy contento y llenito!",
        introMsg: "¡Hola! Soy el oso goloso. ¿Me ayudas a comer manzanas? Por favor, alímentame con ",
        getFoodSvg: () => `
            <svg viewBox="0 0 50 50">
                <!-- Apple shape -->
                <path d="M 25 15 C 18 10 10 16 11 28 C 12 40 22 45 25 43 C 28 45 38 40 39 28 C 40 16 32 10 25 15 Z" fill="#FF3B30" />
                <!-- Apple highlight -->
                <ellipse cx="20" cy="22" rx="4" ry="7" fill="#FFA39E" transform="rotate(-15 20 22)" opacity="0.6"/>
                <!-- Stem -->
                <path d="M 25 15 Q 23 8 18 10" fill="none" stroke="#6D4C41" stroke-width="3" stroke-linecap="round" />
                <!-- Leaf -->
                <path d="M 25 13 Q 32 7 28 4 Q 22 8 25 13 Z" fill="#4CAF50" />
            </svg>`
    },
    {
        name: "conejo",
        displayName: "el Conejo Saltarín 🐰",
        foodName: "zanahorias",
        foodSingular: "zanahoria",
        svgEl: conejoSvg,
        foodColor: "#FF9800",
        victoryMsg: "¡Qué rico! El conejo saltarín se comió todas las zanahorias. ¡Mmm!",
        introMsg: "¡Hola! Soy el conejo saltarín. ¡Tengo mucha hambre! Alímentame con ",
        getFoodSvg: () => `
            <svg viewBox="0 0 50 50">
                <!-- Carrot body -->
                <path d="M 18 12 C 16 8 34 8 32 12 L 27 44 C 26 47 24 47 23 44 Z" fill="#FF9800" />
                <!-- Lines on carrot -->
                <path d="M 21 20 H 26 M 24 28 H 29 M 22 36 H 26" stroke="#E65100" stroke-width="2.5" stroke-linecap="round" />
                <!-- Leaves -->
                <path d="M 23 10 C 23 4 18 2 20 2 C 22 2 25 7 25 10 Z" fill="#4CAF50" />
                <path d="M 25 10 C 25 3 25 1 27 1 C 29 1 27 7 27 10 Z" fill="#4CAF50" />
                <path d="M 27 10 C 27 4 32 2 30 2 C 28 2 25 7 27 10 Z" fill="#4CAF50" />
            </svg>`
    },
    {
        name: "rana",
        displayName: "la Rana Feliz 🐸",
        foodName: "fresas",
        foodSingular: "fresa",
        svgEl: ranaSvg,
        foodColor: "#E91E63",
        victoryMsg: "¡Croac! La rana feliz se ha comido todas las fresas. ¡Delicioso!",
        introMsg: "¡Hola! Soy la rana feliz. ¡Me encantan las fresas rojas! Alímentame con ",
        getFoodSvg: () => `
            <svg viewBox="0 0 50 50">
                <!-- Strawberry body -->
                <path d="M 25 45 C 10 32 10 16 25 14 C 40 16 40 32 25 45 Z" fill="#E91E63" />
                <!-- Leaves on top -->
                <path d="M 25 15 C 20 13 14 16 14 16 L 25 7 L 36 16 C 36 16 30 13 25 15 Z" fill="#4CAF50" />
                <!-- Seeds -->
                <circle cx="18" cy="22" r="1.5" fill="#FFEB3B" />
                <circle cx="32" cy="22" r="1.5" fill="#FFEB3B" />
                <circle cx="25" cy="27" r="1.5" fill="#FFEB3B" />
                <circle cx="18" cy="32" r="1.5" fill="#FFEB3B" />
                <circle cx="32" cy="32" r="1.5" fill="#FFEB3B" />
                <circle cx="25" cy="37" r="1.5" fill="#FFEB3B" />
            </svg>`
    }
];

// SPEECH SYNTHESIS ENGINE
function loadVoices() {
    if (!window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    // Search for a Spanish-speaking voice (preferably Mexican or Latin American, fallback to any Spanish)
    spanishVoice = voices.find(v => v.lang.includes('es-MX')) ||
                   voices.find(v => v.lang.includes('es-US')) ||
                   voices.find(v => v.lang.includes('es-ES')) ||
                   voices.find(v => v.lang.startsWith('es')) ||
                   voices[0];
}

loadVoices();
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
}

function speakText(text) {
    if (isMuted || !window.speechSynthesis) return;
    
    // Stop any ongoing speech immediately
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    if (spanishVoice) {
        utterance.voice = spanishVoice;
    }
    utterance.lang = 'es-ES';
    utterance.pitch = 1.35;  // Higher, friendly pitch for preschoolers
    utterance.rate = 0.85;   // Slightly slower, clear speed
    
    window.speechSynthesis.speak(utterance);
}

// WEB AUDIO SYNTHESIZER
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Sound 1: Bubble Pop (Food eat)
function playPopSound() {
    initAudio();
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    // Frequency sweeps upward quickly for a cute popping sound
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, audioCtx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.16);
}

// Sound 2: High Chime (Star activation)
function playChimeSound() {
    initAudio();
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.26);
}

// Sound 3: Victory Fanfare
function playVictorySound() {
    initAudio();
    if (!audioCtx) return;
    
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major scale arpeggio
    const now = audioCtx.currentTime;
    
    notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        const noteStart = now + (idx * 0.08);
        const noteEnd = noteStart + 0.4;
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(noteStart);
        osc.stop(noteEnd);
    });
}

// GAME INITIALIZATION / FLOW
function startGame(max) {
    maxCount = max;
    currentCount = 0;
    isProcessing = false;
    
    // Hide menu, show gameplay
    menuScreen.classList.remove('active');
    gameScreen.classList.add('active');
    victoryModal.classList.remove('active');
    stopConfetti();
    
    // Set level badge text
    levelBadge.textContent = `Contar hasta ${maxCount}`;
    
    // Build screen for current animal
    setupCurrentRound();
}

function setupCurrentRound() {
    currentCount = 0;
    currentCountEl.textContent = "0";
    targetCountEl.textContent = maxCount;
    
    const animal = animals[activeAnimalIndex];
    
    // Switch visual SVGs
    animals.forEach((anim, idx) => {
        if (idx === activeAnimalIndex) {
            anim.svgEl.classList.remove('hidden');
        } else {
            anim.svgEl.classList.add('hidden');
        }
    });
    
    // Generate instruction text
    const instructionStr = `Alimenta al ${animal.name} con ${maxCount} ${maxCount === 1 ? animal.foodSingular : animal.foodName}.`;
    instructionText.textContent = instructionStr;
    
    // Speak introduction
    speakInstruction();
    
    // Build progress stars
    starsContainer.innerHTML = '';
    for (let i = 0; i < maxCount; i++) {
        const star = document.createElement('span');
        star.classList.add('star-slot');
        star.innerHTML = '⭐';
        starsContainer.appendChild(star);
    }
    
    // Build food plate
    foodContainer.innerHTML = '';
    foodContainer.className = 'food-plate';
    if (maxCount <= 3) {
        foodContainer.classList.add('layout-3');
    } else if (maxCount <= 5) {
        foodContainer.classList.add('layout-5');
    } else {
        foodContainer.classList.add('layout-10');
    }
    
    // Add food items to the plate
    for (let i = 0; i < maxCount; i++) {
        const food = document.createElement('div');
        food.classList.add('food-item');
        food.innerHTML = animal.getFoodSvg();
        
        // Add Pointer Drag events
        setupPointerEvents(food);
        
        foodContainer.appendChild(food);
    }
}

function speakInstruction() {
    const animal = animals[activeAnimalIndex];
    const speechStr = `${animal.introMsg} ${maxCount} ${maxCount === 1 ? animal.foodSingular : animal.foodName}.`;
    speakText(speechStr);
}

// COLLISION AND POINTER EVENT MECHANICS
function setupPointerEvents(item) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    
    item.addEventListener('pointerdown', (e) => {
        if (isProcessing) return;
        initAudio(); // Initialize audio context on click
        
        isDragging = true;
        item.setPointerCapture(e.pointerId);
        
        const rect = item.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        currentX = 0;
        currentY = 0;
        
        item.style.transition = 'none';
        item.style.zIndex = '1000';
    });
    
    item.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        
        currentX = e.clientX - startX;
        currentY = e.clientY - startY;
        
        item.style.transform = `translate(${currentX}px, ${currentY}px) scale(1.15)`;
        
        // Check collision to trigger animal facial expression
        if (checkCollision(item)) {
            activeAnimalWrapper.classList.add('mouth-open');
        } else {
            activeAnimalWrapper.classList.remove('mouth-open');
        }
    });
    
    item.addEventListener('pointerup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        item.releasePointerCapture(e.pointerId);
        
        activeAnimalWrapper.classList.remove('mouth-open');
        
        const dragDistance = Math.sqrt(currentX * currentX + currentY * currentY);
        
        if (dragDistance < 10) {
            // Click/Tap detected: fly to mouth automatically
            flyToMouth(item);
        } else if (checkCollision(item)) {
            // Dragged and dropped successfully
            feedAnimal(item);
        } else {
            // Dragged but missed: slide back
            item.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            item.style.transform = 'translate(0px, 0px)';
            item.style.zIndex = '10';
        }
    });
}

function checkCollision(item) {
    const itemRect = item.getBoundingClientRect();
    const animalRect = activeAnimalWrapper.getBoundingClientRect();
    
    // Calculate center points
    const itemCenter = {
        x: itemRect.left + itemRect.width / 2,
        y: itemRect.top + itemRect.height / 2
    };
    const animalCenter = {
        x: animalRect.left + animalRect.width / 2,
        y: animalRect.top + animalRect.height / 2 + 10 // Shift down slightly toward mouth
    };
    
    const distance = Math.sqrt(
        Math.pow(itemCenter.x - animalCenter.x, 2) + 
        Math.pow(itemCenter.y - animalCenter.y, 2)
    );
    
    // Collides if centers are within 90px of each other
    return distance < 95;
}

function flyToMouth(item) {
    isProcessing = true;
    
    const itemRect = item.getBoundingClientRect();
    const animalRect = activeAnimalWrapper.getBoundingClientRect();
    
    // Find centers
    const itemCenter = {
        x: itemRect.left + itemRect.width / 2,
        y: itemRect.top + itemRect.height / 2
    };
    const mouthCenter = {
        x: animalRect.left + animalRect.width / 2,
        y: animalRect.top + animalRect.height / 2 + 25 // Mouth coordinates
    };
    
    const dx = mouthCenter.x - itemCenter.x;
    const dy = mouthCenter.y - itemCenter.y;
    
    item.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
    item.style.transform = `translate(${dx}px, ${dy}px) scale(0.2)`;
    item.style.zIndex = '1000';
    
    // Open animal mouth mid-flight
    setTimeout(() => {
        activeAnimalWrapper.classList.add('mouth-open');
    }, 150);
    
    setTimeout(() => {
        feedAnimal(item);
    }, 450);
}

function feedAnimal(item) {
    isProcessing = true;
    activeAnimalWrapper.classList.remove('mouth-open');
    
    // Increment counter
    currentCount++;
    currentCountEl.textContent = currentCount;
    
    // Visual eating effect (chew animation)
    activeAnimalWrapper.classList.add('chewing');
    
    // Hide eaten item
    item.classList.add('eaten');
    item.style.transform = 'translate(0px, 0px) scale(0)';
    
    // Sound & count speech synthesis
    playPopSound();
    
    // Visual Star Highlight
    const stars = starsContainer.children;
    if (stars[currentCount - 1]) {
        stars[currentCount - 1].classList.add('filled');
        setTimeout(() => {
            playChimeSound();
        }, 150);
    }
    
    // Speak current count
    const numWords = {
        1: "¡Uno!", 2: "¡Dos!", 3: "¡Tres!", 4: "¡Cuatro!", 5: "¡Cinco!",
        6: "¡Seis!", 7: "¡Siete!", 8: "¡Ocho!", 9: "¡Nueve!", 10: "¡Diez!"
    };
    speakText(numWords[currentCount] || currentCount.toString());
    
    // End chew animation
    setTimeout(() => {
        activeAnimalWrapper.classList.remove('chewing');
        isProcessing = false;
        
        // Check Victory
        if (currentCount >= maxCount) {
            triggerVictory();
        }
    }, 600);
}

// VICTORY SCREEN
function triggerVictory() {
    isProcessing = true;
    
    // Delay victory window for emotional satisfaction
    setTimeout(() => {
        playVictorySound();
        startConfetti();
        
        const animal = animals[activeAnimalIndex];
        
        // Configure Victory Modal
        document.getElementById('victory-message').textContent = animal.victoryMsg;
        document.getElementById('victory-icon-showcase').innerHTML = animal.getFoodSvg();
        
        victoryModal.classList.add('active');
        
        // Speak congratulations
        const congratulations = [
            "¡Excelente! Lo lograste.",
            "¡Maravilloso! Contaste muy bien.",
            "¡Genial! Eres un campeón en contar."
        ];
        const randomPraise = congratulations[Math.floor(Math.random() * congratulations.length)];
        speakText(`${randomPraise} ${animal.victoryMsg}`);
        
        isProcessing = false;
    }, 800);
}

// NEXT LEVEL/ANIMAL FLOW
function nextRound() {
    // Increment animal index
    activeAnimalIndex = (activeAnimalIndex + 1) % animals.length;
    victoryModal.classList.remove('active');
    stopConfetti();
    setupCurrentRound();
}

function resetGame() {
    victoryModal.classList.remove('active');
    stopConfetti();
    setupCurrentRound();
}

// CONFETTI SYSTEM
function resizeCanvas() {
    canvas.width = victoryModal.clientWidth;
    canvas.height = victoryModal.clientHeight;
}

window.addEventListener('resize', resizeCanvas);

function startConfetti() {
    resizeCanvas();
    confettiActive = true;
    confettiParticles = [];
    
    const colors = ['#FF4081', '#FFEB3B', '#00E676', '#00B0FF', '#D500F9', '#FF9100'];
    
    for (let i = 0; i < 100; i++) {
        confettiParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 8 + 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: Math.random() * 4 + 3,
            speedX: Math.random() * 3 - 1.5,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 4 - 2
        });
    }
    
    animateConfetti();
}

function animateConfetti() {
    if (!confettiActive) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    confettiParticles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        
        // Draw standard rectangular particle
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
        
        // Update position
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;
        
        // Reset when falls off bottom
        if (p.y > canvas.height) {
            p.y = -20;
            p.x = Math.random() * canvas.width;
        }
    });
    
    requestAnimationFrame(animateConfetti);
}

function stopConfetti() {
    confettiActive = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// EVENT LISTENERS
// Home return
btnHome.addEventListener('click', () => {
    gameScreen.classList.remove('active');
    menuScreen.classList.add('active');
    victoryModal.classList.remove('active');
    stopConfetti();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
});

// Sound Toggle
btnSound.addEventListener('click', () => {
    isMuted = !isMuted;
    btnSound.textContent = isMuted ? "🔇" : "🔊";
    btnSound.classList.toggle('muted', isMuted);
    
    if (isMuted && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    } else {
        speakInstruction();
    }
});

// Repeat instruction voice-over
btnRepeatVoice.addEventListener('click', speakInstruction);

// Level Buttons
document.querySelectorAll('.btn-level').forEach(button => {
    button.addEventListener('click', (e) => {
        const target = e.currentTarget;
        const max = parseInt(target.getAttribute('data-max'), 10);
        startGame(max);
    });
});

// Victory buttons
btnNextAnimal.addEventListener('click', nextRound);
btnPlayAgain.addEventListener('click', resetGame);
