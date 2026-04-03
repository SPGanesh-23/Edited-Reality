/* ═══════════════════════════════════════════
   PROJECT: TEMPORAL DISTORTION — Script
   Particles, Countdown, Typing, Audio, FX
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    // ── Particle Background ──
    initParticles();

    // ── Countdown Timer ──
    initCountdown();

    // ── Scroll Reveal ──
    initScrollReveal();

    // ── Terminal Typing ──
    initTerminalLogs();

    // ── Distortion Progress Bar ──
    initProgressBars();

    // ── Glitch Hover Effects ──
    initGlitchEffects();

    // ── Load Timelines from Server & init interactions ──
    loadTimelinesFromManifest();

    // ── Hidden Signal Flicker ──
    initHiddenSignal();

    // ── Audio System ──
    initAudio();

    // ── Screen Flicker ──
    initScreenFlicker();
});


/* ═══════════════════════════════════════════
   PARTICLE SYSTEM
   ═══════════════════════════════════════════ */
function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height, particles;
    const PARTICLE_COUNT = 80;
    const CONNECTION_DIST = 120;

    function resize() {
        width = canvas.width = canvas.parentElement.offsetWidth;
        height = canvas.height = canvas.parentElement.offsetHeight;
    }

    function createParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONNECTION_DIST) {
                    const alpha = (1 - dist / CONNECTION_DIST) * 0.15;
                    ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw particles
        for (const p of particles) {
            ctx.fillStyle = `rgba(0, 229, 255, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            // Move
            p.x += p.vx;
            p.y += p.vy;

            // Wrap around
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;
        }

        requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    window.addEventListener('resize', () => {
        resize();
        createParticles();
    });
}


/* ═══════════════════════════════════════════
   COUNTDOWN TIMER
   ═══════════════════════════════════════════ */
function initCountdown() {
    // Next distortion event: 7 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    targetDate.setHours(0, 0, 0, 0);

    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minutesEl = document.getElementById('cd-minutes');
    const secondsEl = document.getElementById('cd-seconds');

    function update() {
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            daysEl.textContent = '00';
            hoursEl.textContent = '00';
            minutesEl.textContent = '00';
            secondsEl.textContent = '00';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        const newDays = String(days).padStart(2, '0');
        const newHours = String(hours).padStart(2, '0');
        const newMins = String(minutes).padStart(2, '0');
        const newSecs = String(seconds).padStart(2, '0');

        // Glitch flash effect when value changes
        if (secondsEl.textContent !== newSecs) {
            secondsEl.parentElement.classList.add('flip');
            setTimeout(() => secondsEl.parentElement.classList.remove('flip'), 150);
        }

        daysEl.textContent = newDays;
        hoursEl.textContent = newHours;
        minutesEl.textContent = newMins;
        secondsEl.textContent = newSecs;
    }

    update();
    setInterval(update, 1000);
}


/* ═══════════════════════════════════════════
   SCROLL REVEAL
   ═══════════════════════════════════════════ */
function initScrollReveal() {
    const items = document.querySelectorAll('.reveal-item');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Stagger the reveal
                setTimeout(() => {
                    entry.target.classList.add('revealed');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    items.forEach(item => observer.observe(item));
}


/* ═══════════════════════════════════════════
   TERMINAL LOG TYPING
   ═══════════════════════════════════════════ */
function initTerminalLogs() {
    const terminalBody = document.getElementById('terminal-body');
    if (!terminalBody) return;

    const logEntries = terminalBody.querySelectorAll('.log-entry');
    let triggered = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !triggered) {
                triggered = true;
                logEntries.forEach((log, i) => {
                    const delay = parseInt(log.getAttribute('data-delay')) || (i * 400);
                    setTimeout(() => {
                        log.classList.add('visible');
                        // Typewriter effect for the log text
                        const textEl = log.querySelector('.log-text');
                        if (textEl) {
                            const fullText = textEl.textContent;
                            textEl.textContent = '';
                            typeText(textEl, fullText, 15);
                        }
                    }, delay);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    observer.observe(terminalBody);
}

function typeText(element, text, speed) {
    let i = 0;
    const interval = setInterval(() => {
        element.textContent += text.charAt(i);
        i++;
        if (i >= text.length) {
            clearInterval(interval);
        }
    }, speed);
}


/* ═══════════════════════════════════════════
   PROGRESS BARS (Distortion + Stability)
   ═══════════════════════════════════════════ */
function initProgressBars() {
    const distortionBar = document.getElementById('distortion-bar');
    const stabilityFill = document.getElementById('stability-fill');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (distortionBar) {
                    const target = distortionBar.getAttribute('data-target') || 78;
                    setTimeout(() => {
                        distortionBar.style.width = target + '%';
                    }, 300);
                }
                if (stabilityFill) {
                    setTimeout(() => {
                        stabilityFill.style.width = '42%';
                    }, 600);
                }
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    const statusSection = document.getElementById('system-status');
    if (statusSection) observer.observe(statusSection);
}


/* ═══════════════════════════════════════════
   GLITCH EFFECTS
   ═══════════════════════════════════════════ */
function initGlitchEffects() {
    // Glitch text on hover for elements with .glitch-text
    const glitchElements = document.querySelectorAll('.glitch-text');

    glitchElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            el.style.animation = 'glitchText 0.3s steps(3) 3';
            el.addEventListener('animationend', () => {
                el.style.animation = '';
            }, { once: true });
        });
    });

    // Random micro-glitch on the hero title
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        setInterval(() => {
            if (Math.random() > 0.85) {
                heroTitle.style.textShadow = `
                    ${Math.random() * 4 - 2}px ${Math.random() * 4 - 2}px 0 rgba(255, 23, 68, 0.7),
                    ${Math.random() * -4 + 2}px ${Math.random() * 4 - 2}px 0 rgba(0, 229, 255, 0.7)
                `;
                setTimeout(() => {
                    heroTitle.style.textShadow = '';
                }, 100);
            }
        }, 2000);
    }
}


/* ═══════════════════════════════════════════
   TIMELINE CARDS — DYNAMIC FROM MANIFEST
   ═══════════════════════════════════════════ */
async function loadTimelinesFromManifest() {
    const grid = document.querySelector('.timelines-grid');
    if (!grid) return;

    try {
        const res = await fetch('/api/chapters');
        if (!res.ok) throw new Error('Manifest fetch failed');
        const manifest = await res.json();

        if (manifest.length > 0) {
            // Rebuild the timeline grid from server data
            grid.innerHTML = '';

            manifest.forEach(ch => {
                const isUnlocked = ch.unlocked;
                const card = document.createElement('article');
                card.className = `timeline-card ${isUnlocked ? 'unlocked' : 'locked'} reveal-item revealed`;
                card.id = `timeline-${ch.timelineId}`;

                card.innerHTML = `
                    <div class="timeline-number">${ch.timelineId}</div>
                    <div class="timeline-info">
                        <h3 class="timeline-name">${isUnlocked ? ch.title : '█'.repeat(ch.title.length)}</h3>
                        <p class="timeline-desc">${isUnlocked ? (ch.description || 'Access this timeline to read the transmission.') : '██████ ████ ██████████ ████████ ██████████████'}</p>
                        <span class="timeline-status ${isUnlocked ? 'status-unlocked' : 'status-locked'}">${isUnlocked ? '● UNLOCKED' : '🔒 LOCKED'}</span>
                    </div>
                    <div class="timeline-action">
                        ${isUnlocked
                            ? `<button class="timeline-btn" data-timeline="${ch.timelineId}">ACCESS →</button>`
                            : `<div class="locked-overlay"><span class="locked-text">ACCESS DENIED</span><span class="locked-sub">Requires synchronization</span></div>`
                        }
                    </div>
                `;
                grid.appendChild(card);
            });

            // ── Always append 2 ghost locked chapters ──
            const highestId = Math.max(...manifest.map(c => parseInt(c.timelineId)));
            for (let g = 1; g <= 2; g++) {
                const ghostId = String(highestId + g).padStart(2, '0');
                const ghost = document.createElement('article');
                ghost.className = 'timeline-card locked reveal-item revealed';
                ghost.id = `timeline-${ghostId}`;
                ghost.innerHTML = `
                    <div class="timeline-number">${ghostId}</div>
                    <div class="timeline-info">
                        <h3 class="timeline-name">█████████</h3>
                        <p class="timeline-desc">██████ ████ ██████████ ████████ ██████ ████████</p>
                        <span class="timeline-status status-locked">🔒 LOCKED</span>
                    </div>
                    <div class="timeline-action">
                        <div class="locked-overlay">
                            <span class="locked-text">ACCESS DENIED</span>
                            <span class="locked-sub">Classification: OMEGA</span>
                        </div>
                    </div>
                `;
                grid.appendChild(ghost);
            }
        }
        // If manifest is empty, keep the default hardcoded cards

    } catch (err) {
        console.log('No manifest found or server offline, using default timeline cards.');
    }

    // Now attach event listeners to all timeline cards (dynamic or static)
    initTimelineInteractions();
}

function initTimelineInteractions() {
    const modal = document.getElementById('chapter-modal');
    const modalClose = document.getElementById('modal-close');
    const modalTitle = document.getElementById('modal-title');
    const modalTag = document.getElementById('modal-tag');
    const modalBody = document.getElementById('modal-body');
    let typingInterval = null;

    // Unlocked timeline buttons
    const unlockBtns = document.querySelectorAll('.timeline-card.unlocked .timeline-btn');
    unlockBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const timeline = btn.getAttribute('data-timeline');
            showToast(`ACCESSING TIMELINE ${timeline}...`);
            
            const card = btn.closest('.timeline-card');
            const titleName = card.querySelector('.timeline-name').textContent;
            modalTitle.textContent = `TIMELINE ${timeline}: ${titleName}`;
            modalTag.textContent = `LOG://TIMELINE_${timeline} — DECRYPTING...`;
            
            modalBody.innerHTML = '<span style="color:var(--text-dim);">Connecting to temporal node...</span>';
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            try {
                const response = await fetch(`/chapters/timeline_${timeline}.json`);
                if (!response.ok) throw new Error('File not found');
                
                const data = await response.json();
                const text = data.content;
                
                modalTitle.textContent = `TIMELINE ${timeline}: ${data.title}`;
                modalTag.textContent = `LOG://TIMELINE_${timeline} — TRANSMISSION RECEIVED`;
                
                // Clear and type out
                modalBody.innerHTML = '';
                if (typingInterval) clearInterval(typingInterval);
                
                let i = 0;
                typingInterval = setInterval(() => {
                    if (text.charAt(i) === '\n') {
                        modalBody.innerHTML += '<br>';
                    } else {
                        modalBody.innerHTML += text.charAt(i);
                    }
                    i++;
                    if (i >= text.length) {
                        clearInterval(typingInterval);
                    }
                    // Auto-scroll to bottom as text types
                    modalBody.scrollTop = modalBody.scrollHeight;
                }, 8);

            } catch (err) {
                modalBody.innerHTML = `<span class="glitch-text" style="color:var(--neon-red);">ERROR: DATA CORRUPTED OR NOT FOUND.</span><br><br>The timeline data could not be retrieved. Transmit it via the <a href="/admin.html" style="color:var(--neon-blue);">Admin Terminal</a>.`;
            }
        });
    });

    // Close Modal
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            if (typingInterval) clearInterval(typingInterval);
        });
    }

    // Close on overlay click
    const overlay = modal ? modal.querySelector('.modal-overlay') : null;
    if (overlay) {
        overlay.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            if (typingInterval) clearInterval(typingInterval);
        });
    }

    // Locked timeline cards
    const lockedCards = document.querySelectorAll('.timeline-card.locked');
    lockedCards.forEach(card => {
        card.addEventListener('click', () => {
            showToast('⚠ ACCESS DENIED — Synchronization required');
            card.style.animation = 'glitchHover 0.3s steps(2)';
            card.addEventListener('animationend', () => {
                card.style.animation = '';
            }, { once: true });
        });
    });
}

// Toast notification
function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}


/* ═══════════════════════════════════════════
   HIDDEN SIGNAL
   ═══════════════════════════════════════════ */
function initHiddenSignal() {
    const hiddenMsg = document.getElementById('hidden-msg');
    const secretLink = document.getElementById('secret-link');

    if (hiddenMsg) {
        // Random intense flicker
        setInterval(() => {
            if (Math.random() > 0.7) {
                hiddenMsg.style.opacity = Math.random() * 0.3;
                setTimeout(() => {
                    hiddenMsg.style.opacity = '';
                }, 100 + Math.random() * 200);
            }
        }, 3000);
    }

    if (secretLink) {
        secretLink.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('SIGNAL TRACE INITIATED... ORIGIN UNKNOWN');
            document.body.style.filter = 'invert(1)';
            setTimeout(() => {
                document.body.style.filter = '';
            }, 150);
        });
    }
}


/* ═══════════════════════════════════════════
   AUDIO SYSTEM
   ═══════════════════════════════════════════ */
function initAudio() {
    const toggle = document.getElementById('audio-toggle');
    if (!toggle) return;

    let audioCtx = null;
    let isPlaying = false;
    let ambientOsc, lfoGain;

    toggle.addEventListener('click', () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (isPlaying) {
            stopAmbient();
        } else {
            startAmbient();
        }
    });

    function startAmbient() {
        if (!audioCtx) return;

        // Low frequency drone
        ambientOsc = audioCtx.createOscillator();
        ambientOsc.type = 'sine';
        ambientOsc.frequency.setValueAtTime(55, audioCtx.currentTime); // Low A

        // LFO for subtle pulsing
        const lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.15, audioCtx.currentTime);

        lfoGain = audioCtx.createGain();
        lfoGain.gain.setValueAtTime(0.003, audioCtx.currentTime);

        const masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.04, audioCtx.currentTime);

        // Second harmonic
        const osc2 = audioCtx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(82.5, audioCtx.currentTime);

        const gain2 = audioCtx.createGain();
        gain2.gain.setValueAtTime(0.015, audioCtx.currentTime);

        // Connect
        lfo.connect(lfoGain);
        lfoGain.connect(masterGain.gain);

        ambientOsc.connect(masterGain);
        osc2.connect(gain2);
        gain2.connect(masterGain);
        masterGain.connect(audioCtx.destination);

        ambientOsc.start();
        osc2.start();
        lfo.start();

        ambientOsc._lfo = lfo;
        ambientOsc._osc2 = osc2;
        ambientOsc._masterGain = masterGain;
        ambientOsc._gain2 = gain2;

        isPlaying = true;
        toggle.classList.add('active');
        toggle.querySelector('.audio-icon').textContent = '◉ AUDIO ON';

        // Random beep intervals
        scheduleBeep();
    }

    function stopAmbient() {
        if (ambientOsc) {
            ambientOsc.stop();
            ambientOsc._lfo.stop();
            ambientOsc._osc2.stop();
            ambientOsc = null;
        }
        isPlaying = false;
        toggle.classList.remove('active');
        toggle.querySelector('.audio-icon').textContent = '◉ AUDIO OFF';
    }

    function scheduleBeep() {
        if (!isPlaying || !audioCtx) return;

        const delay = 3000 + Math.random() * 8000;
        setTimeout(() => {
            if (!isPlaying || !audioCtx) return;

            const beep = audioCtx.createOscillator();
            beep.type = 'square';
            beep.frequency.setValueAtTime(800 + Math.random() * 400, audioCtx.currentTime);

            const beepGain = audioCtx.createGain();
            beepGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
            beepGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

            beep.connect(beepGain);
            beepGain.connect(audioCtx.destination);

            beep.start();
            beep.stop(audioCtx.currentTime + 0.15);

            scheduleBeep();
        }, delay);
    }
}


/* ═══════════════════════════════════════════
   SCREEN FLICKER EFFECT
   ═══════════════════════════════════════════ */
function initScreenFlicker() {
    setInterval(() => {
        if (Math.random() > 0.92) {
            const overlay = document.querySelector('.scanline-overlay');
            if (overlay) {
                overlay.style.background = `
                    repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        rgba(0, 229, 255, 0.06) 2px,
                        rgba(0, 229, 255, 0.06) 4px
                    )
                `;
                setTimeout(() => {
                    overlay.style.background = '';
                }, 80);
            }
        }
    }, 5000);

    // Random color shift on entire page (very subtle)
    setInterval(() => {
        if (Math.random() > 0.95) {
            document.body.style.filter = `hue-rotate(${Math.random() * 10 - 5}deg)`;
            setTimeout(() => {
                document.body.style.filter = '';
            }, 100);
        }
    }, 8000);
}
