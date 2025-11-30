const htmlEl = document.documentElement;
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const languageSelector = document.getElementById('language-selector');
const startTitle = document.getElementById('start-title');
const startDescription = document.getElementById('start-description');
const startGameBtn = document.getElementById('start-game-btn');
const backToMenuBtn = document.getElementById('back-to-menu-btn');
const ingameRestartBtn = document.getElementById('ingame-restart-btn');
const progressLabel = document.getElementById('progress-label');
const progressBarFill = document.getElementById('progress-bar-fill');
const scoreLabel = document.getElementById('score-label');
const scoreValue = document.getElementById('score-value');
const timerLabel = document.getElementById('timer-label');
const timerValue = document.getElementById('timer-value');
const timerContainer = document.getElementById('timer-container');
const questionImage = document.getElementById('question-image');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const endTitle = document.getElementById('end-title');
const finalScoreLabel = document.getElementById('final-score-label');
const finalScoreDisplay = document.getElementById('final-score-display');
const finalFeedbackMessage = document.getElementById('final-feedback-message');
const restartGameBtn = document.getElementById('restart-game-btn');
const feedbackOverlay = document.getElementById('feedback-overlay');
const feedbackBox = document.getElementById('feedback-box');
const feedbackText = document.getElementById('feedback-text');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const masterSoundToggle = document.getElementById('master-sound-toggle');
const musicToggle = document.getElementById('music-toggle');
const timerSoundToggle = document.getElementById('timer-sound-toggle');
const settingsTitle = document.getElementById('settings-title');
const masterSoundLabel = document.getElementById('master-sound-label');
const musicLabel = document.getElementById('music-label');
const timerSoundLabel = document.getElementById('timer-sound-label');
const nextQuestionBtn = document.getElementById('next-question-btn');

let questions = [];
let config = {};
let characters = [];
let currentLanguage = 'ar';
let currentQuestionIndex = 0;
let score = 0;
const sounds = {};
const TIME_LIMIT = 20;
let timerInterval = null;
let timeRemaining;
let isAnswered = false;
let soundSettings = {
    master: true,
    music: true,
    timer: true
};

async function loadGameData() {
    try {
        const [questionsRes, configRes, charactersRes] = await Promise.all([
    fetch('data/questions.json'),
    fetch('data/config.json'),
    fetch('data/characters.json') 
]);
questions = await questionsRes.json();
config = await configRes.json();
characters = await charactersRes.json();
        
        initializeSounds();
        initializeEventListeners();
        setLanguage('ar');
    } catch (error) {
        console.error("فشل تحميل اللعبة:", error);
        document.body.innerHTML = `<h1>Error loading game data.</h1>`;
    }
}

function initializeSounds() {
    sounds.correct = new Audio('sounds/correct.mp3');
    sounds.wrong = new Audio('sounds/wrong.mp3');
    sounds.click = new Audio('sounds/click.mp3');
    sounds.gameOver = new Audio('sounds/game_over.mp3');
    sounds.timerTick = new Audio('sounds/timer.mp3');
    sounds.background = new Audio('sounds/background_music.mp3');
    sounds.background.loop = true;
    sounds.background.volume = 0.3;
}

function initializeEventListeners() {
    languageSelector.addEventListener('click', handleLanguageChange);
    startGameBtn.addEventListener('click', startGame);
    restartGameBtn.addEventListener('click', startGame);
    ingameRestartBtn.addEventListener('click', startGame);
    backToMenuBtn.addEventListener('click', goToMainMenu);
    nextQuestionBtn.addEventListener('click', prepareNextQuestion);
    settingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
    masterSoundToggle.addEventListener('click', toggleMasterSound);
    musicToggle.addEventListener('click', toggleMusic);
    timerSoundToggle.addEventListener('click', toggleTimerSound);
}

function openSettings() {
    playSound('click');
    settingsModal.classList.remove('hidden');
}

function closeSettings() {
    playSound('click');
    settingsModal.classList.add('hidden');
}

function toggleMasterSound() {
    soundSettings.master = !soundSettings.master;
    masterSoundToggle.classList.toggle('active', soundSettings.master);
    if (!soundSettings.master) {
        stopBackgroundMusic();
    } else {
        if (!startScreen.classList.contains('active-screen')) {
            playBackgroundMusic();
        }
    }
}

function toggleMusic() {
    soundSettings.music = !soundSettings.music;
    musicToggle.classList.toggle('active', soundSettings.music);
    if (!soundSettings.music) {
        stopBackgroundMusic();
    } else {
        if (!startScreen.classList.contains('active-screen')) {
            playBackgroundMusic();
        }
    }
}

function toggleTimerSound() {
    soundSettings.timer = !soundSettings.timer;
    timerSoundToggle.classList.toggle('active', soundSettings.timer);
}

function handleLanguageChange(e) {
    if (e.target.classList.contains('lang-btn')) {
        setLanguage(e.target.dataset.lang);
    }
}

function setLanguage(lang) {
    currentLanguage = lang;
    htmlEl.lang = lang;
    htmlEl.dir = (lang === 'ar') ? 'rtl' : 'ltr';
    document.body.style.fontFamily = (lang === 'ar') ? "var(--font-family-arabic)" : "var(--font-family-latin)";
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
    updateUIText();
}

function updateUIText() {
    document.title = config.gameTitle[currentLanguage];
    startTitle.textContent = config.startScreen.title[currentLanguage];
    startDescription.textContent = config.startScreen.description[currentLanguage];
    startGameBtn.textContent = config.startScreen.buttonText[currentLanguage];
    progressLabel.textContent = config.gameScreen.progressLabel[currentLanguage];
    scoreLabel.textContent = config.gameScreen.scoreLabel[currentLanguage];
    timerLabel.textContent = config.gameScreen.timerLabel[currentLanguage];
    ingameRestartBtn.setAttribute('aria-label', config.gameScreen.ingameRestartLabel[currentLanguage]);
    backToMenuBtn.setAttribute('aria-label', config.gameScreen.backToMenuLabel[currentLanguage]);
    endTitle.textContent = config.endScreen.title[currentLanguage];
    finalScoreLabel.textContent = config.endScreen.finalScoreLabel[currentLanguage];
    restartGameBtn.textContent = config.endScreen.restartButtonText[currentLanguage];
    nextQuestionBtn.textContent = { ar: "التالي", en: "Next", fr: "Suivant" }[currentLanguage];
    settingsTitle.textContent = config.settings.title[currentLanguage];
    masterSoundLabel.textContent = config.settings.masterSound[currentLanguage];
    musicLabel.textContent = config.settings.backgroundMusic[currentLanguage];
    timerSoundLabel.textContent = config.settings.timerSound[currentLanguage];
    closeSettingsBtn.textContent = config.settings.closeButton[currentLanguage];
}

function startGame() {
    playSound('click');
    stopTimer();
    currentQuestionIndex = 0;
    score = 0;
    playBackgroundMusic();
    showScreen('game-screen');
    displayQuestion();
}

function goToMainMenu() {
    playSound('click');
    stopTimer();
    stopBackgroundMusic();
    showScreen('start-screen');
}

function displayQuestion() {
    isAnswered = false;
    updateHUD();
    nextQuestionBtn.classList.add('hidden');
    const question = questions[currentQuestionIndex];
    const characterAvatar = document.getElementById('character-avatar');
if (question.characterId && characters.length > 0) {
    const character = characters.find(c => c.id === question.characterId);
    if (character) {
        characterAvatar.src = character.avatar;
        characterAvatar.style.display = 'block';
    } else {
        characterAvatar.style.display = 'none';
    }
} else {
    characterAvatar.style.display = 'none';
}
    questionText.textContent = question.questionText[currentLanguage];
    questionImage.src = question.image;
    questionImage.alt = question.questionText[currentLanguage];
    optionsContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option[currentLanguage];
        button.className = 'btn option-btn';
        button.dataset.index = index;
        button.addEventListener('click', handleOptionClick);
        optionsContainer.appendChild(button);
    });
    startTimer();
}

function startTimer() {
    stopTimer();
    timeRemaining = TIME_LIMIT;
    timerValue.textContent = timeRemaining;
    timerContainer.className = 'hud-item timer-item';
    timerInterval = setInterval(() => {
        timeRemaining--;
        timerValue.textContent = timeRemaining;
        if (timeRemaining <= 10) {
            timerContainer.classList.add('warning');
            playSound('timerTick');
        }
        if (timeRemaining <= 0) {
            handleTimeUp();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function handleTimeUp() {
    if (isAnswered) return;
    isAnswered = true;
    stopTimer();
    showFeedback(false, { ar: "انتهى الوقت!", en: "Time's up!", fr: "Temps écoulé !" }[currentLanguage]);
    playSound('wrong');
    Array.from(optionsContainer.children).forEach(btn => {
        btn.disabled = true;
        if (parseInt(btn.dataset.index) === questions[currentQuestionIndex].correctAnswerIndex) {
            btn.classList.add('correct');
        }
    });
    nextQuestionBtn.classList.remove('hidden');
}

function handleOptionClick(e) {
    if (isAnswered) return;
    isAnswered = true;
    stopTimer();
    playSound('click');
    const selectedButton = e.target;
    const selectedIndex = parseInt(selectedButton.dataset.index);
    const correctIndex = questions[currentQuestionIndex].correctAnswerIndex;
    Array.from(optionsContainer.children).forEach(btn => btn.disabled = true);
    if (selectedIndex === correctIndex) {
        score++;
        selectedButton.classList.add('correct');
        playSound('correct');
        showFeedback(true, questions[currentQuestionIndex].feedback.correct[currentLanguage]);
    } else {
        selectedButton.classList.add('incorrect');
        optionsContainer.children[correctIndex].classList.add('correct');
        playSound('wrong');
        showFeedback(false, questions[currentQuestionIndex].feedback.incorrect[currentLanguage]);
    }
    nextQuestionBtn.classList.remove('hidden');
}

function prepareNextQuestion() {
    playSound('click');
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        displayQuestion();
    } else {
        endGame();
    }
}

function endGame() {
    playSound('gameOver');
    showScreen('end-screen');
    finalScoreDisplay.textContent = `${score} / ${questions.length}`;
    const successRate = score / questions.length;
    let feedbackKey = successRate === 1 ? 'great' : (successRate >= 0.7 ? 'good' : 'retry');
    finalFeedbackMessage.textContent = config.endScreen.feedbackMessages[feedbackKey][currentLanguage];
}

function updateHUD() {
    scoreValue.textContent = score;
    const progressPercent = (currentQuestionIndex / questions.length) * 100;
    progressBarFill.style.width = `${progressPercent}%`;
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active-screen'));
    document.getElementById(screenId).classList.add('active-screen');
}

function showFeedback(isCorrect, message) {
    feedbackText.textContent = message;
    feedbackBox.style.borderColor = isCorrect ? 'var(--success-color)' : 'var(--danger-color)';
    feedbackOverlay.classList.remove('hidden');
    setTimeout(() => feedbackOverlay.classList.add('hidden'), 2200);
}

function playSound(soundName) {
    if (!soundSettings.master) return;
    if (soundName === 'timerTick' && !soundSettings.timer) return;
    if (sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(e => {});
    }
}

function playBackgroundMusic() {
    if (soundSettings.master && soundSettings.music) {
        sounds.background.play().catch(e => {});
    }
}

function stopBackgroundMusic() {
    sounds.background.pause();
    sounds.background.currentTime = 0;
}

loadGameData();