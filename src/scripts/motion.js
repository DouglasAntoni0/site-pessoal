const DESKTOP_MOTION_QUERY = '(min-width: 961px) and (hover: hover) and (pointer: fine)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function animateElement(element, keyframes, options) {
    if (!element || typeof element.animate !== 'function') return;
    element.animate(keyframes, { fill: 'none', ...options });
}

function initHeroMotion() {
    const title = document.querySelector('.hero-title');
    const subtitle = document.querySelector('.hero-subtitle');
    const paragraph = document.querySelector('.hero-paragraph');
    const actions = document.querySelector('.hero-actions');

    animateElement(title, [
        { opacity: 0.78, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });

    for (const [element, delay] of [[subtitle, 110], [paragraph, 180], [actions, 250]]) {
        animateElement(element, [
            { opacity: 0.82, transform: 'translateY(10px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 360, delay, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
}

function initSectionReveals() {
    const elements = [...document.querySelectorAll('.reveal')];
    if (!elements.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            observer.unobserve(entry.target);
            animateElement(entry.target, [
                { opacity: 0.8, transform: 'translateY(22px) scale(.99)' },
                { opacity: 1, transform: 'translateY(0) scale(1)' }
            ], { duration: 460, easing: 'cubic-bezier(.2,.8,.2,1)' });
        }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    elements.forEach((element) => observer.observe(element));
}

function initPointerEffects(desktopMotion) {
    let frame = 0;
    let pointerEvent = null;
    let activeRow = null;

    const resetCard = (row) => {
        if (!row) return;
        row.classList.remove('pointer-active');
        const content = row.querySelector('.project-content');
        if (content) {
            content.style.removeProperty('transform');
            content.style.removeProperty('--spot-x');
            content.style.removeProperty('--spot-y');
        }
    };

    const render = () => {
        frame = 0;
        if (!desktopMotion.matches || !pointerEvent) {
            resetCard(activeRow);
            activeRow = null;
            return;
        }

        const row = pointerEvent.target.closest('.project-row');
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
        const rotateY = (x - 0.5) * 5;
        const rotateX = (0.5 - y) * 5;
        content.style.setProperty('--spot-x', `${Math.round(x * 100)}%`);
        content.style.setProperty('--spot-y', `${Math.round(y * 100)}%`);
        content.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
        row.classList.add('pointer-active');
    };

    document.addEventListener('pointermove', (event) => {
        pointerEvent = event;
        if (!frame) frame = requestAnimationFrame(render);
    }, { passive: true });

    document.addEventListener('pointerout', (event) => {
        if (event.relatedTarget) return;
        pointerEvent = null;
        if (!frame) frame = requestAnimationFrame(render);
    });

    desktopMotion.addEventListener?.('change', () => {
        pointerEvent = null;
        if (!frame) frame = requestAnimationFrame(render);
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) return;
        pointerEvent = null;
        resetCard(activeRow);
        activeRow = null;
    });
}

export function initMotion() {
    const desktopMotion = window.matchMedia(DESKTOP_MOTION_QUERY);
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    if (desktopMotion.matches && !reducedMotion.matches) {
        initHeroMotion();
        initSectionReveals();
    }
    if (!reducedMotion.matches) initPointerEffects(desktopMotion);
}
