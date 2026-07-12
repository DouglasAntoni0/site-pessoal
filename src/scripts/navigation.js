const MOBILE_QUERY = '(max-width: 960px)';

export function initNavigation() {
    const header = document.querySelector('.glass-header');
    const headerRow = document.querySelector('.header-row');
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('primary-nav');
    if (!header || !headerRow || !toggle || !nav) return;

    const mobile = window.matchMedia(MOBILE_QUERY);

    const closeMenu = ({ restoreFocus = false } = {}) => {
        toggle.setAttribute('aria-expanded', 'false');
        if (mobile.matches) nav.hidden = true;
        if (restoreFocus) toggle.focus({ preventScroll: true });
    };

    const syncLayout = () => {
        toggle.setAttribute('aria-expanded', 'false');
        nav.hidden = mobile.matches;
    };

    toggle.addEventListener('click', () => {
        const willOpen = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(willOpen));
        nav.hidden = !willOpen;
        if (willOpen) {
            nav.querySelector('a')?.focus({ preventScroll: true });
        }
    });

    nav.addEventListener('click', (event) => {
        if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('click', (event) => {
        if (!mobile.matches || nav.hidden || header.contains(event.target)) return;
        closeMenu();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && mobile.matches && !nav.hidden) {
            event.preventDefault();
            closeMenu({ restoreFocus: true });
        }
    });

    mobile.addEventListener?.('change', syncLayout);
    syncLayout();

    if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(([entry]) => {
            const height = Math.ceil(entry.borderBoxSize?.[0]?.blockSize || entry.contentRect.height);
            document.documentElement.style.setProperty('--header-row-height', `${height}px`);
        });
        observer.observe(headerRow);
    }
}
