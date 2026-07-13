// ==========================================
// 1. VARIABLES DEL DOM Y ESTADO GLOBAL
// ==========================================
const audio = document.getElementById('global-audio');
audio.volume = 0.65;
const introScreen = document.getElementById('intro-screen');
const menuScreen = document.getElementById('menu-rocola');

const appWrapper = document.getElementById('app-wrapper');

function getAppWrapper() {
    return appWrapper || document.getElementById('app-wrapper') || document.documentElement;
}

function getAppSize() {
    const wrapper = getAppWrapper();

    return {
        width: wrapper.clientWidth || window.innerWidth,
        height: wrapper.clientHeight || window.innerHeight
    };
}

function getAppRect() {
    return getAppWrapper().getBoundingClientRect();
}

function getPointerInApp(event) {
    const source =
        event.touches?.[0] ||
        event.changedTouches?.[0] ||
        event;

    const rect = getAppRect();

    const x = source.clientX - rect.left;
    const y = source.clientY - rect.top;

    return {
        x,
        y,
        width: rect.width,
        height: rect.height,
        inside:
            x >= 0 &&
            y >= 0 &&
            x <= rect.width &&
            y <= rect.height
    };
}

const worlds = {
    1: document.getElementById('world-1'),
    2: document.getElementById('world-2'),
    3: document.getElementById('world-3'),
    4: document.getElementById('world-4'),
    5: document.getElementById('world-5'),
    6: document.getElementById('world-6')
};

const floatingPlayer = document.getElementById('floating-player');
const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const playerPlayBtn = document.getElementById('player-play-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');

let currentWorld = 0;
let secretErrorsFound = new Set();
let isPlaying = false;
let world2ClimaxTriggered = false;
let world2TextWritten = false;
let secretPolaroidRevealed = false;

let openedGalaxyStars = new Set();
let finalUniverseShown = false;
let finalScreenMusicActive = false;
let finalDreamLyricIndex = -1;

const FINAL_SONG_SRC = "canciones 1/Something About You - Eyedress Dent May.mp3";

/* Ajusta estos segundos si tu archivo empieza con silencio distinto */
const FINAL_DREAM_LYRICS = [
    { time: 44.0, id: "final-dream-line-1" },
    { time: 47.0, id: "final-dream-line-2" },
    { time: 52.0, id: "final-dream-line-3" }
];

const FINAL_DREAM_END = 70.5;

const EXTRA_TRACKS = {
    "in-the-pool": {
        title: "in the pool",
        artist: "kensuke ushio",
        src: "canciones 1/in the pool - kensuke ushio.mp3"
    },
    "por-ti": {
        title: "Por Ti",
        artist: "3AM",
        src: "canciones 1/Por Ti - 3AM (FLAC).mp3"
    },
    "la-terminal": {
        title: "la terminal",
        artist: "Jaze",
        src: "canciones 1/la terminal - Jaze (FLAC).mp3"
    },
    "bachata-rosa": {
        title: "Bachata Rosa",
        artist: "Juan Luis Guerra",
        src: "canciones 1/Bachata Rosa - Juan Luis Guerra.mp3"
    },
    "risk-it-all": {
        title: "Risk it All",
        artist: "Bruno Mars",
        src: "canciones 1/Risk it All.mp3"
    },
    "sparks": {
        title: "Sparks",
        artist: "Coldplay",
        src: "canciones 1/Sparks - Coldplay.mp3"
    },
    "still-love-you": {
        title: "still love you",
        artist: "Dxngelo",
        src: "canciones 1/Dxngelo - still love you.mp3"
    },
    "sunflower": {
        title: "Sunflower",
        artist: "Post Malone",
        src: "canciones 1/Post Malone - Sunflower.mp3"
    },
    "til-kingdom-come": {
        title: "Til Kingdom Come",
        artist: "Coldplay",
        src: "canciones 1/Til Kingdom Come - Coldplay.mp3"
    },
    "seguro-te-pierdo": {
        title: "Seguro Te Pierdo",
        artist: "Sergi Kid Flex",
        src: "canciones 1/Seguro Te Pierdo - Sergi Kid Flex.mp3"
    },
    "te-quiero": {
        title: "Te quiero",
        artist: "Hombres G",
        src: "canciones 1/Te quiero - Hombres G.mp3"
    },
    "alguna-vez-alli": {
        title: "Alguna Vez Allí Algo Ardió",
        artist: "Mi Sobrino Memo",
        src: "canciones 1/Alguna Vez Allí Algo Ardió - Mi Sobrino Memo.mp3"
    },
    "forever-young": {
        title: "Forever Young",
        artist: "Alphaville",
        src: "canciones 1/Forever Young - Alphaville.mp3"
    },
    "gone-gone-gone": {
        title: "Gone, Gone, Gone",
        artist: "Phillip Phillips",
        src: "canciones 1/Gone, Gone, Gone - Phillip Phillips.mp3"
    },
    "nubecita": {
        title: "Nubecita",
        artist: "Wuicho kun",
        src: "canciones 1/Nubecita - Wuicho kun.mp3"
    }
};

let extraTrackMode = false;
let activeExtraTrackKey = null;

// LISTA DE TROFEOS CON PISTAS CRÍPTICAS
const trophyData = {
    "world1_stars": { title: "Cosmógrafa", hint: "Explora cada rincón brillante de la galaxia.", unlocked: false },
    "world1_secret": { title: "Error 1/5", hint: "Una anomalía azul con coordenadas propias. (610) Valeska.", unlocked: false },

    "world2_photos": { title: "Papel y Tinta", hint: "Revive los recuerdos ocultos en la piel.", unlocked: false },
    "world2_secret": { title: "Error 2/5", hint: "Una foto apareció donde no debía.", unlocked: false },

    "world3_rain": {
        title: "FILA 12 · ASIENTO 22",
        hint: "Hay una butaca reservada en la sala.",
        unlocked: false
    },
    "world3_secret": {
        title: "Ave fuera de cuadro",
        hint: "No todas las aves vuelan hacia el mismo recuerdo.",
        unlocked: false
    },

    "world4_reality": {
        title: "Toma estable",
        hint: "La ciudad encontró su encuadre.",
        unlocked: false
    },
    "world4_secret": {
        title: "Anomalía violeta",
        hint: "Algunas luces no pertenecen a esta ciudad.",
        unlocked: false
    },

    "world5_yellow": { title: "Brillo Propio", hint: "Interactúa con lo que no fue programado por mí.", unlocked: false },
    "world5_secret": { title: "Error 5/5", hint: "Atrapa la chispa rebelde en el fuego.", unlocked: false }
};

function unlockTrophy(id) {
    if (trophyData[id] && !trophyData[id].unlocked) {
        trophyData[id].unlocked = true;
        // ELIMINADO: saveTrophies(); <-- ¡Este era el villano que congelaba tu página!
        
        // Notificación estilo ROBLOX para secretos, MINECRAFT para normales
        const style = id.includes('secret') ? 'roblox' : 'minecraft';
        showAchievement("¡Trofeo Desbloqueado!", trophyData[id].title, 5000, style);
        updateTrophyUI();
    }
}

function updateTrophyUI() {
    const list = document.getElementById('trophy-list');
    const bubble = document.getElementById('trophy-counter-bubble');
    if (!list) return;

    list.innerHTML = '';
    let count = 0;

    Object.keys(trophyData).forEach(id => {
        const t = trophyData[id];
        if (t.unlocked) count++;
        
        const item = document.createElement('div');
        item.className = `trophy-item ${t.unlocked ? 'unlocked' : ''}`;
        item.innerHTML = `
            <img src="${t.unlocked ? 'https://minecraft.wiki/images/Nether_Star_JE3_BE2.png' : 'https://minecraft.wiki/images/Barrier_JE2_BE2.png'}">
            <div>
                <h4>${t.unlocked ? t.title : "???"}</h4>
                <p>${t.hint}</p>
            </div>
        `;
        list.appendChild(item);
    });

    if (bubble) bubble.textContent = `${count}/${Object.keys(trophyData).length}`;
}

function toggleTrophyPanel() {
    document.getElementById('trophy-panel').classList.toggle('hidden');
    updateTrophyUI();
}

let secretWorldUnlocked = false;

function unlockSecretError(errorNumber, trophyId) {
    if (secretErrorsFound.has(errorNumber)) return;

    secretErrorsFound.add(errorNumber);

    if (trophyId) {
        unlockTrophy(trophyId);
    } else {
        showAchievement(
            'Error encontrado',
            `Error ${errorNumber}/5 detectado`,
            4500,
            'roblox'
        );
    }

    checkSecretWorldUnlock();
}

// Función maestra para liberar los secretos

function revealAllSecrets() {
    // 1. Revelar el disco secreto
    const secretCard = document.getElementById('secret-vinyl-card');
    if (secretCard) {
        secretCard.style.display = 'block'; 
        setTimeout(() => secretCard.classList.remove('secret-hidden'), 50);
    }

    // 2. Revelar el botón de la carta
    const spideyBtn = document.querySelector('.secret-letter-btn');
    if (spideyBtn) {
        spideyBtn.classList.remove('secret-hidden');
    }

    // 3. Añadir el 6to mundo a la rocola
    vinylWorlds.push({
        world: 6,
        title: 'Disco dañado',
        desc: 'No tenias que encontrarlo pero weno jajs'
    });

    // 4. Actualizar interfaz
    vinylAngles = [90, 150, 210, 270, 330, 30];
    vinylCurrentIndex = 5;
    updateVinylMenu();
}

function checkSecretWorldUnlock() {
    if (secretWorldUnlocked) return;

    if (secretErrorsFound.size >= 5) {
        secretWorldUnlocked = true;

        showAchievement(
            'Sistema Corrupto',
            'Se detectaron 5 anomalías. Acceso total desbloqueado.',
            6000,
            'roblox'
        );

        revealAllSecrets(); // Llama a la función unificada
    }
}

// Mundos visitados para desbloquear la pantalla final
let visitedWorlds = new Set();
const totalWorlds = 5;


const visitedCounter = document.getElementById('visited-counter');
const finalScreenBtn = document.getElementById('final-screen-btn');
const finalScreen = document.getElementById('final-screen');

function startExperience() {
    if (!introScreen || !menuScreen) {
        console.error('No se encontró intro-screen o menu-rocola');
        return;
    }

    introScreen.classList.remove('active');
    introScreen.classList.add('hidden');

    menuScreen.classList.remove('hidden');
    menuScreen.classList.add('active');

    if (typeof updateVinylMenu === 'function') {
        updateVinylMenu();
    }
}

window.startExperience = startExperience;

// ==========================================
// MINI TRÁILER DE INTRO
// ==========================================
let introTrailerStarted = false;
let introTrailerTimers = [];

function clearIntroTrailerTimers() {
    introTrailerTimers.forEach(timer => clearTimeout(timer));
    introTrailerTimers = [];
}

function revealIntroMainCard() {
    if (!introScreen) return;

    introScreen.classList.remove('trailer-running');
    introScreen.classList.add('trailer-done');

    const skipBtn = document.getElementById('intro-skip-btn');
    if (skipBtn) {
        skipBtn.classList.add('hidden-skip');
    }
}

function startIntroTrailer({ force = false } = {}) {
    if (!introScreen) return;

    if (introTrailerStarted && !force) return;

    introTrailerStarted = true;
    clearIntroTrailerTimers();

    introScreen.classList.remove('trailer-done');
    introScreen.classList.add('trailer-running');

    const skipBtn = document.getElementById('intro-skip-btn');
    if (skipBtn) {
        skipBtn.classList.remove('hidden-skip');
    }

    const lines = Array.from(document.querySelectorAll('#intro-trailer .trailer-line'));

    if (!lines.length) {
        revealIntroMainCard();
        return;
    }

    lines.forEach(line => {
        line.classList.remove('visible', 'leaving');
    });

    const startDelay = 450;
    const stepDelay = 1750;
    const visibleFor = 1180;

    lines.forEach((line, index) => {
        const showAt = startDelay + index * stepDelay;
        const hideAt = showAt + visibleFor;

        introTrailerTimers.push(setTimeout(() => {
            line.classList.add('visible');
            line.classList.remove('leaving');
        }, showAt));

        introTrailerTimers.push(setTimeout(() => {
            line.classList.add('leaving');
        }, hideAt));
    });

    const finishAt = startDelay + lines.length * stepDelay + 450;

    introTrailerTimers.push(setTimeout(() => {
        revealIntroMainCard();
    }, finishAt));
}

function skipIntroTrailer() {
    introTrailerStarted = true;
    clearIntroTrailerTimers();

    document.querySelectorAll('#intro-trailer .trailer-line').forEach(line => {
        line.classList.remove('visible');
        line.classList.add('leaving');
    });

    revealIntroMainCard();
}

function syncIntroTrailerState() {
    if (!introScreen) return;

    const introIsActive = introScreen.classList.contains('active');

    document.body.classList.toggle('intro-is-active', introIsActive);

    if (introIsActive && !introTrailerStarted) {
        startIntroTrailer();
    }
}

function initIntroTrailerObserver() {
    if (!introScreen) return;

    const observer = new MutationObserver(syncIntroTrailerState);

    observer.observe(introScreen, {
        attributes: true,
        attributeFilter: ['class']
    });

    syncIntroTrailerState();
}

initIntroTrailerObserver();

window.skipIntroTrailer = skipIntroTrailer;
window.startIntroTrailer = startIntroTrailer;

function markWorldAsVisited(worldId) {
    visitedWorlds.add(worldId);
    updateVisitedCounter();
}

function updateVisitedCounter() {
    if (!visitedCounter || !finalScreenBtn) return;

    const visitedCount = visitedWorlds.size;
    visitedCounter.textContent = `Universos visitados: ${visitedCount}/${totalWorlds}`;

    if (visitedCount >= totalWorlds) {
        finalScreenBtn.disabled = false;
        finalScreenBtn.classList.remove('locked');
        finalScreenBtn.classList.add('unlocked');
        finalScreenBtn.textContent = 'Abrir mensaje final ✨';

        if (!finalScreenBtn.dataset.unlocked) {
            finalScreenBtn.dataset.unlocked = 'true';
            showAchievement('¡Logro desbloqueado!', 'Mensaje final disponible', 5000);
        }

        // DESBLOQUEAR EL NUEVO BOTÓN DE PLAYLIST
        const playlistRoomBtn = document.getElementById('playlist-room-btn');
        if (playlistRoomBtn) {
            playlistRoomBtn.disabled = false;
            playlistRoomBtn.classList.remove('locked');
            playlistRoomBtn.classList.add('unlocked');
            playlistRoomBtn.textContent = 'Abrir pistas adicionales 🎧';
        }
    }
}

function openFinalScreen() {
    if (visitedWorlds.size < totalWorlds) return;

    audio.pause();
    audio.currentTime = 0;

    menuScreen.classList.remove('active');
    menuScreen.classList.add('hidden');

    finalScreen.classList.remove('hidden');
    finalScreen.classList.add('active');

    currentWorld = 0;

    extraTrackMode = false;
    activeExtraTrackKey = null;
    setExtraPlayButtonState(false);

    finalScreenMusicActive = true;
    resetFinalDreamLyrics();

    audio.src = FINAL_SONG_SRC;
    audio.preload = "auto";
    audio.load();

    playerTitle.textContent = "Something About You";
    playerArtist.textContent = "Eyedress, Dent May";

    progressBar.value = 0;
    currentTimeEl.textContent = "0:00";
    durationEl.textContent = "0:00";

    audio.play().then(() => {
        isPlaying = true;
        updatePlayButton();
    }).catch(e => {
        console.log("El navegador bloqueó el autoplay final hasta otra interacción.", e);
        isPlaying = false;
        updatePlayButton();
    });

    showAchievement('¡Logro desbloqueado!', 'Todos los universos completados', 5500);
}

function dodgeNoButton(event, btn) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const box = document.getElementById('smile-question-box');
    if (!box || !btn) return;

    box.classList.remove('accepted');
    box.classList.add('teasing');

    btn.classList.add('running-away');

    const options = btn.closest('.smile-options');
    const container = options || box;

    const containerRect = container.getBoundingClientRect();

    const yesBtn =
        document.getElementById('smile-yes-btn') ||
        container.querySelector('.smile-yes') ||
        container.querySelector('.smile-btn:not(.smile-no)');

    const btnWidth = btn.offsetWidth || 80;
    const btnHeight = btn.offsetHeight || 42;

    const padding = 10;
    const safeGap = 22;

    const maxX = Math.max(0, containerRect.width - btnWidth - padding * 2);
    const maxY = Math.max(0, containerRect.height - btnHeight - padding * 2);

    let yesBox = null;

    if (yesBtn && yesBtn !== btn) {
        const yesRect = yesBtn.getBoundingClientRect();

        yesBox = {
            left: yesRect.left - containerRect.left - safeGap,
            top: yesRect.top - containerRect.top - safeGap,
            right: yesRect.right - containerRect.left + safeGap,
            bottom: yesRect.bottom - containerRect.top + safeGap
        };
    }

    function overlapsYes(x, y) {
        if (!yesBox) return false;

        const noBox = {
            left: x,
            top: y,
            right: x + btnWidth,
            bottom: y + btnHeight
        };

        return !(
            noBox.right < yesBox.left ||
            noBox.left > yesBox.right ||
            noBox.bottom < yesBox.top ||
            noBox.top > yesBox.bottom
        );
    }

    let randomX = padding;
    let randomY = padding;
    let foundSafeSpot = false;

    for (let i = 0; i < 40; i++) {
        const candidateX = padding + Math.random() * maxX;
        const candidateY = padding + Math.random() * maxY;

        if (!overlapsYes(candidateX, candidateY)) {
            randomX = candidateX;
            randomY = candidateY;
            foundSafeSpot = true;
            break;
        }
    }

    // Si el contenedor está muy pequeño, lo manda a una esquina opuesta al botón "zhy"
    if (!foundSafeSpot && yesBox) {
        const corners = [
            { x: padding, y: padding },
            { x: padding + maxX, y: padding },
            { x: padding, y: padding + maxY },
            { x: padding + maxX, y: padding + maxY }
        ];

        corners.sort((a, b) => {
            const yesCenterX = (yesBox.left + yesBox.right) / 2;
            const yesCenterY = (yesBox.top + yesBox.bottom) / 2;

            const distA = Math.hypot(a.x - yesCenterX, a.y - yesCenterY);
            const distB = Math.hypot(b.x - yesCenterX, b.y - yesCenterY);

            return distB - distA;
        });

        randomX = corners[0].x;
        randomY = corners[0].y;
    }

    btn.style.left = `${randomX}px`;
    btn.style.top = `${randomY}px`;

    const frases = [
        'ño no es una opción válida xd',
        'se movió solito, qué raro',
        'intenta de nuevo ps',
        'el botón tiene voluntad propia',
        'acepta nomás jasjasj'
    ];

    const answer = document.getElementById('smile-answer');

    if (answer) {
        answer.textContent = frases[Math.floor(Math.random() * frases.length)];
    }

    setTimeout(() => {
        if (!box.classList.contains('smile-final-accepted')) {
            box.classList.remove('teasing');
        }
    }, 1100);
}

function acceptSmile() {
    const box = document.getElementById('smile-question-box');
    const answer = document.getElementById('smile-answer');

    if (!box || !answer) return;

    box.classList.remove('teasing');
    box.classList.add('accepted', 'smile-final-accepted');

    answer.textContent = 'sabía que sí jsajs 💙';

    showAchievement('¡Logro desbloqueado!', 'Le saqué una sonrisa', 5000, 'minecraft');
}

function resetFinalDreamLyrics() {
    finalDreamLyricIndex = -1;

    const finalScreenEl = document.getElementById('final-screen');
    const box = document.getElementById('final-dream-lyrics');

    if (finalScreenEl) {
        finalScreenEl.classList.remove('final-dream-active');
    }

    if (box) {
        box.classList.remove('show');
    }

    FINAL_DREAM_LYRICS.forEach(item => {
        const line = document.getElementById(item.id);
        if (line) line.classList.remove('visible');
    });
}

function updateFinalDreamLyrics(current) {
    const finalScreenEl = document.getElementById('final-screen');
    const box = document.getElementById('final-dream-lyrics');

    if (!finalScreenMusicActive || !finalScreenEl || !box) return;

    const isDreamMoment = current >= FINAL_DREAM_LYRICS[0].time && current <= FINAL_DREAM_END;

    finalScreenEl.classList.toggle('final-dream-active', isDreamMoment);
    box.classList.toggle('show', isDreamMoment);

    FINAL_DREAM_LYRICS.forEach((item, index) => {
        const line = document.getElementById(item.id);
        if (!line) return;

        const nextTime = FINAL_DREAM_LYRICS[index + 1]?.time || FINAL_DREAM_END;
        const isActiveLine = current >= item.time && current < nextTime;

        line.classList.toggle('visible', isDreamMoment && isActiveLine);

        if (isActiveLine && finalDreamLyricIndex !== index) {
            finalDreamLyricIndex = index;
        }
    });

    if (!isDreamMoment) {
        finalDreamLyricIndex = -1;
    }
}

audio.addEventListener('timeupdate', () => {
    if (finalScreenMusicActive) {
        updateFinalDreamLyrics(audio.currentTime || 0);
    }
});

window.dodgeNoButton = dodgeNoButton;
window.acceptSmile = acceptSmile;

function backToMenuFromFinal() {
    finalScreenMusicActive = false;
    extraTrackMode = false;
    activeExtraTrackKey = null;

    resetFinalDreamLyrics();
    setExtraPlayButtonState(false);

    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    updatePlayButton();

    finalScreen.classList.remove('active');
    finalScreen.classList.add('hidden');

    menuScreen.classList.remove('hidden');
    menuScreen.classList.add('active');

    currentWorld = 0;
}

function getExtraPlayerElements() {
    return {
        select: document.getElementById('extra-tracks-select'),
        button: document.getElementById('extra-play-btn')
    };
}

function setExtraPlayButtonState(playing) {
    const { button } = getExtraPlayerElements();
    if (!button) return;

    button.classList.toggle('is-playing', !!playing);

    const icon = button.querySelector('i');
    const label = button.querySelector('span');

    if (icon) {
        icon.className = playing ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    }

    if (label) {
        label.textContent = playing ? 'Pausa' : 'Play';
    }
}

function stopFinalDreamLyricsForExtraTracks() {
    finalScreenMusicActive = false;
    finalDreamLyricIndex = -1;
    resetFinalDreamLyrics();

    const finalScreenEl = document.getElementById('final-screen');
    if (finalScreenEl) {
        finalScreenEl.classList.remove('final-dream-active');
    }
}

function toggleExtraTrack() {
    const { select } = getExtraPlayerElements();
    if (!select) return;

    const selectedKey = select.value;
    const track = EXTRA_TRACKS[selectedKey];
    updatePlaylistRoomBackground(selectedKey);

    if (!track) {
        console.warn('No existe esta pista extra:', selectedKey);
        return;
    }

    const isSameExtraTrack = extraTrackMode && activeExtraTrackKey === selectedKey;

    if (isSameExtraTrack && !audio.paused) {
        audio.pause();
        isPlaying = false;
        setExtraPlayButtonState(false);
        updatePlayButton();
        return;
    }

    stopFinalDreamLyricsForExtraTracks();

    extraTrackMode = true;

    if (!isSameExtraTrack) {
        activeExtraTrackKey = selectedKey;

        audio.pause();
        audio.src = track.src;
        audio.preload = 'auto';
        audio.load();

        try {
            audio.currentTime = 0;
        } catch (e) {
            // Algunos navegadores esperan metadata antes de permitir currentTime.
        }

        progressBar.value = 0;
        currentTimeEl.textContent = '0:00';
        durationEl.textContent = '0:00';
    }

    playerTitle.textContent = track.title;
    playerArtist.textContent = track.artist;

    audio.play().then(() => {
        isPlaying = true;
        setExtraPlayButtonState(true);
        updatePlayButton();
    }).catch(error => {
        console.log('No se pudo reproducir la pista extra todavía:', error);
        isPlaying = false;
        setExtraPlayButtonState(false);
        updatePlayButton();
    });
}

function initPostCreditsPlayer() {
    const { select, button } = getExtraPlayerElements();
    if (!select || !button) return;

    button.addEventListener('click', toggleExtraTrack);

    select.addEventListener('change', () => {
        updatePlaylistRoomBackground(select.value);
        if (extraTrackMode && !audio.paused) {
            activeExtraTrackKey = null;
            toggleExtraTrack();
            return;
        }

        activeExtraTrackKey = null;
        setExtraPlayButtonState(false);
    });

    audio.addEventListener('play', () => {
        if (!extraTrackMode) return;

        isPlaying = true;
        setExtraPlayButtonState(true);
        updatePlayButton();
    });

    audio.addEventListener('pause', () => {
        if (!extraTrackMode) return;

        isPlaying = false;
        setExtraPlayButtonState(false);
        updatePlayButton();
    });

    audio.addEventListener('ended', () => {
        if (!extraTrackMode) return;

        isPlaying = false;
        setExtraPlayButtonState(false);
        updatePlayButton();
    });
}

initPostCreditsPlayer();

// ==========================================
// 2. PLAYLIST
// ==========================================
const playlist = {
    1: { 
        title: "La Vie En Rose", 
        artist: "Louis Armstrong", 
        src: "canciones 1/La vie en rose (Single Version) - Louis Armstrong.mp3", 
        cover: "imagenes/portada_walle.jpg" 
    },

    2: { 
        title: "Corazón", 
        artist: "Danny Ocean", 
        src: "canciones 1/Corazón - Danny Ocean.mp3", 
        cover: "imagenes/portada_corazon.jpg" 
    },

    3: { 
        title: "BIRDS OF A FEATHER", 
        artist: "Billie Eilish", 
        src: "canciones 1/Birds of a feather - Billie Eilish.mp3", 
        cover: "imagenes/portada_billie.jpg" 
    },

    4: { 
        title: "Seguro Te Pierdo", 
        artist: "Sergi Kid Flex", 
        src: "canciones 1/Seguro Te Pierdo - Sergi Kid Flex.mp3", 
        cover: "imagenes/portada_default.jpg" 
    },

    5: { 
        title: "Yellow", 
        artist: "Coldplay", 
        src: "canciones 1/Yellow - Coldplay.mp3", 
        cover: "imagenes/portada_yellow.jpg" 
    },

    6: {
    title: "Odio a summer × muñequita",
    artist: "logan lower",
    src: "canciones 1/Odio a summer × logan lower - muñequita.mp3",
    cover: "imagenes/portada_default.jpg"
}
};

// ==========================================
// 3. NAVEGACIÓN PRINCIPAL
// ==========================================
function openWorld(worldId) {
    if (currentWorld !== 0) {
        worlds[currentWorld].classList.remove('active');
        worlds[currentWorld].classList.add('hidden');
    } else {
        menuScreen.classList.remove('active');
        menuScreen.classList.add('hidden');
    }

    const selectedWorld = worlds[worldId];
    
    if (!selectedWorld) {
        console.error(`No existe el mundo ${worldId}`);
        return;
    }
    
    selectedWorld.classList.remove('hidden');
    selectedWorld.classList.add('active');
    
    currentWorld = worldId;

    if (worldId === 2 && typeof prepareWorld2InitialState === 'function') {
        prepareWorld2InitialState({ force: true });
    }
    
    if (worldId <= totalWorlds) {
        
        markWorldAsVisited(worldId);
    }
    
    loadSongData(worldId);
    
    if (worldId === 6) {
        if (typeof initWorld6Scene === 'function') {
            initWorld6Scene();
        }
        
        if (typeof resetWorld6State === 'function') {
            resetWorld6State();
        }
        audio.currentTime = 0;
    }

    try {
        if (worldId === 1) {
             initGalaxy();
             
             if (galaxyRenderer && galaxyCamera && galaxyComposer) {
            const { width, height } = getGalaxyRenderSize();

            galaxyCamera.aspect = width / height;
            galaxyCamera.updateProjectionMatrix();

            galaxyRenderer.setSize(width, height);
            galaxyComposer.setSize(width, height);
        }
        }

        if (worldId === 3) {
            resetBillieCinema();
        }

        if (worldId === 4) {
        if (typeof resetWorld4State === 'function') {
            resetWorld4State();
        }

        if (typeof updateWorld4Scene === 'function') {
            updateWorld4Scene(0);
        }
        }

    if (worldId === 5) initYellowWorld();
    } catch (error) {
        console.error("Error inicializando mundo:", error);
    }

    // Si es el mundo 3, NO reproducimos el audio inmediatamente
    if (worldId === 3) {
        audio.pause();
        audio.currentTime = 0;
        isPlaying = false;
        updatePlayButton();
    } else {
        audio.play().then(() => {
            isPlaying = true;
            updatePlayButton();
        }).catch(e => console.log("Se requiere interacción previa", e));
    }
}

function goBack() {
    audio.pause();
    isPlaying = false;
    updatePlayButton();
    audio.currentTime = 0;

    worlds[currentWorld].classList.remove('active');
    worlds[currentWorld].classList.add('hidden');

    resetEffects();

    menuScreen.classList.remove('hidden');
    menuScreen.classList.add('active');
    currentWorld = 0;
    updateVisitedCounter();

    clearTimeout(world3IntroTimer);
    
    const world3 = document.getElementById('world-3');
    if (world3) {
        world3.classList.remove('cinema-intro-active', 'show-billie-note');
    }
}

// ==========================================
// 4. LÓGICA DEL REPRODUCTOR FLOTANTE
// ==========================================
function togglePlayer(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (!floatingPlayer) return;

    const willOpen =
        floatingPlayer.classList.contains('hidden-player') ||
        !floatingPlayer.classList.contains('active-player');

    floatingPlayer.classList.toggle('hidden-player', !willOpen);
    floatingPlayer.classList.toggle('active-player', willOpen);

    const toggleBtn = document.getElementById('toggle-player-btn');

    if (toggleBtn) {
        toggleBtn.classList.toggle('player-toggle-open', willOpen);
        toggleBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        toggleBtn.setAttribute('aria-label', willOpen ? 'Cerrar reproductor' : 'Abrir reproductor');

        const icon = toggleBtn.querySelector('i');

        if (icon) {
            icon.className = willOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-music';
        }
    }
}

function loadSongData(id) {
    const song = playlist[id];

    playerTitle.textContent = song.title;
    playerArtist.textContent = song.artist;

    audio.pause();
    audio.preload = 'auto';
    audio.src = song.src;
    audio.load();

    try {
        audio.currentTime = 0;
    } catch (e) {
        // Algunos navegadores no dejan cambiar currentTime hasta cargar metadata.
    }

    progressBar.value = 0;
    currentTimeEl.textContent = '0:00';
    durationEl.textContent = '0:00';
}

function togglePlay() {
    if (currentWorld === 0 && !finalScreenMusicActive && !extraTrackMode) return;

    if (isPlaying) {
        audio.pause();
        isPlaying = false;
    } else {
        audio.play().then(() => {
            isPlaying = true;
            updatePlayButton();
        }).catch(e => console.log("No se pudo reproducir todavía", e));
        return;
    }

    updatePlayButton();
}

function updatePlayButton() {
    playerPlayBtn.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
}

function nextWorld() {
    if (currentWorld === 0 || currentWorld === 6) return;

    let next = currentWorld + 1;

    if (next > totalWorlds) {
        next = 1;
    }

    resetEffects();
    openWorld(next);
}

function prevWorld() {
    if (currentWorld === 0 || currentWorld === 6) return;

    let prev = currentWorld - 1;

    if (prev < 1) {
        prev = totalWorlds;
    }

    resetEffects();
    openWorld(prev);
}

// ==========================================
// 5. BARRA DE PROGRESO Y CONTROL DE TIEMPO
// ==========================================
function formatTime(time) {
    if (isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
});

progressBar.addEventListener('input', () => {
    audio.currentTime = (progressBar.value / 100) * audio.duration;

    if (typeof syncWorldVisualsToTime === 'function') {
        syncWorldVisualsToTime(audio.currentTime);
    }
});

audio.addEventListener('ended', () => {
    // Si estamos en la sala de playlist o rocola, NO avanzar automáticamente
    if (extraTrackMode || currentWorld === 0) {
        isPlaying = false;
        updatePlayButton();
        if (typeof setPlaylistRoomPlayButtonState === 'function') {
            setPlaylistRoomPlayButtonState(false);
        }
        return;
    }

    if (currentWorld > 0 && currentWorld <= totalWorlds) {
        setTimeout(nextWorld, 600);
    }
});

// ==========================================
// 6. EVENTOS SINCRONIZADOS Y EASTER EGGS
// ==========================================
const achievement = document.getElementById('minecraft-achievement');
const achievementTitle = document.getElementById('achievement-title');
const achievementDescription = document.getElementById('achievement-description');
const achievementIcon = document.getElementById('achievement-icon');
let achievementUnlocked = false;
let achievementTimeout;

const polaroidPiel = document.getElementById('polaroid-piel');
const polaroidLabios = document.getElementById('polaroid-labios');
const polaroidOjos = document.getElementById('polaroid-ojos');
const polaroidCorazon = document.getElementById('polaroid-corazon');

const walleStar = document.getElementById('walle-star');
const featherBurst = document.getElementById('feather-burst');
const sunflowerBurst = document.getElementById('sunflower-burst');
const world5Element = document.getElementById('world-5');
const yellowParticles = document.getElementById('yellow-particles');
const yellowSunflowers = document.getElementById('yellow-sunflowers');
const yellowMainTitle = document.getElementById('yellow-main-title');
const yellowMainText = document.getElementById('yellow-main-text');
const yellowHiddenNote = document.getElementById('yellow-hidden-note');
const yellowColorNote = document.getElementById('yellow-color-note');

const yellowStars = document.getElementById('yellow-stars');
const yellowStarMessage = document.getElementById('yellow-star-message');
const yellowSkyStars = document.getElementById('yellow-sky-stars');
const yellowFireCanvas = document.getElementById('yellow-fire-canvas');
const yellowFireCtx = yellowFireCanvas ? yellowFireCanvas.getContext('2d') : null;

let yellowFireParticles = [];
let yellowFireSparks = [];
let yellowFireAnimationId = null;
let yellowSecretInterval = null;
let yellowSkyStarsGenerated = false;
const yellowLyricMain = document.getElementById('yellow-lyric-main');
const yellowLyricNext = document.getElementById('yellow-lyric-next');
const yellowLyricsBox = document.querySelector('.yellow-lyrics-box');
const yellowLyricsPanel = document.getElementById('yellow-lyrics-panel');
const yellowLyricsToggle = document.getElementById('yellow-lyrics-toggle');
const yellowLyricsClose = document.getElementById('yellow-lyrics-close');
const yellowLyricsScroll = document.getElementById('yellow-lyrics-scroll');
let yellowLyricsPanelRendered = false;
let yellowActivePanelLyricIndex = -1;
let yellowSkyStarsLayer = document.getElementById('yellow-sky-stars');
let yellowHighlightStarsLayer = document.getElementById('yellow-highlight-stars');


let yellowNoteShown = false;
let yellowAchievementTriggered = false;
let yellowInitialStarsAchievementTriggered = false;
let yellowSecondaryAchievementTriggered = false;
let yellowInteractionCount = 0;
let yellowParticleInterval = null;
let yellowStarsGenerated = false;
let yellowFirstStarAchievementShown = false;
let yellowSecretStarAchievementShown = false;
let yellowCurrentLyricIndex = -1;
let yellowStarMessageTimeout = null;
let world1VoiceTriggered = false;
let world2AchievementTriggered = false;
let world3AchievementTriggered = false;
let world4AchievementTriggered = false;
let world3IntroTimer = null;


// REEMPLAZA TODA LA FUNCIÓN showAchievement
function showAchievement(title, description, duration = 4500, style = 'minecraft') {
    const achievementEl = document.getElementById('minecraft-achievement');
    const iconEl = document.getElementById('achievement-icon');
    const titleEl = document.getElementById('achievement-title');
    const descEl = document.getElementById('achievement-description');

    if (!achievementEl) return;
    const mobileLandscapeAchievement =
    window.matchMedia &&
    window.matchMedia('(hover: none) and (pointer: coarse) and (orientation: landscape) and (max-height: 560px)').matches;

    if (mobileLandscapeAchievement) {
    duration = Math.min(duration, style === 'roblox' ? 2400 : 2600);
    }

    achievementEl.classList.remove('achievement-minecraft', 'achievement-roblox', 'achievement-visible');
    void achievementEl.offsetWidth; // Fuerza al navegador a reiniciar la animación

    if (style === 'roblox') {
        achievementEl.classList.add('achievement-roblox');
        iconEl.src = 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Roblox_player_icon_black.svg';
        iconEl.style.filter = 'invert(1)';
    } else {
        achievementEl.classList.add('achievement-minecraft');
        iconEl.style.filter = 'none';

        // LECTURA INTELIGENTE (Busca tanto en el Título como en la Descripción)
        const text = (title + " " + description).toLowerCase();

        if (text.includes('estrella') || text.includes('cielo') || text.includes('brillo') || text.includes('galaxia') || text.includes('cosmógrafa')) {
            // Logros del espacio -> Estrella del Nether
            iconEl.src = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.2/assets/minecraft/textures/item/nether_star.png';
        } else if (text.includes('evidencia') || text.includes('piel') || text.includes('fotográfica') || text.includes('labios')) {
            // Mundo 2 (Fotos) -> Ítem de Papel
            iconEl.src = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.2/assets/minecraft/textures/item/paper.png';
        } else if (
            text.includes('café') ||
            text.includes('ojo') ||
            text.includes('ojos') ||
            text.includes('pantalla') ||
            text.includes('proyector') ||
            text.includes('fotograma')
        ) {
            // Mundo 3 -> Ojo de Ender
            iconEl.src = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.2/assets/minecraft/textures/item/ender_eye.png';
        } else if (text.includes('realidad') || text.includes('flor') || text.includes('girasol')) {
            // Mundo 4 (Atom Eve) -> Cristal del End (Energía rosa/morada)
            iconEl.src = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.2/assets/minecraft/textures/item/end_crystal.png';
        } else {
            // Por defecto -> Disco Cat
            iconEl.src = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.2/assets/minecraft/textures/item/music_disc_cat.png';
        }
    }

    titleEl.textContent = title;
    descEl.textContent = description;
    achievementEl.classList.add('achievement-visible');

    clearTimeout(achievementTimeout);
    achievementTimeout = setTimeout(() => {
        achievementEl.classList.remove('achievement-visible');
    }, duration);
}

function triggerBurst(container, symbol, extraClass, count = 16) {
    if (!container) return;

    container.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('span');
        particle.className = `effect-particle ${extraClass}`;
        particle.textContent = symbol;

        const angle = Math.random() * Math.PI * 2;
        const distance = 120 + Math.random() * 220;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        const rot = `${Math.random() * 320 - 160}deg`;

        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        particle.style.setProperty('--rot', rot);
        particle.style.animationDuration = `${2.1 + Math.random() * 1.2}s`;

        container.appendChild(particle);
    }

    setTimeout(() => {
        container.innerHTML = '';
    }, 3200);
}

function spawnBlueSpark() {
    if (currentWorld !== 5 || secretErrorsFound.has(5)) return;
    if (!yellowFireCanvas || !yellowFireCtx) return;

    /*
        IMPORTANTE:
        Usamos el rect CSS, no yellowFireCanvas.width/height.
        En celulares con DPR alto, canvas.width está multiplicado por DPR,
        pero el contexto ya fue escalado con setTransform(dpr,...).
        Si usamos canvas.width, la chispa nace fuera de la flama visible.
    */
    const rect = yellowFireCanvas.getBoundingClientRect();
    const width = rect.width || yellowFireCanvas.clientWidth || 1;
    const height = rect.height || yellowFireCanvas.clientHeight || 1;

    const baseX = width / 2;
    const baseY = height * 0.91;

    yellowFireSparks.push({
        x: baseX + (Math.random() - 0.5) * 18,
        y: baseY - (4 + Math.random() * 7),

        vx: (Math.random() - 0.5) * 0.55,
        vy: -(1.15 + Math.random() * 0.45),

        size: 3.0 + Math.random() * 0.9,
        life: 0,
        maxLife: 130 + Math.random() * 22,
        alpha: 0.92,

        pulse: Math.random() * Math.PI * 2,
        isSecretBlue: true
    });
}

function initYellowWorld() {
    if (!world5Element) return;

    if (!world5Element.classList.contains('world-5')) {
        world5Element.classList.add('world-5');
    }

    yellowSkyStarsLayer = document.getElementById('yellow-sky-stars');
    yellowHighlightStarsLayer = document.getElementById('yellow-highlight-stars');

    if (!yellowSkyStarsLayer) {
        const el = document.createElement('div');
        el.id = 'yellow-sky-stars';
        el.className = 'yellow-sky-stars';
        world5Element.appendChild(el);
        yellowSkyStarsLayer = el;
    }

    if (!yellowHighlightStarsLayer) {
        const el = document.createElement('div');
        el.id = 'yellow-highlight-stars';
        el.className = 'yellow-highlight-stars';
        world5Element.appendChild(el);
        yellowHighlightStarsLayer = el;
    }

    yellowInteractionCount = 0;
    yellowFirstStarAchievementShown = false;
    yellowSecretStarAchievementShown = false;
    yellowNoteShown = false;
    yellowAchievementTriggered = false;
    yellowSecondaryAchievementTriggered = false;
    yellowStarsGenerated = false;
    yellowCurrentLyricIndex = -1;
    yellowInitialStarsAchievementTriggered = false;

    if (yellowHiddenNote) yellowHiddenNote.classList.remove('show');
    if (yellowColorNote) yellowColorNote.classList.remove('show');
    if (yellowStars) yellowStars.innerHTML = '';
    if (yellowHighlightStarsLayer) yellowHighlightStarsLayer.innerHTML = '';
    if (yellowStarMessage) yellowStarMessage.classList.remove('show');

    world5Element.classList.remove('lit', 'show-stars', 'show-lyrics');
    world5Element.style.setProperty('--yellow-progress', 0.02);

    if (yellowMainTitle) yellowMainTitle.textContent = 'Para tus madrugadas';
    if (yellowMainText) yellowMainText.textContent = 'Me dijiste que las noches largas te asustan, y que le temes a que el universo se apague, por eso te programé este cielo. Aquí las estrellas no mueren, solo están ahí para hacerte compañía en tu insomnio, y brillan para ti';
    if (yellowLyricMain) yellowLyricMain.textContent = 'Todo empieza en la oscuridad';
    if (yellowLyricNext) yellowLyricNext.textContent = 'y poco a poco se enciende';

    // BUGS ELIMINADOS. El código fluye directo a generar las estrellas y el fuego.
    generateYellowSkyStars();
    startYellowFire();
    renderYellowLyricsPanel();
    yellowActivePanelLyricIndex = -1;

    // Iniciar el generador de la chispa azul
    yellowSecretInterval = setInterval(spawnBlueSpark, 6500);

/* Primer intento un poco antes para que no parezca que no existe */
setTimeout(() => {
    if (currentWorld === 5 && !secretErrorsFound.has(5)) {
        spawnBlueSpark();
    }
}, 6000);
}

function resetYellowWorld() {

    if (yellowSecretInterval) {
        clearInterval(yellowSecretInterval);
        yellowSecretInterval = null;
    }

    if (yellowParticleInterval) {
        clearInterval(yellowParticleInterval);
        yellowParticleInterval = null;
    }

    if (!world5Element) return;

    if (yellowParticles) yellowParticles.innerHTML = '';
    if (yellowSunflowers) yellowSunflowers.innerHTML = '';
    if (yellowStars) yellowStars.innerHTML = '';

    if (yellowSkyStarsLayer) {
        yellowSkyStarsLayer.innerHTML = '';
    }
    if (yellowHighlightStarsLayer) {
        yellowHighlightStarsLayer.innerHTML = '';
    }

    if (yellowHiddenNote) yellowHiddenNote.classList.remove('show');
    if (yellowColorNote) yellowColorNote.classList.remove('show');
    if (yellowStarMessage) yellowStarMessage.classList.remove('show');

    world5Element.classList.remove('lit');
    world5Element.classList.remove('show-stars');
    world5Element.classList.remove('show-lyrics');
    world5Element.style.setProperty('--yellow-progress', 0);

    if (yellowMainTitle) {
        yellowMainTitle.textContent = 'Para tus madrugadas';
    }

    if (yellowMainText) {
        yellowMainText.textContent =
            'Me dijiste que las noches largas te asustan, y que le temes a que el universo se apague. Por eso te programé este cielo. Aquí las estrellas no mueren. Solo están ahí para hacerte compañía en tu insomnio... y brillan para ti.';
    }

    if (yellowLyricMain) yellowLyricMain.textContent = 'Todo empieza en la oscuridad...';
    if (yellowLyricNext) yellowLyricNext.textContent = 'y poco a poco se enciende.';

    yellowNoteShown = false;
    yellowAchievementTriggered = false;
    yellowSecondaryAchievementTriggered = false;
    yellowInteractionCount = 0;
    yellowFirstStarAchievementShown = false;
    yellowSecretStarAchievementShown = false;
    yellowStarsGenerated = false;
    yellowCurrentLyricIndex = -1;
    yellowInitialStarsAchievementTriggered = false;
    stopYellowFire();

    if (yellowLyricsPanel) {
        yellowLyricsPanel.classList.add('hidden');
    }

    yellowActivePanelLyricIndex = -1;
}

function resizeYellowFireCanvas() {
    if (!yellowFireCanvas || !yellowFireCtx) return;

    const app = getAppSize();
    const rect = yellowFireCanvas.getBoundingClientRect();

    const cssWidth = rect.width || app.width;
    const cssHeight = rect.height || app.height;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    yellowFireCanvas.width = Math.max(1, Math.floor(cssWidth * dpr));
    yellowFireCanvas.height = Math.max(1, Math.floor(cssHeight * dpr));

    yellowFireCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function generateYellowSkyStars() {
    if (!yellowSkyStarsLayer) return;

    yellowSkyStarsLayer.innerHTML = '';
    
    yellowSkyStarsLayer.style.display = 'block';
    yellowSkyStarsLayer.style.opacity = '1';
    yellowSkyStarsLayer.style.zIndex = '5'; 

    const total = window.innerWidth < 768 ? 60 : 90; 

    for (let i = 0; i < total; i++) {
        const star = document.createElement('span');
        star.className = 'yellow-sky-star';

        const rand = Math.random();
        let size = (rand < 0.70) ? (1.5 + Math.random() * 1.5) :
                   (rand < 0.92) ? (2.5 + Math.random() * 1.0) :
                                   (3.5 + Math.random() * 1.0);

        const left = Math.random() * 100;
        const top = Math.random() * 65; 

        // Estilos inyectados a prueba de fallos
        star.style.cssText = `
            position: absolute !important;
            left: ${left}% !important;
            top: ${top}% !important;
            width: ${size}px !important;
            height: ${size}px !important;
            background-color: #ffffff !important;
            border-radius: 50% !important;
            opacity: ${(0.3 + Math.random() * 0.5).toFixed(2)} !important;
            box-shadow: 0 0 ${size}px rgba(200, 220, 255, 0.45) !important;
            animation: yellowSkyTwinkleFinal ${2 + Math.random() * 4}s ease-in-out infinite alternate !important;
            animation-delay: ${Math.random() * 5}s !important;
            pointer-events: none !important;
            z-index: 1 !important;
        `;

        yellowSkyStarsLayer.appendChild(star);
    }
}



// emitYellowFireParticle definida más abajo (solo una vez)

function startYellowFire() {
    if (!yellowFireCanvas || !yellowFireCtx) return;

    resizeYellowFireCanvas();

    if (yellowFireAnimationId) {
        cancelAnimationFrame(yellowFireAnimationId);
    }

    yellowFireParticles = [];
    yellowFireSparks = [];

    animateYellowFire();
}

function stopYellowFire() {
    if (yellowFireAnimationId) {
        cancelAnimationFrame(yellowFireAnimationId);
        yellowFireAnimationId = null;
    }

    if (yellowFireCtx && yellowFireCanvas) {
        const rect = yellowFireCanvas.getBoundingClientRect();
        yellowFireCtx.clearRect(0, 0, rect.width, rect.height);
    }

    yellowFireParticles = [];
    yellowFireSparks = [];
}

function emitYellowFireParticle(width, height, progress) {
    const baseX = width / 2;
    const baseY = height * 0.88;

    /*
        Diseño visual recuperado del código antiguo:
        una flama baja, suave y realista, no una columna agresiva.
        El progreso actual sigue controlando intensidad, cantidad y altura.
    */
    const eased = Math.max(0, Math.min(1, progress || 0));
    const spread = 24 + eased * 22;

    const particle = {
        x: baseX + (Math.random() - 0.5) * spread,
        y: baseY + Math.random() * 8,

        vx: (Math.random() - 0.5) * (0.45 + eased * 0.55),
        vy: -(0.42 + Math.random() * 0.78 + eased * 0.45),

        size: 11 + Math.random() * 15 + eased * 8,

        life: 0,
        maxLife: 42 + Math.random() * 24,

        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.045 + Math.random() * 0.035,

        heightLimit: height * (0.18 + eased * 0.24)
    };

    yellowFireParticles.push(particle);

    /* Brasas antiguas: discretas, cálidas y pequeñas. */
    if (Math.random() < 0.22 + eased * 0.18) {
        yellowFireSparks.push({
            x: baseX + (Math.random() - 0.5) * (44 + eased * 36),
            y: baseY - Math.random() * 8,
            vx: (Math.random() - 0.5) * (0.55 + eased * 0.65),
            vy: -(0.8 + Math.random() * 1.4 + eased * 0.65),
            size: 0.8 + Math.random() * 1.7,
            life: 0,
            maxLife: 70 + Math.random() * 45,
            alpha: 0.28 + Math.random() * 0.35
        });
    }
}

function drawYellowFireParticle(ctx, p, progress) {
    const t = p.life / p.maxLife;

    /* Aparece, vive un poco y se apaga como el diseño antiguo. */
    const fadeIn = Math.min(1, t / 0.18);
    const fadeOut = Math.max(0, 1 - t);
    const fade = fadeIn * fadeOut;

    if (fade <= 0.003) return;

    const eased = Math.max(0, Math.min(1, progress || 0));

    /* Más tipo sombra/luz viva que fuego vectorial violento. */
    const radiusX = p.size * (0.95 + t * 0.18);
    const radiusY = p.size * (1.45 - t * 0.22);

    const sway = Math.sin(p.wobble) * (2.5 + eased * 3.5);
    const x = p.x + sway;
    const y = p.y;

    ctx.save();

    /* Halo exterior suave: esta es la apariencia antigua realista. */
    const outerGlow = ctx.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        radiusY * 1.6
    );
    outerGlow.addColorStop(0.00, `rgba(255, 190, 70, ${0.025 * fade})`);
    outerGlow.addColorStop(0.35, `rgba(255, 140, 25, ${0.045 * fade})`);
    outerGlow.addColorStop(0.70, `rgba(255, 95, 10, ${0.028 * fade})`);
    outerGlow.addColorStop(1.00, `rgba(0, 0, 0, 0)`);

    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX * 1.5, radiusY * 1.7, 0, 0, Math.PI * 2);
    ctx.fill();

    /* Núcleo suave: dorado detrás del fondo, sin masa blanca. */
    const innerGlow = ctx.createRadialGradient(
        x,
        y - radiusY * 0.12,
        0,
        x,
        y,
        radiusY
    );
    innerGlow.addColorStop(0.00, `rgba(255, 230, 120, ${0.05 * fade})`);
    innerGlow.addColorStop(0.25, `rgba(255, 185, 60, ${0.07 * fade})`);
    innerGlow.addColorStop(0.55, `rgba(255, 120, 25, ${0.05 * fade})`);
    innerGlow.addColorStop(1.00, `rgba(0, 0, 0, 0)`);

    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function animateYellowFire() {
    if (!yellowFireCanvas || !yellowFireCtx || currentWorld !== 5) {
        yellowFireAnimationId = null;
        return;
    }

    const rect = yellowFireCanvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const progress = world5Element
        ? Number(getComputedStyle(world5Element).getPropertyValue('--yellow-progress')) || 0
        : 0;

    const ctx = yellowFireCtx;

    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    /*
        Emisión del código antiguo, conservando el progreso actual:
        empieza leve y crece, pero sin convertirse en una llamarada violenta.
    */
    const emitCount = Math.floor(1 + progress * 3);

    for (let i = 0; i < emitCount; i++) {
        emitYellowFireParticle(width, height, progress);
    }

    /* Limitador del diseño antiguo para no saturar ni congelar móvil. */
    if (yellowFireParticles.length > 90) {
        yellowFireParticles.splice(0, yellowFireParticles.length - 90);
    }
    if (yellowFireSparks.length > 35) {
        yellowFireSparks.splice(0, yellowFireSparks.length - 35);
    }

    const baseX = width / 2;
    const baseY = height * 0.91;

    /* Piso de luz antiguo: cálido, bajo, contenido y progresivo. */
    const baseGlow = ctx.createRadialGradient(
        baseX,
        baseY,
        0,
        baseX,
        baseY,
        120 + progress * 90
    );

    baseGlow.addColorStop(0, `rgba(255,220,120,${0.05 + progress * 0.08})`);
    baseGlow.addColorStop(0.28, `rgba(255,165,50,${0.05 + progress * 0.07})`);
    baseGlow.addColorStop(0.58, `rgba(255,100,20,${0.03 + progress * 0.05})`);
    baseGlow.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = baseGlow;
    ctx.beginPath();
    ctx.ellipse(
        baseX,
        baseY,
        150 + progress * 95,
        52 + progress * 40,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    yellowFireParticles = yellowFireParticles.filter(p => {
        p.life++;

        const t = p.life / p.maxLife;
        p.wobble += p.wobbleSpeed;

        /* Movimiento antiguo: serpentea y sube sin abrirse demasiado. */
        p.x += p.vx + Math.sin(p.wobble) * (0.42 + progress * 0.75);
        p.y += p.vy - Math.sin(t * Math.PI) * (0.20 + progress * 0.34);

        const centerPull = (width / 2 - p.x) * (0.004 + t * 0.012);
        p.x += centerPull;

        const maxRise = height * (0.46 + progress * 0.10);
        const topLimit = height * 0.91 - maxRise;

        if (p.y < topLimit) return false;

        drawYellowFireParticle(ctx, p, progress);
        return p.life < p.maxLife;
    });

    yellowFireSparks = yellowFireSparks.filter(s => {
        s.life++;

        const t = s.life / s.maxLife;
        const alpha = s.alpha * Math.pow(1 - t, 1.15);

        s.x += (s.vx || 0) + Math.sin(t * 10) * 0.18;
        s.y += s.vy || 0;
        if (typeof s.vy === 'number') s.vy *= 0.990;

        if (s.isSecretBlue) {
            const mobileLandscapeSecret =
                window.matchMedia &&
                window.matchMedia('(hover: none) and (pointer: coarse) and (orientation: landscape) and (max-height: 560px)').matches;

            const pulse = 1 + Math.sin(s.life * 0.20 + (s.pulse || 0)) * 0.065;
            const boost = mobileLandscapeSecret ? 1.04 : 1;

            const flameW = s.size * 0.82 * pulse * boost;
            const flameH = s.size * 1.82 * pulse * boost;

            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(Math.sin(s.life * 0.12 + (s.pulse || 0)) * 0.075);

            /* Halo azul MUY suave, sin aro circular pesado. */
            const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, flameH * 1.45);
            glow.addColorStop(0.00, `rgba(155, 235, 255, ${alpha * 0.12})`);
            glow.addColorStop(0.46, `rgba(55, 165, 255, ${alpha * 0.055})`);
            glow.addColorStop(1.00, `rgba(55, 165, 255, 0)`);

            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.ellipse(0, 0, flameW * 1.05, flameH * 1.02, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(105, 218, 255, ${alpha * 0.70})`;
            ctx.shadowColor = `rgba(60, 190, 255, ${alpha * 0.40})`;
            ctx.shadowBlur = mobileLandscapeSecret ? 8 : 7;

            ctx.beginPath();
            ctx.moveTo(0, -flameH * 1.14);
            ctx.quadraticCurveTo(flameW * 0.92, -flameH * 0.16, flameW * 0.46, flameH * 0.84);
            ctx.quadraticCurveTo(0, flameH * 1.02, -flameW * 0.46, flameH * 0.84);
            ctx.quadraticCurveTo(-flameW * 0.92, -flameH * 0.16, 0, -flameH * 1.14);
            ctx.closePath();
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.fillStyle = `rgba(235, 250, 255, ${Math.min(1, alpha * 0.70)})`;
            ctx.beginPath();
            ctx.ellipse(0, -flameH * 0.10, flameW * 0.28, flameH * 0.48, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            s.size *= 0.996;
        } else {
            ctx.fillStyle = `rgba(255,185,55,${alpha})`;
            ctx.shadowColor = 'rgba(255,132,0,0.85)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        return s.life < s.maxLife;
    });

    ctx.globalCompositeOperation = 'source-over';

    yellowFireAnimationId = requestAnimationFrame(animateYellowFire);
}


function spawnSunflower(x, y) {
    if (!yellowSunflowers) return;

    const bloom = document.createElement('span');
    bloom.className = 'sunflower-bloom';
    bloom.textContent = '🌻';
    bloom.style.left = `${x}px`;
    bloom.style.top = `${y}px`;

    yellowSunflowers.appendChild(bloom);

    setTimeout(() => {
        bloom.remove();
    }, 1900);
}

// ==========================================
// INTERACCIÓN MUNDO 5 (YELLOW) REPARADA
// ==========================================
function handleYellowInteraction(clientX, clientY) {
    if (currentWorld !== 5) return;
    if (window.__yellowStarTouchLock) return;

    if (!secretErrorsFound.has(5) && yellowFireCanvas) {
        const rect = yellowFireCanvas.getBoundingClientRect();

        /* Si el toque NO cae dentro del canvas del fuego, no buscamos la chispa azul.
           Esto evita falsos positivos al tocar estrellas amarillas arriba. */
        if (
            clientX < rect.left ||
            clientX > rect.right ||
            clientY < rect.top ||
            clientY > rect.bottom
        ) {
            return;
        }

        /*
        El fuego se dibuja en coordenadas CSS porque el contexto ya fue escalado
        con DPR en resizeYellowFireCanvas().
        Por eso el toque también debe quedar en coordenadas CSS.
        */
        const touchX = clientX - rect.left;
        const touchY = clientY - rect.top;

        const mobileLandscape =
            window.matchMedia &&
            window.matchMedia('(hover: none) and (pointer: coarse) and (orientation: landscape) and (max-height: 560px)').matches;

        const hitRadius = mobileLandscape ? 34 : 65;

        for (let i = 0; i < yellowFireSparks.length; i++) {
            const s = yellowFireSparks[i];

            if (s.isSecretBlue) {
                const dist = Math.hypot(s.x - touchX, s.y - touchY);

                if (dist < hitRadius) {
                    unlockSecretError(5, 'world5_secret');
                    yellowFireSparks.splice(i, 1);

                    /*
                        Safety net: el secreto no debe matar la flama amarilla.
                        Si por cualquier microcorte el loop quedó sin frame, lo reactivamos
                        sin resetear partículas ni tocar el progreso de la canción.
                    */
                    if (currentWorld === 5 && yellowFireCanvas && yellowFireCtx && !yellowFireAnimationId) {
                        yellowFireAnimationId = requestAnimationFrame(animateYellowFire);
                    }

                    if (yellowStarMessage) {
                        yellowStarMessage.innerHTML = `[ ERROR 5/5: Memoria corrompida ]`;
                        yellowStarMessage.classList.add('show', 'glitch-text');

                        setTimeout(() => {
                            yellowStarMessage.classList.remove('show');
                            setTimeout(() => yellowStarMessage.classList.remove('glitch-text'), 500);
                        }, 3200);
                    }

                    break;
                }
            }
        }
    }
}
const yellowTimedLyrics = [
    { time: 0, main: '', next: '' },

    { time: 33, main: 'Look at the stars', next: '' },
    { time: 36, main: 'Look how they shine for you', next: '' },
    { time: 42, main: 'And everything you do', next: '' },
    { time: 48, main: 'Yeah, they were all yellow', next: '' },

    { time: 50, main: 'I came along', next: '' },
    { time: 53, main: 'I wrote a song for you', next: '' },
    { time: 58, main: 'And all the things you do', next: '' },
    { time: 64, main: 'And it was called, "Yellow"', next: '' },

    { time: 69, main: 'So, then I took my turn', next: '' },
    { time: 75, main: 'Oh, what a thing to have done', next: '' },
    { time: 81, main: 'And it was all yellow', next: '' },

    { time: 88, main: 'Your skin, oh yeah, your skin and bones', next: '' },
    { time: 94, main: 'Turn into something beautiful', next: '' },
    { time: 99, main: 'You know I love you so', next: '' },
    { time: 108, main: 'You know I love you so', next: '' },

    { time: 133, main: 'I swam across', next: '' },
    { time: 135, main: 'I jumped across for you', next: '' },
    { time: 141, main: 'Oh, what a thing to do', next: '' },
    { time: 147, main: "'Cause you were all yellow", next: '' },

    { time: 149, main: 'I drew a line', next: '' },
    { time: 152, main: 'I drew a line for you', next: '' },
    { time: 158, main: 'Oh, what a thing to do', next: '' },
    { time: 163, main: 'And it was all yellow', next: '' },

    { time: 171, main: 'Your skin, oh yeah, your skin and bones', next: '' },
    { time: 176, main: 'Turn into something beautiful', next: '' },
    { time: 182, main: "For you, I'd bleed myself dry", next: '' },
    { time: 191, main: "For you, I'd bleed myself dry", next: '' },

    { time: 215, main: "It's true", next: '' },
    { time: 219, main: 'Look how they shine for you', next: '' },
    { time: 224, main: 'Look how they shine for you', next: '' },
    { time: 230, main: 'Look how they shine for', next: '' },
    { time: 235, main: 'Look how they shine for you', next: '' },
    { time: 240, main: 'Look how they shine for you', next: '' },
    { time: 246, main: 'Look how they shine', next: '' },

    { time: 249, main: 'Look at the stars', next: '' },
    { time: 251, main: 'Look how they shine for you', next: '' },
    { time: 257, main: 'And all the things that you do', next: '' },

    { time: 263, main: '', next: '' }
];
const yellowLyricsTimeline = [
    { start: 33, end: 36, text: 'Look at the stars' },
    { start: 36, end: 41, text: 'Look how they shine for you' },
    { start: 42, end: 45, text: 'And everything you do' },
    { start: 48, end: 50, text: 'Yeah, they were all yellow' },

    { start: 50, end: 53, text: 'I came along' },
    { start: 53, end: 56, text: 'I wrote a song for you' },
    { start: 58, end: 61, text: 'And all the things you do' },
    { start: 64, end: 69, text: 'And it was called, "Yellow"' },

    { start: 69, end: 73, text: 'So, then I took my turn' },
    { start: 75, end: 78, text: 'Oh, what a thing to have done' },
    { start: 81, end: 83, text: 'And it was all yellow' },

    { start: 88, end: 94, text: '(Ah) your skin, oh yeah, your skin, and bones' },
    { start: 94, end: 99, text: '(Ooh) turn into something beautiful' },
    { start: 99, end: 104, text: '(Ah) and you know, you know I love you so' },
    { start: 108, end: 110, text: 'You know I love you so' },

    { start: 133, end: 135, text: 'I swam across' },
    { start: 135, end: 138, text: 'I jumped across for you' },
    { start: 141, end: 144, text: 'Oh, what a thing to do' },
    { start: 147, end: 149, text: "'Cause you were all yellow" },

    { start: 149, end: 152, text: 'I drew a line' },
    { start: 152, end: 156, text: 'I drew a line for you' },
    { start: 158, end: 161, text: 'Oh, what a thing to do' },
    { start: 163, end: 166, text: 'And it was all yellow' },

    { start: 171, end: 176, text: '(Ah) and your skin, oh yeah, your skin, and bones' },
    { start: 176, end: 182, text: '(Ooh) turn into something beautiful' },
    { start: 182, end: 188, text: "(Ah) and you know, for you, I'd bleed myself dry" },
    { start: 191, end: 194, text: "For you, I'd bleed myself dry" },

    { start: 215, end: 217, text: "It's true" },
    { start: 219, end: 222, text: 'Look how they shine for you' },
    { start: 224, end: 228, text: 'Look how they shine for you' },
    { start: 230, end: 231, text: 'Look how they shine for' },
    { start: 235, end: 239, text: 'Look how they shine for you' },
    { start: 240, end: 245, text: 'Look how they shine for you' },
    { start: 246, end: 248, text: 'Look how they shine' },

    { start: 249, end: 251, text: 'Look at the stars' },
    { start: 251, end: 254, text: 'Look how they shine for you' },
    { start: 257, end: 262, text: 'And all the things that you do' }
];
function updateYellowLyrics(current) {
    if (!yellowLyricMain || !yellowLyricNext) return;

    let selectedIndex = 0;

    for (let i = 0; i < yellowTimedLyrics.length; i++) {
        if (current >= yellowTimedLyrics[i].time) {
            selectedIndex = i;
        } else {
            break;
        }
    }

    if (selectedIndex === yellowCurrentLyricIndex) return;

    yellowCurrentLyricIndex = selectedIndex;
    const lyric = yellowTimedLyrics[selectedIndex];

    if (yellowLyricsBox) {
        yellowLyricsBox.classList.add('change');
    }

    setTimeout(() => {
        yellowLyricMain.textContent = lyric.main;
        yellowLyricNext.textContent = lyric.next || '';

        if (yellowLyricsBox) {
            yellowLyricsBox.classList.remove('change');
        }
    }, 220);
}
function renderYellowLyricsPanel() {
    if (!yellowLyricsScroll || yellowLyricsPanelRendered) return;

    yellowLyricsScroll.innerHTML = '';

    yellowLyricsTimeline.forEach((line, index) => {
        const div = document.createElement('div');
        div.className = 'yellow-lyric-line';
        div.dataset.index = index;
        div.textContent = line.text;

        yellowLyricsScroll.appendChild(div);
    });

    yellowLyricsPanelRendered = true;
}

function updateYellowLyricsPanel(current) {
    if (!yellowLyricsScroll || !yellowLyricsPanelRendered) return;

    let activeIndex = -1;

    for (let i = 0; i < yellowLyricsTimeline.length; i++) {
        const line = yellowLyricsTimeline[i];

        if (current >= line.start && current < line.end) {
            activeIndex = i;
            break;
        }
    }

    if (activeIndex === yellowActivePanelLyricIndex) return;

    yellowActivePanelLyricIndex = activeIndex;

    const lines = yellowLyricsScroll.querySelectorAll('.yellow-lyric-line');

    lines.forEach((lineEl, index) => {
        lineEl.classList.remove('active', 'near');

        if (index === activeIndex) {
            lineEl.classList.add('active');

            const targetTop =
            lineEl.offsetTop -
            yellowLyricsScroll.clientHeight / 2 +
            lineEl.clientHeight / 2;

     yellowLyricsScroll.scrollTo({
        top: targetTop,
        behavior: 'smooth'
    });
        } else if (
            index === activeIndex - 1 ||
            index === activeIndex + 1 ||
            index === activeIndex + 2
        ) {
            lineEl.classList.add('near');
        }
    });
}

if (yellowLyricsToggle && yellowLyricsPanel) {
    yellowLyricsToggle.addEventListener('click', () => {
        renderYellowLyricsPanel();
        yellowLyricsPanel.classList.remove('hidden');
    });
}

if (yellowLyricsClose && yellowLyricsPanel) {
    yellowLyricsClose.addEventListener('click', () => {
        yellowLyricsPanel.classList.add('hidden');
    });
}

function createYellowStars(count = 34) {
    if (!yellowHighlightStarsLayer || yellowStarsGenerated) return;

    yellowStarsGenerated = true;
    yellowHighlightStarsLayer.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const star = document.createElement('button');
        star.type = 'button';
        star.className = 'yellow-highlight-star';

        placeYellowHighlightStar(star, true);

        star.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();

        window.__yellowStarTouchLock = true;
        setTimeout(() => {
            window.__yellowStarTouchLock = false;
        }, 180);

        star.classList.add('touched');
        showYellowStarMessage(e.clientX, e.clientY);

        setTimeout(() => {
        placeYellowHighlightStar(star, false);
            star.classList.remove('touched');
        }, 650);
    });

        yellowHighlightStarsLayer.appendChild(star);
    }
}

function placeYellowHighlightStar(star, firstTime = false) {
    const size = 4.5 + Math.random() * 5.5;
    const left = 6 + Math.random() * 88;
    const top = 6 + Math.random() * 42;
    const delay = firstTime ? Math.random() * 0.9 : 0;
    const twinkle = 1.7 + Math.random() * 2.8;
    const alpha = 0.72 + Math.random() * 0.25;

    star.style.left = `${left}%`;
    star.style.top = `${top}%`;
    star.style.setProperty('--size', `${size}px`);
    star.style.setProperty('--delay', `${delay}s`);
    star.style.setProperty('--twinkle', `${twinkle}s`);
    star.style.setProperty('--alpha', alpha.toFixed(2));
}

function showYellowStarMessage(x, y) {
    if (!yellowStarMessage) return;

    // Contamos primero para que el primer toque sea realmente el toque 1.
    yellowInteractionCount += 1;

    // Evolución narrativa según interacciones. Mantiene tus frases originales.
    if (yellowInteractionCount === 1) {
        yellowStarMessage.innerHTML = "Me contaste que te gustaría ser una estrella...";
    } else if (yellowInteractionCount === 4) {
        yellowStarMessage.innerHTML = "...para iluminar a los que se sienten solos de noche";
    } else if (yellowInteractionCount === 7) {
        yellowStarMessage.innerHTML = "Es un pensamiento muy bonito, pero se te olvida un detalle...";
    } else if (yellowInteractionCount === 10) {
        yellowStarMessage.innerHTML = "Tú también mereces que te iluminen , para eso las programé jsja";
    }
    // Para cualquier otro valor no se toca innerHTML → mantiene el texto de la última fase.

    yellowStarMessage.style.left = `${x}px`;
    yellowStarMessage.style.top = `${Math.max(90, y - 40)}px`;
    yellowStarMessage.classList.remove('glitch-text');
    yellowStarMessage.classList.add('show');

    clearTimeout(yellowStarMessageTimeout);
    yellowStarMessageTimeout = setTimeout(() => {
        yellowStarMessage.classList.remove('show');
    }, 2800);

    // Feedback normal al primer toque, sin marcar ningún error secreto.
    if (!yellowFirstStarAchievementShown) {
        yellowFirstStarAchievementShown = true;
        showAchievement('Curiosidad detectada', 'Buscando sentido en el brillo', 4200, 'minecraft');
    }

    // Regla real del Mundo 5: al tocar 10 estrellas amarillas, se desbloquea el logro normal.
    // El Error 5/5 queda reservado únicamente para la chispa azul secreta del fuego.
    if (yellowInteractionCount >= 10 && !yellowSecretStarAchievementShown) {
        yellowSecretStarAchievementShown = true;
        unlockTrophy('world5_yellow');
        growYellowGarden(8);
    }
}

function growYellowGarden(amount = 6) {
    if (!yellowSunflowers) return;

    for (let i = 0; i < amount; i++) {
        setTimeout(() => {
            const x = window.innerWidth * (0.18 + Math.random() * 0.64);
            const y = window.innerHeight * (0.66 + Math.random() * 0.24);
            spawnSunflower(x, y);
        }, i * 180);
    }
}

// Helpers de curva para la llama amarilla
function smoothstepYellow(t) {
    const c = Math.max(0, Math.min(1, t));
    return c * c * (3 - 2 * c);
}

function getYellowFireIntensity(progress) {
    // Curva más expresiva: arranca lento, crece con aceleración, llega a 1.0 al 100%
    // Fase 0–0.25 (inicio): suave, apenas perceptible
    // Fase 0.25–0.65 (desarrollo): crecimiento claro y evidente
    // Fase 0.65–1.0 (clímax): llama plena, viva, mágica
    if (progress < 0.25) {
        return smoothstepYellow(progress / 0.25) * 0.22;
    } else if (progress < 0.65) {
        const t = (progress - 0.25) / 0.40;
        return 0.22 + smoothstepYellow(t) * 0.50;
    } else {
        const t = (progress - 0.65) / 0.35;
        return 0.72 + smoothstepYellow(t) * 0.28;
    }
}

function updateYellowWorld(current, duration) {
    const progress = duration ? Math.min(current / duration, 1) : 0;

    const flameProgress = getYellowFireIntensity(progress);

    if (world5Element) {
        world5Element.style.setProperty('--yellow-progress', flameProgress.toFixed(3));
    }

    updateYellowLyrics(current);
    updateYellowLyricsPanel(current);
    
    if (yellowColorNote) {
        const showColorNote = current >= 14 && current <= 31;
        yellowColorNote.classList.toggle('show', showColorNote);
    }

    if (flameProgress > 0.22 && world5Element) {
        world5Element.classList.add('lit');
    }

    // Momentos importantes de Yellow
    const inInitialStarsMoment = current >= 33 && current <= 50;      // 0:33 - 0:50
    
    // NUEVO: Los dos coros fuertes donde entra la Aurora ("Your skin, oh yeah...")
    const isAuroraMoment = (current >= 87 && current <= 110) || (current >= 170 && current <= 194); 

    const inBleedMoment = current >= 182 && current <= 194;           // 3:02 - 3:14
    const inLongShineMoment = current >= 219 && current <= 248;       // 3:39 - 4:08
    const inFinalStarsMoment = current >= 249 && current <= 262;      // 4:09 - 4:22

    const showStrongStars =
        inInitialStarsMoment ||
        isAuroraMoment || /* Que las estrellas brillen fuerte con la aurora */
        inLongShineMoment ||
        inFinalStarsMoment;

    // Letras cinematográficas obligatorias SOLO en los momentos especificados
    const showForcedLyrics = inBleedMoment || inFinalStarsMoment;

    if (world5Element) {
        world5Element.classList.toggle('show-stars', showStrongStars);
        world5Element.classList.toggle('show-lyrics', showForcedLyrics);
        // NUEVO: Encender o apagar la aurora
        world5Element.classList.toggle('show-aurora', isAuroraMoment);
    }

    if (showStrongStars && !yellowStarsGenerated) {
        createYellowStars(48);
    }

    if (inInitialStarsMoment && !yellowInitialStarsAchievementTriggered) {
        yellowInitialStarsAchievementTriggered = true;

        showAchievement(
            '¡Logro desbloqueado!',
            'El cielo empezó a mirar',
            4800
        );
    }

    if (inBleedMoment && !yellowAchievementTriggered) {
        yellowAchievementTriggered = true;

        if (yellowMainTitle) {
            yellowMainTitle.textContent = 'Ok, eso ya fue demasiado sincero xd';
        }

        if (yellowMainText) {
            yellowMainText.textContent =
                'Hay partes de canciones que ya no parecen letra, parecen evidencia.';
        }

        showAchievement(
            '¡Logro desbloqueado!',
            'HP crítico, sentimiento máximo xd',
            4800
        );
    }

    if (inFinalStarsMoment && !yellowSecondaryAchievementTriggered) {
        yellowSecondaryAchievementTriggered = true;

        if (yellowMainTitle) {
            yellowMainTitle.textContent = 'Cada punto de luz entendió la tarea';
        }

        if (yellowMainText) {
            yellowMainText.textContent =
                'Y decidió quedarse brillando justo cuando debía.';
        }

        showAchievement(
            '¡Logro desbloqueado!',
            'Hasta el cielo entendió la tarea',
            5200
        );
    }
}



// ==========================================
// MUNDO 3: LETRAS SINCRONIZADAS (MP3 CORTO)
// ==========================================

const billieTimedLyrics = [
    { time: 0.00, main: "La película está por empezar...", next: "espero que hayas traído canchita" },
    { time: 3.00, main: "espero que hayas traído canchita", next: "I want you to stay" },
    
    { time: 3.55, main: "I want you to stay", next: "'Til I'm in the grave" },
    { time: 8.02, main: "'Til I'm in the grave", next: "'Til I rot away, dead and buried" },
    { time: 12.61, main: "'Til I rot away, dead and buried", next: "'Til I'm in the casket you carry" },
    { time: 17.08, main: "'Til I'm in the casket you carry", next: "If you go, I'm going too, uh" },
    { time: 21.59, main: "If you go, I'm going too, uh", next: "'Cause it was always you, alright" },
    { time: 26.27, main: "'Cause it was always you, alright", next: "And if I'm turnin' blue, please don't save me" },
    { time: 30.87, main: "And if I'm turnin' blue, please don't save me", next: "Nothing left to lose without my baby" },
    
    { time: 35.43, main: "Nothing left to lose without my baby", next: "Birds of a feather, we should stick together, I know" },
    { time: 41.45, main: "Birds of a feather, we should stick together, I know", next: "I said I'd never think I wasn't better alone" },
    { time: 46.06, main: "I said I'd never think I wasn't better alone", next: "Can't change the weather, might not be forever" },
    { time: 50.56, main: "Can't change the weather, might not be forever", next: "But if it's forever, it's even better" },
    
    { time: 54.52, main: "But if it's forever, it's even better", next: "And I don't know what I'm cryin' for" },
    { time: 59.77, main: "And I don't know what I'm cryin' for", next: "I don't think I could love you more" },
    { time: 64.70, main: "I don't think I could love you more", next: "It might not be long, but baby, I" },
    { time: 69.10, main: "It might not be long, but baby, I", next: "I'll love you 'til the day that I die" },
    
    { time: 75.28, main: "I'll love you 'til the day that I die", next: "'Til the day that I die" },
    { time: 80.62, main: "'Til the day that I die", next: "'Til the light leaves my eyes" },
    { time: 85.22, main: "'Til the light leaves my eyes", next: "'Til the day that I die" },
    
    { time: 89.72, main: "'Til the day that I die", next: "I want you to see, hm" },
    { time: 94.94, main: "I want you to see, hm", next: "How you look to me, hm" },
    { time: 99.66, main: "How you look to me, hm", next: "You wouldn't believe if I told ya" },
    { time: 104.18, main: "You wouldn't believe if I told ya", next: "You would keep the compliments I throw ya" },
    
    { time: 108.56, main: "You would keep the compliments I throw ya", next: "But you're so full of shit, uh" },
    { time: 112.92, main: "But you're so full of shit, uh", next: "Tell me it's a bit, no" },
    { time: 117.77, main: "Tell me it's a bit, no", next: "Say you don't see it, your mind's polluted" },
    { time: 122.45, main: "Say you don't see it, your mind's polluted", next: "Say you wanna quit, don't be stupid" },
    
    { time: 126.96, main: "Say you wanna quit, don't be stupid", next: "And I don't know what I'm cryin' for" },
    { time: 133.13, main: "And I don't know what I'm cryin' for", next: "I don't think I could love you more" },
    { time: 137.85, main: "I don't think I could love you more", next: "Might not be long, but baby, I" },
    { time: 142.29, main: "Might not be long, but baby, I", next: "Don't wanna say goodbye" },
    
    { time: 149.13, main: "Don't wanna say goodbye", next: "Birds of a feather, we should stick together..." },
    { time: 151.29, main: "Birds of a feather, we should stick together, I know ('til the day that I die)", next: "I said I'd never think I wasn't better alone ('til the light leaves my eyes)" },
    { time: 155.77, main: "I said I'd never think I wasn't better alone ('til the light leaves my eyes)", next: "Can't change the weather, might not be forever ('til the day I die)" },
    { time: 160.46, main: "Can't change the weather, might not be forever ('til the day I die)", next: "But if it's forever, it's even better" },
    
    { time: 165.11, main: "But if it's forever, it's even better", next: "I knew you in another life" },
    { time: 169.83, main: "I knew you in another life", next: "You had that same look in your eyes" },
    { time: 174.83, main: "You had that same look in your eyes", next: "I love you, don't act so surprised" },
    { time: 179.34, main: "I love you, don't act so surprised", next: "" },
    
    { time: 183.70, main: "gracias por venir :)", next: "perdon que no encontre rosas azules, y la salida es por la derecha" }
];

function updateBillieCinemaLyrics(current, duration) {
    if (currentWorld !== 3) return;
    if (!billieLyricLine) return;

    const BILLIE_OFFSET = 0; 
    let adjustedTime = current - BILLIE_OFFSET;

    const exitSign = document.getElementById('cinema-exit-sign');
    if (exitSign) {
        exitSign.classList.toggle('door-opened', adjustedTime >= 183.70);
    }

    const exitDoor = document.getElementById('cinema-exit-door');
    if (exitDoor) exitDoor.classList.toggle('door-opened', adjustedTime >= 183.70);

    let currentLyric = billieTimedLyrics[0];

    for (let i = 0; i < billieTimedLyrics.length; i++) {
        let targetTime = i === 0 ? 0 : billieTimedLyrics[i].time;
        if (adjustedTime >= targetTime) {
            currentLyric = billieTimedLyrics[i];
        } else {
            break;
        }
    }

    const newIndex = billieTimedLyrics.indexOf(currentLyric);
    const world3 = document.getElementById('world-3');
    
    if (world3) {
        world3.classList.toggle('billie-final-reveal', adjustedTime >= 124.98);
        
        // Efecto Aves
        const birdsMoment =
        (adjustedTime >= 17.61 && adjustedTime <= 34.76) ||
        (adjustedTime >= 95.01 && adjustedTime <= 107.76);

        if (birdsMoment) {
            spawnBirdFlock();
        } else {
            flockSpawned = false;
            const container = document.getElementById('bird-flock-container');
            if (container) container.innerHTML = '';
        }
        
        // Efecto Plumas
        const foreverMoment =
        (adjustedTime >= 46.31 && adjustedTime <= 56.76) ||
        (adjustedTime >= 87.72 && adjustedTime <= 93.76);
        
        world3.classList.toggle('birds-active', birdsMoment);
        world3.classList.toggle('forever-vow-active', foreverMoment);

        updateBillieGlitchBird(adjustedTime);

        if (foreverMoment && !world3.dataset.vowShown) {
            world3.dataset.vowShown = 'true';
            triggerBurst(featherBurst, '🪶', 'feather-particle', 22);
        }
        
        if (!foreverMoment) {
            world3.dataset.vowShown = '';
        }
    }
    
    if (newIndex === currentBillieLyricIndex) return;
    
    currentBillieLyricIndex = newIndex;
    billieLyricLine.classList.add('change');

    setTimeout(() => {
        billieLyricLine.textContent = currentLyric.main;
        if (billieLyricNext) billieLyricNext.textContent = currentLyric.next || "";
        billieLyricLine.classList.remove('change');
    }, 220);
}

function updateBillieGlitchBird(adjustedTime) {
    const world3 = document.getElementById('world-3');
    const container = document.getElementById('bird-flock-container');

    if (!world3 || !container) return;
    if (secretErrorsFound.has(3) || billieGlitchBirdCaught) {
        world3.classList.remove('glitch-bird-window');
        return;
    }

    const birdWindow =
        (adjustedTime >= 28.61 && adjustedTime <= 33.76) ||
        (adjustedTime >= 106.11 && adjustedTime <= 111.76);

    world3.classList.toggle('glitch-bird-window', birdWindow);

    if (!birdWindow) {
        const oldSecretBird = container.querySelector('.secret-glitch-bird');
        if (oldSecretBird) oldSecretBird.remove();
        return;
    }

    if (container.querySelector('.secret-glitch-bird')) return;

    const secretBird = document.createElement('div');
    secretBird.className = 'flock-bird neon-glitch-bird secret-glitch-bird';
    secretBird.style.top = '28%';
    secretBird.style.animationDuration = '4.4s';
    secretBird.style.animationDelay = '0s';

    secretBird.addEventListener('pointerdown', catchBillieGlitchBird);

    container.appendChild(secretBird);

    setTimeout(() => {
        if (secretBird && secretBird.parentNode) secretBird.remove();
    }, 4600);
}


function resetBillieCinema() {
    currentBillieLyricIndex = -1;
    clearTimeout(billieCinemaTimer);
    clearInterval(featherAmbientInterval);

    const world3 = document.getElementById('world-3');
    if (world3) {
        world3.classList.remove(
            'cinema-lights-on',
            'cinema-lights-dimmed',
            'forever-vow-active',
            'birds-active',
            'billie-final-reveal',
            'world3-corrupted',
            'world3-tap-glitch',
            'show-billie-note',
            'glitch-bird-window',
            'glitch-bird-caught',
            'bird-error-flash',
            'reserved-seat-found',
            'cinema-exit-activated'
        );

        billieReservedSeatFound = false;
        
        world3.dataset.vowShown = '';
    }

    billieGlitchBirdCaught = false;
    
    const birdErrorFrame = document.querySelector('.world3-bird-error-frame');
    if (birdErrorFrame) birdErrorFrame.remove();

    const container = document.getElementById('cinema-feathers-ambient');
    if (container) container.innerHTML = '';

    if (billieLyricLine) {
        billieLyricLine.textContent = 'La función está por empezar...';
        billieLyricLine.classList.remove('change');
    }
    if (billieLyricNext) {
        billieLyricNext.textContent = 'espero que hayas traído canchita';
    }
    if (oceanText1) oceanText1.style.display = 'block';
    if (oceanText2) oceanText2.style.display = 'none';

    const lobby = document.getElementById('cinema-lobby');
    if (lobby) lobby.classList.remove('door-opened');

    const exitSign = document.getElementById('cinema-exit-sign');
    if (exitSign) exitSign.classList.remove('door-opened');

    const exitDoor = document.getElementById('cinema-exit-door');
    if (exitDoor) exitDoor.classList.remove('door-opened', 'exit-clicked');

    const oldExitCaption = document.querySelector('.cinema-exit-caption');
    if (oldExitCaption) oldExitCaption.remove();

    document.querySelectorAll('.cinema-exit-particle').forEach(particle => particle.remove());

    popcornCount = 0;
    isWarmRain = false;

    if (oceanZone) {
        oceanZone.classList.remove('warm', 'projector-error', 'projector-cracking');
        oceanZone.style.removeProperty('--corruption');
    }
    
    const oldError = document.querySelector('.world3-error-frame');
    if (oldError) oldError.remove();
    
    world3ClickCount = 0;
}


let cinemaExitDoorCooldown = false;

function initCinemaExitDoorInteractions() {
    const targets = [
        document.getElementById('cinema-exit-door'),
        document.getElementById('cinema-exit-sign')
    ].filter(Boolean);

    targets.forEach(target => {
        if (target.dataset.exitReady === 'true') return;
        target.dataset.exitReady = 'true';
        target.addEventListener('pointerdown', handleCinemaExitDoorClick);
    });
}

function handleCinemaExitDoorClick(event) {
    const exitDoor = document.getElementById('cinema-exit-door');
    const exitSign = document.getElementById('cinema-exit-sign');
    const world3 = document.getElementById('world-3');

    // Aunque esté cerrada, no debe disparar la canchita global ni otro efecto.
    event.preventDefault();
    event.stopPropagation();

    if (currentWorld !== 3 || !world3 || !exitDoor || !exitDoor.classList.contains('door-opened')) {
        return;
    }

    if (cinemaExitDoorCooldown) return;
    cinemaExitDoorCooldown = true;

    world3.classList.add('cinema-exit-activated');
    exitDoor.classList.add('exit-clicked');
    if (exitSign) exitSign.classList.add('exit-clicked');

    spawnCinemaExitBurst(exitDoor, world3);
    showCinemaExitCaption(world3);

    setTimeout(() => {
        world3.classList.remove('cinema-exit-activated');
        exitDoor.classList.remove('exit-clicked');
        if (exitSign) exitSign.classList.remove('exit-clicked');
        cinemaExitDoorCooldown = false;
    }, 2400);
}

function showCinemaExitCaption(world3) {
    const oldCaption = document.querySelector('.cinema-exit-caption');
    if (oldCaption) oldCaption.remove();

    const caption = document.createElement('div');
    caption.className = 'cinema-exit-caption';
    caption.innerHTML = `
        <span>salida encontrada</span>
        <strong>sí, era por la derecha</strong>
        <small>fin de la función</small>
    `;

    world3.appendChild(caption);

    setTimeout(() => caption.classList.add('show'), 30);
    setTimeout(() => {
        caption.classList.remove('show');
        setTimeout(() => caption.remove(), 650);
    }, 2300);
}

function spawnCinemaExitBurst(exitDoor, world3) {
    const worldRect = world3.getBoundingClientRect();
    const doorRect = exitDoor.getBoundingClientRect();
    const originX = doorRect.left - worldRect.left + doorRect.width * 0.5;
    const originY = doorRect.top - worldRect.top + doorRect.height * 0.45;

    for (let i = 0; i < 26; i++) {
        const particle = document.createElement('span');
        particle.className = 'cinema-exit-particle';
        particle.style.left = `${originX}px`;
        particle.style.top = `${originY}px`;
        particle.style.setProperty('--exit-x', `${-80 - Math.random() * 260}px`);
        particle.style.setProperty('--exit-y', `${(Math.random() - 0.5) * 190}px`);
        particle.style.setProperty('--exit-size', `${3 + Math.random() * 5}px`);
        particle.style.animationDelay = `${Math.random() * 0.18}s`;
        world3.appendChild(particle);
        particle.addEventListener('animationend', () => particle.remove(), { once: true });
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('load', initCinemaExitDoorInteractions);
} else {
    initCinemaExitDoorInteractions();
}

window.addEventListener('pointerdown', (e) => {
    if (currentWorld !== 3) return;

    const popcorn = document.createElement('div');
    popcorn.className = 'popcorn-particle';
    popcorn.style.left = `${e.clientX}px`;
    popcorn.style.top = `${e.clientY}px`;

    const direction = Math.random() < 0.5 ? -1 : 1;
    popcorn.style.setProperty('--popcorn-mid-x', `${direction * (35 + Math.random() * 55)}px`);
    popcorn.style.setProperty('--popcorn-end-x', `${direction * (90 + Math.random() * 120)}px`);
    popcorn.style.setProperty('--popcorn-arc', `${135 + Math.random() * 75}px`);

    document.body.appendChild(popcorn);

    setTimeout(() => {
        popcorn.remove();
    }, 1200);

    popcornCount++;

    if (popcornCount === 10) {
        showAchievement(
            '🏆 Logro desbloqueado',
            'oe valeska sucia (ensuciaste mi cine xd)',
            5000,
            'minecraft'
        );
    }
});

let billieCinemaTimer = null;
let featherAmbientInterval = null;

// Cuando toca la puerta
window.enterCinemaRoom = function() {
    const lobby = document.getElementById('cinema-lobby');
    const world3 = document.getElementById('world-3');
    if (!lobby || !world3) return;

    // 1. Abrimos la puerta y encendemos las luces
    lobby.classList.add('door-opened');
    world3.classList.add('cinema-lights-on'); 

    // 2. Temporizador de 5 SEGUNDOS EXACTOS
    clearTimeout(billieCinemaTimer);
    billieCinemaTimer = setTimeout(() => {
        // Apagamos luces
        world3.classList.remove('cinema-lights-on');
        world3.classList.add('cinema-lights-dimmed');
        
        // Empieza la música
        audio.play().then(() => {
            isPlaying = true;
            updatePlayButton();
        }).catch(e => console.log(e));

        // Empiezan a caer las plumas invisibles
        startCinemaFeathers();
    }, 5000);
};

function startCinemaFeathers() {
    const container = document.getElementById('cinema-feathers-ambient');
    if (!container) return;
    
    clearInterval(featherAmbientInterval);
    featherAmbientInterval = setInterval(() => {
        if (currentWorld !== 3) return;
        const feather = document.createElement('span');
        feather.className = 'cinema-ambient-feather';
        feather.textContent = '🪶';
        
        feather.style.left = `${Math.random() * 100}vw`;
        feather.style.top = `-10px`;
        feather.style.setProperty('--drift', `${(Math.random() - 0.5) * 150}px`);
        feather.style.setProperty('--rot', `${Math.random() * 360}deg`);
        feather.style.animation = `featherFloatDown ${6 + Math.random() * 6}s linear forwards`;
        feather.style.fontSize = `${14 + Math.random() * 16}px`;
        feather.style.position = 'absolute';
        feather.style.opacity = '0.15';

        container.appendChild(feather);
        setTimeout(() => feather.remove(), 10000);
    }, 1200);
}
    
// ==========================================
// LETRAS SINCRONIZADAS MUNDO 4 (FEEL IT)
// ==========================================

const seguroTimedLyrics = [
    {
        "time": 0,
        "text": "♪"
    },
    {
        "time": 4.33,
        "text": "Si es que yo te cuento (yeah)"
    },
    {
        "time": 10.32,
        "text": "En el momento que te vi (no)"
    },
    {
        "time": 13.42,
        "text": "Imaginé que eras así (wow)"
    },
    {
        "time": 16.36,
        "text": "Pero ahora que te conocí (yo)"
    },
    {
        "time": 19.35,
        "text": "Siento que me muero por ti"
    },
    {
        "time": 22.5,
        "text": "Si es que yo te cuento"
    },
    {
        "time": 25.51,
        "text": "Todo lo que siento"
    },
    {
        "time": 28.35,
        "text": "Seguro que pierdo"
    },
    {
        "time": 31.33,
        "text": "Seguro que pierdo, oh"
    },
    {
        "time": 35.25,
        "text": "Te lo quiero confesar"
    },
    {
        "time": 36.73,
        "text": "Que muchas veces te lo intenté contar"
    },
    {
        "time": 39.7,
        "text": "Pero me lo tuve que callar para no arruinar"
    },
    {
        "time": 43.18,
        "text": "Por miedo que tú me vayas a dejar"
    },
    {
        "time": 46.21,
        "text": "Pues me conformo con tu amistad"
    },
    {
        "time": 48.94,
        "text": "Aunque me sienta mal"
    },
    {
        "time": 50.57,
        "text": "Porque nosotros nunca vamos a estar"
    },
    {
        "time": 53.31,
        "text": "Contigo la paso bien"
    },
    {
        "time": 55.11,
        "text": "¿Te digo por qué?"
    },
    {
        "time": 56.62,
        "text": "Me hiciste ver las cosas que no pude ayer"
    },
    {
        "time": 59.21,
        "text": "Contigo la paso bien"
    },
    {
        "time": 61.18,
        "text": "¿Te digo por qué?"
    },
    {
        "time": 62.7,
        "text": "Me hiciste ver las cosas que no pude ayer"
    },
    {
        "time": 70.5,
        "text": "En el momento en que te vi (no)"
    },
    {
        "time": 73.51,
        "text": "Imaginé que eras así (uoh)"
    },
    {
        "time": 76.49,
        "text": "Pero ahora que te conocí (yo)"
    },
    {
        "time": 79.38,
        "text": "Siento que me muero por ti"
    },
    {
        "time": 82.37,
        "text": "Si es que yo te cuento"
    },
    {
        "time": 85.44,
        "text": "Todo lo que siento"
    },
    {
        "time": 88.53,
        "text": "Seguro que pierdo"
    },
    {
        "time": 91.45,
        "text": "Seguro que pierdo"
    },
    {
        "time": 94.45,
        "text": "Cuando no sé de ti te juro que yo me desespero"
    },
    {
        "time": 96.55,
        "text": "Dime cuánto demoras y espero"
    },
    {
        "time": 97.96,
        "text": "No sé qué habrás hecho, te conozco recién"
    },
    {
        "time": 99.35,
        "text": "Pero ahora siento que te quiero"
    },
    {
        "time": 101.23,
        "text": "Y yo quisiera invitarte a salir"
    },
    {
        "time": 102.7,
        "text": "Pero no tengo dinero"
    },
    {
        "time": 104.11,
        "text": "Aunque prefiero hacerte canciones"
    },
    {
        "time": 105.99,
        "text": "Contigo, para ser sincero"
    },
    {
        "time": 107.83,
        "text": "Es que tiene unos ojos que iluminarían Manhattan"
    },
    {
        "time": 110.99,
        "text": "Y una voz hermosa que mil paisajes retratan"
    },
    {
        "time": 113.99,
        "text": "¿Acaso no ves que cuando caminas desfilas?"
    },
    {
        "time": 116.93,
        "text": "Miremos el cielo hasta que se ponga lila"
    },
    {
        "time": 119.61,
        "text": "Y ¿qué pasó?"
    },
    {
        "time": 120.88,
        "text": "Lo que pasó es que usted me enamoró"
    },
    {
        "time": 123.59,
        "text": "No sé qué si es fuiste tú o si acaso es que soy yo, oh"
    },
    {
        "time": 127.75,
        "text": "Pero ahora dime, ¿qué pasó-oh-oh?"
    },
    {
        "time": 130.6,
        "text": "Si es que yo te cuento"
    },
    {
        "time": 133.41,
        "text": "Todo lo que siento"
    },
    {
        "time": 136.45,
        "text": "Seguro que pierdo"
    },
    {
        "time": 139.45,
        "text": "Seguro que pierdo, oh"
    },
    {
        "time": 143.22,
        "text": "Contigo la paso bien"
    },
    {
        "time": 145.34,
        "text": "Te digo por qué"
    },
    {
        "time": 146.62,
        "text": "Me hiciste ver las cosas que no pude ayer"
    },
    {
        "time": 149.11,
        "text": "Contigo la paso bien"
    },
    {
        "time": 151.14,
        "text": "Te digo por qué"
    },
    {
        "time": 152.69,
        "text": "Me hiciste ver las cosas que no pude ayer"
    },
    {
        "time": 154.62,
        "text": "Si es que yo te cuento"
    },
    {
        "time": 157.46,
        "text": "Todo lo que siento"
    },
    {
        "time": 160.47,
        "text": "Seguro te pierdo"
    },
    {
        "time": 163.38,
        "text": "Seguro te pierdo"
    }
];

let currentSeguroLyricIndex = -1;
let currentSeguroAct = "";
let seguroFrameIndex = 0;
let seguroLyricToken = 0;

let seguroLilacSecretFound = false;
let seguroCameraFocusedOnce = false;
let seguroCameraFocusBound = false;
let seguroFocusZonesBound = false;
let seguroStagePointerBound = false;
let seguroFocusFound = new Set();

// Variables para Lluvia Canvas
let seguroRainAnimationId = null;
let seguroRainCanvasInitialized = false;
let seguroRainDrops = [];

// Temporizadores de canción (exactamente como lo pediste)
const SEGURO_LILAC_SECRET_START = 116.93;
const SEGURO_LILAC_SECRET_END = 127.75;

const seguroWorld4Zones = {
    focus: [
        {
            id: "focus-01-656",
            label: "Toma 01/4",
            start: 22.50,
            end: 46.21,
            x: 11.24,
            y: 55.97,
            w: 9.90,
            h: 23.50,
            note: "primeras luces / confesión contenida"
        },
        {
            id: "focus-02-474",
            label: "Toma 02/4",
            start: 46.21,
            end: 70.50,
            x: 25.02,
            y: 70.36,
            w: 13.92,
            h: 15.34,
            note: "charco / me hiciste ver las cosas"
        },
        {
            id: "focus-03-94",
            label: "Toma 03/4",
            start: 107.83,
            end: 113.99,
            x: 59.14,
            y: 48.54,
            w: 7.90,
            h: 19.18,
            note: "Manhattan / edificios iluminados"
        },
        {
            id: "focus-04-610",
            label: "Toma 04/4",
            start: 113.99,
            end: 123.59,
            x: 68.91,
            y: 67.96,
            w: 19.67,
            h: 18.94,
            note: "desfile / calle central"
        }
    ],
    secret: {
        id: "lilac-window-566",
        label: "Anomalía violeta",
        start: 116.93,
        end: 127.75,
        x: 10.08,
        y: 31.28,
        w: 2.54,
        h: 4.56,
        note: "ventana lila secreta"
    }
};

const seguroActFillImages = {
    intro: "city_blackout_blue.png",
    firstSpark: "city_sparse_windows.png",
    confession: "city_low_glow.png",
    friendship: "city_soft_glow.png",
    returnFear: "city_sparse_windows.png",
    anxiety: "city_high_glow.png",
    manhattan: "city_high_glow.png",
    voice: "city_peak_soft.png",
    walk: "city_peak_flicker_A.png",
    lila: "city_peak_hard_night.png",
    afterLila: "city_afterglow.png",
    warm: "city_afterglow.png",
    final: "city_soft_glow.png"
};


function getSeguroAct(current) {
    if (current < 4.46)   return "intro";          // Ciudad dormida
    if (current < 22.50)  return "firstSpark";     // Primeras emociones
    if (current < 46.21)  return "confession";     // "Si es que yo te cuento"
    if (current < 70.50)  return "friendship";     // Calidez resignada
    if (current < 94.45)  return "returnFear";     // Vuelve el miedo
    if (current < 107.83) return "anxiety";        // "Cuando no sé de ti..." (Energía sube)
    if (current < 110.99) return "manhattan";      // Iluminan Manhattan
    if (current < 113.99) return "voice";          // Voz hermosa
    if (current < 116.93) return "walk";           // Caminas desfilas (10fps activo)
    if (current < 123.59) return "lila";           // Ventana lila
    if (current < 143.22) return "afterLila";      // "Usted me enamoró"
    if (current < 160.47) return "warm";           // Calma cálida
    return "final";                                // Cierre sensible
}


function updateSeguroLyrics(current) {
    const line = document.getElementById('seguro-lyric-line');
    if (!line) return;

    let nextIndex = -1;
    for (let i = seguroTimedLyrics.length - 1; i >= 0; i--) {
        if (current >= seguroTimedLyrics[i].time) {
            nextIndex = i;
            break;
        }
    }
    if (nextIndex === currentSeguroLyricIndex) return;

    currentSeguroLyricIndex = nextIndex;
    const nextText = nextIndex >= 0 ? seguroTimedLyrics[nextIndex].text : '♪';
    const token = ++seguroLyricToken;

    line.classList.add('changing');
    setTimeout(() => {
        if (token !== seguroLyricToken) return;
        line.textContent = nextText;
        line.classList.remove('changing');
    }, 120);
}

function updateSeguroAtmosphereFrames(current) {
    const world = document.getElementById('world-4');
    if (!world) return;

    const frame = Math.floor(current * 5) % 6;
    const beat = Math.floor(current * 2) % 2;
    world.dataset.cityFrame = String(frame);
    world.dataset.beat = String(beat);
}

function setSeguroAct(act) {
    const world = document.getElementById('world-4');
    if (!world) return;

    if (currentSeguroAct !== act) {
        currentSeguroAct = act;
        world.dataset.act = act;

        const fillImage = seguroActFillImages[act] || seguroActFillImages.intro;
        world.style.setProperty('--seguro-fill-image', `url("imagenes mundo4/${fillImage}")`);

        // Reiniciar frame para el 10fps
        if (act !== "walk") {
            delete world.dataset.walkFrame;
        } else {
            world.dataset.walkFrame = "0";
        }
    }
}

function updateSeguroWalkFrame(current) {
    const world = document.getElementById('world-4');
    if (!world || currentSeguroAct !== "walk") return;

    // Estética Stop-Motion a 10fps SOLO en este acto
    const frame = Math.floor((current - 113.99) * 10) % 2;
    world.dataset.walkFrame = String(Math.max(0, frame));
}

// ── Lógica Lilac Window ──
function updateSeguroLilacWindowAvailability(current) {
    const world = document.getElementById('world-4');
    if (!world) return;

    const lilacHitbox = document.getElementById('seguro-lilac-hitbox');
    const overlay = ensureSeguroLilacOverlayInStack();
    const zoneButton = ensureSeguroLilacZoneButton();

    const alreadyFound = seguroLilacSecretFound || secretErrorsFound.has(4);
    const activeWindowTime = current >= seguroWorld4Zones.secret.start && current <= seguroWorld4Zones.secret.end;
    const isVisible = activeWindowTime && !alreadyFound;

    if (lilacHitbox) {
        seguroApplyZonePosition(lilacHitbox, seguroWorld4Zones.secret);
        lilacHitbox.disabled = !isVisible;
        lilacHitbox.classList.toggle('active', isVisible);
    }

    if (zoneButton) {
        seguroApplyZonePosition(zoneButton, seguroWorld4Zones.secret);
        zoneButton.disabled = !isVisible;
        zoneButton.classList.toggle('active', isVisible);
    }

    if (overlay) {
        overlay.classList.toggle('active', isVisible);
    }

    world.classList.toggle('seguro-lilac-secret-window-active', isVisible);
}

function triggerSeguroLilacSecret(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (currentWorld !== 4) return;

    const current = audio?.currentTime || 0;
    if (current < seguroWorld4Zones.secret.start || current > seguroWorld4Zones.secret.end) return;

    seguroLilacSecretFound = true;

    const world = document.getElementById('world-4');
    if (world) {
        world.classList.remove('seguro-lilac-secret-window-active');
        world.classList.add('seguro-lilac-secret-found');
    }

    playSeguroCaptureFeedback({
        event,
        label: 'ANOMALÍA VIOLETA',
        secret: true
    });

    if (typeof unlockSecretError === 'function') {
        unlockSecretError(4, 'world4_secret');
    }
}

// ── Lógica de tomas de cámara (Logro Normal) ──
function seguroApplyZonePosition(el, zone) {
    if (!el || !zone) return;

    const world = document.getElementById('world-4');
    const stack = world?.querySelector('.seguro-city-stack');
    const rendered = getSeguroRenderedImageRect?.();

    // Los porcentajes del calibrador se guardan sobre la imagen renderizada con cover,
    // no sobre el viewport completo. Por eso convertimos a píxeles relativos al stack.
    if (stack && rendered) {
        const stackRect = stack.getBoundingClientRect();
        el.style.left = `${(rendered.left - stackRect.left) + (zone.x / 100) * rendered.width}px`;
        el.style.top = `${(rendered.top - stackRect.top) + (zone.y / 100) * rendered.height}px`;
        el.style.width = `${(zone.w / 100) * rendered.width}px`;
        el.style.height = `${(zone.h / 100) * rendered.height}px`;
        return;
    }

    el.style.left = `${zone.x}%`;
    el.style.top = `${zone.y}%`;
    el.style.width = `${zone.w}%`;
    el.style.height = `${zone.h}%`;
}


function ensureSeguroLilacOverlayInStack() {
    const world = document.getElementById('world-4');
    const stack = world?.querySelector('.seguro-city-stack');
    if (!stack) return null;

    let overlay = document.getElementById('seguro-lilac-overlay-img');
    if (!overlay) {
        overlay = document.createElement('img');
        overlay.id = 'seguro-lilac-overlay-img';
        overlay.className = 'seguro-city-layer city-lilac-overlay';
        overlay.src = 'imagenes mundo4/city_lilac_window.png';
        overlay.alt = '';
        overlay.setAttribute('aria-hidden', 'true');
        stack.appendChild(overlay);
    }

    return overlay;
}

function ensureSeguroLilacZoneButton() {
    ensureSeguroFocusUI();

    const focusLayer = document.getElementById('seguro-focus-layer');
    if (!focusLayer) return null;

    let btn = document.getElementById('seguro-lilac-zone-button');
    if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'seguro-lilac-zone-button';
        btn.className = 'seguro-lilac-zone-button';
        btn.setAttribute('aria-label', 'Ventana lila secreta');
        btn.addEventListener('pointerdown', triggerSeguroLilacSecret);
        btn.addEventListener('click', triggerSeguroLilacSecret);
        focusLayer.appendChild(btn);
    }

    seguroApplyZonePosition(btn, seguroWorld4Zones.secret);
    return btn;
}

function ensureSeguroFocusUI() {
    const world = document.getElementById('world-4');
    const stack = world?.querySelector('.seguro-city-stack');
    const camera = world?.querySelector('.seguro-camera-frame');
    if (!world || !stack || !camera) return;

    let focusLayer = document.getElementById('seguro-focus-layer');
    if (!focusLayer) {
        focusLayer = document.createElement('div');
        focusLayer.id = 'seguro-focus-layer';
        focusLayer.className = 'seguro-focus-layer';
        stack.appendChild(focusLayer);
    }

    let flash = document.getElementById('seguro-focus-flash');
    if (!flash) {
        flash = document.createElement('div');
        flash.id = 'seguro-focus-flash';
        flash.className = 'seguro-focus-flash';
        flash.setAttribute('aria-hidden', 'true');
        stack.appendChild(flash);
    }

    let counter = document.getElementById('seguro-focus-counter');
    if (!counter) {
        counter = document.createElement('span');
        counter.id = 'seguro-focus-counter';
        counter.className = 'seguro-focus-counter';
        counter.textContent = 'CAPTURA LOS MOMENTOS · 0/4';
        camera.appendChild(counter);
    }

    let lock = document.getElementById('seguro-focus-lock-label');
    if (!lock) {
        lock = document.createElement('span');
        lock.id = 'seguro-focus-lock-label';
        lock.className = 'seguro-focus-lock-label';
        lock.textContent = 'FOCUS LOCK';
        camera.appendChild(lock);
    }

    let toast = document.getElementById('seguro-shot-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'seguro-shot-toast';
        toast.className = 'seguro-shot-toast';
        toast.setAttribute('aria-hidden', 'true');
        camera.appendChild(toast);
    }
}

function playSeguroCaptureFeedback({ event, label = 'CAPTURA GUARDADA', secret = false } = {}) {
    const world = document.getElementById('world-4');
    if (!world) return;

    const rect = world.getBoundingClientRect();
    const focusBox = document.getElementById('camera-focus-box');
    const lockLabel = document.getElementById('seguro-focus-lock-label');
    const toast = document.getElementById('seguro-shot-toast');
    const flash = document.getElementById('seguro-focus-flash');

    // Posicionar cuadro de enfoque en el punto del click
    if (rect && focusBox && event) {
        focusBox.style.left = `${event.clientX - rect.left}px`;
        focusBox.style.top = `${event.clientY - rect.top}px`;
    }

    // Label FOCUS LOCK
    if (lockLabel) {
        lockLabel.textContent = label;
    }

    // Toast
    if (toast) {
        const toastText = secret
            ? 'ANOMALÍA CAPTURADA'
            : `CAPTURA GUARDADA · ${seguroFocusFound.size}/${seguroWorld4Zones.focus.length}`;
        toast.textContent = toastText;
        toast.classList.remove('show', 'secret');
        void toast.offsetWidth;
        toast.classList.add('show');
        if (secret) toast.classList.add('secret');
    }

    // Flash: usar clases directas en el elemento en lugar de clase en world
    // Esto evita el problema de reflow en iOS Safari y doble-click rápido
    if (flash) {
        flash.classList.remove('flash-active', 'flash-secret');
        // Forzar reflow para reiniciar la animación limpiamente
        void flash.offsetWidth;
        if (secret) {
            flash.classList.add('flash-secret');
        } else {
            flash.classList.add('flash-active');
        }
        // Limpiar clases del flash después de que termine la animación
        const flashDuration = secret ? 620 : 520;
        if (flash._flashTimer) clearTimeout(flash._flashTimer);
        flash._flashTimer = setTimeout(() => {
            flash.classList.remove('flash-active', 'flash-secret');
        }, flashDuration);
    }

    // Camera focus box — disparar via clase en world (mantiene compatibilidad)
    world.classList.remove('seguro-camera-focused', 'seguro-secret-captured');
    void world.offsetWidth;
    world.classList.add('seguro-camera-focused');
    if (secret) world.classList.add('seguro-secret-captured');

    // Cleanup
    if (world._seguroFeedbackTimer) clearTimeout(world._seguroFeedbackTimer);
    world._seguroFeedbackTimer = setTimeout(() => {
        world.classList.remove('seguro-camera-focused', 'seguro-secret-captured');
        if (toast) toast.classList.remove('show', 'secret');
    }, 920);
}

function updateSeguroFocusCounter() {
    const counter = document.getElementById('seguro-focus-counter');
    const total = seguroWorld4Zones.focus.length;
    const count = Math.min(seguroFocusFound.size, total);
    if (!counter) return;

    counter.textContent = count >= total ? 'TOMA ESTABLE · 4/4' : `CAPTURA LOS MOMENTOS · ${count}/${total}`;
    counter.classList.toggle('complete', count >= total);
}


function getSeguroRenderedImageRect() {
    const world = document.getElementById('world-4');
    const container = world?.querySelector('.seguro-city-stack');
    const img = world?.querySelector('.seguro-city-layer') || document.querySelector('#seguro-lilac-window .seguro-lilac-window-img');

    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const naturalWidth = img?.naturalWidth || 16;
    const naturalHeight = img?.naturalHeight || 9;
    const imageRatio = naturalWidth / naturalHeight;
    const containerRatio = rect.width / rect.height;

    let width, height, left, top;

    // MISMO ENCUADRE VISUAL QUE EL MUNDO 4:
    // object-fit: cover + object-position: center bottom.
    // Esto mantiene el zoom inmersivo y evita calibrar contra la imagen completa sin recorte.
    if (containerRatio > imageRatio) {
        width = rect.width;
        height = width / imageRatio;
        left = rect.left;
        top = rect.bottom - height;
    } else {
        height = rect.height;
        width = height * imageRatio;
        left = rect.left + (rect.width - width) / 2;
        top = rect.top;
    }

    return { left, top, width, height };
}

function getSeguroPointPercent(event) {
    const rect = getSeguroRenderedImageRect();
    if (!rect || !event) return null;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    if (x < 0 || y < 0 || x > 100 || y > 100) return null;

    return { x, y };
}

function seguroPointInsideZone(point, zone) {
    if (!point || !zone) return false;
    return (
        point.x >= zone.x &&
        point.x <= zone.x + zone.w &&
        point.y >= zone.y &&
        point.y <= zone.y + zone.h
    );
}

function handleSeguroStagePointer(event) {
    if (currentWorld !== 4 || !event) return;

    const target = event.target;
    if (target?.closest?.('.back-btn, #floating-player, #toggle-player-btn, .player-controls, .progress-container-small, .seguro-lilac-hitbox, .seguro-focus-hitbox')) {
        return;
    }

    const current = audio?.currentTime || 0;
    const point = getSeguroPointPercent(event);
    if (!point) return;

    const secret = seguroWorld4Zones.secret;
    const secretActive = current >= secret.start && current <= secret.end && !seguroLilacSecretFound && !secretErrorsFound.has(4);

    if (secretActive && seguroPointInsideZone(point, secret)) {
        triggerSeguroLilacSecret(event);
        return;
    }

    const zone = seguroWorld4Zones.focus.find(z =>
        current >= z.start &&
        current <= z.end &&
        !seguroFocusFound.has(z.id) &&
        seguroPointInsideZone(point, z)
    );

    if (zone) {
        triggerSeguroFocusZone(zone, event);
    }
}

function initSeguroCameraFocus() {
    const world = document.getElementById('world-4');
    const lilacHitbox = document.getElementById('seguro-lilac-hitbox');
    if (!world) return;

    ensureSeguroFocusUI();
    ensureSeguroLilacOverlayInStack();
    ensureSeguroLilacZoneButton();

    if (!seguroStagePointerBound) {
        seguroStagePointerBound = true;
        world.addEventListener('pointerdown', handleSeguroStagePointer, true);
    }

    const focusLayer = document.getElementById('seguro-focus-layer');
    if (!focusLayer || seguroFocusZonesBound) {
        updateSeguroFocusCounter();
        return;
    }

    seguroFocusZonesBound = true;

    seguroWorld4Zones.focus.forEach((zone, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'seguro-focus-hitbox';
        btn.dataset.zoneId = zone.id;
        btn.dataset.zoneIndex = String(index + 1);
        btn.setAttribute('aria-label', `${zone.label} - tomar la foto`);
        btn.innerHTML = `<span class="seguro-zone-instruction"><b>${zone.label}</b><em>tomar foto</em></span>`;
        seguroApplyZonePosition(btn, zone);

        btn.addEventListener('pointerdown', (event) => {
            triggerSeguroFocusZone(zone, event);
        });

        focusLayer.appendChild(btn);
    });

    if (lilacHitbox) {
        seguroApplyZonePosition(lilacHitbox, seguroWorld4Zones.secret);
        lilacHitbox.removeEventListener('click', triggerSeguroLilacSecret);
        lilacHitbox.removeEventListener('pointerdown', triggerSeguroLilacSecret);
        lilacHitbox.addEventListener('click', triggerSeguroLilacSecret);
        lilacHitbox.addEventListener('pointerdown', triggerSeguroLilacSecret);
    }

    updateSeguroFocusCounter();
}

function triggerSeguroFocusZone(zone, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (currentWorld !== 4 || !zone || seguroFocusFound.has(zone.id)) return;

    const current = audio?.currentTime || 0;
    if (current < zone.start || current > zone.end) return;

    seguroFocusFound.add(zone.id);

    const world = document.getElementById('world-4');
    const hitbox = document.querySelector(`.seguro-focus-hitbox[data-zone-id="${zone.id}"]`);

    if (hitbox) {
        hitbox.classList.remove('active');
        hitbox.classList.add('found');
    }

    playSeguroCaptureFeedback({
        event,
        label: `FOCUS LOCK · ${zone.label}`,
        secret: false
    });

    updateSeguroFocusCounter();

    if (seguroFocusFound.size >= seguroWorld4Zones.focus.length) {
        seguroCameraFocusedOnce = true;
        if (world) world.classList.add('seguro-toma-estable');
        if (typeof unlockTrophy === "function") {
            unlockTrophy("world4_reality");
        }
    }
}

function updateSeguroFocusZonesAvailability(current) {
    const world = document.getElementById('world-4');
    if (!world) return;

    ensureSeguroFocusUI();

    seguroWorld4Zones.focus.forEach((zone) => {
        const btn = document.querySelector(`.seguro-focus-hitbox[data-zone-id="${zone.id}"]`);
        if (!btn) return;

        seguroApplyZonePosition(btn, zone);

        const active = current >= zone.start && current <= zone.end && !seguroFocusFound.has(zone.id);
        btn.classList.toggle('active', active);
        btn.disabled = !active;
    });

    updateSeguroFocusCounter();
}

// ── Lluvia Canvas Ligera ──
function getSeguroRainIntensity(act) {
    const table = {
        intro: 0.1, firstSpark: 0.15, confession: 0.2, friendship: 0.15,
        returnFear: 0.25, anxiety: 0.4, manhattan: 0.2, voice: 0.15,
        walk: 0.15, lila: 0.2, afterLila: 0.1, warm: 0.05, final: 0.05
    };
    return table[act] ?? 0.1;
}

function initSeguroRainCanvas() {
    const canvas = document.getElementById('seguro-rain-canvas');
    if (!canvas || seguroRainCanvasInitialized) return;
    
    seguroRainCanvasInitialized = true;
    const resize = () => {
        const { width, height } = getAppSize();
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

        canvas.width = Math.max(1, Math.floor(width * dpr));
        canvas.height = Math.max(1, Math.floor(height * dpr));

        canvas.style.width = '100%';
        canvas.style.height = '100%';
    };
    window.addEventListener('resize', resize);
    resize();

    const count = getAppSize().width < 768 ? 60 : 120;
    seguroRainDrops = Array.from({ length: count }, () => ({
        x: Math.random(), y: Math.random(),
        speed: 0.6 + Math.random() * 0.8,
        length: 10 + Math.random() * 20,
        opacity: 0.1 + Math.random() * 0.2
    }));
}

function drawSeguroRainFrame() {
    const canvas = document.getElementById('seguro-rain-canvas');
    if (!canvas || currentWorld !== 4) {
        seguroRainAnimationId = null;
        return;
    }

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const intensity = getSeguroRainIntensity(currentSeguroAct);

    if (intensity > 0.02) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(200, 220, 255, ${intensity * 1.5})`;
        ctx.lineWidth = 1;
        
        seguroRainDrops.forEach(drop => {
            drop.y += drop.speed * (0.5 + intensity);
            drop.x += 0.05; // Ligero viento

            if (drop.y > 1.1) { drop.y = -0.1; drop.x = Math.random(); }
            if (drop.x > 1.1) { drop.x = -0.1; }

            const x = drop.x * w;
            const y = drop.y * h;
            const dx = drop.length * 0.3;
            const dy = drop.length;

            ctx.moveTo(x, y);
            ctx.lineTo(x - dx, y + dy);
        });
        ctx.stroke();
    }
    seguroRainAnimationId = requestAnimationFrame(drawSeguroRainFrame);
}

// ── Actualizaciones ──
function updateWorld4Scene(current) {
    if (!seguroRainAnimationId) {
        initSeguroRainCanvas();
        seguroRainAnimationId = requestAnimationFrame(drawSeguroRainFrame);
    }
    
    updateSeguroLyrics(current);
    updateSeguroAtmosphereFrames(current);
    
    const act = getSeguroAct(current);
    setSeguroAct(act);

    if (act === "walk") updateSeguroWalkFrame(current);
    updateSeguroLilacWindowAvailability(current);
    updateSeguroFocusZonesAvailability(current);
}

function resetWorld4State() {
    currentSeguroLyricIndex = -1;
    currentSeguroAct = "";
    seguroCameraFocusedOnce = false;
    seguroFocusFound = new Set();

    const world = document.getElementById('world-4');
    if (world) {
        world.dataset.act = "intro";
        delete world.dataset.walkFrame;
        world.style.setProperty('--seguro-fill-image', 'url("imagenes mundo4/city_blackout_blue.png")');
        world.classList.remove('seguro-lilac-secret-window-active', 'seguro-toma-estable', 'seguro-camera-focused');
        world.classList.toggle('seguro-lilac-secret-found', secretErrorsFound.has(4));
    }

    ensureSeguroLilacOverlayInStack();
    ensureSeguroLilacZoneButton();

    const line = document.getElementById('seguro-lyric-line');
    if (line) {
        line.textContent = "♪";
        line.classList.remove('changing');
    }
    
    // Iniciar eventos únicos
    initSeguroCameraFocus();
    document.querySelectorAll('#world-4 .seguro-focus-hitbox').forEach(btn => {
        btn.classList.remove('active', 'found');
        btn.disabled = true;
    });
    updateSeguroFocusCounter();
    
    const lilacHitbox = document.getElementById('seguro-lilac-hitbox');
    if (lilacHitbox) {
        seguroApplyZonePosition(lilacHitbox, seguroWorld4Zones.secret);
        lilacHitbox.removeEventListener('click', triggerSeguroLilacSecret);
        lilacHitbox.removeEventListener('pointerdown', triggerSeguroLilacSecret);
        lilacHitbox.addEventListener('click', triggerSeguroLilacSecret);
        lilacHitbox.addEventListener('pointerdown', triggerSeguroLilacSecret);
    }
}

audio.addEventListener('timeupdate', () => {
    const current = audio.currentTime;
    const duration = audio.duration;

    if (duration) {
        progressBar.value = (current / duration) * 100;
        currentTimeEl.textContent = formatTime(current);
    }

    // ==========================================
    // MUNDO 1 - LA VIE EN ROSE
    // ==========================================
    if (currentWorld === 1) {
        updateLaVieEnRoseLyrics(current);
        if (current >= 14 && !world1VoiceTriggered) {
            world1VoiceTriggered = true;
            showAchievement('¡Logro desbloqueado!', 'La voz entró en tu galaxia');
        }
        if (current >= 73 && current <= 85 && !achievementUnlocked) {
            achievementUnlocked = true;
            showAchievement('¡Logro desbloqueado!', 'Bailando entre estrellas', 6000);
        }

        // EL CLÍMAX DE LOS NEUTRINOS (Segundo 148: Entra la trompeta)
        if (current >= 148.0) {
            if (!neutrinosTriggered) {
                neutrinosTriggered = true;
                closeAllGalaxyLabels();
                const diracText = document.getElementById('dirac-constellation-text');
                if (diracText) diracText.classList.add('show-dirac');
                if (neutrinoBreeze) {
                    neutrinoBreeze.visible = true;
                    neutrinoBreeze.material.opacity = 0;
                }
            }
        } else {
            neutrinosTriggered = false;
            const diracText = document.getElementById('dirac-constellation-text');
            if (diracText) diracText.classList.remove('show-dirac');
            if (neutrinoBreeze) {
                neutrinoBreeze.visible = false;
                neutrinoBreeze.material.opacity = 0;
            }
        }
    }

    // ==========================================
    // MUNDO 2 - CORAZÓN
    // ==========================================
    if (currentWorld === 2) {
        updateCorazonLyrics(current);
        updateCorazonPolaroids(current);

        if (current >= 133 && !world2AchievementTriggered) {
            world2AchievementTriggered = true;
            showAchievement('¡Logro desbloqueado!', 'Evidencia fotográfica encontrada');
        }

        if (current >= 60 && current <= 85) {
            if (Math.random() < 0.08) spawnCorazonSunflower();
            if (Math.random() < 0.15) spawnPixelHeart();
        }

        if (current >= 133 && current <= 152) {
            if (Math.random() < 0.06) spawnCorazonSunflower();
            if (Math.random() < 0.12) spawnPixelHeart();
        }
    }

    // ==========================================
    // MUNDO 3 - BIRDS OF A FEATHER
    // ==========================================
    if (currentWorld === 3) {
        updateBillieCinemaLyrics(current, duration);
        
        if (current >= 66 && !world3AchievementTriggered) {
            world3AchievementTriggered = true;
            triggerBurst(featherBurst, '🪶', 'feather-particle', 14);
        }
    }

    // ==========================================
    // MUNDO 4 - SEGURO TE PIERDO
    // ==========================================
    if (currentWorld === 4 && typeof updateWorld4Scene === 'function') {
        updateWorld4Scene(audio.currentTime || 0);
    }


    // ==========================================
    // MUNDO 5 - YELLOW
    // ==========================================
    if (currentWorld === 5) {
        updateYellowWorld(current, duration);
    }

    // ==========================================
    // MUNDO 6 - DISCO ROTO
    // ==========================================
    if (currentWorld === 6) {
        updateNotepadText(current);

        // ── Escena de dibujos: aparece en el segundo 33 ──
        const world6el = document.getElementById('world-6');
        if (world6el) {
            if (current >= 33 && !world6el.classList.contains('doodle-active')) {
                world6el.classList.add('doodle-active');
            } else if (current < 33 && world6el.classList.contains('doodle-active')) {
                world6el.classList.remove('doodle-active');
            }
        }
    }
});
// ==========================================
const laVieEnRoseLyrics = [
    {
        "time": 95.53,
        "text": "Hold me close and hold me fast"
    },
    {
        "time": 100.16,
        "text": "The magic spell you cast"
    },
    {
        "time": 104.01,
        "text": "This is la vie en rose"
    },
    {
        "time": 109.09,
        "text": "When you kiss me, heaven sighs"
    },
    {
        "time": 113.94,
        "text": "And though I close my eyes"
    },
    {
        "time": 117.6,
        "text": "I see la vie en rose"
    },
    {
        "time": 122.77,
        "text": "When you press me to your heart"
    },
    {
        "time": 127.7,
        "text": "I'm in a world apart"
    },
    {
        "time": 131.29,
        "text": "A world where roses bloom"
    },
    {
        "time": 136.15,
        "text": "And when you speak"
    },
    {
        "time": 138.41,
        "text": "Angels sing from above"
    },
    {
        "time": 143.23,
        "text": "Everyday words seems"
    },
    {
        "time": 146.72,
        "text": "To turn into love songs"
    },
    {
        "time": 149.91,
        "text": "Give your heart and soul to me"
    },
    {
        "time": 155.1,
        "text": "And life will always be"
    },
    {
        "time": 159.12,
        "text": "La vie en rose"
    }
];

let currentLaVieLyricIndex = -1;

function updateLaVieEnRoseLyrics(current) {
    if (currentWorld !== 1) return;

    const subEl = document.querySelector('.cinematic-subtitles p');
    if (!subEl) return;

    let selectedIndex = -1;

    for (let i = 0; i < laVieEnRoseLyrics.length; i++) {
        if (current >= laVieEnRoseLyrics[i].time) selectedIndex = i;
        else break;
    }

    if (selectedIndex === currentLaVieLyricIndex) return;
    currentLaVieLyricIndex = selectedIndex;

    if (selectedIndex === -1) {
        subEl.style.opacity = 0;
        subEl.innerText = '';
        return;
    }

    const activeText = laVieEnRoseLyrics[selectedIndex].text;
    subEl.style.opacity = 0;

    setTimeout(() => {
        if (currentLaVieLyricIndex !== selectedIndex) return;
        subEl.innerText = activeText;
        subEl.style.opacity = 1;
    }, 160);
}

// ==========================================
// MUNDO 1: CONSTELACIONES DE TEXTO · ENJAMBRE LOCAL
// Usa exactamente los time de laVieEnRoseLyrics.
// No toca laVieEnRoseLyrics ni otros mundos.
// ==========================================

const GALAXY_LYRIC_FORM_SECONDS = 3.2;
const GALAXY_LYRIC_RELEASE_SECONDS = 4.8;
const GALAXY_LYRIC_DESKTOP_POINTS = 15000;
const GALAXY_LYRIC_MOBILE_POINTS = 8400;

let galaxyLyricConstellations = [];
let galaxyLyricConstellationsReady = false;
let galaxyBaseStarPool = null;

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function easeInOutCubic(value) {
    value = clamp01(value);
    return value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function calcGalaxyPreloadTime(text, zone) {
    const charCount = text.replace(/\s/g, '').length;
    const zoneDist = Math.sqrt(zone.x * zone.x + zone.z * zone.z);

    const charFactor = Math.min(2.0, charCount / 9);
    const distFactor = Math.min(1.4, zoneDist / 2.8);

    return GALAXY_LYRIC_FORM_SECONDS + charFactor + distFactor;
}

function getGalaxyLyricZones(isMobile = false) {
    if (isMobile) {
        return [
            { x: -1.5, y:  2.8, z: -0.8, w: 2.85, h: 0.84 },
            { x:  1.6, y: -2.4, z: -0.2, w: 2.85, h: 0.84 },
            { x:  0.0, y:  1.5, z: -1.8, w: 3.20, h: 0.88 },
            { x: -1.4, y: -1.2, z:  1.2, w: 2.65, h: 0.78 },
            { x:  1.5, y:  2.2, z:  0.8, w: 2.65, h: 0.78 }
        ];
    }

    return [
        { x: -3.2, y:  4.2, z: -1.0, w: 3.75, h: 1.06 }, 
        { x:  3.2, y: -3.8, z: -0.5, w: 3.75, h: 1.06 }, 
        { x:  0.0, y:  2.5, z: -3.0, w: 4.45, h: 1.10 }, 
        { x: -2.8, y: -2.0, z:  1.8, w: 3.35, h: 0.94 }, 
        { x:  3.0, y:  3.2, z:  1.5, w: 3.35, h: 0.94 }, 
        { x:  0.0, y: -1.8, z: -2.5, w: 4.10, h: 0.98 }  
    ];
}

function measureGalaxyTrackedText(ctx, text, tracking = 2) {
    const chars = Array.from(text);
    if (!chars.length) return 0;

    return chars.reduce((width, char, index) => {
        return width + ctx.measureText(char).width + (index < chars.length - 1 ? tracking : 0);
    }, 0);
}

function drawGalaxyTrackedText(ctx, text, x, y, tracking = 2, mode = 'fill') {
    const chars = Array.from(text);
    const totalWidth = measureGalaxyTrackedText(ctx, text, tracking);
    let cursor = x - totalWidth / 2;

    chars.forEach((char, index) => {
        if (mode === 'stroke') ctx.strokeText(char, cursor, y);
        else ctx.fillText(char, cursor, y);

        cursor += ctx.measureText(char).width + (index < chars.length - 1 ? tracking : 0);
    });
}

function wrapGalaxyConstellationTextTracked(ctx, text, maxWidth, tracking = 2) {
    const words = text.replace(/\s+/g, ' ').trim().split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = measureGalaxyTrackedText(ctx, testLine, tracking);

        if (width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });

    if (currentLine) lines.push(currentLine);
    return lines;
}

function createGalaxyTextTargets(text, zone, count) {
    const canvas = document.createElement('canvas');
    canvas.width = 980;
    canvas.height = 320;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const TRACKING = 2.4;
    const FONT_WEIGHT = 650;

    let fontSize = text.length > 25 ? 46 : 56;
    let lines = [];

    for (let attempt = 0; attempt < 18; attempt++) {
        ctx.font = `${FONT_WEIGHT} ${fontSize}px Urbanist, Arial, sans-serif`;
        lines = wrapGalaxyConstellationTextTracked(ctx, text, canvas.width * 0.86, TRACKING);

        if (lines.length * fontSize * 1.16 <= canvas.height * 0.78) break;
        fontSize -= 3;
    }

    ctx.font = `${FONT_WEIGHT} ${fontSize}px Urbanist, Arial, sans-serif`;

    const lineHeight = fontSize * 1.16;
    const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = Math.max(1.2, fontSize * 0.024);

    lines.forEach((line, index) => {
        drawGalaxyTrackedText(
            ctx,
            line,
            canvas.width / 2,
            startY + index * lineHeight,
            TRACKING,
            'stroke'
        );
    });

    ctx.fillStyle = '#ffffff';

    lines.forEach((line, index) => {
        drawGalaxyTrackedText(
            ctx,
            line,
            canvas.width / 2,
            startY + index * lineHeight,
            TRACKING,
            'fill'
        );
    });

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const candidates = [];
    const stride = 1;

    let minX = canvas.width;
    let maxX = 0;
    let minY = canvas.height;
    let maxY = 0;

    for (let y = 0; y < canvas.height; y += stride) {
        for (let x = 0; x < canvas.width; x += stride) {
            const alpha = pixels[(y * canvas.width + x) * 4 + 3];

            if (alpha > 70) {
                candidates.push({ x, y, alpha });

                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    const targets = [];
    if (!candidates.length) return targets;

    const textHeightPx = Math.max(1, maxY - minY);
    const textCenterX = (minX + maxX) / 2;
    const textCenterY = (minY + maxY) / 2;

    /*
        Regla de aspect ratio:
        - NO se escala X e Y por separado.
        - La escala es uniforme y se basa SOLO en la altura.
        - El ancho resultante fluye naturalmente según la proporción real del canvas 2D.
    */
    const uniformScale = (zone.h * 0.92) / textHeightPx;
    const step = candidates.length / count;

    for (let i = 0; i < count; i++) {
    
        const candidate = candidates[
            Math.floor((i * step + Math.random() * Math.max(1, step)) % candidates.length)
        ];

        const alphaWeight = candidate.alpha / 255;

        const planarJitter =
        0.00055 +
        (1 - alphaWeight) * 0.00095;

        const localX =
        (candidate.x - textCenterX) * uniformScale +
        (Math.random() - 0.5) * planarJitter;

        const localY =
        -(candidate.y - textCenterY) * uniformScale +
        (Math.random() - 0.5) * planarJitter;

        const localZ = (Math.random() - 0.5) * 0.0009;

        targets.push([localX, localY, localZ]);
    }

    return targets;
}


function getGalaxyBillboardBasis(zone) {
    /*
        Rotación rígida:
        angle = atan2(z, x) apunta hacia afuera desde el centro galáctico.
        Todo el texto usa esta MISMA base, sin curvar extremos.
    */
    const normalAngle = Math.atan2(zone.z, zone.x);

    const normalX = Math.cos(normalAngle);
    const normalZ = Math.sin(normalAngle);

    const tangentX = -Math.sin(normalAngle);
    const tangentZ = Math.cos(normalAngle);

    return {
        normalAngle,
        normalX,
        normalZ,
        tangentX,
        tangentZ
    };
}

function rotateGalaxyTextPoint(localPoint, zone, basis) {
    const localX = localPoint[0];
    const localY = localPoint[1];
    const localZ = localPoint[2];

    return [
        zone.x + localX * basis.tangentX + localZ * basis.normalX,
        zone.y + localY,
        zone.z + localX * basis.tangentZ + localZ * basis.normalZ
    ];
}


function collectLocalGalaxyHomes(zone, count, basis) {
    const homes = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const j = i * 3;
        // Distribución aleatoria por toda la galaxia
        const radius = Math.pow(Math.random(), 0.5) * 9; 
        const angle = Math.random() * Math.PI * 2;
        
        homes[j] = Math.cos(angle) * radius;
        homes[j + 1] = (Math.random() - 0.5) * 6; // Esparcidas en distintas alturas
        homes[j + 2] = Math.sin(angle) * radius;
    }

    return homes;
}

function buildLyricConstellation(lyric, index, isMobile = false) {
    const zones = getGalaxyLyricZones(isMobile);
    const zone = zones[index % zones.length];
    const count = isMobile ? GALAXY_LYRIC_MOBILE_POINTS : GALAXY_LYRIC_DESKTOP_POINTS;

    const dynamicPreload = calcGalaxyPreloadTime(lyric.text, zone);
    const targets = createGalaxyTextTargets(lyric.text, zone, count);
    const basis = getGalaxyBillboardBasis(zone);

    const positions = new Float32Array(count * 3);
    const homePositions = collectLocalGalaxyHomes(zone, count, basis);
    const targetPositions = new Float32Array(count * 3);
    const stagger = new Float32Array(count);
    const phase = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        const j = i * 3;
        const localTarget = targets[i] || [0, 0, 0];
        const target = rotateGalaxyTextPoint(localTarget, zone, basis);

        positions[j] = homePositions[j];
        positions[j + 1] = homePositions[j + 1];
        positions[j + 2] = homePositions[j + 2];

        targetPositions[j] = target[0];
        targetPositions[j + 1] = target[1];
        targetPositions[j + 2] = target[2];

        const breezeBias = clamp01(localTarget[0] / Math.max(0.001, zone.w) + 0.5);
        stagger[i] = clamp01(breezeBias * 0.55 + Math.random() * 0.45);
        phase[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const baseSize = isMobile ? 0.024 : 0.021;
    const freeSize = baseSize * 1.5;
    const formedSize = baseSize * 0.8;

    const material = new THREE.PointsMaterial({
        size: freeSize,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0,

        color: new THREE.Color('#fff4ba'),

        blending: THREE.AdditiveBlending,

        depthWrite: false,
        depthTest: false,
        map: starTexture,
        alphaMap: starTexture,
        alphaTest: 0.035
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 60;
    points.visible = false;

    points.userData = {
        isLyricConstellation: true,

        lyricTime: lyric.time,
        nextTime: laVieEnRoseLyrics[index + 1]?.time ?? lyric.time + 7.5,
        dynamicPreload,

        homePositions,
        targetPositions,
        stagger,
        phase,
        count,

        freeSize,
        formedSize,

        freeOpacity: 0.04,
        formedOpacity: 0.6,

        dispersedColor: new THREE.Color('#fff4ba'),
        formedColor: new THREE.Color('#ffd700')
    };

    return points;
}

function initGalaxyLyricConstellations(isMobile = window.innerWidth < 768) {
    if (!galaxyScene || galaxyLyricConstellationsReady) return;

    galaxyBaseStarPool = null;

    galaxyLyricConstellations = laVieEnRoseLyrics.map((lyric, index) => {
        const constellation = buildLyricConstellation(lyric, index, isMobile);
        galaxyScene.add(constellation);
        return constellation;
    });

    galaxyLyricConstellationsReady = true;
}

function updateGalaxyLyricConstellations(current, elapsedTime) {
    if (!galaxyLyricConstellationsReady || currentWorld !== 1) return;

    galaxyLyricConstellations.forEach((constellation) => {
        const data = constellation.userData;
        const positions = constellation.geometry.attributes.position.array;

        const preloadStart = data.lyricTime - data.dynamicPreload;
        const releaseStart = data.nextTime;

        constellation.visible = true;

        let maxPresence = 0;

        /*
            La formación completa llega en lyric.time.
            La frase queda armada hasta data.nextTime.
            La siguiente puede empezar a formarse durante el preload sin desmontar esta.
        */
        const staggerWindow = Math.min(1.25, data.dynamicPreload * 0.28);
        const formDuration = Math.max(
            0.55,
            data.dynamicPreload - staggerWindow - 0.08
        );

        for (let i = 0; i < data.count; i++) {
            const j = i * 3;
            const s = data.stagger[i];

            const staggeredStart = preloadStart + s * staggerWindow;
            const formRaw = (current - staggeredStart) / formDuration;

            const releaseRaw =
                (current - releaseStart - s * 0.72) /
                GALAXY_LYRIC_RELEASE_SECONDS;

            const form = easeInOutCubic(formRaw);
            const release = easeInOutCubic(releaseRaw);
            const presence = clamp01(form * (1 - release));

            maxPresence = Math.max(maxPresence, presence);

            const hx = data.homePositions[j];
            const hy = data.homePositions[j + 1];
            const hz = data.homePositions[j + 2];

            const tx = data.targetPositions[j];
            const ty = data.targetPositions[j + 1];
            const tz = data.targetPositions[j + 2];

            const freeFloat =
                Math.sin(elapsedTime * 0.50 + data.phase[i]) *
                0.026 *
                (1 - presence);

            const freeDriftX =
                Math.cos(elapsedTime * 0.33 + data.phase[i] * 1.7) *
                0.018 *
                (1 - presence);

            const freeDriftZ =
                Math.sin(elapsedTime * 0.29 + data.phase[i] * 1.3) *
                0.018 *
                (1 - presence);

            const letterBreath =
                Math.sin(elapsedTime * 1.65 + data.phase[i]) *
                0.0045 *
                presence;

            positions[j] = hx + (tx - hx) * presence + freeDriftX;
            positions[j + 1] = hy + (ty - hy) * presence + freeFloat + letterBreath;
            positions[j + 2] = hz + (tz - hz) * presence + freeDriftZ;
        }

        constellation.geometry.attributes.position.needsUpdate = true;

        const energy = clamp01(maxPresence);

        const material = constellation.material;

        material.opacity = data.freeOpacity + (data.formedOpacity - data.freeOpacity) * energy;

        material.size =
            data.freeSize + (data.formedSize - data.freeSize) * energy;

        material.blending = THREE.AdditiveBlending;
        material.transparent = true;
        material.depthWrite = false;
        material.needsUpdate = true;

        if (data.dispersedColor && data.formedColor) {
            material.color
            .copy(data.dispersedColor)
            .lerp(data.formedColor, energy);
        }
    });
}


    
// --- Mundo 3 (Ojos Café, Lluvia Cálida y Ondas) ---
const oceanZone = document.getElementById('ocean-interaction');
const oceanText1 = document.getElementById('ocean-text-1');
const oceanText2 = document.getElementById('ocean-text-2');
const billieLyricLine = document.getElementById('billie-lyric-line');
const billieLyricNext = document.getElementById('billie-lyric-next');

let billieLyrics = [];
let billieLyricsLoaded = false;
let currentBillieLyricIndex = -1;
const world3Background = document.getElementById('world-3');
let isWarmRain = false; 
let billieReservedSeatFound = false;
let popcornCount = 0;

oceanZone.addEventListener('mouseenter', activateCoffeeEyes);
oceanZone.addEventListener('touchstart', activateCoffeeEyes);
oceanZone.addEventListener('mouseleave', deactivateCoffeeEyes);
oceanZone.addEventListener('touchend', deactivateCoffeeEyes);


// En script.js[cite: 5]
function unlockBillieReservedSeat(event) {
    if (event) event.stopPropagation();

    const ticket = document.getElementById('billie-seat-ticket');
    const rosas = document.getElementById('billie-floor-roses');
    const aveAzul = document.getElementById('billie-reserved-seat');

    ticket.classList.add('show-ticket');
    rosas.classList.add('show-roses');
    
    // Ocultar el ave azul
    aveAzul.style.visibility = 'hidden'; 

    if (!billieReservedSeatFound) {
        billieReservedSeatFound = true;
        showAchievement('¡Logro desbloqueado!', '12 · ASIENTO 22', 5000, 'minecraft');
    }
}

// Función para cerrar (que reutilizarás en el botón X del ticket)
function toggleBillieTicket() {
    const ticket = document.getElementById('billie-seat-ticket');
    const rosas = document.getElementById('billie-floor-roses');
    const aveAzul = document.getElementById('billie-reserved-seat');

    ticket.classList.remove('show-ticket');
    rosas.classList.remove('show-roses');
    
    // Hacer que el ave reaparezca
    aveAzul.style.visibility = 'visible';
}

window.unlockBillieReservedSeat = unlockBillieReservedSeat;
window.toggleBillieTicket = toggleBillieTicket;

function activateCoffeeEyes() {
    if (currentWorld !== 3) return;

    if (world3Background) {
        world3Background.classList.add('coffee-eyes-active');
    }

    if (oceanZone) {
        oceanZone.classList.add('warm');
    }

    isWarmRain = false; // ya no usamos lluvia
}

function deactivateCoffeeEyes() {
    if (currentWorld !== 3) return;

    if (world3Background && !world3Background.classList.contains('billie-final-reveal')) {
        world3Background.classList.remove('coffee-eyes-active');
    }

    if (oceanZone) {
        oceanZone.classList.remove('warm');
    }

    isWarmRain = false;
}


function resetEffects() {
    if (polaroidPiel) polaroidPiel.classList.remove('show-polaroid-piel');
    if (polaroidLabios) polaroidLabios.classList.remove('show-polaroid-labios');
    if (polaroidOjos) polaroidOjos.classList.remove('show-polaroid-ojos');
    if (polaroidCorazon) polaroidCorazon.classList.remove('show-polaroid-corazon');

    if (typeof resetCorazonWorld === 'function') {
        resetCorazonWorld();
    }

    updateCorazonLyrics(0);

    if (typeof clearCorazonSunflowers === 'function') {
        clearCorazonSunflowers();
    }

    deactivateCoffeeEyes();
    
    if (achievement) {
        achievementUnlocked = false;
        clearTimeout(achievementTimeout);
        achievement.classList.remove('achievement-visible');
        achievement.classList.add('achievement-hidden');
    }

    if (typeof stopRainLoop === 'function') {
        stopRainLoop();
    }

    if (walleStar) {
        walleStar.classList.remove('fly');
    }

    if (featherBurst) {
        featherBurst.innerHTML = '';
    }

    if (sunflowerBurst) {
        sunflowerBurst.innerHTML = '';
    }

    for (let i = 0; i < 6; i++) {
        let label = document.getElementById(`label-${i}`);
        if (label) label.classList.remove('visible');
    }

    let coreLabel = document.getElementById('label-core');
    if (coreLabel) coreLabel.classList.remove('visible');

    hideValeskaAsteroidReveal();

    blueSecretUnlocked = false;

    openedGalaxyStars.clear();
    finalUniverseShown = false;

    const progress = document.getElementById('galaxy-progress');
    if (progress) {
        progress.textContent = 'Toca las estrellas: 0/6';
    }

    const finalMessage = document.getElementById('final-universe-message');
    if (finalMessage) {
        finalMessage.classList.remove('show');
    }

    world1VoiceTriggered = false;
    world2AchievementTriggered = false;
    world3AchievementTriggered = false;
    world4AchievementTriggered = false;

    if (typeof resetWorld6State === 'function') {
        resetWorld6State();
    }

    resetBillieCinema();
    resetYellowWorld();
    resetWorld4State();

    // Reset Mundo 1: constelación de Dirac
    isDiracForming = false;
    diracTriggered = false;
    const diracText = document.getElementById('dirac-constellation-text');
    if (diracText) diracText.classList.remove('show-dirac');

}

// ==========================================
// MUNDO 6 - BLOC DE NOTAS (CALIBRADO OFICIAL)
// ==========================================
const notepadScript = [
    { t: 0.0, str: "" },
    { t: 0.2, str: "O" },
    { t: 0.5, str: "Odio a" },
    { t: 0.8, str: "Odio a Valeska..." },
    { t: 1.8, str: "" },

    // ── ACUMULACIÓN PROGRESIVA DE LA LISTA ──
    { t: 3.3, str: "Odio" },
    { t: 3.6, str: "Odio su frágil" },
    { t: 3.9, str: "Odio su frágil corazón." },

    { t: 4.5, str: "Odio su frágil corazón.\n\nSu" },
    { t: 4.8, str: "Odio su frágil corazón.\n\nSu actitud y su forma de ser." },

    { t: 6.0, str: "Odio su frágil corazón.\n\nSu actitud y su forma de ser.\n\nSus cambios" },
    { t: 6.8, str: "Odio su frágil corazón.\n\nSu actitud y su forma de ser.\n\nSus cambios de cabello a cada rato." },

    { t: 7.5, str: "Odio su frágil corazón.\n\nSu actitud y su forma de ser.\n\nSus cambios de cabello a cada rato.\n\nEl lunar" },
    { t: 8.5, str: "Odio su frágil corazón.\n\nSu actitud y su forma de ser.\n\nSus cambios de cabello a cada rato.\n\nEl lunar de cucaracha sobre el labio." },

    { t: 10.5,  str: "Odio su frágil corazón.\n\nSu actitud y su forma de ser.\n\nSus cambios de cabello a cada rato.\n\nEl lunar de cucaracha sobre el labio.\n\nCómo su voz" },
    { t: 11.5, str: "Odio su frágil corazón.\n\nSu actitud y su forma de ser.\n\nSus cambios de cabello a cada rato.\n\nEl lunar de cucaracha sobre el labio.\n\nCómo su voz se quiebra por unas flores." },

    // ── Lista completa visible hasta t=14.0 ──
    { t: 14.0, str: "" },

    // ── REMATE FINAL (LA NUEVA FRASE DEL GESTO) ──
    { t: 14.3, str: "O" },
    { t: 14.8, str: "Odio cuando" },
    { t: 15.5, str: "Odio cuando se muerde el dedo al sonreír." },

    { t: 17.0, str: "Odio cuando se muerde el dedo al sonreír.\n\nEl punto es" },
    { t: 18.0, str: "Odio cuando se muerde el dedo al sonreír.\n\nEl punto es que, estoy jodido." },

    { t: 19.0, str: "Odio cuando se muerde el dedo al sonreír.\n\nEl punto es que, estoy jodido.\nDe ver" },
    { t: 19.5, str: "Odio cuando se muerde el dedo al sonreír.\n\nEl punto es que, estoy jodido.\nDe verdad." },

    { t: 20.0, str: "Odio cuando se muerde el dedo al sonreír.\n\nEl punto es que, estoy jodido.\nDe verdad.\n\nPor un lado" },
    { t: 21.0, str: "Odio cuando se muerde el dedo al sonreír.\n\nEl punto es que, estoy jodido.\nDe verdad.\n\nPor un lado quiero olvidarla..." },

    { t: 22.0, str: "Odio cuando se muerde el dedo al sonreír.\n\nEl punto es que, estoy jodido.\nDe verdad.\n\nPor un lado quiero olvidarla...\ny por el " },
    { t: 23.0, str: "Odio cuando se muerde el dedo al sonreír.\n\nEl punto es que, estoy jodido.\nDe verdad.\n\nPor un lado quiero olvidarla...\ny por el otro lado..." },

    { t: 24.0, str: "Odio cuando se muerde el dedo al sonreír.\n\nEl punto es que, estoy jodido.\nDe verdad.\n\nPor un lado quiero olvidarla...\ny por el otro lado...\nSé que es un caos" },
    { t: 25.0, str: "Odio cuando se muerde el dedo al sonreír.\n\nEl punto es que, estoy jodido.\nDe verdad.\n\nPor un lado quiero olvidarla...\ny por el otro lado...\nSé que es un caos precioso en este universo" },
    { t: 26.2, str: "Odio cuando se muerde el dedo al sonreír.\n\nEl punto es que, estoy jodido.\nDe verdad.\n\nPor un lado quiero olvidarla...\ny por el otro lado...\nSé que es un caos precioso en este universo y me encanta así como es ajsajs" }
];

// ==========================================
// MUNDO 6 - ESCENA DINÁMICA / DIBUJOS
// ==========================================
let roseCanvas = null;
let roseCtx = null;
let world6LoopStarted = false;
let world6LastFrame = 0;

const world6State = {
    roseA: 0,
    roseB: 0,
    roseC: 0,
    roseD: 0,
    sushiProgress: 0,
    scrapbookTriggered: false,

    // Secreto 88s
    letterEnvelopeShown: false,
    letterSecretOpen: false
};

function rangeProgress(current, start, end) {
    if (end <= start) return 0;
    return clamp01((current - start) / (end - start));
}

function initWorld6Scene() {
    roseCanvas = document.getElementById('rose-canvas');
    if (!roseCanvas) return;

    roseCtx = roseCanvas.getContext('2d');
    resizeWorld6Canvas();

    if (!world6LoopStarted) {
        world6LoopStarted = true;
        requestAnimationFrame(world6SketchLoop);
    }

    initWorld6LetterSecret();
}

function resizeWorld6Canvas() {
    if (!roseCanvas || !roseCtx) return;

    const { width, height } = getAppSize();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    roseCanvas.width = Math.max(1, Math.floor(width * dpr));
    roseCanvas.height = Math.max(1, Math.floor(height * dpr));

    roseCanvas.style.width = '100%';
    roseCanvas.style.height = '100%';

    roseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function setWorld6Symbol(id, visible) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('show', !!visible);
}

// ==========================================
// MUNDO 6 - SECRETO 88s / SOBRE + HOJA 3D
// ==========================================
function initWorld6LetterSecret() {
    const world6        = document.getElementById('world-6');
    const envelope      = document.getElementById('world6-letter-envelope');
    const notebookCard  = document.getElementById('world6-notebook-card');
    const overlay       = document.getElementById('world6-theater-overlay');
    const notebookStage = document.getElementById('world6-notebook-flip');

    if (!envelope || !notebookCard || !overlay || !notebookStage || !world6) return;

    // Evita duplicar listeners si se vuelve a inicializar el Mundo 6
    if (world6.dataset.letterSecretReady === 'true') return;
    world6.dataset.letterSecretReady = 'true';

    // 1. Abrir carta al tocar el sobre
    envelope.addEventListener('click', openWorld6NotebookSecret);
    envelope.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openWorld6NotebookSecret(event);
        }
    });

    // 2. Flip de la carta al tocar DENTRO de ella (stop propagation previene cierre accidental)
    notebookCard.addEventListener('click', (event) => {
        event.stopPropagation();
        notebookCard.classList.toggle('flipped');
    });

    // 3. Cerrar tocando directamente el overlay oscuro
    overlay.addEventListener('click', closeWorld6NotebookSecret);

    // 4. Cerrar tocando el contenedor invisible que ocupa toda la pantalla (pero fuera de la carta)
    notebookStage.addEventListener('click', (event) => {
        if (!notebookCard.contains(event.target)) {
            closeWorld6NotebookSecret(event);
        }
    });

    // 5. Botón ✕ (ahora inyectado en HTML)
    const closeBtn = document.getElementById('world6-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            closeWorld6NotebookSecret(event);
        });
    }
}

// NUEVA FUNCIÓN: Cierra suavemente la carta y permite reabrirla
function closeWorld6NotebookSecret(event) {
    if (event) {
        event.preventDefault();
    }

    const world6 = document.getElementById('world-6');
    const envelope = document.getElementById('world6-letter-envelope');
    const overlay = document.getElementById('world6-theater-overlay');
    const notebookStage = document.getElementById('world6-notebook-flip');
    const notebookCard = document.getElementById('world6-notebook-card');

    world6State.letterSecretOpen = false;

    // Removemos foco y ocultamos carta
    if (world6) world6.classList.remove('theater-focus-active');
    
    if (overlay) {
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden', 'true');
    }
    
    if (notebookStage) {
        notebookStage.classList.remove('show');
        notebookStage.setAttribute('aria-hidden', 'true');
    }
    
    if (notebookCard) {
        notebookCard.classList.remove('flipped');
    }

    // Lógica de reapertura: Si la música sigue de 88s en adelante, el sobre vuelve a aparecer
    if (currentWorld === 6 && audio && audio.currentTime >= 88.0) {
        if (envelope) {
            envelope.classList.remove('opening');
            envelope.classList.add('show');
            envelope.setAttribute('aria-hidden', 'false');
        }
        world6State.letterEnvelopeShown = true;
    } else {
        if (envelope) {
            envelope.classList.remove('show', 'opening');
            envelope.setAttribute('aria-hidden', 'true');
        }
        world6State.letterEnvelopeShown = false;
    }
}

function revealWorld6Envelope() {
    const envelope = document.getElementById('world6-letter-envelope');
    if (!envelope) return;

    world6State.letterEnvelopeShown = true;

    envelope.classList.remove('opening');
    envelope.classList.add('show');
    envelope.setAttribute('aria-hidden', 'false');
}

function hideWorld6Envelope() {
    const envelope = document.getElementById('world6-letter-envelope');
    if (!envelope) return;

    envelope.classList.remove('show');
    envelope.setAttribute('aria-hidden', 'true');
}

function openWorld6NotebookSecret(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const world6 = document.getElementById('world-6');
    const envelope = document.getElementById('world6-letter-envelope');
    const overlay = document.getElementById('world6-theater-overlay');
    const notebookStage = document.getElementById('world6-notebook-flip');

    if (!world6 || !overlay || !notebookStage) return;

    world6State.letterSecretOpen = true;

    if (envelope) {
        envelope.classList.add('opening');
        envelope.classList.remove('show');
        envelope.setAttribute('aria-hidden', 'true');
    }

    world6.classList.add('theater-focus-active');

    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');

    notebookStage.classList.add('show');
    notebookStage.setAttribute('aria-hidden', 'false');
}

function resetWorld6LetterSecret() {
    const world6 = document.getElementById('world-6');
    const envelope = document.getElementById('world6-letter-envelope');
    const overlay = document.getElementById('world6-theater-overlay');
    const notebookStage = document.getElementById('world6-notebook-flip');
    const notebookCard = document.getElementById('world6-notebook-card');

    world6State.letterEnvelopeShown = false;
    world6State.letterSecretOpen = false;

    if (world6) {
        world6.classList.remove('theater-focus-active');
    }

    if (envelope) {
        envelope.classList.remove('show', 'opening');
        envelope.setAttribute('aria-hidden', 'true');
    }

    if (overlay) {
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden', 'true');
    }

    if (notebookStage) {
        notebookStage.classList.remove('show');
        notebookStage.setAttribute('aria-hidden', 'true');
    }

    if (notebookCard) {
        notebookCard.classList.remove('flipped');
    }
}

function updateWorld6Scene(current) {
    if (currentWorld !== 6) return;
    const world6 = document.getElementById('world-6');
    if (!world6) return;

    setWorld6Symbol('mole-doodle', current >= 5.5 && current < 7.5);
    setWorld6Symbol('cherry-doodle', current >= 7.8 && current < 9.3);
    world6.classList.toggle('show-park', current >= 17.5);

    world6State.roseA = rangeProgress(current, 20.5, 23.0); 
    world6State.roseB = rangeProgress(current, 23.0, 26.0); 
    world6State.roseC = rangeProgress(current, 26.0, 29.0); 
    world6State.roseD = rangeProgress(current, 29.0, 32.0); 
    world6State.sushiProgress = rangeProgress(current, 28.0, 31.0); // El sushi se dibuja aquí

    if (current >= 33.0 && !world6State.scrapbookTriggered) {
        world6State.scrapbookTriggered = true;
        triggerScrapbookExplosion();
    }

    // Secreto del sobre: aparece desde 1:28 / 88.0s
    if (current >= 88.0 && !world6State.letterEnvelopeShown && !world6State.letterSecretOpen) {
        revealWorld6Envelope();
    }

    // Si retrocedes la canción antes del segundo 88 y aún no abrió el secreto, se vuelve a ocultar.
    if (current < 88.0 && world6State.letterEnvelopeShown && !world6State.letterSecretOpen) {
        hideWorld6Envelope();
        world6State.letterEnvelopeShown = false;
    }

    world6.classList.toggle('final-confession-active', current >= 39.0);
}

function world6SketchLoop(timestamp) {
    requestAnimationFrame(world6SketchLoop);

    if (!roseCtx || currentWorld !== 6) return;

    // 15 FPS aprox
    if (timestamp - world6LastFrame < (1000 / 15)) return;
    world6LastFrame = timestamp;

    drawWorld6Roses();
}

function drawWorld6Roses() {
    if (!roseCanvas || !roseCtx) return;
    const rect = roseCanvas.getBoundingClientRect();
    roseCtx.clearRect(0, 0, rect.width, rect.height);

    if (world6State.roseA > 0) drawMathRose(roseCtx, rect.width * 0.10, rect.height * 0.85, 30, world6State.roseA, -0.2);
    if (world6State.roseB > 0) drawMathRose(roseCtx, rect.width * 0.90, rect.height * 0.85, 38, world6State.roseB, 0.2);
    if (world6State.roseC > 0) drawMathRose(roseCtx, rect.width * 0.15, rect.height * 0.15, 25, world6State.roseC, 2.5);
    if (world6State.roseD > 0) drawMathRose(roseCtx, rect.width * 0.85, rect.height * 0.20, 28, world6State.roseD, -2.1);
    
    // Dibuja el Sushi de Grafito en el centro-derecha
    if (world6State.sushiProgress > 0) {
        drawGraphiteSushi(roseCtx, rect.width * 0.82, rect.height * 0.60, 35, world6State.sushiProgress);
    }
}

function drawMathRose(ctx, cx, cy, scale, progress, rotation = 0) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    const totalSteps = 260;
    const maxSteps = Math.max(2, Math.floor(totalSteps * progress));

    // COLOR GRAFITO (Lápiz)
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(50, 55, 60, 0.85)'; // Gris oscuro

    for (let i = 0; i <= maxSteps; i++) {
        const theta = (i / totalSteps) * Math.PI * 8;
        const r = Math.cos(5 * theta);
        const x = scale * r * Math.cos(theta);
        const y = scale * r * Math.sin(theta);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Sombreado de grafito frotado
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(30, 35, 40, 0.10)';
    ctx.lineWidth = 5;
    for (let i = 0; i <= maxSteps; i++) {
        const theta = (i / totalSteps) * Math.PI * 8;
        const r = Math.cos(5 * theta);
        const x = scale * r * Math.cos(theta);
        const y = scale * r * Math.sin(theta);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Tallo y hojas a lápiz
    ctx.strokeStyle = 'rgba(50, 55, 60, 0.6)';
    ctx.lineWidth = 1.2;
    if (progress > 0.18) {
        ctx.beginPath(); ctx.moveTo(0, scale * 0.55); ctx.quadraticCurveTo(-6, scale * 1.05, 10, scale * 1.75); ctx.stroke();
    }
    if (progress > 0.42) {
        ctx.beginPath(); ctx.moveTo(3, scale * 1.1); ctx.quadraticCurveTo(24, scale * 1.02, 14, scale * 1.24); ctx.quadraticCurveTo(7, scale * 1.18, 3, scale * 1.1); ctx.stroke();
    }
    ctx.restore();
}

// Boceto arquitectónico de un Sushi Roll
function drawGraphiteSushi(ctx, cx, cy, scale, progress) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(0.2); // Inclinación casual
    
    const maxP = clamp01(progress);
    ctx.strokeStyle = 'rgba(50, 55, 60, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    // Cilindro del alga (Nori)
    if (maxP > 0.1) { ctx.ellipse(0, 0, scale, scale * 0.5, 0, 0, Math.PI * 2 * maxP); }
    if (maxP > 0.4) { ctx.ellipse(0, scale * 0.8, scale, scale * 0.5, 0, 0, Math.PI); }
    if (maxP > 0.6) { ctx.moveTo(-scale, 0); ctx.lineTo(-scale, scale * 0.8); ctx.moveTo(scale, 0); ctx.lineTo(scale, scale * 0.8); }
    ctx.stroke();

    // Relleno (salmón, arroz) con sombreado sucio
    if (maxP > 0.8) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(50, 55, 60, 0.5)';
        ctx.rect(-scale * 0.4, -scale * 0.2, scale * 0.8, scale * 0.4);
        ctx.moveTo(-scale*0.6, 0); ctx.lineTo(scale*0.6, 0);
        ctx.stroke();
    }
    ctx.restore();
}

function updateNotepadText(current) {
    if (currentWorld !== 6) return;

    const notepadEl = document.getElementById('notepad-text');
    if (!notepadEl) return;

    let activeStr = "";

    for (let i = 0; i < notepadScript.length; i++) {
        if (current >= notepadScript[i].t) {
            activeStr = notepadScript[i].str;
        } else {
            break;
        }
    }

    if (notepadEl.textContent !== activeStr) {
        notepadEl.textContent = activeStr;
    }

    // NUEVO: actualiza la escena visual del mundo 6
    updateWorld6Scene(current);
}

function resetWorld6State() {
    const world6 = document.getElementById('world-6');
    const notepadEl = document.getElementById('notepad-text');
    const scrapbookLayer = document.getElementById('scrapbook-layer');

    if (world6) {
        world6.classList.remove('show-park', 'final-confession-active', 'doodle-active');
    }

    if (notepadEl) {
        notepadEl.textContent = '';
    }

    if (scrapbookLayer) {
        scrapbookLayer.innerHTML = '';
    }

    const mole = document.getElementById('mole-doodle');
    const cherry = document.getElementById('cherry-doodle');

    if (mole) mole.classList.remove('show');
    if (cherry) cherry.classList.remove('show');

    world6State.roseA = 0;
    world6State.roseB = 0;
    world6State.roseC = 0;
    world6State.roseD = 0;
    world6State.scrapbookTriggered = false;

    if (roseCtx && roseCanvas) {
        const rect = roseCanvas.getBoundingClientRect();
        roseCtx.clearRect(0, 0, rect.width, rect.height);
    }

    resetWorld6LetterSecret();
}

// ==========================================
// MOTOR DE LETRAS MUNDO 2 (CORAZÓN)
// ==========================================
// Llénalo con los tiempos en segundos cuando escuches la canción.
const corazonTimedLyrics = [
    { time: 0, main: "Ni idea que poner aca...", next: "¡Uh!" },
    { time: 1.63, main: "¡Uh!", next: "¡Vamo!" },
    { time: 4.05, main: "¡Vamo!", next: "Yeh-yeh, yeh-yeh, yei" },
    { time: 6.43, main: "Yeh-yeh, yeh-yeh, yei", next: "Babylon Gi-i-irl" },
    { time: 11.04, main: "Babylon Gi-i-irl", next: "Oh, oh" },
    { time: 16.23, main: "Oh, oh", next: "Dice" },
    { time: 19.97, main: "Dice", next: "No había ninguna intención, solo una tensión entre nosotros" },
    { time: 21.02, main: "No había ninguna intención, solo una tensión entre nosotros", next: "Era tanta la magia, baby, que se veía hasta en las fotos" },
    { time: 25.9, main: "Era tanta la magia, baby, que se veía hasta en las fotos", next: "La idea era arreglarnos, no terminar más rotos" },
    { time: 30.87, main: "La idea era arreglarnos, no terminar más rotos", next: "Hubo un fallo en la dirección, era tu cama" },
    { time: 35.71, main: "Hubo un fallo en la dirección, era tu cama", next: "No tu corazón, bebé" },
    { time: 39.54, main: "No tu corazón, bebé", next: "Hicimos el amor una y otra vez" },
    { time: 42.8, main: "Hicimos el amor una y otra vez", next: "No sé ni cómo explicarlo, baby, ya no sé si fuimos agua o sed" },
    { time: 47.4, main: "No sé ni cómo explicarlo, baby, ya no sé si fuimos agua o sed", next: "¿Y ahora cómo te digo que me enamoré?" },
    { time: 54.48, main: "¿Y ahora cómo te digo que me enamoré?", next: "No sé ni cómo explicarlo" },
    { time: 63.69, main: "No sé ni cómo explicarlo", next: "Oh, baby, ya no sé si fuimos agua o sed" },
    { time: 68.2, main: "Oh, baby, ya no sé si fuimos agua o sed", next: "Oh, oh" },
    { time: 73.82, main: "Oh, oh", next: "Ey, yo" },
    { time: 77.4, main: "Ey, yo", next: "Si nunca había una intención, ¿por qué tanto enredo entre nosotros?" },
    { time: 78.37, main: "Si nunca había una intención, ¿por qué tanto enredo entre nosotros?", next: "Ya no quiero manejar si no va' a estar tú de copiloto" },
    { time: 83.11, main: "Ya no quiero manejar si no va' a estar tú de copiloto", next: "La culpa es de tu cara, que la veo y me vuelvo loco" },
    { time: 87.55, main: "La culpa es de tu cara, que la veo y me vuelvo loco", next: "Hubo un fallo en la dirección, era tu cama" },
    { time: 92.87, main: "Hubo un fallo en la dirección, era tu cama", next: "No tu corazón, bebé" },
    { time: 96.62, main: "No tu corazón, bebé", next: "Hicimos el amor una y otra vez" },
    { time: 99.79, main: "Hicimos el amor una y otra vez", next: "No sé ni cómo explicarlo, baby, ya no sé si fuimos agua o sed" },
    { time: 104.79, main: "No sé ni cómo explicarlo, baby, ya no sé si fuimos agua o sed", next: "¿Y ahora cómo te digo que me enamoré? Ay" },
    { time: 111.68, main: "¿Y ahora cómo te digo que me enamoré? Ay", next: "La-la-la-la, la-la-la-la, la, ah-ah" },
    { time: 119.02, main: "La-la-la-la, la-la-la-la, la, ah-ah", next: "Oh" },
    { time: 123.06, main: "Oh", next: "Uh-uh-uh-uh-uh-uh" },
    { time: 124.09, main: "Uh-uh-uh-uh-uh-uh", next: "Baby, ya no sé si fuimos agua o sed" },
    { time: 125.84, main: "Baby, ya no sé si fuimos agua o sed", next: "¿Y ahora cómo te digo que me enamoré?" },
    { time: 130.93, main: "¿Y ahora cómo te digo que me enamoré?", next: "De tu piel" },
    { time: 135.27, main: "De tu piel", next: "de tu boca" },
    { time: 136.36, main: "de tu boca", next: "de cómo hablas de tus cosas" },
    { time: 137.53, main: "de cómo hablas de tus cosas", next: "De cómo esquivas los Te Quiero" },
    { time: 139.75, main: "De cómo esquivas los Te Quiero", next: "tú me encantas porque estás loca" },
    { time: 142.31, main: "tú me encantas porque estás loca", next: "De tu voz, de tus miedos, de tus victorias y tus derrotas" },
    { time: 144.73, main: "De tu voz, de tus miedos, de tus victorias y tus derrotas", next: "Fue tan fácil para ti enamorarme con tu corazón" },
    { time: 149.85, main: "Fue tan fácil para ti enamorarme con tu corazón", next: "" },
    { time: 165.0, main: "", next: "" }
];
let currentCorazonLyricIndex = -1;

function updateCorazonLyrics(current) {
    const lyricMain = document.getElementById('corazon-lyric-main');
    const lyricNext = document.getElementById('corazon-lyric-next');
    const box = document.querySelector('.corazon-lyrics-box');
    
    // Si no estamos en el mundo 2, nos aseguramos de borrar todo y salimos
    if (currentWorld !== 2) {
        if (lyricMain) lyricMain.textContent = "";
        if (lyricNext) lyricNext.textContent = "";
        if (box) box.classList.remove('change');
        currentCorazonLyricIndex = -1;
        return;
    }

    if (!lyricMain || !lyricNext || !box) return;

    let selectedIndex = 0;
    for (let i = 0; i < corazonTimedLyrics.length; i++) {
        if (current >= corazonTimedLyrics[i].time) selectedIndex = i;
        else break;
    }

    if (selectedIndex === currentCorazonLyricIndex) return;
    currentCorazonLyricIndex = selectedIndex;

    box.classList.add('change');
    setTimeout(() => {
        lyricMain.textContent = corazonTimedLyrics[selectedIndex].main;
        lyricNext.textContent = corazonTimedLyrics[selectedIndex].next;
        box.classList.remove('change');
    }, 300);
}



// OBSOLETO: stub antiguo de resetWorld4State eliminado (función completa definida arriba)

// ==========================================
// 9. MOTOR 3D: GALAXIA PRO
// ==========================================
let galaxyScene, galaxyCamera, galaxyRenderer, galaxyControls, galaxyComposer;
let galaxyInitialized = false;
const clock = new THREE.Clock();
// Navegación WASD tipo vuelo libre para Mundo 1
const galaxyFlightKeys = {
    w: false,
    a: false,
    s: false,
    d: false
};

let galaxyFlightControlsBound = false;
let galaxyFlightLastTime = performance.now();

const GALAXY_FLIGHT_SPEED = 0.05; // aprox. por frame a 60fps
const galaxyFlightForward = new THREE.Vector3();
const galaxyFlightRight = new THREE.Vector3();
const galaxyFlightMove = new THREE.Vector3();

function bindGalaxyFlightControls() {
    if (galaxyFlightControlsBound) return;
    galaxyFlightControlsBound = true;

    window.addEventListener('keydown', (event) => {
        if (currentWorld !== 1) return;

        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

        const key = event.key.toLowerCase();
        if (key in galaxyFlightKeys) {
            galaxyFlightKeys[key] = true;
            event.preventDefault();
        }
    }, { passive: false });

    window.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        if (key in galaxyFlightKeys) {
            galaxyFlightKeys[key] = false;
            event.preventDefault();
        }
    }, { passive: false });
}

function updateGalaxyFlightMovement() {
    if (
        currentWorld !== 1 ||
        !galaxyCamera ||
        !galaxyControls ||
        !galaxyControls.target
    ) {
        galaxyFlightLastTime = performance.now();
        return;
    }

    const now = performance.now();
    const deltaScale = Math.min(2.25, ((now - galaxyFlightLastTime) / 1000) * 60);
    galaxyFlightLastTime = now;

    galaxyFlightMove.set(0, 0, 0);

    galaxyCamera.getWorldDirection(galaxyFlightForward);
    galaxyFlightForward.normalize();

    galaxyFlightRight.copy(galaxyFlightForward)
        .cross(galaxyCamera.up)
        .normalize();

    if (galaxyFlightKeys.w) galaxyFlightMove.add(galaxyFlightForward);
    if (galaxyFlightKeys.s) galaxyFlightMove.sub(galaxyFlightForward);
    if (galaxyFlightKeys.d) galaxyFlightMove.add(galaxyFlightRight);
    if (galaxyFlightKeys.a) galaxyFlightMove.sub(galaxyFlightRight);

    if (galaxyFlightMove.lengthSq() === 0) return;

    galaxyFlightMove
        .normalize()
        .multiplyScalar(GALAXY_FLIGHT_SPEED * deltaScale);

    galaxyCamera.position.add(galaxyFlightMove);
    galaxyControls.target.add(galaxyFlightMove);
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let interactiveStars = []; 
let interactiveStarAuras = [];
let blueSecretStar = null;
let blueSecretAura = null;
let nearDustParticles; 
let galaxyNebulaGroup = null;
let galaxyDustLaneGroup = null;
let galaxyCoreGlowGroup = null;
let galaxyMistGroup = null;
let galaxyStarFormingGroup = null;
let galaxyForegroundDustGroup = null;
let galaxyBlueSpiralDust = null;
let galaxyStreakField = null;
let coreMesh; 
let blueSecretUnlocked = false; 
let valeskaAsteroidRevealed = false; // guard: evita abrir la ficha si ya está abierta

function createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const context = canvas.getContext('2d');
    context.beginPath(); context.arc(16, 16, 15, 0, Math.PI * 2);
    context.fillStyle = '#ffffff'; context.fill();
    return new THREE.CanvasTexture(canvas);
}
const starTexture = createCircleTexture();

function createNebulaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
}

function createAuraTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);

    // Capa base: halo suave con caída lenta para que el glow se sienta voluminoso
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0.00, 'rgba(255, 248, 220, 0.92)');  // blanco cálido en centro
    gradient.addColorStop(0.12, 'rgba(255, 235, 180, 0.60)');  // crema
    gradient.addColorStop(0.30, 'rgba(255, 210, 130, 0.24)');  // dorado suave
    gradient.addColorStop(0.55, 'rgba(255, 180,  90, 0.09)');  // naranja muy suave
    gradient.addColorStop(0.78, 'rgba(200, 145, 255, 0.03)');  // hint lavanda
    gradient.addColorStop(1.00, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    // Anillo difuso intermedio: da profundidad, parece halo multiespectral
    ctx.globalCompositeOperation = 'screen';
    const ringGrad = ctx.createRadialGradient(128, 128, 38, 128, 128, 96);
    ringGrad.addColorStop(0.0,  'rgba(255, 255, 255, 0)');
    ringGrad.addColorStop(0.45, 'rgba(255, 240, 200, 0.045)');
    ringGrad.addColorStop(0.75, 'rgba(210, 200, 255, 0.035)');
    ringGrad.addColorStop(1.0,  'rgba(255,255,255,0)');
    ctx.fillStyle = ringGrad;
    ctx.fillRect(0, 0, 256, 256);

    // Manchas asimétricas: rompen la perfección circular → aspecto de gas estelar
    ctx.globalCompositeOperation = 'screen';
    const blobs = [
        { x: 110, y: 108, r: 55, a: 0.055 },
        { x: 148, y: 120, r: 60, a: 0.042 },
        { x: 128, y:  98, r: 40, a: 0.035 },
        { x: 100, y: 148, r: 45, a: 0.028 },
        { x: 158, y: 100, r: 38, a: 0.022 }
    ];
    blobs.forEach(b => {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0,   `rgba(255, 245, 210, ${b.a})`);
        g.addColorStop(0.6, `rgba(255, 220, 160, ${b.a * 0.4})`);
        g.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
}

const auraTexture = createAuraTexture();

function createBlueSecretAuraTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 192;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 192, 192);
    ctx.globalCompositeOperation = 'lighter';

    const base = ctx.createRadialGradient(96, 96, 0, 96, 96, 92);
    base.addColorStop(0.00, 'rgba(255,255,255,0.52)');
    base.addColorStop(0.16, 'rgba(120,215,255,0.30)');
    base.addColorStop(0.38, 'rgba(54,150,255,0.15)');
    base.addColorStop(0.68, 'rgba(40,92,255,0.052)');
    base.addColorStop(1.00, 'rgba(0,0,0,0)');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 192, 192);

    // Pequeñas nubes asimétricas para que no se lea como un aro perfecto.
    const blobs = [
        { x: 82, y: 88, r: 44, a: 0.16 },
        { x: 112, y: 102, r: 50, a: 0.13 },
        { x: 96, y: 72, r: 32, a: 0.10 },
        { x: 72, y: 116, r: 36, a: 0.09 },
        { x: 126, y: 76, r: 30, a: 0.08 }
    ];

    blobs.forEach(blob => {
        const g = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
        g.addColorStop(0, `rgba(132,224,255,${blob.a})`);
        g.addColorStop(0.62, `rgba(56,156,255,${blob.a * 0.38})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
        ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

const blueSecretAuraTexture = createBlueSecretAuraTexture();

function createGalaxyStreakTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const g = ctx.createLinearGradient(0, 48, 384, 48);
    g.addColorStop(0.00, 'rgba(255,255,255,0)');
    g.addColorStop(0.18, 'rgba(120,210,255,0.035)');
    g.addColorStop(0.42, 'rgba(190,230,255,0.20)');
    g.addColorStop(0.52, 'rgba(255,245,210,0.16)');
    g.addColorStop(0.66, 'rgba(150,190,255,0.10)');
    g.addColorStop(1.00, 'rgba(255,255,255,0)');

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const center = ctx.createRadialGradient(192, 48, 0, 192, 48, 54);
    center.addColorStop(0.00, 'rgba(255,255,255,0.22)');
    center.addColorStop(0.30, 'rgba(120,220,255,0.08)');
    center.addColorStop(1.00, 'rgba(255,255,255,0)');

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = center;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;

    return texture;
}

const galaxyStreakTexture = createGalaxyStreakTexture();

function createGalaxyStreakField(parameters, isMobile = false, isHighEndMobile = false) {
    const group = new THREE.Group();
    group.name = 'galaxy-streak-field';

    const count = isMobile
        ? (isHighEndMobile ? 150 : 80)
        : 130;

    const palette = [
        new THREE.Color('#8bdcff'),
        new THREE.Color('#4e82ff'),
        new THREE.Color('#d4b7ff'),
        new THREE.Color('#fff0b6')
    ];

    for (let i = 0; i < count; i++) {
        const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2;
        const radius = 0.9 + Math.pow(Math.random(), 0.62) * parameters.radius * 0.96;

        const spinAngle = radius * parameters.spin;
        const randomAngle = (Math.random() - 0.5) * 0.34;
        const angle = branchAngle + spinAngle + randomAngle;

        const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.20;
        const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.20;
        const y = (Math.random() - 0.5) * (0.34 + radius * 0.035);

        const color = palette[Math.floor(Math.random() * palette.length)].clone();

        const material = new THREE.SpriteMaterial({
            map: galaxyStreakTexture,
            color,
            transparent: true,
            opacity: 0.055 + Math.random() * 0.060,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        material.rotation = angle + Math.PI * 0.5 + (Math.random() - 0.5) * 0.35;

        const streak = new THREE.Sprite(material);
        streak.position.set(x, y, z);

        const length = 0.38 + Math.random() * 0.92 + radius * 0.035;
        const thickness = 0.030 + Math.random() * 0.030;

        streak.scale.set(length, thickness, 1);

        streak.userData = {
            baseOpacity: material.opacity,
            phase: Math.random() * Math.PI * 2,
            drift: 0.006 + Math.random() * 0.012
        };

        group.add(streak);
    }

    group.userData = {
        baseRotation: Math.random() * Math.PI * 2
    };

    return group;
}


// ======================================================
// NUBES / NEBULOSAS REALISTAS PARA EL MUNDO 1
// Son pocas sprites grandes con textura procedural: se ve más denso sin matar FPS.
// ======================================================
function createSoftCloudTexture(options = {}) {
    const {
        size = 256,
        coreAlpha = 0.72,
        midAlpha = 0.24,
        edgeAlpha = 0.0,
        noise = true,
        cells = 38,
        cavities = 20
    } = options;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    const cx = size * 0.5;
    const cy = size * 0.5;

    // Base suave, pero con caída lenta para que parezca gas y no círculo sólido.
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.54);
    gradient.addColorStop(0.00, `rgba(255,255,255,${coreAlpha})`);
    gradient.addColorStop(0.18, `rgba(255,255,255,${midAlpha})`);
    gradient.addColorStop(0.46, 'rgba(255,255,255,0.115)');
    gradient.addColorStop(0.72, 'rgba(255,255,255,0.035)');
    gradient.addColorStop(1.00, `rgba(255,255,255,${edgeAlpha})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Parches de gas: rompe la forma circular y crea volumen orgánico.
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < cells; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.pow(Math.random(), 0.85) * size * 0.32;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        const r = size * (0.045 + Math.random() * 0.19);
        const a = 0.018 + Math.random() * 0.05;

        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(255,255,255,${a})`);
        g.addColorStop(0.55, `rgba(255,255,255,${a * 0.35})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Cavidades oscuras: evita que la nebulosa se vea como sticker.
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < cavities; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.pow(Math.random(), 0.75) * size * 0.38;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        const r = size * (0.035 + Math.random() * 0.13);
        const a = 0.035 + Math.random() * 0.10;

        const cut = ctx.createRadialGradient(x, y, 0, x, y, r);
        cut.addColorStop(0, `rgba(255,255,255,${a})`);
        cut.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.fillStyle = cut;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Alpha noise barato: textura menos plástica, sin subir geometría.
    if (noise) {
        ctx.globalCompositeOperation = 'destination-in';
        const image = ctx.getImageData(0, 0, size, size);
        const data = image.data;
        for (let i = 0; i < data.length; i += 4) {
            const px = (i / 4) % size;
            const py = Math.floor((i / 4) / size);
            const soft = 0.90 + 0.10 * Math.sin(px * 0.09) * Math.cos(py * 0.075);
            const grain = 0.82 + Math.random() * 0.25;
            data[i + 3] = Math.min(255, data[i + 3] * soft * grain);
        }
        ctx.putImageData(image, 0, 0);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
}

function createDustLaneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const g = ctx.createRadialGradient(256, 128, 8, 256, 128, 255);
    g.addColorStop(0.00, 'rgba(0,0,0,0.88)');
    g.addColorStop(0.25, 'rgba(0,0,0,0.52)');
    g.addColorStop(0.56, 'rgba(0,0,0,0.18)');
    g.addColorStop(1.00, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mordidas internas para que el polvo no sea una mancha ovalada perfecta.
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 28; i++) {
        const x = 55 + Math.random() * 410;
        const y = 34 + Math.random() * 188;
        const r = 18 + Math.random() * 68;
        const cut = ctx.createRadialGradient(x, y, 0, x, y, r);
        cut.addColorStop(0, 'rgba(255,255,255,0.18)');
        cut.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = cut;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
}

function makeGalaxyPlane(texture, color, opacity, blending = THREE.AdditiveBlending) {
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        color: new THREE.Color(color),
        transparent: true,
        opacity,
        blending,
        depthWrite: false,
        side: THREE.DoubleSide
    });

    if (blending === THREE.NormalBlending) {
        material.depthTest = false;
    }

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 1), material);
    mesh.frustumCulled = false;
    return mesh;
}

function placeInGalaxyPlane(mesh, x, y, z, scaleX, scaleZ, angle, renderOrder = 0) {
    mesh.position.set(x, y, z);

    // La textura queda acostada en el disco galáctico, no pegada a la cámara.
    // Esto elimina el look de "reflector" que salía con sprites gigantes.
    mesh.rotation.set(-Math.PI / 2, 0, angle);
    mesh.scale.set(scaleX, scaleZ, 1);
    mesh.renderOrder = renderOrder;

    mesh.userData.baseOpacity = mesh.material.opacity;
    mesh.userData.baseScaleX = scaleX;
    mesh.userData.baseScaleZ = scaleZ;
    mesh.userData.baseRotationZ = angle;
    mesh.userData.phase = Math.random() * Math.PI * 2;
    mesh.userData.rotationSpeed = (Math.random() - 0.5) * 0.00065;

    return mesh;
}

function spiralPoint(parameters, index, radiusBias = 0.72, angleNoise = 0.32) {
    const r = 0.55 + Math.pow(Math.random(), radiusBias) * parameters.radius * 0.98;
    const branch = index % parameters.branches;
    const branchAngle = (branch / parameters.branches) * Math.PI * 2;
    const theta = branchAngle + r * parameters.spin + (Math.random() - 0.5) * angleNoise;

    // Tangente aproximada de una espiral: hace que las nubes sigan los brazos.
    const dx = Math.cos(theta) - r * parameters.spin * Math.sin(theta);
    const dz = Math.sin(theta) + r * parameters.spin * Math.cos(theta);
    const tangent = Math.atan2(dz, dx);

    return { r, theta, tangent };
}



function createGalaxyAtmosphere(parameters, isMobile = false, isHighEndMobile = false) {
    const root = new THREE.Group();

    const cloudTextures = [
        createSoftCloudTexture({ size: isMobile ? 192 : 320, coreAlpha: 0.50, midAlpha: 0.16, cells: 46, cavities: 26 }),
        createSoftCloudTexture({ size: isMobile ? 192 : 288, coreAlpha: 0.42, midAlpha: 0.13, cells: 52, cavities: 32 }),
        createSoftCloudTexture({ size: isMobile ? 160 : 256, coreAlpha: 0.58, midAlpha: 0.18, cells: 36, cavities: 24 })
    ];

    const mistTexture = createSoftCloudTexture({
        size: isMobile ? 192 : 384,
        coreAlpha: 0.22,
        midAlpha: 0.085,
        edgeAlpha: 0.0,
        cells: 58,
        cavities: 34
    });

    const knotTexture = createSoftCloudTexture({
        size: isMobile ? 96 : 128,
        coreAlpha: 0.78,
        midAlpha: 0.22,
        edgeAlpha: 0.0,
        cells: 24,
        cavities: 12
    });

    // Textura de filamento: alargada horizontalmente para simular gas en flujo
    const filamentTexture = createSoftCloudTexture({
        size: isMobile ? 128 : 192,
        coreAlpha: 0.35,
        midAlpha: 0.10,
        edgeAlpha: 0.0,
        cells: 18,
        cavities: 8
    });

    const dustTexture = createDustLaneTexture();

    galaxyNebulaGroup = new THREE.Group();
    galaxyDustLaneGroup = new THREE.Group();
    galaxyCoreGlowGroup = new THREE.Group();
    galaxyMistGroup = new THREE.Group();
    galaxyStarFormingGroup = new THREE.Group();
    galaxyForegroundDustGroup = new THREE.Group();
    const galaxyFilamentGroup = new THREE.Group();

    // Paleta de brazos: azul/cian/lavanda — más contraste con el núcleo cálido
    const palette = [
        '#3455ff',
        '#4a6aff',
        '#5e58ff',
        '#7f60f0',
        '#9e72f5',
        '#cc6aaa',
        '#e87ab8'
    ];

    // Paleta cálida para el núcleo
    const warmPalette = ['#fff3d0', '#ffd8a0', '#ffba70'];

    // ── NÚCLEO ──
    // Cinco capas: núcleo blanco-cálido preciso → dorado medio → ámbar → cian periférico.
    // Opacidades escalonadas para detalle interno sin sobrequemar.
    const coreLayers = [
        // Centro puro: pequeño y muy controlado, detalle del bulge
        { color: '#fffae8', opacity: isMobile ? 0.10 : 0.14, scale: [1.55, 0.72] },
        // Capa interna: blanco cálido con masa
        { color: '#fff0d8', opacity: isMobile ? 0.16 : 0.22, scale: [2.80, 1.18] },
        // Capa media: dorado suave, volumen real
        { color: '#ffca7a', opacity: isMobile ? 0.065 : 0.095, scale: [4.30, 1.40] },
        // Ámbar exterior: transición al polvo
        { color: '#ffae55', opacity: isMobile ? 0.035 : 0.055, scale: [5.50, 1.65] },
        // Halo cian periférico: une el núcleo cálido con los brazos fríos
        { color: '#90ccff', opacity: isMobile ? 0.022 : 0.038, scale: [7.20, 2.10] }
    ];

    coreLayers.forEach((layer, index) => {
        const tex = cloudTextures[index % cloudTextures.length];
        const mesh = makeGalaxyPlane(tex, layer.color, layer.opacity);
        placeInGalaxyPlane(mesh, 0, 0.012 + index * 0.005, 0, layer.scale[0], layer.scale[1], (index - 1) * 0.08, -2);
        mesh.userData.rotationSpeed = 0.00012 + index * 0.00010;
        galaxyCoreGlowGroup.add(mesh);
    });

    // Polvo oscuro cálido sobre el núcleo: da textura interna y evita el look "quemado"
    {
        const coredustMesh = makeGalaxyPlane(dustTexture, '#2e1200', isMobile ? 0.048 : 0.065, THREE.NormalBlending);
        placeInGalaxyPlane(coredustMesh, 0, 0.042, 0, 2.50, 0.78, 0.15, -1);
        coredustMesh.userData.opacityWave = 0.006;
        galaxyCoreGlowGroup.add(coredustMesh);
    }
    // Segunda capa de polvo ligeramente desplazada: más profundidad
    {
        const coredustMesh2 = makeGalaxyPlane(dustTexture, '#1a0a00', isMobile ? 0.030 : 0.042, THREE.NormalBlending);
        placeInGalaxyPlane(coredustMesh2, 0.12, 0.050, 0.08, 1.90, 0.55, -0.20, -1);
        coredustMesh2.userData.opacityWave = 0.005;
        galaxyCoreGlowGroup.add(coredustMesh2);
    }

    // ── NIEBLA DE FONDO ── (igual que antes, amplía la atmósfera)
    const mistCount = isMobile ? (isHighEndMobile ? 14 : 10) : 18;
    for (let i = 0; i < mistCount; i++) {
        const p = spiralPoint(parameters, i, 0.82, 0.75);
        const off = (Math.random() - 0.5) * (0.35 + p.r * 0.08);
        const x = Math.cos(p.theta) * p.r + Math.cos(p.theta + Math.PI / 2) * off;
        const z = Math.sin(p.theta) * p.r + Math.sin(p.theta + Math.PI / 2) * off;

        const opacity = (isMobile ? 0.012 : 0.016) + Math.random() * (isMobile ? 0.013 : 0.018);
        const mesh = makeGalaxyPlane(mistTexture, palette[i % palette.length], opacity);
        const s = (isMobile ? 1.55 : 2.05) + Math.random() * (isMobile ? 0.65 : 1.05);

        placeInGalaxyPlane(
            mesh,
            x,
            (Math.random() - 0.5) * 0.035,
            z,
            s * (1.35 + Math.random() * 0.35),
            s * (0.70 + Math.random() * 0.25),
            p.tangent + (Math.random() - 0.5) * 0.18,
            -4
        );

        mesh.userData.opacityWave = 0.004;
        galaxyMistGroup.add(mesh);
    }

    // ── NEBULOSAS PRINCIPALES ── mayor densidad en brazos medios → estructura espiral más clara
    const nebulaCount = isMobile ? (isHighEndMobile ? 52 : 32) : 60;
    for (let i = 0; i < nebulaCount; i++) {
        const p = spiralPoint(parameters, i, 0.64, 0.38);
        const side = (Math.random() - 0.5) * (0.14 + p.r * 0.060);
        const x = Math.cos(p.theta) * p.r + Math.cos(p.theta + Math.PI / 2) * side;
        const z = Math.sin(p.theta) * p.r + Math.sin(p.theta + Math.PI / 2) * side;
        const t = p.r / parameters.radius;

        const tex = cloudTextures[i % cloudTextures.length];
        // Más contraste en brazos medios (t: 0.28–0.78)
        const opacityBoost = (t > 0.28 && t < 0.78) ? (0.018 + (0.50 - Math.abs(t - 0.50)) * 0.020) : 0;
        const opacity = (isMobile ? 0.032 : 0.048) + Math.random() * (isMobile ? 0.028 : 0.040) + opacityBoost;
        const mesh = makeGalaxyPlane(tex, palette[(i + Math.floor(t * 5)) % palette.length], opacity);

        const s = (isMobile ? 0.80 : 1.00) + t * 0.88 + Math.random() * 0.52;

        placeInGalaxyPlane(
            mesh,
            x,
            (Math.random() - 0.5) * 0.042,
            z,
            s * (1.52 + Math.random() * 0.42),
            s * (0.50 + Math.random() * 0.20),
            p.tangent + (Math.random() - 0.5) * 0.16,
            0
        );

        mesh.userData.opacityWave = 0.009;
        galaxyNebulaGroup.add(mesh);
    }

    // ── SUBNUBES EN LOS BRAZOS ──
    const subCloudCount = isMobile ? (isHighEndMobile ? 30 : 20) : 38;
    for (let i = 0; i < subCloudCount; i++) {
        const p = spiralPoint(parameters, i + 100, 0.62, 0.28);
        const side = (Math.random() - 0.5) * (0.12 + p.r * 0.055);
        const x = Math.cos(p.theta) * p.r + Math.cos(p.theta + Math.PI / 2) * side;
        const z = Math.sin(p.theta) * p.r + Math.sin(p.theta + Math.PI / 2) * side;

        const opacity = (isMobile ? 0.026 : 0.038) + Math.random() * (isMobile ? 0.024 : 0.032);
        const mesh = makeGalaxyPlane(cloudTextures[(i + 1) % cloudTextures.length], palette[(i + 2) % palette.length], opacity);
        const s = (isMobile ? 0.36 : 0.48) + Math.random() * (isMobile ? 0.40 : 0.56);

        placeInGalaxyPlane(
            mesh,
            x,
            0.014 + (Math.random() - 0.5) * 0.035,
            z,
            s * (1.22 + Math.random() * 0.30),
            s * (0.64 + Math.random() * 0.18),
            p.tangent + (Math.random() - 0.5) * 0.22,
            1
        );

        mesh.userData.opacityWave = 0.007;
        galaxyNebulaGroup.add(mesh);
    }

    // ── REGIONES DE FORMACIÓN ESTELAR ──
    const knotCount = isMobile ? (isHighEndMobile ? 22 : 16) : 28;
    for (let i = 0; i < knotCount; i++) {
        const p = spiralPoint(parameters, i + 200, 0.66, 0.25);
        const x = Math.cos(p.theta) * p.r + (Math.random() - 0.5) * 0.18;
        const z = Math.sin(p.theta) * p.r + (Math.random() - 0.5) * 0.18;

        const color = i % 4 === 0 ? warmPalette[i % warmPalette.length] : palette[(i + 4) % palette.length];
        const mesh = makeGalaxyPlane(knotTexture, color, (isMobile ? 0.044 : 0.062) + Math.random() * 0.036);
        const s = (isMobile ? 0.15 : 0.20) + Math.random() * (isMobile ? 0.20 : 0.28);

        placeInGalaxyPlane(mesh, x, 0.035 + (Math.random() - 0.5) * 0.025, z, s * 1.25, s, p.tangent, 3);
        mesh.userData.opacityWave = 0.014;
        galaxyStarFormingGroup.add(mesh);
    }

    // ── CARRILES DE POLVO OSCURO ──
    // Más sutiles: menor opacidad máxima para no bloquear estrellas
    const dustCount = isMobile ? (isHighEndMobile ? 12 : 9) : 16;
    for (let i = 0; i < dustCount; i++) {
        const p = spiralPoint(parameters, i + 300, 0.76, 0.26);
        const x = Math.cos(p.theta) * p.r;
        const z = Math.sin(p.theta) * p.r;

        const mesh = makeGalaxyPlane(
            dustTexture,
            '#020104',
            (isMobile ? 0.065 : 0.095) + Math.random() * 0.050,  // más sutil que antes
            THREE.NormalBlending
        );

        const s = 0.70 + Math.random() * 0.82;
        placeInGalaxyPlane(
            mesh,
            x,
            0.048 + i * 0.0014,
            z,
            s * (1.90 + Math.random() * 0.55),
            s * (0.28 + Math.random() * 0.14),
            p.tangent + (Math.random() - 0.5) * 0.14,
            6
        );

        mesh.userData.opacityWave = 0.009;
        galaxyDustLaneGroup.add(mesh);
    }

    // ── FILAMENTOS DE GAS ── (nuevo: estelas sutiles siguiendo los brazos espirales)
    // Son planos muy alargados y de baja opacidad — gas en flujo, no speed lines.
    const filamentCount = isMobile ? (isHighEndMobile ? 10 : 7) : 14;
    for (let i = 0; i < filamentCount; i++) {
        const p = spiralPoint(parameters, i + 500, 0.70, 0.20);
        const side = (Math.random() - 0.5) * 0.12;
        const x = Math.cos(p.theta) * p.r + Math.cos(p.theta + Math.PI / 2) * side;
        const z = Math.sin(p.theta) * p.r + Math.sin(p.theta + Math.PI / 2) * side;

        // Color: mezcla de cian suave y lavanda para los filamentos
        const filColors = ['#4a78ff', '#58a8ff', '#7a60e8', '#90d8ff'];
        const color = filColors[i % filColors.length];

        const opacity = (isMobile ? 0.018 : 0.026) + Math.random() * (isMobile ? 0.016 : 0.022);
        const mesh = makeGalaxyPlane(filamentTexture, color, opacity);

        // Muy alargados a lo largo de la tangente del brazo espiral
        const lenScale = (isMobile ? 1.4 : 1.8) + Math.random() * (isMobile ? 0.8 : 1.2);
        const widScale = (isMobile ? 0.12 : 0.16) + Math.random() * (isMobile ? 0.10 : 0.14);

        placeInGalaxyPlane(
            mesh,
            x,
            (Math.random() - 0.5) * 0.028,
            z,
            lenScale,
            widScale,
            p.tangent + (Math.random() - 0.5) * 0.10,
            2
        );

        mesh.userData.opacityWave = 0.005;
        galaxyFilamentGroup.add(mesh);
    }

    root.add(galaxyMistGroup);
    root.add(galaxyCoreGlowGroup);
    root.add(galaxyNebulaGroup);
    root.add(galaxyStarFormingGroup);
    root.add(galaxyDustLaneGroup);
    root.add(galaxyFilamentGroup);

    return root;
}

function updateGalaxyAtmosphere(time) {
    function breatheMeshGroup(group, speed = 0.35) {
        if (!group) return;

        group.children.forEach(mesh => {
            const wave = Math.sin(time * speed + mesh.userData.phase);
            const opacityWave = mesh.userData.opacityWave || 0.006;

            mesh.material.opacity = Math.max(0, mesh.userData.baseOpacity + wave * opacityWave);
            mesh.rotation.z = mesh.userData.baseRotationZ + Math.sin(time * 0.12 + mesh.userData.phase) * 0.018;
        });
    }

    breatheMeshGroup(galaxyCoreGlowGroup, 0.48);
    breatheMeshGroup(galaxyMistGroup, 0.22);
    breatheMeshGroup(galaxyNebulaGroup, 0.36);
    breatheMeshGroup(galaxyStarFormingGroup, 0.72);
    breatheMeshGroup(galaxyDustLaneGroup, 0.28);

    if (galaxyMistGroup) {
        galaxyMistGroup.rotation.y = Math.sin(time * 0.020) * 0.006;
    }

    if (galaxyNebulaGroup) {
        galaxyNebulaGroup.rotation.y = Math.sin(time * 0.034) * 0.008;
    }
}



function createBlueSpiralDustLayer(parameters, isMobile = false, isHighEndMobile = false) {
    const group = new THREE.Group();

    // Más partículas en los brazos respecto al núcleo → mejor estructura espiral
    const coreCount  = isMobile ? (isHighEndMobile ? 2800 : 1900) : 4800;
    const armCount   = isMobile ? (isHighEndMobile ? 11500 : 7200) : 18000;
    const haloCount  = isMobile ? (isHighEndMobile ? 2600 : 1800) : 4600;

    const coreRadius = parameters.radius * 0.44;
    const armRadius  = parameters.radius * 1.30;
    const haloRadius = parameters.radius * 1.78;

    function createPointLayer(count, size, opacity) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size,
            sizeAttenuation: true,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
            transparent: true,
            opacity,
            map: starTexture,
            alphaMap: starTexture,
            alphaTest: 0.006
        });

        return {
            geometry,
            positions,
            colors,
            points: new THREE.Points(geometry, material)
        };
    }

    /* ── NÚCLEO AZUL ──
       Menos partículas y tono más oscuro que los brazos
       para que el núcleo cálido del coreMesh destaque */
    {
        const layer = createPointLayer(
            coreCount,
            isMobile ? (isHighEndMobile ? 0.022 : 0.024) : 0.030,
            isMobile ? (isHighEndMobile ? 0.42 : 0.36) : 0.48  // más tenue que antes
        );

        for (let i = 0; i < coreCount; i++) {
            const i3 = i * 3;

            const radius = Math.pow(Math.random(), 1.65) * coreRadius;  // más concentrado
            const angle  = radius * 5.2 + Math.random() * Math.PI * 2;
            const noise  = 0.08 + radius * 0.07;

            const x = Math.cos(angle) * radius + (Math.random() - 0.5) * noise;
            const z = Math.sin(angle) * radius + (Math.random() - 0.5) * noise;
            const y = (Math.random() - 0.5) * (0.08 + radius * 0.028);

            layer.positions[i3]     = x;
            layer.positions[i3 + 1] = y;
            layer.positions[i3 + 2] = z;

            // Tonos más oscuros/saturados en el núcleo (menos celeste brillante)
            const tone = Math.random();
            const color = tone < 0.55
                ? new THREE.Color('#1244e8')
                : tone < 0.84
                    ? new THREE.Color('#1a7eee')
                    : new THREE.Color('#50b8f8');

            layer.colors[i3]     = color.r;
            layer.colors[i3 + 1] = color.g;
            layer.colors[i3 + 2] = color.b;
        }

        layer.geometry.attributes.position.needsUpdate = true;
        layer.geometry.attributes.color.needsUpdate    = true;
        layer.points.renderOrder = 1;
        group.add(layer.points);
    }

    /* ── BRAZOS ESPIRALES ──
       Más partículas, tono más brillante/cian, dispersión angular más ajustada
       para que los brazos se lean con claridad */
    {
        const layer = createPointLayer(
            armCount,
            isMobile ? (isHighEndMobile ? 0.020 : 0.022) : 0.028,
            isMobile ? (isHighEndMobile ? 0.68 : 0.60) : 0.78  // más brillante
        );

        const arms = 3;

        for (let i = 0; i < armCount; i++) {
            const i3 = i * 3;

            const radius    = 0.55 + Math.pow(Math.random(), 0.78) * armRadius;
            const armIndex  = i % arms;
            const armBase   = (Math.PI * 2 / arms) * armIndex;

            // Espiral más apretada (factor 1.22 en lugar de 1.18)
            const spiralAngle =
                armBase +
                radius * (parameters.spin * 1.22) +
                Math.sin(radius * 1.10) * 0.16;

            // Dispersión angular más ajustada → brazos más definidos
            const angularNoise = (Math.random() - 0.5) * (0.18 + radius * 0.028);
            const radialNoise  = (Math.random() - 0.5) * (0.22 + radius * 0.028);

            const finalRadius = radius + radialNoise;
            const finalAngle  = spiralAngle + angularNoise;

            // Scatter lateral mínimo cerca del eje del brazo
            const armScatter = 0.04 + radius * 0.028;

            const x = Math.cos(finalAngle) * finalRadius + (Math.random() - 0.5) * armScatter;
            const z = Math.sin(finalAngle) * finalRadius + (Math.random() - 0.5) * armScatter;
            const y = (Math.random() - 0.5) * (0.10 + radius * 0.016);

            layer.positions[i3]     = x;
            layer.positions[i3 + 1] = y;
            layer.positions[i3 + 2] = z;

            // Paleta cian más rica: azul-profundo → cian → aqua para distinguir de la niebla
            const tone = Math.random();
            const color = tone < 0.38
                ? new THREE.Color('#0a28f0')   // azul eléctrico
                : tone < 0.70
                    ? new THREE.Color('#1068f8') // azul-cian
                    : tone < 0.90
                        ? new THREE.Color('#40b4ff') // cian medio
                        : new THREE.Color('#70d8ff'); // aqua claro

            layer.colors[i3]     = color.r;
            layer.colors[i3 + 1] = color.g;
            layer.colors[i3 + 2] = color.b;
        }

        layer.geometry.attributes.position.needsUpdate = true;
        layer.geometry.attributes.color.needsUpdate    = true;
        layer.points.renderOrder = 1;
        group.add(layer.points);
    }

    /* ── HALO EXTERNO SUAVE ── */
    {
        const layer = createPointLayer(
            haloCount,
            isMobile ? (isHighEndMobile ? 0.018 : 0.020) : 0.025,
            isMobile ? (isHighEndMobile ? 0.22 : 0.18) : 0.25
        );

        for (let i = 0; i < haloCount; i++) {
            const i3 = i * 3;

            const radius = parameters.radius * 0.75 + Math.random() * haloRadius;
            const angle  = radius * 1.30 + Math.random() * Math.PI * 2;
            const spread = 0.22 + radius * 0.042;

            const x = Math.cos(angle) * radius + (Math.random() - 0.5) * spread;
            const z = Math.sin(angle) * radius + (Math.random() - 0.5) * spread;
            const y = (Math.random() - 0.5) * (0.18 + radius * 0.015);

            layer.positions[i3]     = x;
            layer.positions[i3 + 1] = y;
            layer.positions[i3 + 2] = z;

            const color = Math.random() < 0.65
                ? new THREE.Color('#0f30e8')
                : new THREE.Color('#3aacf8');

            layer.colors[i3]     = color.r;
            layer.colors[i3 + 1] = color.g;
            layer.colors[i3 + 2] = color.b;
        }

        layer.geometry.attributes.position.needsUpdate = true;
        layer.geometry.attributes.color.needsUpdate    = true;
        layer.points.renderOrder = 1;
        group.add(layer.points);
    }

    group.rotation.z = -0.08;
    group.position.set(0, 0, -0.05);

    galaxyBlueSpiralDust = group;
    return galaxyBlueSpiralDust;
}

function createStarLayer(count, size, parameters, isGiant = false) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    // Paleta más cinematográfica: núcleo crema-dorado → brazos azul-índigo
    // Los gigantes tienen menor opacidad near-core para no saturar el centro
    const colorInside = new THREE.Color('#ffe8b0');  // crema cálido (menos blanco quemado)
    const colorMid    = new THREE.Color('#d0c8ff');  // lavanda suave
    const colorOutside = new THREE.Color('#1a38ff'); // azul profundo

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const radius = Math.pow(Math.random(), parameters.densityPower) * parameters.radius;
        const spinAngle = radius * parameters.spin;
        let branchOffset = (Math.random() - 0.5) * 0.6; 
        const branchAngle = ((i % parameters.branches) / parameters.branches + branchOffset) * Math.PI * 2;

        const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
        const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;

        positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
        positions[i3 + 1] = randomY * (isGiant ? 0.2 : 1); 
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

        const t = radius / parameters.radius; // 0=centro, 1=borde

        // Interpolación en dos tramos: interior → lavanda → azul exterior
        // Reduce la acumulación de blanco en el núcleo con el tono crema
        const mixedColor = colorInside.clone();
        if (t < 0.42) {
            mixedColor.lerp(colorMid, t / 0.42);
        } else {
            mixedColor.copy(colorMid).lerp(colorOutside, (t - 0.42) / 0.58);
        }

        colors[i3] = mixedColor.r; colors[i3 + 1] = mixedColor.g; colors[i3 + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Gigantes: menos opacidad para que no quemen el núcleo,
    // pero siguen siendo visibles como estrellas destacadas
    const baseOpacity = isGiant ? 0.48 : 0.30;

    const material = new THREE.PointsMaterial({
        size: size, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexColors: true, transparent: true, opacity: baseOpacity,
        map: starTexture, alphaMap: starTexture, alphaTest: 0.01
    });

    return new THREE.Points(geometry, material);
}

let neutrinoBreeze = null;
let neutrinosTriggered = false;

function isHighEndMobileGalaxyDevice() {
    const isCoarsePointer =
        window.matchMedia &&
        window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    if (!isCoarsePointer) return false;

    const dpr = window.devicePixelRatio || 1;
    const cores = navigator.hardwareConcurrency || 4;
    const hasDeviceMemory = typeof navigator.deviceMemory === 'number';
    const memory = hasDeviceMemory ? navigator.deviceMemory : 4;

    const appSize = getAppSize();
    const longestSide = Math.max(appSize.width, appSize.height);

    const dprOk = dpr >= 2;
    const cpuOk = cores >= 6;
    const memOk = !hasDeviceMemory || memory >= 4;
    const screenOk = longestSide >= 800;

    return screenOk && dprOk && cpuOk && memOk;
}

function initGalaxy() {
    if (galaxyInitialized) return; 
    
    const canvas = document.querySelector('#galaxy-canvas');
    galaxyScene = new THREE.Scene();
    
    const appSize = getAppSize();

    const isCoarsePointer =
    window.matchMedia &&
    window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    const isMobile = appSize.width < 768 || isCoarsePointer;
    const isHighEndMobile = isMobile && isHighEndMobileGalaxyDevice();

    const parameters = {
        radius: isMobile ? (isHighEndMobile ? 5.45 : 5) : 6,
        branches: 8,
        spin: isHighEndMobile ? 1.72 : 1.65,
        randomness: isHighEndMobile ? 0.34 : 0.38,
        randomnessPower: 3,
        densityPower: isHighEndMobile ? 4.0 : 4.4  // más alto = menos acumulación en el núcleo
    };
    
    // Capa base: muchas estrellas pequeñas (la mayoría del detalle de los brazos)
    galaxyScene.add(createStarLayer(
        isHighEndMobile ? 34000 : 28000,
        isMobile ? 0.018 : 0.016,
        parameters
    ));

    // Capa media: estrellas medianas, definen los brazos
    galaxyScene.add(createStarLayer(
        isHighEndMobile ? 16000 : 12000,
        isMobile ? 0.026 : 0.030,
        parameters
    ));

    // Gigantes: pocas, más controladas para no saturar el centro
    // isGiant=true → opacidad reducida + Y flat (se quedan en el disco)
    galaxyScene.add(createStarLayer(
        isHighEndMobile ? 2200 : 1800,
        isMobile ? 0.058 : 0.065,
        parameters,
        true
    ));

    galaxyScene.add(createBlueSpiralDustLayer(parameters, isMobile, isHighEndMobile));
    galaxyStreakField = createGalaxyStreakField(parameters, isMobile, isHighEndMobile);
    galaxyScene.add(galaxyStreakField);
    const dustGeo = new THREE.BufferGeometry();
    const dustCount = isHighEndMobile ? 1400 : (isMobile ? 900 : 800);
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
        dustPos[i * 3] = (Math.random() - 0.5) * 15;
        dustPos[i * 3 + 1] = (Math.random() - 0.5) * 15;
        dustPos[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
        size: isHighEndMobile ? 1.2 : 1.5,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: isHighEndMobile ? 0.042 : 0.03,
        map: createNebulaTexture(),
        color: '#1b56ff'
    });
    
    nearDustParticles = new THREE.Points(dustGeo, dustMat);
    galaxyScene.add(nearDustParticles);

    // Capas visuales nuevas

    galaxyScene.add(createGalaxyAtmosphere(parameters, isMobile, isHighEndMobile));

    const starMat = new THREE.SpriteMaterial({
        map: starTexture,
        color: 0xffffff,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 1
    });
    
    for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 / 6) * i;
    const radius = 2.5 + Math.random();
    const y = (Math.random() - 0.5) * 1.5;

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Paleta más rica y variada: crema, dorado, lavanda, cian suave
    const auraPalette = [
        '#ffd890', // dorado suave
        '#fff5d8', // crema pura
        '#e8d0ff', // lavanda suave
        '#ffc868', // ámbar cálido
        '#d8f0ff', // celeste muy frío
        '#ffe0b0'  // melocotón
    ];

    const auraColor = auraPalette[i % auraPalette.length];

    // Aura principal — más grande y suave
    const auraMaterial = new THREE.SpriteMaterial({
        map: auraTexture,
        color: new THREE.Color(auraColor),
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: isHighEndMobile ? 0.68 : 0.58,
        depthWrite: false
    });

    const aura = new THREE.Sprite(auraMaterial);
    aura.position.set(x, y, z);
    aura.scale.set(isHighEndMobile ? 1.72 : 1.45, isHighEndMobile ? 1.72 : 1.45, 1);
    aura.userData = {
        baseScale: isHighEndMobile ? 1.72 : 1.45,
        phase: Math.random() * Math.PI * 2,
        shimmerPhase: Math.random() * Math.PI * 2,
        pulseSpeed: 1.2 + Math.random() * 0.8   // velocidad de pulso individual
    };

    galaxyScene.add(aura);
    interactiveStarAuras.push(aura);

    // Estrella clickeable — sin cambios en hitbox
    const star = new THREE.Sprite(starMat.clone());
    star.scale.set(0.17, 0.17, 1);
    star.position.set(x, y, z);
    star.userData = {
        id: i,
        aura
    };

    galaxyScene.add(star);
    interactiveStars.push(star);
    }

    // --- ESTRELLA AZUL SECRETA 
    const blueAuraMaterial = new THREE.SpriteMaterial({
    map: blueSecretAuraTexture,
    color: new THREE.Color('#7edcff'),
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: isHighEndMobile ? 0.48 : 0.40,
    depthWrite: false
    });

    blueSecretAura = new THREE.Sprite(blueAuraMaterial);
    blueSecretAura.position.set(-1.5, -5.5, -2.0);
    blueSecretAura.scale.set(isHighEndMobile ? 1.95 : 1.68, isHighEndMobile ? 1.52 : 1.36, 1);
    blueSecretAura.userData = {
        baseScale: isHighEndMobile ? 1.95 : 1.68,
        baseScaleY: isHighEndMobile ? 1.52 : 1.36,
        phase: Math.random() * Math.PI * 2
    };
    galaxyScene.add(blueSecretAura);

    const blueStarMaterial = new THREE.SpriteMaterial({
    map: starTexture,
    color: new THREE.Color('#74c7ff'),
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 1,
    depthWrite: false
  });

    blueSecretStar = new THREE.Sprite(blueStarMaterial);
    blueSecretStar.position.copy(blueSecretAura.position);
    blueSecretStar.scale.set(0.22, 0.22, 1);
    blueSecretStar.userData = {
        id: 'blue-secret',
        aura: blueSecretAura
    };

    galaxyScene.add(blueSecretStar);

    const coreGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({ visible: false }); 
    coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    galaxyScene.add(coreMesh);

    const sizes = getGalaxyRenderSize();
    galaxyCamera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
    galaxyCamera.position.set(4, 3, 5);
    galaxyScene.add(galaxyCamera);

    galaxyRenderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    galaxyRenderer.setSize(sizes.width, sizes.height);
    galaxyRenderer.setPixelRatio(
    Math.min(window.devicePixelRatio, isHighEndMobile ? 2.4 : 2.0)
    );

    galaxyControls = new THREE.OrbitControls(galaxyCamera, canvas);
    galaxyControls.enableDamping = true;
    galaxyControls.dampingFactor = 0.055;

    // Navegación estilo visor espacial:
    // click izquierdo = rotar, click derecho = paneo, rueda = acercar/alejar.
    galaxyControls.enableRotate = true;
    galaxyControls.enablePan = true;
    galaxyControls.enableZoom = true;
    galaxyControls.rotateSpeed = 0.38;
    galaxyControls.panSpeed = 0.62;
    galaxyControls.zoomSpeed = 0.78;
    galaxyControls.minDistance = 2.15;
    galaxyControls.maxDistance = 12.0;
    galaxyControls.screenSpacePanning = true;
    galaxyControls.target.set(0, 0, 0);

    galaxyControls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
    };

    galaxyControls.autoRotate = true;
    galaxyControls.autoRotateSpeed = 0.25;
    galaxyControls.addEventListener('start', () => {
        galaxyControls.autoRotate = false;
    });

    canvas.addEventListener('contextmenu', (event) => event.preventDefault());

    const renderScene = new THREE.RenderPass(galaxyScene, galaxyCamera);
    const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(sizes.width, sizes.height),
        // strength: más alto en high-end mobile → galaxia más cinematográfica
        isMobile ? (isHighEndMobile ? 0.58 : 0.42) : 0.52,
        // radius: más amplio en high-end para halos más suaves y elegantes
        isMobile ? (isHighEndMobile ? 0.55 : 0.40) : 0.52,
        // threshold: ligeramente más bajo en high-end → más objetos brillan (estrellas, gas)
        isMobile ? (isHighEndMobile ? 0.32 : 0.42) : 0.38
    );
    galaxyComposer = new THREE.EffectComposer(galaxyRenderer);
    galaxyComposer.addPass(renderScene);
    galaxyComposer.addPass(bloomPass);

    galaxyInitialized = true;
    // --- SISTEMA DE NEUTRINOS — micro-partículas casi invisibles atravesando la escena ---
    // Muy sutiles: atmósfera, no decoración invasiva.
    const neutrinoGeo = new THREE.BufferGeometry();
    const neutrinoCount = isMobile ? (isHighEndMobile ? 900 : 600) : 1400;
    const neutrinoPos    = new Float32Array(neutrinoCount * 3);
    const neutrinoColors = new Float32Array(neutrinoCount * 3);
    // Velocidad individual por partícula: varía en dirección y magnitud
    const neutrinoVel    = new Float32Array(neutrinoCount * 3);

    const colorA = new THREE.Color('#ffe890'); // dorado muy suave
    const colorB = new THREE.Color('#88eeff'); // celeste etéreo
    const colorC = new THREE.Color('#cc88ff'); // lavanda sutil

    for (let i = 0; i < neutrinoCount; i++) {
        // Distribución esférica amplia para que siempre haya algunas en pantalla
        const r = 8 + Math.random() * 6;
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        neutrinoPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
        neutrinoPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        neutrinoPos[i*3+2] = r * Math.cos(phi);

        // Cada neutrino tiene dirección propia: mayoría van en diagonal
        const speed = 0.018 + Math.random() * 0.022;
        const dir   = new THREE.Vector3(
            (Math.random() - 0.5) * 0.8 + (Math.random() < 0.5 ? -1 : 1) * 0.6,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.8 + (Math.random() < 0.5 ? -1 : 1) * 0.5
        ).normalize().multiplyScalar(speed);
        neutrinoVel[i*3]   = dir.x;
        neutrinoVel[i*3+1] = dir.y;
        neutrinoVel[i*3+2] = dir.z;

        // Color aleatorio entre los tres
        const palette3 = [colorA, colorB, colorC];
        const mixed = palette3[Math.floor(Math.random() * 3)].clone()
            .lerp(palette3[Math.floor(Math.random() * 3)], Math.random() * 0.5);
        neutrinoColors[i*3]   = mixed.r;
        neutrinoColors[i*3+1] = mixed.g;
        neutrinoColors[i*3+2] = mixed.b;
    }

    neutrinoGeo.setAttribute('position', new THREE.BufferAttribute(neutrinoPos, 3));
    neutrinoGeo.setAttribute('color',    new THREE.BufferAttribute(neutrinoColors, 3));

    // Guardar velocidades en userData para usarlas en tick()
    const neutrinoMat = new THREE.PointsMaterial({
        size: isMobile ? (isHighEndMobile ? 0.092 : 0.074) : 0.078,  // micro-partículas, muy pequeñas
        vertexColors: true,
        transparent: true,
        opacity: 0,  // inician invisibles, se revelan con el clímax de los neutrinos
        blending: THREE.AdditiveBlending,
        map: starTexture,
        alphaTest: 0.002,
        depthWrite: false
    });

    neutrinoBreeze = new THREE.Points(neutrinoGeo, neutrinoMat);
    neutrinoBreeze.visible = false;
    neutrinoBreeze.userData.velocities = neutrinoVel;
    galaxyScene.add(neutrinoBreeze);
    initGalaxyLyricConstellations(isMobile);
    bindGalaxyFlightControls();
    tick(); 
}

let galaxyPointerStart = null;

function handleGalaxyObjectClick(event) {
    if (currentWorld !== 1 || !galaxyCamera) return;

    const galaxyCanvas = document.getElementById('galaxy-canvas');
    const pointer = getPointerInElement(event, galaxyCanvas);
    if (!pointer.inside) return;

    mouse.x = (pointer.x / pointer.width) * 2 - 1;
    mouse.y = -(pointer.y / pointer.height) * 2 + 1;

    raycaster.setFromCamera(mouse, galaxyCamera);

    const clickableObjects = blueSecretStar
        ? [...interactiveStars, blueSecretStar, coreMesh]
        : [...interactiveStars, coreMesh];

    const intersects = raycaster.intersectObjects(clickableObjects);

    if (intersects.length > 0) {
        const clickedObj = intersects[0].object;

        if (clickedObj === blueSecretStar) {
            triggerValeskaAsteroidReveal();
            return;
        }

        if (clickedObj === coreMesh) {
            if (openedGalaxyStars.size < 6) {
                const progress = document.getElementById('galaxy-progress');

                if (progress) {
                    progress.textContent = `Primero toca las estrellas: ${openedGalaxyStars.size}/6`;
                }

                return;
            }

            const coreLabel = document.getElementById('label-core');

            if (coreLabel) {
                coreLabel.classList.add('visible');
            }

            revealFinalUniverseMessage();
            return;
        }

        const id = clickedObj.userData.id;
        const label = document.getElementById(`label-${id}`);

        if (label) {
            label.classList.add('visible');
        }

        openedGalaxyStars.add(id);
        updateGalaxyProgress();

        if (openedGalaxyStars.size === 6) {
            updateGalaxyProgress();

            showAchievement(
                '¡Logro desbloqueado!',
                'Ahora sí puedes tocar el centro de la galaxia',
                4500
            );
        }
    }
}

window.addEventListener('pointerdown', (event) => {
    if (currentWorld !== 1) return;
    if (event.button !== 0) return;

    const pointer = getPointerInApp(event);
    if (!pointer.inside) return;

    galaxyPointerStart = {
        x: pointer.x,
        y: pointer.y,
        t: performance.now()
    };
});

window.addEventListener('pointerup', (event) => {
    if (currentWorld !== 1 || !galaxyPointerStart) return;
    if (event.button !== 0) return;

    const pointer = getPointerInApp(event);

    const dx = pointer.x - galaxyPointerStart.x;
    const dy = pointer.y - galaxyPointerStart.y;
    const distance = Math.hypot(dx, dy);
    const elapsed = performance.now() - galaxyPointerStart.t;

    galaxyPointerStart = null;

    if (!pointer.inside) return;

    // Si arrastraste para rotar, no disparamos labels por accidente.
    if (distance > 6 || elapsed > 520) return;

    handleGalaxyObjectClick(event);
});

function updateGalaxyProgress() {
    const progress = document.getElementById('galaxy-progress');
    if (!progress) return;

    progress.textContent = `Toca las estrellas: ${openedGalaxyStars.size}/6`;

    if (openedGalaxyStars.size === 6) {
        progress.textContent = 'Ahora toca el centro de la galaxia ✨';
    }
}

function revealFinalUniverseMessage() {
    finalUniverseShown = true;
    const finalMessage = document.getElementById('final-universe-message');
    if (finalMessage) {
        finalMessage.classList.add('show');
    }
}

function closeFinalUniverseMessage() {
    const finalMessage = document.getElementById('final-universe-message');

    if (finalMessage) {
        finalMessage.classList.remove('show');
    }
}

window.closeLabel = function(id) { document.getElementById(`label-${id}`).classList.remove('visible'); }
window.closeCoreLabel = function() { document.getElementById('label-core').classList.remove('visible'); }

function closeAllGalaxyLabels() {
    // Cierra todas las estrellas normales
    for (let i = 0; i < 6; i++) {
        const label = document.getElementById(`label-${i}`);
        if (label) label.classList.remove('visible');
    }
    // Cierra el centro y el secreto
    const coreLabel = document.getElementById('label-core');
    if (coreLabel) coreLabel.classList.remove('visible');
    
    hideValeskaAsteroidReveal();
    
    // Cierra el mensaje final gigante si está abierto
    const finalMessage = document.getElementById('final-universe-message');
    if (finalMessage) finalMessage.classList.remove('show');
}

window.closeBlueSecretLabel = function() {
    hideValeskaAsteroidReveal();
};

function triggerValeskaAsteroidReveal() {
    if (valeskaAsteroidRevealed) return;
    valeskaAsteroidRevealed = true;

    if (!secretErrorsFound.has(1)) {
        unlockSecretError(1, 'world1_secret');
    }

    const panel = document.getElementById('label-blue-secret');
    if (panel) panel.classList.add('visible');

    const orbit = document.getElementById('valeska-asteroid-orbit');
    if (orbit) orbit.classList.add('orbit-active');
}

function hideValeskaAsteroidReveal() {
    valeskaAsteroidRevealed = false;
    const panel = document.getElementById('label-blue-secret');
    if (panel) panel.classList.remove('visible');
    const orbit = document.getElementById('valeska-asteroid-orbit');
    if (orbit) orbit.classList.remove('orbit-active');
}

function tick() {
    if (currentWorld === 1) {
        const time = clock.getElapsedTime();
        galaxyCamera.position.y += Math.sin(time * 0.5) * 0.003;
        galaxyCamera.position.x += Math.cos(time * 0.3) * 0.002;

        if (nearDustParticles) {
            nearDustParticles.rotation.y = time * 0.02;
            nearDustParticles.rotation.x = time * 0.01;
        }

        if (galaxyStreakField) {
        galaxyStreakField.rotation.y = Math.sin(time * 0.045) * 0.020;
        galaxyStreakField.rotation.z = Math.cos(time * 0.038) * 0.012;

        galaxyStreakField.children.forEach((streak, index) => {
            const phase = streak.userData.phase || 0;
            const baseOpacity = streak.userData.baseOpacity || 0.06;

            streak.material.opacity =
                baseOpacity *
                (0.72 + Math.sin(time * (0.55 + streak.userData.drift * 10) + phase + index * 0.07) * 0.28);
        });
        }

        updateGalaxyAtmosphere(time);

        interactiveStarAuras.forEach((aura, index) => {
            const speed = aura.userData.pulseSpeed || 1.5;
            const shimmerSpeed = speed * 2.8;
            // Pulso principal suave
            const pulse = Math.sin(time * speed + aura.userData.phase) * 0.22;
            // Shimmer rápido de baja amplitud encima del pulso
            const shimmer = Math.sin(time * shimmerSpeed + (aura.userData.shimmerPhase || 0)) * 0.06;
            const scale = aura.userData.baseScale + pulse + shimmer;
            aura.scale.set(scale, scale, 1);
            // Opacidad: varía en dos frecuencias para efecto "respiración mística"
            const opBase = 0.52 + Math.sin(time * speed * 0.7 + aura.userData.phase) * 0.15;
            const opShimmer = Math.sin(time * shimmerSpeed * 0.5 + index) * 0.075;
            aura.material.opacity = Math.max(0.28, Math.min(0.84, opBase + opShimmer));
        });
        
        if (blueSecretAura) {
            const pulse = Math.sin(time * 1.65 + blueSecretAura.userData.phase) * 0.10;
            const scaleX = blueSecretAura.userData.baseScale + pulse;
            const scaleY = (blueSecretAura.userData.baseScaleY || 1.28) + pulse * 0.58;
            blueSecretAura.scale.set(scaleX, scaleY, 1);
            blueSecretAura.material.opacity = 0.26 + Math.sin(time * 1.35) * 0.055;
        }
        
        if (blueSecretStar) {
            const starPulse = 0.22 + Math.sin(time * 2.4) * 0.035;
            blueSecretStar.scale.set(starPulse, starPulse, 1);
        }
        
        // --- ANIMACIÓN DE LA BRISA DE NEUTRINOS ---
        if (neutrinoBreeze && neutrinoBreeze.visible) {
            // Fade in suave hasta opacidad máxima muy baja (micro-partículas sutiles)
            const targetOpacity = 0.46;
            if (neutrinoBreeze.material.opacity < targetOpacity) {
                neutrinoBreeze.material.opacity = Math.min(targetOpacity, neutrinoBreeze.material.opacity + 0.003);
            }

            const positions  = neutrinoBreeze.geometry.attributes.position.array;
            const velocities = neutrinoBreeze.userData.velocities;
            const boundR     = 14; // radio de la burbuja de bucle

            for (let i = 0; i < positions.length; i += 3) {
                if (velocities) {
                    positions[i]   += velocities[i];
                    positions[i+1] += velocities[i+1];
                    positions[i+2] += velocities[i+2];
                } else {
                    // Fallback si no hay velocidades (migración segura)
                    positions[i]   -= 0.018;
                    positions[i+1] -= 0.005;
                    positions[i+2] -= 0.018;
                }

                // Bucle esférico: si sale del radio, reaparece al otro lado
                const dx = positions[i], dy = positions[i+1], dz = positions[i+2];
                if (Math.sqrt(dx*dx + dy*dy + dz*dz) > boundR) {
                    positions[i]   *= -0.92;
                    positions[i+1] *= -0.92;
                    positions[i+2] *= -0.92;
                }
            }
            neutrinoBreeze.geometry.attributes.position.needsUpdate = true;
        }

        updateGalaxyLyricConstellations(audio.currentTime || 0, time);
        updateGalaxyFlightMovement();

        galaxyControls.update();
        galaxyComposer.render();

        const sizes = getAppSize();

        interactiveStars.forEach(star => {
            star.position.y += Math.sin(time * 2 + star.userData.id) * 0.002;
            const vector = star.position.clone();
            vector.project(galaxyCamera);

            const label = document.getElementById(`label-${star.userData.id}`);
            if (label) {
                if (vector.z > 1) {
                    label.style.display = 'none';
                } else {
                    label.style.display = 'block';
                    const xPos = (vector.x * 0.5 + 0.5) * sizes.width;
                    const yPos = (vector.y * -0.5 + 0.5) * sizes.height;
                    label.style.left = `${xPos}px`;
                    label.style.top = `${yPos}px`;
                }
            }
        });

        const coreVector = coreMesh.position.clone();
        coreVector.project(galaxyCamera);
        const coreLabel = document.getElementById('label-core');
        if (coreLabel) {
            if (coreVector.z > 1) {
                coreLabel.style.display = 'none';
            } else {
                coreLabel.style.display = 'block';
                coreLabel.style.left = `${(coreVector.x * 0.5 + 0.5) * sizes.width}px`;
                coreLabel.style.top = `${(coreVector.y * -0.5 + 0.5) * sizes.height}px`;
            }
        }

        if (blueSecretStar) {
            const blueVector = blueSecretStar.position.clone();
            blueVector.project(galaxyCamera);

            const starScreenX  = (blueVector.x *  0.5 + 0.5) * sizes.width;
            const starScreenY  = (blueVector.y * -0.5 + 0.5) * sizes.height;
            const isBehindCam  = blueVector.z > 1;

            // Aro orbital: siempre centrado en la posición de la estrella
            const orbitEl = document.getElementById('valeska-asteroid-orbit');
            if (orbitEl) {
                orbitEl.style.display = isBehindCam ? 'none' : 'block';
                if (!isBehindCam) {
                    orbitEl.style.left = `${starScreenX}px`;
                    orbitEl.style.top  = `${starScreenY}px`;
                }
            }

            // Ficha: desktop → posición clampeada junto a la estrella
            //        mobile  → position:fixed via CSS, no tocar left/top
            const blueLabel = document.getElementById('label-blue-secret');
            if (blueLabel) {
                blueLabel.style.display = isBehindCam ? 'none' : 'block';
                if (!isBehindCam && window.innerWidth > 768) {
                    const panelW = 340;
                    const panelH = blueLabel.offsetHeight || 260;
                    const mg     = 16;
                    let px = starScreenX + 24;
                    let py = starScreenY;
                    px = Math.min(px, sizes.width  - panelW - mg);
                    px = Math.max(px, mg);
                    py = Math.max(py, panelH / 2 + mg);
                    py = Math.min(py, sizes.height - panelH / 2 - mg);
                    blueLabel.style.left = `${px}px`;
                    blueLabel.style.top  = `${py}px`;
                }
            }
        }
    }
    window.requestAnimationFrame(tick);
}

window.addEventListener('pointerdown', (e) => {
    if (currentWorld !== 5) return;

    // Si toca una estrella amarilla normal, NO buscamos la chispa azul secreta.
    // Antes solo se revisaba .yellow-star, pero las estrellas actuales usan .yellow-highlight-star.
    // Por eso el click podía pasar al detector global y disparar el ERROR 5/5 por accidente.
    if (e.target.closest && e.target.closest('.yellow-highlight-star, .yellow-star')) return;

    handleYellowInteraction(e.clientX, e.clientY);
});

// ==========================================
// MENÚ VINYL INTERACTIVO LIMPIO
// ==========================================
let vinylCurrentIndex = 0;
let vinylDragStartX = 0;
let vinylIsDragging = false;
let vinylDragAccumulated = 0;

let isDraggingVinyl = false;
let activeVinylEl = null;
let vinylStartX = 0;
let vinylStartY = 0;
let vinylInitialX = 0;
let vinylInitialY = 0;
let vinylMoved = false;

let vinylAngles = [90, 162, 234, 306, 18];

const vinylWorlds = [
    { world: 1, title: 'La Vie En Rose', desc: 'El universo donde hasta la física se pone romántica.' },
    { world: 2, title: 'Corazón', desc: 'La letra me ayuda a delatarme.' },
    { world: 3, title: 'Birds of a Feather', desc: 'El universo de esos ojos cafés que arruinan teorías.' },
    { world: 4, title: 'Seguro Te Pierdo', desc: 'La ciudad, la lluvia y lo que no me atrevo a decir.' },
    { world: 5, title: 'Yellow', desc: 'El universo donde todo termina iluminándose por ti.' }
];

const vinylWheel = document.getElementById('vinyl-wheel');

function getVisibleVinylCards() {
    if (!vinylWheel) return [];

    return [...vinylWheel.querySelectorAll('.vinyl-card')]
        .filter(card => {
            const isHidden = card.classList.contains('secret-hidden');
            const isDisplayNone = card.style.display === 'none';
            return !isHidden && !isDisplayNone;
        });
}

function syncVinylWorldsWithVisibleCards() {
    const cards = getVisibleVinylCards();

    return cards.map(card => {
        const world = Number(card.dataset.world);
        const fallbackInfo = vinylWorlds.find(item => item.world === world);
        const htmlTitle = card.querySelector('h3')?.textContent?.trim();
        const htmlDesc = card.querySelector('p')?.textContent?.trim();

        return {
            world,
            title: htmlTitle || fallbackInfo?.title || 'Archivo',
            desc: htmlDesc || fallbackInfo?.desc || ''
        };
    });
}

function updateVinylMenu() {
    if (!vinylWheel) return;
    const cards = [...vinylWheel.querySelectorAll('.vinyl-card:not(.secret-hidden)')];
    const visibleWorlds = syncVinylWorldsWithVisibleCards();
    const isMobile = window.innerWidth < 768;
    const radius = isMobile ? 115 : 160; 

    cards.forEach((card, index) => {
        const angleDeg = vinylAngles[index];
        const angleRad = angleDeg * (Math.PI / 180);

        const x = Math.cos(angleRad) * radius;
        const y = Math.sin(angleRad) * radius;
        
        const scale = index === vinylCurrentIndex ? 1 : 0.65;
        const opacity = index === vinylCurrentIndex ? 1 : 0.4;
        
        let offset = Math.abs(index - vinylCurrentIndex);
        if (offset > Math.floor(cards.length / 2)) offset = cards.length - offset;
        const z = 10 - offset;
        const blur = offset > 0 ? '3px' : '0px';

        card.style.setProperty('--x', `${x}px`);
        card.style.setProperty('--y', `${y}px`);
        card.style.setProperty('--scale', scale);
        card.style.opacity = opacity;
        card.style.zIndex = z;
        card.style.filter = `blur(${blur})`;

        card.classList.remove('inserting');
        card.classList.toggle('active', index === vinylCurrentIndex);
    });

    const selected = visibleWorlds[vinylCurrentIndex] || vinylWorlds[vinylCurrentIndex];
    const displayTitle = document.getElementById('active-song-title');
    const displayDesc = document.getElementById('active-song-desc');
    if (selected && displayTitle) displayTitle.textContent = selected.title;
    if (selected && displayDesc) displayDesc.textContent = selected.desc;
}

// ==========================================
// CONTROL SEGURO DE LA RUEDA (SWIPE Y CLICS)
// ==========================================
if (vinylWheel) {
    let startX = 0;
    
    // Para Celulares (Touch)
    vinylWheel.addEventListener('touchstart', e => {
        startX = e.changedTouches[0].screenX;
    }, {passive: true});

    vinylWheel.addEventListener('touchend', e => {
        const endX = e.changedTouches[0].screenX;
        if (endX < startX - 40) rotateVinylMenu(1);
        if (endX > startX + 40) rotateVinylMenu(-1);
    }, {passive: true});

    // Para PC (Clics directos a los discos del fondo)
    const cards = [...vinylWheel.querySelectorAll('.vinyl-card')];
    cards.forEach((card, index) => {
        card.addEventListener('click', (e) => {
            if (index !== vinylCurrentIndex && !card.classList.contains('secret-hidden')) {
                const activeCount = vinylWorlds.length;
                let diff = index - vinylCurrentIndex;
                if (diff > activeCount / 2) diff -= activeCount;
                if (diff < -activeCount / 2) diff += activeCount;
                rotateVinylMenu(diff);
            }
        });
    });
}

function rotateVinylMenu(direction) {
    const total = getVisibleVinylCards().length;
    if (!total) return;

    vinylCurrentIndex = (vinylCurrentIndex + direction + total) % total;
    updateVinylMenu();
}

function enterSelectedVinylWorld() {
    if (!vinylWheel) return;

    const cards = getVisibleVinylCards();
    const activeCard = cards[vinylCurrentIndex];

    if (!activeCard) return;

    const worldId = Number(activeCard.dataset.world);
    if (!worldId) return;

    const turntable = document.querySelector('.center-turntable');

    activeCard.style.transform = '';
    activeCard.classList.add('inserting');
    if (turntable) turntable.classList.add('playing');

    setTimeout(() => {
        openWorld(worldId);

        setTimeout(() => {
            activeCard.classList.remove('inserting');
            if (turntable) turntable.classList.remove('playing');
            updateVinylMenu();
        }, 500);
    }, 850);
}

if (vinylWheel) {
    const turntable = document.querySelector('.center-turntable');

    vinylWheel.addEventListener('pointerdown', (e) => {
        const card = e.target.closest('.vinyl-card');
        const cards = getVisibleVinylCards();

        // Si toca un disco
        if (card) {
            if (card.classList.contains('secret-hidden')) return;

            const index = cards.indexOf(card);
            if (index === -1) return;

            // Si toca un disco lateral, solo lo trae al centro
            if (index !== vinylCurrentIndex) {
                let diff = index - vinylCurrentIndex;
                const total = cards.length;

                if (diff > total / 2) diff -= total;
                if (diff < -total / 2) diff += total;

                rotateVinylMenu(diff);
                return;
            }

            // Si toca el disco activo, empieza arrastre hacia tocadiscos
            isDraggingVinyl = true;
            activeVinylEl = card;
            vinylMoved = false;

            vinylInitialX = parseFloat(card.style.getPropertyValue('--x')) || 0;
            vinylInitialY = parseFloat(card.style.getPropertyValue('--y')) || 0;

            vinylStartX = e.clientX;
            vinylStartY = e.clientY;

            card.classList.add('dragging-active');
            card.setPointerCapture(e.pointerId);
            return;
        }

        // Si toca el fondo de la rueda, rota arrastrando
        vinylIsDragging = true;
        vinylDragStartX = e.clientX;
        vinylDragAccumulated = 0;
        vinylWheel.classList.add('dragging');
        vinylWheel.setPointerCapture(e.pointerId);
    });

    vinylWheel.addEventListener('pointermove', (e) => {
        // Arrastre del disco activo hacia el tocadiscos
        if (isDraggingVinyl && activeVinylEl) {
            const dx = e.clientX - vinylStartX;
            const dy = e.clientY - vinylStartY;

            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
                vinylMoved = true;
            }

            const currentX = vinylInitialX + dx;
            const currentY = vinylInitialY + dy;

            activeVinylEl.style.transform =
                `translate(-50%, -50%) translate(${currentX}px, ${currentY}px) scale(1.08)`;

            const distToCenter = Math.hypot(currentX, currentY);

            if (turntable) {
                turntable.classList.toggle('target-ready', distToCenter < 85);
            }

            return;
        }

        // Arrastre del fondo para rotar la rueda
        if (!vinylIsDragging) return;

        const dx = e.clientX - vinylDragStartX;
        vinylDragAccumulated += dx;
        vinylDragStartX = e.clientX;

        if (Math.abs(vinylDragAccumulated) > 70) {
            rotateVinylMenu(vinylDragAccumulated < 0 ? 1 : -1);
            vinylDragAccumulated = 0;
        }
    });

    vinylWheel.addEventListener('pointerup', (e) => {
        // Soltar disco activo
        if (isDraggingVinyl && activeVinylEl) {
            const dx = e.clientX - vinylStartX;
            const dy = e.clientY - vinylStartY;

            const finalX = vinylInitialX + dx;
            const finalY = vinylInitialY + dy;
            const distToCenter = Math.hypot(finalX, finalY);

            const card = activeVinylEl;

            isDraggingVinyl = false;
            activeVinylEl = null;

            card.classList.remove('dragging-active');
            if (turntable) turntable.classList.remove('target-ready');

            if (distToCenter < 85) {
                enterSelectedVinylWorld();
            } else {
                card.style.transform = '';
                updateVinylMenu();
            }

            return;
        }

        // Soltar fondo de rueda
        vinylIsDragging = false;
        vinylWheel.classList.remove('dragging');
    });

    vinylWheel.addEventListener('pointercancel', () => {
        vinylIsDragging = false;
        isDraggingVinyl = false;

        if (activeVinylEl) {
            activeVinylEl.classList.remove('dragging-active');
            activeVinylEl.style.transform = '';
        }

        activeVinylEl = null;
        vinylWheel.classList.remove('dragging');

        if (turntable) turntable.classList.remove('target-ready');

        updateVinylMenu();
    });
}

document.addEventListener('keydown', (event) => {
    if (!menuScreen || !menuScreen.classList.contains('active')) return;

    if (event.key === 'ArrowLeft') rotateVinylMenu(-1);
    if (event.key === 'ArrowRight') rotateVinylMenu(1);
    if (event.key === 'Enter') enterSelectedVinylWorld();
});

updateVinylMenu();


window.startExperience = startExperience;
window.togglePlayer = togglePlayer;
window.openWorld = openWorld;
window.goBack = goBack;
window.prevWorld = prevWorld;
window.nextWorld = nextWorld;
window.togglePlay = togglePlay;
window.rotateVinylMenu = rotateVinylMenu;
window.enterSelectedVinylWorld = enterSelectedVinylWorld;
window.toggleTrophyPanel = toggleTrophyPanel;
window.openFinalScreen = openFinalScreen;
window.backToMenuFromFinal = backToMenuFromFinal;
window.unlockSecretError = unlockSecretError;
window.checkSecretWorldUnlock = checkSecretWorldUnlock;
window.addEventListener('load', initWorld6Scene);


if (typeof updateVinylMenu === 'function') {
    updateVinylMenu();
}

if (typeof updateTrophyUI === 'function') {
    updateTrophyUI();
}

// ==========================================
// MUNDO 2: CUARTO OSCURO, POLAROIDS Y CLÍMAX
// ==========================================
let pZIndexCounter = 30;
let world2DragEnabled = true;
let world2Initialised = false;
let world2SecretAchievementShown = false;

const WORLD2_CLIMAX_AT = 130.93; 
const WORLD2_MAIN_POLAROIDS = ["polaroid-piel", "polaroid-labios", "polaroid-ojos"];
const DARKROOM_WHISPERS = [
    "deja de intentar voltearlas...",
    "estás sobrepensando otra vez",
    "solo escucha...",
    "shhh",
    "todavía no...",
    "respira",
    "no todo se revela a la fuerza"
];

let darkroomWhisperInterval = null;
let world2RippleMoveCount = 0;

function updateWorld2Gradient(current = 0, duration = 0) {
    const world2 = document.getElementById('world-2');
    if (!world2 || world2.classList.contains('corazon-climax')) return;

    const progress = duration && Number.isFinite(duration)
        ? clamp01(current / duration)
        : 0;

    const eased = progress * progress * (3 - 2 * progress);
    const warm = Math.min(eased * 0.65, 0.48);

    world2.style.setProperty('--world2-warm-opacity', `${warm}`);
    world2.style.setProperty('--world2-red-opacity', `${1 - warm * 0.55}`);
}

function prepareWorld2InitialState({ force = false } = {}) {
    const world2 = document.getElementById('world-2');
    if (!world2) return;

    if (world2Initialised && !force) return;

    const secret = document.getElementById('polaroid-secret');
    const world2SecretAlreadyFound =
        secretPolaroidRevealed ||
        secretErrorsFound.has(2) ||
        trophyData.world2_secret?.unlocked ||
        secret?.dataset.found === 'true';

    world2Initialised = true;
    world2DragEnabled = true;
    world2ClimaxTriggered = false;
    world2TextWritten = false;
    secretPolaroidRevealed = world2SecretAlreadyFound;
    world2SecretAchievementShown = world2SecretAlreadyFound;

    world2.classList.remove('corazon-climax', 'warm-reveal');
    world2.style.setProperty('--world2-warm-opacity', '0');
    world2.style.setProperty('--world2-red-opacity', '1');

    WORLD2_MAIN_POLAROIDS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        el.classList.remove('hidden-polaroid', 'revealed', 'polaroid-glow', 'climax-locked', 'shake-locked');
        el.classList.add('flipped');
        
        // LIMPIEZA DE ESTILOS INLINE: Permite que el CSS Responsive controle la posición
        el.style.transform = '';
        el.style.transition = '';
        el.style.opacity = '';
        el.style.zIndex = '';
        el.style.removeProperty('--px');
        el.style.removeProperty('--py');
        el.style.removeProperty('--prot');
    });

    world2.querySelectorAll('.polaroid-back .back-text').forEach(note => {
    note.classList.remove('show-note');
    });

    if (currentWorld === 2) {
        startDarkroomWhispers();
    }

    if (secret) {
        secret.classList.remove('revealed', 'polaroid-glow', 'climax-locked', 'shake-locked');
        secret.classList.add('flipped');

        secret.style.transition = '';
        secret.style.zIndex = '';
        secret.style.removeProperty('--px');
        secret.style.removeProperty('--py');
        secret.style.removeProperty('--prot');

        if (world2SecretAlreadyFound) {
            // Si ya encontró el polaroid secreto, no debe volver a aparecer al salir y entrar.
            secret.dataset.found = 'true';
            secret.classList.add('hidden-polaroid');
            secret.style.opacity = '0';
            secret.style.pointerEvents = 'none';
            secret.style.transform = 'scale(0.8)';
        } else {
            secret.dataset.found = '';
            secret.classList.remove('hidden-polaroid');
            secret.style.transform = '';
            secret.style.opacity = '';
            secret.style.pointerEvents = '';
        }
    }

    const title = document.getElementById('world2-title');
    const desc = document.getElementById('world2-desc');
    const intro = document.querySelector('.world2-intro-copy');
    const lyricsBox = document.querySelector('.corazon-lyrics-box');
    const line1 = document.getElementById('hw-line-1');
    const line2 = document.getElementById('hw-line-2');

    if (title) title.style.opacity = '';
    if (desc) desc.style.opacity = '';
    if (intro) intro.style.opacity = '';
    if (lyricsBox) lyricsBox.style.opacity = '';
    if (line1) line1.textContent = '';
    if (line2) line2.textContent = '';

    initWorld2RevealRipples();

    if (currentWorld === 2 && !world2ClimaxTriggered) {
        startDarkroomWhispers();
    }

    const hiddenQr = document.getElementById('hidden-qr');
    if (hiddenQr) {
        hiddenQr.classList.remove('qr-hidden-final');
    }

    // Reset graffiti de luz al estado invisible
    const graffitiLeft = document.getElementById('graffiti-left');
    const graffitiRight = document.getElementById('graffiti-right');
    if (graffitiLeft) graffitiLeft.classList.add('hidden-graffiti');
    if (graffitiRight) graffitiRight.classList.add('hidden-graffiti');
}

function shakeLockedPolaroid(el) {
    if (!el) return;

    const note = el.querySelector('.polaroid-back .back-text');
    if (note) {
        note.classList.add('show-note');
    }

    el.classList.remove('shake-locked');
    void el.offsetWidth;
    el.classList.add('shake-locked');

    setTimeout(() => el.classList.remove('shake-locked'), 380);
}

function spawnDarkroomWhisper() {
    const world2 = document.getElementById('world-2');

    if (!world2 || currentWorld !== 2 || world2ClimaxTriggered) {
        stopDarkroomWhispers();
        return;
    }

    const whisper = document.createElement('span');

    const phrase = DARKROOM_WHISPERS[
        Math.floor(Math.random() * DARKROOM_WHISPERS.length)
    ];

    const top = 10 + Math.random() * 75;
    const left = 10 + Math.random() * 75;
    const rotation = -10 + Math.random() * 20;

    whisper.className = 'floating-whisper';
    whisper.textContent = phrase;
    whisper.style.top = `${top}%`;
    whisper.style.left = `${left}%`;
    whisper.style.setProperty('--whisper-rot', `${rotation}deg`);

    world2.appendChild(whisper);

    whisper.addEventListener('animationend', () => {
        whisper.remove();
    }, { once: true });
}

function startDarkroomWhispers() {
    const world2 = document.getElementById('world-2');

    if (!world2 || currentWorld !== 2 || world2ClimaxTriggered) return;

    clearInterval(darkroomWhisperInterval);

    spawnDarkroomWhisper();

    darkroomWhisperInterval = setInterval(() => {
        if (world2ClimaxTriggered || currentWorld !== 2) {
            stopDarkroomWhispers();
            return;
        }

        spawnDarkroomWhisper();
    }, 2500);
}

function stopDarkroomWhispers() {
    clearInterval(darkroomWhisperInterval);
    darkroomWhisperInterval = null;

    document.querySelectorAll('#world-2 .floating-whisper').forEach(el => {
        el.remove();
    });
}

function initPolaroidInteractions() {
    const polaroids = document.querySelectorAll('#world-2 .interactive-polaroid');

    polaroids.forEach(p => {
        if (p.dataset.dragReady === 'true') return;
        p.dataset.dragReady = 'true';

        let isDragging = false;
        let moved = false;
        let startClientX = 0;
        let startClientY = 0;
        let originX = 0;
        let originY = 0;

        function beginDrag(e) {
            if (currentWorld !== 2) return;
            if (!world2DragEnabled) return;
            if (p.classList.contains('hidden-polaroid') || p.classList.contains('climax-locked')) return;

            const pointer = getPointerInApp(e);
            if (!pointer.inside) return;

            isDragging = true;
            moved = false;

            startClientX = pointer.x;
            startClientY = pointer.y;

            const computedStyle = getComputedStyle(p);
            originX = parseFloat(computedStyle.getPropertyValue('--px')) || 0;
            originY = parseFloat(computedStyle.getPropertyValue('--py')) || 0;

            pZIndexCounter += 1;
            p.style.zIndex = pZIndexCounter;
            e.preventDefault();
            e.stopPropagation();

            p.style.setProperty('transition', 'none', 'important');

            try {
                p.setPointerCapture(e.pointerId);
            } catch (err) {}
        }

        function drag(e) {
            if (!isDragging) return;

            e.preventDefault();
            e.stopPropagation();

            const pointer = getPointerInApp(e);

            const dx = pointer.x - startClientX;
            const dy = pointer.y - startClientY;

            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                moved = true;
            }
        

            const { width, height } = getAppSize();

            const limitX = width * 0.48;
            const limitY = height * 0.48;

            const nextX = Math.max(-limitX, Math.min(limitX, originX + dx));
            const nextY = Math.max(-limitY, Math.min(limitY, originY + dy));

            p.style.setProperty('--px', `${nextX}px`, 'important');
            p.style.setProperty('--py', `${nextY}px`, 'important');

            p.style.setProperty(
                'transform',
                'translate(calc(-50% + var(--px)), calc(-50% + var(--py))) rotate(var(--prot)) scale(1.045)',
                'important'
            );
        }

        function endDrag(e) {
            if (!isDragging) return;

            isDragging = false;

            p.style.setProperty(
                'transition',
                'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.35s ease',
                'important'
            );

            /* Quitamos solo el scale temporal.
            Las coordenadas --px / --py quedan guardadas inline con priority important. */
            p.style.removeProperty('transform');

            if (!moved) {
                if (p.dataset.secret === 'true') {
                    revealSecretPolaroid();
                } else if (p.dataset.main === 'true') {
                    shakeLockedPolaroid(p);
                }
            }

            try { p.releasePointerCapture(e.pointerId); } catch (err) {}
        }

        p.addEventListener('pointerdown', beginDrag);
        p.addEventListener('pointermove', drag);
        p.addEventListener('pointerup', endDrag);
        p.addEventListener('pointercancel', () => { isDragging = false; p.style.transform = ''; });

        p.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();

            if (p.dataset.secret === 'true') {
                revealSecretPolaroid();
            } else if (p.dataset.main === 'true') {
                shakeLockedPolaroid(p);
            }
        });
    });
}

function revealSecretPolaroid() {
    if (currentWorld !== 2 || secretPolaroidRevealed || world2ClimaxTriggered) return;

    const secret = document.getElementById('polaroid-secret');
    if (!secret) return;

    secretPolaroidRevealed = true;
    secret.dataset.found = 'true';
    pZIndexCounter += 1;

    secret.classList.remove('hidden-polaroid');
    secret.classList.add('revealed');
    secret.classList.remove('flipped');
    secret.style.zIndex = pZIndexCounter;
    secret.style.opacity = '1';
    secret.style.pointerEvents = 'auto';

    if (!world2SecretAchievementShown) {
        world2SecretAchievementShown = true;
        unlockSecretError(2, 'world2_secret');
        showAchievement('🏆 LOGRO DESBLOQUEADO', 'Ansiedad Recompensada', 5200, 'minecraft');
    }

    setTimeout(() => {
        if (!secret || world2ClimaxTriggered) return;

        secret.style.opacity = '0';
        secret.style.transform = 'scale(0.8)';
        secret.style.pointerEvents = 'none';
        secret.classList.add('hidden-polaroid');
    }, 4500);
}

window.revealSecretPolaroid = revealSecretPolaroid;

function typewriterEffect(elementId, text, speed, callback) {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.textContent = '';
    let i = 0;

    function typeWriter() {
        if (i < text.length) {
            el.textContent += text.charAt(i);
            i += 1;
            setTimeout(typeWriter, speed);
        } else if (callback) {
            callback();
        }
    }

    typeWriter();
}

function triggerClimax() {
    const world2 = document.getElementById('world-2');
    if (!world2 || world2ClimaxTriggered) return;

    prepareWorld2InitialState({ force: false });

    world2ClimaxTriggered = true;
    const hiddenQr = document.getElementById('hidden-qr');
    if (hiddenQr) {
        hiddenQr.classList.add('qr-hidden-final');
    }
    stopDarkroomWhispers();

    document.querySelectorAll('#world-2 .reveal-ripple').forEach(el => {
        el.remove();
    });

    world2TextWritten = true;
    world2DragEnabled = false;

    world2.classList.add('corazon-climax', 'warm-reveal');
    world2.style.setProperty('--world2-warm-opacity', '1');
    world2.style.setProperty('--world2-red-opacity', '0.10');

    const title = document.getElementById('world2-title');
    const desc = document.getElementById('world2-desc');
    const lyricsBox = document.querySelector('.corazon-lyrics-box');

    if (title) title.style.opacity = '0';
    if (desc) desc.style.opacity = '0';
    if (lyricsBox) lyricsBox.style.opacity = '0';

    WORLD2_MAIN_POLAROIDS.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;

        el.classList.remove('hidden-polaroid', 'polaroid-glow', 'shake-locked');
        el.classList.add('flipped', 'climax-locked');

        // Limpia posiciones manuales del drag para que mande el CSS del clímax
        el.style.removeProperty('--px');
        el.style.removeProperty('--py');
        el.style.removeProperty('--prot');
        el.style.transform = '';

        el.style.opacity = '1';
        el.style.transition = 'transform 1.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease, filter 0.8s ease';
    });

    const secret = document.getElementById('polaroid-secret');
    if (secret) {
        secret.classList.add('climax-locked');
    }

    const line1 = document.getElementById('hw-line-1');
    const line2 = document.getElementById('hw-line-2');

    if (line1) line1.textContent = '';
    if (line2) line2.textContent = '';

    typewriterEffect('hw-line-1', 'No era revelar un secreto como tal', 62, () => {
        setTimeout(() => {
            typewriterEffect('hw-line-2', 'era mirarte con más cuidado', 48);
        }, 380);
    });

    if (typeof unlockTrophy === 'function') {
        unlockTrophy('world2_photos');
    }
}

function spawnRevealRipple(event) {
    const world2 = document.getElementById('world-2');

    if (!world2 || currentWorld !== 2 || world2ClimaxTriggered) return;

    world2RippleMoveCount += 1;

    if (world2RippleMoveCount % 5 !== 0) return;

    const rect = world2.getBoundingClientRect();
    const ripple = document.createElement('div');

    ripple.className = 'reveal-ripple';
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;

    world2.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
        ripple.remove();
    }, { once: true });
}

function initWorld2RevealRipples() {
    const world2 = document.getElementById('world-2');

    if (!world2 || world2.dataset.rippleReady === 'true') return;

    world2.dataset.rippleReady = 'true';
    world2.addEventListener('pointermove', spawnRevealRipple);
}

window.triggerClimax = triggerClimax;

window.triggerClimax = triggerClimax;

function updateCorazonPolaroids(current = 0) {
    const world2 = document.getElementById('world-2');
    if (!world2) return;

    if (!world2Initialised) {
        prepareWorld2InitialState({ force: true });
    }

    updateWorld2Gradient(current, audio ? audio.duration : 0);

    /* Oculta el QR unos segundos antes del clímax para que no se vea feo
   cuando los polaroids empiezan a prepararse para voltearse */
    const hiddenQr = document.getElementById('hidden-qr');
    if (hiddenQr) {
        const qrShouldHide = current >= WORLD2_CLIMAX_AT - 5.5;
        hiddenQr.classList.toggle('qr-hidden-final', qrShouldHide || world2ClimaxTriggered);
    }

    if (current >= WORLD2_CLIMAX_AT) {
        triggerClimax();
    }

    if (current >= WORLD2_CLIMAX_AT) {
        triggerClimax();
    }

    if (!world2ClimaxTriggered) return;

    const piel = document.getElementById('polaroid-piel');
    const labios = document.getElementById('polaroid-labios');
    const ojos = document.getElementById('polaroid-ojos');

    if (piel && current >= 135.27) {
        piel.classList.remove('flipped');
        piel.classList.add('polaroid-glow');
        setTimeout(() => piel.classList.remove('polaroid-glow'), 1200);
    }

    if (labios && current >= 136.36) {
        labios.classList.remove('flipped');
        labios.classList.add('polaroid-glow');
        setTimeout(() => labios.classList.remove('polaroid-glow'), 1200);
    }

    if (ojos && current >= 137.53) {
        ojos.classList.remove('flipped');
        ojos.classList.add('polaroid-glow');
        setTimeout(() => ojos.classList.remove('polaroid-glow'), 1200);
    }

    // Graffiti de luz: aparecen en el segundo exacto de la letra
    const graffitiLeft = document.getElementById('graffiti-left');
    const graffitiRight = document.getElementById('graffiti-right');

    if (current >= 139.75) {
        if (graffitiLeft) graffitiLeft.classList.remove('hidden-graffiti');
        if (graffitiRight) graffitiRight.classList.remove('hidden-graffiti');
    } else {
        if (graffitiLeft) graffitiLeft.classList.add('hidden-graffiti');
        if (graffitiRight) graffitiRight.classList.add('hidden-graffiti');
    }
}

function resetCorazonWorld() {
    world2Initialised = false;
    prepareWorld2InitialState({ force: true });

    if (typeof clearCorazonSunflowers === 'function') clearCorazonSunflowers();

    const heartsLayer = document.getElementById('corazon-hearts-layer');
    if (heartsLayer) heartsLayer.innerHTML = '';
}

window.addEventListener('load', () => {
    initPolaroidInteractions();
    prepareWorld2InitialState({ force: true });
});

// ==========================================
// EFECTO FLORECER (MUNDO 2 - CORAZÓN)
// ==========================================
let corazonSunflowersCount = 0;

function spawnCorazonSunflower() {
    const container = document.getElementById('corazon-sunflowers');
    if (!container || corazonSunflowersCount > 40) return; // Máximo 40 para no saturar

    const sunflower = document.createElement('div');
    sunflower.className = 'corazon-bloom-particle';
    sunflower.textContent = '🌻';

    // Posición aleatoria en toda la pantalla
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const rotation = (Math.random() - 0.5) * 60; // Rotación aleatoria

    sunflower.style.left = `${x}vw`;
    sunflower.style.top = `${y}vh`;
    sunflower.style.setProperty('--rot', `${rotation}deg`);

    // Hacemos que algunos sean más grandes que otros
    const scaleObj = 0.5 + Math.random() * 0.8;
    sunflower.style.fontSize = `calc(clamp(40px, 8vw, 80px) * ${scaleObj})`;

    container.appendChild(sunflower);
    corazonSunflowersCount++;
}

// Limpiar girasoles al salir del mundo
function clearCorazonSunflowers() {
    const container = document.getElementById('corazon-sunflowers');
    if (container) container.innerHTML = '';
    corazonSunflowersCount = 0;
}

// ==========================================
// CÓDIGOS DE LOS ERRORES (GLITCHES MUNDOS 2, 3, 4)
// ==========================================

// --- ERROR 3: AVE FUERA DE CUADRO (MUNDO 3) ---
let billieGlitchBirdCaught = false;

function catchBillieGlitchBird(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (currentWorld !== 3) return;
    if (secretErrorsFound.has(3)) return;

    const world3 = document.getElementById('world-3');
    const screen = document.getElementById('ocean-interaction');

    if (!world3 || !screen) return;
    if (!world3.classList.contains('glitch-bird-window')) return;

    billieGlitchBirdCaught = true;

    // --- FIX: Destruir el ave inmediatamente para que no siga volando ---
    if (event && event.target) {
        const clickedBird = event.target.closest('.secret-glitch-bird');
        if (clickedBird) clickedBird.remove();
    } else {
        // Fallback por si acaso
        const bird = document.querySelector('.secret-glitch-bird');
        if (bird) bird.remove();
    }

    unlockSecretError(3, 'world3_secret');

    world3.classList.remove('glitch-bird-window');
    world3.classList.add('glitch-bird-caught', 'bird-error-flash');

    const frame = document.createElement('div');
    frame.className = 'world3-bird-error-frame';
    frame.innerHTML = `
        <div>
            <span>[ERROR_0x3]</span>
            <small>BIRD OUT OF FRAME</small>
        </div>
    `;

    screen.appendChild(frame);

    triggerBurst(featherBurst, '🪶', 'feather-particle', 26);
    showAchievement('Error 3/5', 'Ave fuera de cuadro', 5000, 'roblox');

    setTimeout(() => {
        world3.classList.remove('bird-error-flash');
        if (frame) frame.remove();
    }, 2400);
}

window.catchBillieGlitchBird = catchBillieGlitchBird;

function toggleBillieHiddenNote() {
    if (currentWorld !== 3) return;

    const world3 = document.getElementById('world-3');
    if (!world3) return;

    world3.classList.toggle('show-billie-note');
}

window.toggleBillieHiddenNote = toggleBillieHiddenNote;


function triggerScrapbookExplosion() {
    const layer = document.getElementById('scrapbook-layer');
    if (!layer) return;

    layer.innerHTML = '';

    // Notas estrictamente en esquinas: enmarcan el cuaderno sin tapar el texto central.
    const items = [
        { type: 'note', text: 'Y yo que pensaba que la física era difícil 😔', x: 3, y: 8, rot: -12, delay: 0 },
        { type: 'note', text: 'me encanta tu locura y esquizofrenia xd', x: 78, y: 9, rot: 9, delay: 600 },
        { type: 'note', text: 'no sabia programar rosas moradas :(', x: 4, y: 78, rot: -7, delay: 1200 },
        { type: 'note', text: 'ese lunar sobre tu labio tiene la culpa de esto', x: 76, y: 80, rot: 7, delay: 2000 }
    ];

    items.forEach(item => {
        setTimeout(() => {
            const el = document.createElement('div');

            el.className = 'scrapbook-item scrap-note';
            el.style.left = `${item.x}%`;
            el.style.top = `${item.y}%`;
            el.style.setProperty('--rot', `${item.rot}deg`);
            el.innerHTML = item.text;

            layer.appendChild(el);
        }, item.delay);
    });
}

let flockSpawned = false;

function spawnBirdFlock() {
    if (flockSpawned || currentWorld !== 3) return;

    flockSpawned = true;

    const container = document.getElementById('bird-flock-container');
    if (!container) return;

    container.innerHTML = '';

    const totalBirds = 12;

    for (let i = 0; i < totalBirds; i++) {
        const bird = document.createElement('div');
        bird.className = 'flock-bird';

        const delay = Math.random() * 2.3;
        const startY = 18 + Math.random() * 48;

        bird.style.top = `${startY}%`;
        bird.style.animationDelay = `${delay}s`;
        bird.style.animationDuration = `${6 + Math.random() * 3}s`;

        container.appendChild(bird);
    }
}

// ==========================================
// SISTEMA DE LOGIN DE ROBLOX
// ==========================================

let intentosFallidos = 0;
const ROBLOX_AUTO_LOGIN = false;

const CORRECT_USER = 'valeskaskav';
const CORRECT_PASS = 'tuntunsahur';

window.addEventListener('load', () => {
    if (!ROBLOX_AUTO_LOGIN) {
        localStorage.removeItem('valeskaLogueada');
        return;
    }

    if (localStorage.getItem('valeskaLogueada') === 'true') {
        enterRobloxUniverse();
    }
});

function enterRobloxUniverse() {
    const loginScreen = document.getElementById('roblox-login-screen');
    const introScreen = document.getElementById('intro-screen');

    if (!loginScreen || !introScreen) return;

    loginScreen.classList.add('hidden');
    loginScreen.classList.remove('active');

    introScreen.classList.remove('hidden');
    introScreen.classList.add('active');

    const audio = document.getElementById('global-audio');
    if (audio) {
        audio.play().catch(() => console.log('Esperando interacción...'));
    }
}

function showError(message) {
    const errorEl = document.getElementById('roblox-error');
    if (!errorEl) return;

    errorEl.textContent = message;
    errorEl.classList.remove('show-error');

    void errorEl.offsetWidth;

    errorEl.classList.add('show-error');

    clearTimeout(errorEl._hideTimer);
    errorEl._hideTimer = setTimeout(() => {
        errorEl.classList.remove('show-error');
    }, 3200);
}

function shakeRobloxForm() {
    const form = document.querySelector('.rb-form');
    if (!form) return;

    form.classList.remove('shake');
    void form.offsetWidth;
    form.classList.add('shake');

    setTimeout(() => {
        form.classList.remove('shake');
    }, 500);
}

function checkRobloxLogin() {
    const userField = document.getElementById('roblox-user');
    const passField = document.getElementById('roblox-pass');
    const btn = document.querySelector('.rb-btn-login');

    if (!userField || !passField || !btn) return;

    const user = userField.value.trim().toLowerCase();
    const pass = passField.value.trim();

    if (!user && !pass) {
        showError('Error 400: primero escribe algo ps.');
        shakeRobloxForm();
        return;
    }

    if (!user) {
        showError('Error 401: falta el usuario, o sea, tú nombre de usuario de Roblox xd');
        shakeRobloxForm();
        return;
    }

    if (!pass) {
        showError('Error 401: falta la contraseña');
        shakeRobloxForm();
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Validando...';

    setTimeout(() => {
        if (user === CORRECT_USER && pass === CORRECT_PASS) {
            localStorage.setItem('valeskaLogueada', 'true');
            btn.textContent = 'Iniciar sesión';
            btn.disabled = false;
            enterRobloxUniverse();
            return;
        }

        intentosFallidos++;

        btn.textContent = 'Iniciar sesión';
        btn.disabled = false;

        if (user !== CORRECT_USER && pass !== CORRECT_PASS) {
            showError('Error 401: usuario y contraseña incorrectos.');
        } else if (user !== CORRECT_USER) {
            showError('Error 401: ese usuario no existe en este universo.');
        } else if (pass !== CORRECT_PASS) {
            if (intentosFallidos >= 5) {
                showError('ni que fuera tan difícil ps, tienes un llavero de brainrot no?');
            } else {
                showError('Error 401: contraseña incorrecta.');
            }
        }

        shakeRobloxForm();
    }, 650);
}

function mostrarBromaCodigo() {
    showError('oe para que necesitas uno?');
    shakeRobloxForm();
}

function mostrarErrorInicioRapido() {
    showError('Error 412: exceso de esquizofrenia detectado.');
    shakeRobloxForm();
}

window.mostrarBromaCodigo = mostrarBromaCodigo;
window.mostrarErrorInicioRapido = mostrarErrorInicioRapido;

function toggleRobloxPass(btn) {
    const passInput = document.getElementById('roblox-pass');
    if (!passInput || !btn) return;

    const isHidden = passInput.type === 'password';
    passInput.type = isHidden ? 'text' : 'password';

    btn.innerHTML = isHidden
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
             <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
             <line x1="1" y1="1" x2="23" y2="23"/>
           </svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z"/>
             <circle cx="12" cy="12" r="3"/>
           </svg>`;
}

document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;

    const loginScreen = document.getElementById('roblox-login-screen');

    if (loginScreen && !loginScreen.classList.contains('hidden')) {
        checkRobloxLogin();
    }
});

window.checkRobloxLogin = checkRobloxLogin;
window.showError = showError;
window.toggleRobloxPass = toggleRobloxPass;

// ==========================================
// CARTA SECRETA: SPIDER-MAN BLUE
// ==========================================
function toggleSpideyLetter() {
    const modal = document.getElementById('spidey-modal');
    if (modal) {
        modal.classList.toggle('show-modal');
    }
}

// Exponer la función para el HTML
window.toggleSpideyLetter = toggleSpideyLetter;

// ==========================================
// CONTROLADOR GLOBAL DE RESIZE (OPTIMIZACIÓN MÓVIL)
// Evita que la barra de direcciones del navegador hunda los FPS
// ==========================================
let globalResizeTimer;

function resizeGalaxyToApp() {
    if (!galaxyInitialized || !galaxyCamera || !galaxyRenderer || !galaxyComposer) return;

    const { width, height } = getGalaxyRenderSize();

    galaxyCamera.aspect = width / height;
    galaxyCamera.updateProjectionMatrix();

    galaxyRenderer.setSize(width, height);
    galaxyComposer.setSize(width, height);
}

function resizeAllAppCanvases() {
    resizeGalaxyToApp();

    if (typeof resizeYellowFireCanvas === 'function') {
        resizeYellowFireCanvas();
    }

    if (typeof resizeWorld6Canvas === 'function') {
        resizeWorld6Canvas();
    }

    if (typeof resizePlaylistVisualizerCanvas === 'function') {
        resizePlaylistVisualizerCanvas();
    }
}

window.addEventListener('resize', () => {
    clearTimeout(globalResizeTimer);

    globalResizeTimer = setTimeout(() => {
        resizeAllAppCanvases();
    }, 180);
});

window.addEventListener('orientationchange', () => {
    clearTimeout(globalResizeTimer);

    globalResizeTimer = setTimeout(() => {
        resizeAllAppCanvases();
    }, 300);
});

// ==========================================
// SALA DE PISTAS ADICIONALES (PLAYLIST ROOM HI-FI)
// ==========================================

const EXTRA_TRACK_NOTES = {
    "risk-it-all": "Esta fue con la que empece a hacerte una pagina, no se si cuenta como origen, pero algo empezo ahí supongo",
    "in-the-pool": "Esta la puse porque no todo lo bonito tenia que gritar, aveces basta con una canción tranquila, agua de noche y la sensación rara de querer quedarse un poco más",
    "por-ti": "Esta no necesitaba ser un mundo, solo necesitaba quedarse sonando un rato xd",
    "la-terminal": "Literal, escuhco cuando voy en el transporte y hay lluvia",
    "bachata-rosa": "Ni yo se porque la puse, solo que me gusto jasja",
    "sparks": "Quizas sea la cancion que más me recuerda a ti, no se si es por la letra o por el ritmo pero me hace pensar en ti",
    "still-love-you": "Esta no es taaan especial, pero quizas y te guste xd, porque a mi si",
    "sunflower": "Aca se habla de como una persona es algo caotica (en el buen sentido xd) y como a veces es dificil de entender, pero aun asi es hermosa y especial como un girasol",
    "til-kingdom-come": "En si esta tambien me recuerda a ti, pero porque  por ti hago varias cosas que no haria por nadie mas, y eso me hace pensar en ti",
    "te-quiero": "Bueno, la de aca simplemente es hermosa xd",
    "alguna-vez-alli": "Me dijiste que te gustan las canciones tristes y gracias a ti tambien me gustan jksak",
    "forever-young": "La de aca si es algo personal para mi , no hay explicacion xd",
    "gone-gone-gone": "Esta creo que tanto tu y yo la conocemos jsajs",
    "nubecita": "bueno , esta tambien es algo triste"
};

function getPlaylistRoomElements() {
    return {
        select: document.getElementById('playlist-room-select'),
        button: document.getElementById('playlist-room-play-btn'),
        note: document.getElementById('playlist-room-note'),
        status: document.getElementById('crt-status')
    };
}

function setPlaylistRoomPlayButtonState(playing) {
    const { button, status } = getPlaylistRoomElements();
    if (!button) return;

    button.classList.toggle('is-playing', !!playing);
    const icon = button.querySelector('i');
    const span = button.querySelector('span');
    
    if (icon) {
        icon.className = playing ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    }
    
    if (span) {
        span.textContent = playing ? 'PAUSA' : 'PLAY';
    }

    if (status) {
        status.textContent = playing ? 'SYNC: OK' : 'STANDBY';
        status.style.color = playing ? '#4ade80' : 'rgba(255, 157, 0, 0.4)';
    }
}

function updatePlaylistRoomNote(key) {
    const { note } = getPlaylistRoomElements();
    if (!note) return;
    note.textContent = EXTRA_TRACK_NOTES[key] || "Esta no necesitaba ser un mundo. Solo necesitaba quedarse sonando un rato.";
}

function togglePlaylistRoomTrack() {
    const { select } = getPlaylistRoomElements();
    if (!select) return;

    const selectedKey = select.value;
    const track = EXTRA_TRACKS[selectedKey];
    if (!track) return;

    const isSameExtraTrack = extraTrackMode && activeExtraTrackKey === selectedKey;

    if (isSameExtraTrack && !audio.paused) {
        audio.pause();
        isPlaying = false;
        setPlaylistRoomPlayButtonState(false);
        updatePlayButton();
        return;
    }

    extraTrackMode = true;

    if (!isSameExtraTrack) {
        activeExtraTrackKey = selectedKey;
        audio.pause();
        audio.src = track.src;
        audio.preload = 'auto';
        audio.load();

        try { audio.currentTime = 0; } catch (e) {}

        if (progressBar) progressBar.value = 0;
        if (currentTimeEl) currentTimeEl.textContent = '0:00';
        if (durationEl) durationEl.textContent = '0:00';
    }

    if (playerTitle) playerTitle.textContent = track.title;
    if (playerArtist) playerArtist.textContent = track.artist;

    updatePlaylistRoomNote(selectedKey);

    audio.play().then(() => {
        isPlaying = true;
        setPlaylistRoomPlayButtonState(true);
        startPlaylistVisualizer();
        updatePlayButton();
    }).catch(error => {
        console.log('No se pudo reproducir la pista extra todavía:', error);
        isPlaying = false;
        setPlaylistRoomPlayButtonState(false);
        updatePlayButton();
    });
}

// Variables del Visualizador (Simulado y Seguro)
let playlistVisualizerRAF = null;
let playlistVisualizerRunning = false;
let crtParticles = [];

function resizePlaylistVisualizerCanvas() {
    const canvas = document.getElementById('playlist-visualizer-canvas');
    if (!canvas) return null;

    const app = getAppSize();
    const rect = canvas.getBoundingClientRect();

    const cssWidth = rect.width || app.width;
    const cssHeight = rect.height || app.height;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const w = Math.max(1, Math.floor(cssWidth * dpr));
    const h = Math.max(1, Math.floor(cssHeight * dpr));

    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    return { canvas, ctx, width: cssWidth, height: cssHeight };
}

function drawPlaylistVisualizerFrame() {
    const room = document.getElementById('playlist-room');
    const payload = resizePlaylistVisualizerCanvas();

    if (!payload || !room || !room.classList.contains('active')) {
        playlistVisualizerRunning = false;
        playlistVisualizerRAF = null;
        return;
    }

    const { ctx, width, height } = payload;
    const now = performance.now() * 0.001;
    // Verificamos si realmente está sonando el audio sin secuestrar la API
    const isPlayingAudio = audio && !audio.paused && audio.currentTime > 0;

    ctx.clearRect(0, 0, width, height);

    // Fondo profundo
    ctx.fillStyle = 'rgba(2, 3, 5, 0.7)';
    ctx.fillRect(0, 0, width, height);

    let bass = 0;

    if (isPlayingAudio) {
        // Bajo simulado con una combinación de ondas y ruido para sentirse orgánico
        bass = 0.5 + Math.sin(now * 6) * 0.25 + Math.random() * 0.25;
        
        if (bass > 0.75 && Math.random() > 0.6) {
            crtParticles.push({
                x: width * 0.1 + Math.random() * (width * 0.8),
                y: height,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 4 - 2,
                life: 1,
                size: Math.random() * 2 + 1
            });
        }
    }

    room.style.setProperty('--visualizer-bass', isPlayingAudio ? bass.toFixed(3) : (Math.sin(now * 2) * 0.05).toFixed(3));

    // 1. Barras de Frecuencia Base (Lilac/Púrpura)
    const bars = 48;
    const gap = width * 0.008;
    const barWidth = (width - (gap * (bars + 1))) / bars;
    const startX = gap;
    const baseY = height * 0.98;

    for (let i = 0; i < bars; i++) {
        let raw = 0;
        if (isPlayingAudio) {
            // Animación de frecuencia reactiva mezclando ondas y posición
            raw = Math.abs(Math.sin(now * 8 + i * 0.3) * 0.5 + Math.cos(now * 3 - i * 0.1) * 0.3) + Math.random() * 0.2;
        } else {
            // "Respiración" ambiental
            raw = 0.05 + 0.05 * Math.sin(now * 1.2 + i * 0.15);
        }
        
        const h = height * 0.05 + (raw * height * 0.5);
        const x = startX + i * (barWidth + gap);
        
        const progress = i / bars;
        // Color lila hacia naranja
        ctx.fillStyle = `rgba(${170 + progress*85}, ${85 + progress*65}, ${255 - progress*200}, ${0.5 + raw * 0.5})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        
        ctx.beginPath();
        ctx.roundRect(x, baseY - h, barWidth, h, [barWidth/2, barWidth/2, 0, 0]);
        ctx.fill();
    }
    ctx.shadowBlur = 0;

    // 2. Onda de Osciloscopio Principal
    ctx.beginPath();
    const waveAmp = height * 0.35;
    const centerY = height * 0.45;
    const steps = width > 500 ? 200 : 100;

    for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * width;
        let y = centerY;

        if (isPlayingAudio) {
            // Onda dinámica pseudo-reactiva
            const v = Math.sin(i * 0.1 + now * 15) * 0.4 + Math.sin(i * 0.04 - now * 8) * 0.4 + (Math.random() * 0.1);
            y = centerY + v * waveAmp;
        } else {
            let localTime = (now % 2.0);
            let pulsePhase = ((i / steps) - (localTime - 0.5)) * 10;
            let damp = Math.exp(-Math.pow(pulsePhase, 2) * 2);
            y = centerY + Math.sin(pulsePhase * 3) * waveAmp * 0.35 * damp;
        }

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ff9d00';
    ctx.shadowColor = '#ff6a00';
    ctx.shadowBlur = 18;
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#fff';
    ctx.shadowBlur = 0;
    ctx.stroke();

    // 3. Partículas de "Polvo de Fósforo"
    crtParticles = crtParticles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        
        if(p.life > 0) {
            ctx.fillStyle = `rgba(255, 157, 0, ${p.life})`;
            ctx.shadowColor = '#ff9d00';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            return true;
        }
        return false;
    });
    ctx.shadowBlur = 0;

    playlistVisualizerRAF = requestAnimationFrame(drawPlaylistVisualizerFrame);
}

function startPlaylistVisualizer() {
    if (playlistVisualizerRunning) return;
    playlistVisualizerRunning = true;
    playlistVisualizerRAF = requestAnimationFrame(drawPlaylistVisualizerFrame);
}

function stopPlaylistVisualizer() {
    playlistVisualizerRunning = false;
    if (playlistVisualizerRAF) cancelAnimationFrame(playlistVisualizerRAF);
    playlistVisualizerRAF = null;
    crtParticles = []; 
}

// Inicialización de la Sala
function initPlaylistRoom() {
    const { select, button } = getPlaylistRoomElements();
    if (!select || !button) return;

    select.innerHTML = '';
    Object.keys(EXTRA_TRACKS).forEach(key => {
        const track = EXTRA_TRACKS[key];
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = `${track.artist} - ${track.title}`;
        select.appendChild(opt);
    });

    button.addEventListener('click', togglePlaylistRoomTrack);

    select.addEventListener('change', () => {
        const selectedKey = select.value;
        updatePlaylistRoomNote(selectedKey);

        if (extraTrackMode && !audio.paused) {
            activeExtraTrackKey = null;
            togglePlaylistRoomTrack();
            return;
        }

        activeExtraTrackKey = null;
        setPlaylistRoomPlayButtonState(false);
        startPlaylistVisualizer(); 
    });
}

function openPlaylistRoom() {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    updatePlayButton();

    const menuScreen = document.getElementById('menu-rocola');
    const playlistRoom = document.getElementById('playlist-room');

    menuScreen.classList.remove('active');
    menuScreen.classList.add('hidden');

    playlistRoom.classList.remove('hidden');
    playlistRoom.classList.add('active');

    currentWorld = 0;
    extraTrackMode = true;
    activeExtraTrackKey = null;

    const { select } = getPlaylistRoomElements();
    if (select) {
        updatePlaylistRoomNote(select.value);
    }
    setPlaylistRoomPlayButtonState(false);
    startPlaylistVisualizer();
}

function backToMenuFromPlaylistRoom() {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    extraTrackMode = false;
    activeExtraTrackKey = null;
    updatePlayButton();

    stopPlaylistVisualizer();

    const menuScreen = document.getElementById('menu-rocola');
    const playlistRoom = document.getElementById('playlist-room');

    playlistRoom.classList.remove('active');
    playlistRoom.classList.add('hidden');

    menuScreen.classList.remove('hidden');
    menuScreen.classList.add('active');

    currentWorld = 0;
}

window.openPlaylistRoom = openPlaylistRoom;
window.backToMenuFromPlaylistRoom = backToMenuFromPlaylistRoom;
window.addEventListener('load', initPlaylistRoom);

// ==========================================
// OPTIMIZACIÓN FINAL · PANTALLA COMPLETA Y MOBILE
// Agregar al final de script.js
// ==========================================

// ── 1. Eliminar duplicado de window.triggerClimax ──
// (Ya existe la asignación en línea 7440; la de 7442 es redundante.
//  No la borramos aquí porque no devolvemos el archivo completo.
//  Si quieres limpiarla manualmente: elimina la línea 7442 de script.js)



// ── 3. Pausar visualizador playlist si la sala no está activa ──
// Guard: drawPlaylistVisualizerFrame ya verifica playlistVisualizerRunning,
// pero lo reforzamos al escuchar visibilitychange
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (typeof stopPlaylistVisualizer === 'function' && playlistVisualizerRunning) {
            stopPlaylistVisualizer();
        }
        // Pausar audio si está sonando
        if (audio && !audio.paused) {
            audio.pause();
            isPlaying = false;
            updatePlayButton();
            if (typeof setPlaylistRoomPlayButtonState === 'function') {
                setPlaylistRoomPlayButtonState(false);
            }
        }
    }
});

// ── 4. Guard adicional: detener fuego amarillo si se cambia de mundo rápido ──
// (animateYellowFire ya tiene guard currentWorld !== 5, esto es refuerzo)
const _originalGoBack = window.goBack;
// No redefinimos goBack para no romper nada. El guard en animateYellowFire es suficiente.

// ── 5. Reducir sombras y blur en móvil vía JS para efectos inline ──
// Detectar móvil de baja gama y reducir partículas
(function reduceMobileEffects() {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    // Reducir partículas del fuego amarillo si está en móvil
    // (ya tiene lógica condicional en generateYellowSkyStars: 60 en móvil vs 90)
    // No se necesita más cambio aquí.

    // Reducir max partículas del canvas playlist visualizer en móvil
    // Lo hacemos sobreescribiendo el límite interno
    Object.defineProperty(window, '_mobileOptimized', { value: true, writable: false });
})();

// =====================================================
// RESPONSIVE + FULLSCREEN SAFE MODE
// Pegar al final de script.js
// =====================================================

function isMobilePortraitSafe() {
    return window.innerWidth < 768 && window.matchMedia('(orientation: portrait)').matches;
}

function getPointerInElement(event, element) {
    const source =
        event.touches?.[0] ||
        event.changedTouches?.[0] ||
        event;

    const rect = element?.getBoundingClientRect?.() || getAppRect();

    const x = source.clientX - rect.left;
    const y = source.clientY - rect.top;

    return {
        x,
        y,
        width: rect.width,
        height: rect.height,
        inside:
            x >= 0 &&
            y >= 0 &&
            x <= rect.width &&
            y <= rect.height
    };
}

function getGalaxyRenderSize() {
    const canvas = document.getElementById('galaxy-canvas');

    if (isMobilePortraitSafe() && canvas) {
        const rect = canvas.getBoundingClientRect();

        if (rect.width > 0 && rect.height > 0) {
            return {
                width: Math.max(1, rect.width),
                height: Math.max(1, rect.height)
            };
        }
    }

    return getAppSize();
}

function refreshSeguroResponsiveHitboxes() {
    if (
        typeof seguroApplyZonePosition !== 'function' ||
        typeof seguroWorld4Zones === 'undefined'
    ) {
        return;
    }

    document.querySelectorAll('#seguro-focus-layer .seguro-focus-hitbox').forEach(btn => {
        const zone = seguroWorld4Zones.focus.find(item => item.id === btn.dataset.zoneId);
        if (zone) seguroApplyZonePosition(btn, zone);
    });

    const lilacZoneBtn = document.getElementById('seguro-lilac-zone-button');
    if (lilacZoneBtn && seguroWorld4Zones.secret) {
        seguroApplyZonePosition(lilacZoneBtn, seguroWorld4Zones.secret);
    }

    const lilacHitbox = document.getElementById('seguro-lilac-hitbox');
    if (lilacHitbox && seguroWorld4Zones.secret) {
        seguroApplyZonePosition(lilacHitbox, seguroWorld4Zones.secret);
    }
}

function updateResponsiveModeFlags() {
    document.body.classList.toggle('mobile-portrait-safe', isMobilePortraitSafe());

    clearTimeout(window.__responsiveResizeTimer);
    window.__responsiveResizeTimer = setTimeout(() => {
        if (typeof resizeAllAppCanvases === 'function') {
            resizeAllAppCanvases();
        }

        refreshSeguroResponsiveHitboxes();
    }, 140);
}

function canUseFullscreen() {
    return !!(
        document.fullscreenEnabled &&
        document.documentElement &&
        document.documentElement.requestFullscreen
    );
}

async function enterFullscreenSafely() {
    try {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    } catch (firstError) {
        await document.documentElement.requestFullscreen();
    }
}

async function toggleFullscreenMode() {
    try {
        if (!canUseFullscreen()) {
            document.body.classList.add('fullscreen-unavailable');
            updateFullscreenButtons();
            return false;
        }

        if (!document.fullscreenElement) {
            await enterFullscreenSafely();
            document.body.classList.add('is-fullscreen-mode');
        } else {
            await document.exitFullscreen();
            document.body.classList.remove('is-fullscreen-mode');
        }

        updateFullscreenButtons();
        return true;
    } catch (error) {
        console.warn('No se pudo cambiar pantalla completa:', error);
        document.body.classList.add('fullscreen-failed');
        updateFullscreenButtons();
        return false;
    }
}

function updateFullscreenButtons() {
    const supported = canUseFullscreen();
    const active = !!document.fullscreenElement;

    document.body.classList.toggle('is-fullscreen-mode', active);
    document.body.classList.toggle('fullscreen-unavailable', !supported);

    document.querySelectorAll('[data-fullscreen-toggle]').forEach(btn => {
        btn.hidden = !supported;

        /*
            En móvil/fullscreen ya no usamos texto largo.
            Lo dejamos como control mini:
            ⛶ = entrar / × = salir
        */
        btn.textContent = active ? '×' : '⛶';

        btn.setAttribute(
            'aria-label',
            active ? 'Salir de pantalla completa' : 'Pantalla completa'
        );

        btn.setAttribute(
            'title',
            active ? 'Salir de pantalla completa' : 'Pantalla completa'
        );

        btn.classList.toggle('is-active', active);
    });

    document.querySelectorAll('[data-mobile-fullscreen]').forEach(btn => {
        btn.hidden = !supported;
    });
}

function closeMobileOrientationNotice() {
    const notice = document.getElementById('mobile-orientation-notice');
    if (notice) notice.hidden = true;

    try {
        sessionStorage.setItem('mobileOrientationNoticeDismissed', 'true');
    } catch (error) {
        console.warn('No se pudo guardar el cierre del aviso móvil:', error);
    }
}

function shouldShowMobileOrientationNotice() {
    let dismissed = false;

    try {
        dismissed = sessionStorage.getItem('mobileOrientationNoticeDismissed') === 'true';
    } catch (error) {
        dismissed = false;
    }

    return isMobilePortraitSafe() && !dismissed;
}

function updateMobileOrientationNotice() {
    const notice = document.getElementById('mobile-orientation-notice');
    if (!notice) return;

    notice.hidden = !shouldShowMobileOrientationNotice();

    const fullscreenBtn = notice.querySelector('[data-mobile-fullscreen]');
    if (fullscreenBtn) {
        fullscreenBtn.hidden = !canUseFullscreen();
    }
}

function initResponsiveFullscreenSystem() {
    updateResponsiveModeFlags();
    updateFullscreenButtons();
    updateMobileOrientationNotice();

    document.querySelectorAll('[data-fullscreen-toggle]').forEach(btn => {
        if (btn.dataset.fullscreenBound === 'true') return;
        btn.dataset.fullscreenBound = 'true';
        btn.addEventListener('click', toggleFullscreenMode);
    });

    document.querySelectorAll('[data-mobile-fullscreen]').forEach(btn => {
        if (btn.dataset.mobileFullscreenBound === 'true') return;
        btn.dataset.mobileFullscreenBound = 'true';

        btn.addEventListener('click', async () => {
            await toggleFullscreenMode();
            closeMobileOrientationNotice();
        });
    });

    document.querySelectorAll('[data-mobile-continue]').forEach(btn => {
        if (btn.dataset.mobileContinueBound === 'true') return;
        btn.dataset.mobileContinueBound = 'true';
        btn.addEventListener('click', closeMobileOrientationNotice);
    });
}

document.addEventListener('fullscreenchange', () => {
    document.body.classList.toggle('is-fullscreen-mode', !!document.fullscreenElement);
    updateFullscreenButtons();
});

window.addEventListener('resize', () => {
    updateResponsiveModeFlags();
    updateMobileOrientationNotice();
});

window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        updateResponsiveModeFlags();
        updateMobileOrientationNotice();
    }, 250);
});

initResponsiveFullscreenSystem();
window.toggleFullscreenMode = toggleFullscreenMode;