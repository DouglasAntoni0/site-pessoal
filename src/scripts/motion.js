const DESKTOP_POINTER_QUERY = '(min-width: 961px) and (hover: hover) and (pointer: fine)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const SLOW_UPDATE_QUERY = '(update: slow)';

let frameId = 0;
let scrollDirty = true;
let pointerDirty = false;
let pointerEvent = null;
let activeRow = null;
let counterAnimations = [];

function animateElement(element, keyframes, options) {
    if (!element || typeof element.animate !== 'function') return;
    element.animate(keyframes, { fill: 'none', ...options });
}

function motionShouldBeReduced() {
    const saveData = Boolean(navigator.connection?.saveData);
    return window.matchMedia(REDUCED_MOTION_QUERY).matches
        || window.matchMedia(SLOW_UPDATE_QUERY).matches
        || saveData;
}

function syncMotionPreference() {
    const reduced = motionShouldBeReduced();
    document.documentElement.classList.toggle('motion-reduced', reduced);
    if (reduced) {
        document.getAnimations().forEach((animation) => animation.cancel());
        for (const element of document.querySelectorAll('[data-counter]')) {
            element.textContent = element.dataset.counter;
        }
        counterAnimations = [];
    }
    return reduced;
}

function initHeroMotion() {
    const sequence = [
        [document.querySelector('.hero-eyebrow'), 0, 380, 8],
        [document.querySelector('.hero-title'), 70, 560, 14],
        [document.querySelector('.hero-subtitle'), 180, 430, 10],
        [document.querySelector('.hero-paragraph'), 260, 430, 10],
        [document.querySelector('.hero-actions'), 340, 420, 8],
        [document.querySelector('.hero-proof'), 420, 430, 8]
    ];

    for (const [element, delay, duration, offset] of sequence) {
        animateElement(element, [
            { opacity: 0.78, transform: `translateY(${offset}px)` },
            { opacity: 1, transform: 'translateY(0)' }
        ], { duration, delay, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }

    animateElement(document.querySelector('.qa-command-center'), [
        { opacity: 0.76, transform: 'translateY(16px) scale(.985)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
    ], { duration: 680, delay: 210, easing: 'cubic-bezier(.16,1,.3,1)' });

    counterAnimations = [...document.querySelectorAll('[data-counter]')].map((element, index) => ({
        element,
        target: Number(element.dataset.counter),
        start: 0,
        duration: 650 + index * 90
    }));
    scheduleFrame();
}

function revealElement(element) {
    animateElement(element, [
        { opacity: 0.76, transform: 'translateY(26px) scale(.985)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
    ], { duration: 580, easing: 'cubic-bezier(.16,1,.3,1)' });

    if (!element.matches('.skill-group')) return;
    [...element.querySelectorAll('.skill-chip')].forEach((chip, index) => {
        animateElement(chip, [
            { opacity: 0.72, transform: 'translateY(9px) scale(.97)' },
            { opacity: 1, transform: 'translateY(0) scale(1)' }
        ], {
            duration: 380,
            delay: Math.min(index * 28, 280),
            easing: 'cubic-bezier(.2,.8,.2,1)'
        });
    });
}

function initSectionReveals() {
    const elements = [...document.querySelectorAll('.reveal')];
    if (!elements.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            observer.unobserve(entry.target);
            revealElement(entry.target);
        }
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.1 });

    elements.forEach((element) => observer.observe(element));
}

function resetCard(row) {
    if (!row) return;
    row.classList.remove('pointer-active');
    const content = row.querySelector('.project-content');
    if (!content) return;
    content.style.removeProperty('transform');
    content.style.removeProperty('--spot-x');
    content.style.removeProperty('--spot-y');
    content.style.removeProperty('will-change');
}

function renderPointer() {
    pointerDirty = false;
    const desktopPointer = window.matchMedia(DESKTOP_POINTER_QUERY).matches;
    if (!desktopPointer || !pointerEvent) {
        resetCard(activeRow);
        activeRow = null;
        return;
    }

    const row = pointerEvent.target.closest?.('.project-row');
    if (row !== activeRow) {
        resetCard(activeRow);
        activeRow = row;
    }
    if (!row) return;

    const content = row.querySelector('.project-content');
    const rect = content?.getBoundingClientRect();
    if (!content || !rect?.width || !rect?.height) return;

    const x = Math.max(0, Math.min(1, (pointerEvent.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (pointerEvent.clientY - rect.top) / rect.height));
    const rotateY = (x - 0.5) * 8;
    const rotateX = (0.5 - y) * 8;
    content.style.setProperty('--spot-x', `${Math.round(x * 100)}%`);
    content.style.setProperty('--spot-y', `${Math.round(y * 100)}%`);
    content.style.setProperty('will-change', 'transform');
    content.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    row.classList.add('pointer-active');
}

function renderScroll() {
    scrollDirty = false;
    const root = document.documentElement;
    const scrollRange = Math.max(1, root.scrollHeight - innerHeight);
    const pageProgress = Math.max(0, Math.min(1, scrollY / scrollRange));
    document.getElementById('reading-progress-bar')?.style.setProperty('transform', `scaleX(${pageProgress.toFixed(4)})`);

    const lifecycle = document.querySelector('.quality-lifecycle');
    const progress = document.getElementById('lifecycle-progress');
    if (!lifecycle || !progress) return;
    const rect = lifecycle.getBoundingClientRect();
    const lifecycleProgress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
    progress.style.setProperty('--lifecycle-progress', lifecycleProgress.toFixed(4));
}

function renderCounters(now) {
    if (!counterAnimations.length) return false;
    counterAnimations = counterAnimations.filter((counter) => {
        if (!counter.start) counter.start = now;
        const elapsed = Math.min(1, (now - counter.start) / counter.duration);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        counter.element.textContent = String(Math.round(counter.target * eased));
        if (elapsed < 1) return true;
        counter.element.textContent = String(counter.target);
        return false;
    });
    return counterAnimations.length > 0;
}

function renderFrame(now) {
    frameId = 0;
    if (scrollDirty) renderScroll();
    if (pointerDirty) renderPointer();
    if (renderCounters(now)) scheduleFrame();
}

function scheduleFrame() {
    if (!frameId) frameId = requestAnimationFrame(renderFrame);
}

function initFrameScheduler() {
    addEventListener('scroll', () => {
        scrollDirty = true;
        scheduleFrame();
    }, { passive: true });

    addEventListener('resize', () => {
        scrollDirty = true;
        pointerDirty = true;
        scheduleFrame();
    }, { passive: true });

    document.addEventListener('pointermove', (event) => {
        pointerEvent = event;
        pointerDirty = true;
        scheduleFrame();
    }, { passive: true });

    document.addEventListener('pointerout', (event) => {
        if (event.relatedTarget) return;
        pointerEvent = null;
        pointerDirty = true;
        scheduleFrame();
    });

    document.addEventListener('visibilitychange', () => {
        document.documentElement.classList.toggle('motion-paused', document.hidden);
        if (!document.hidden) {
            scrollDirty = true;
            scheduleFrame();
        }
    });

    scheduleFrame();
}

export function initMotion() {
    const reducedQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const slowQuery = window.matchMedia(SLOW_UPDATE_QUERY);
    const reduced = syncMotionPreference();

    initFrameScheduler();
    if (!reduced) {
        initHeroMotion();
        initSectionReveals();
    }

    const handlePreferenceChange = () => syncMotionPreference();
    reducedQuery.addEventListener?.('change', handlePreferenceChange);
    slowQuery.addEventListener?.('change', handlePreferenceChange);
    navigator.connection?.addEventListener?.('change', handlePreferenceChange);
}
