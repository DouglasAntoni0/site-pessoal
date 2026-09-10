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

    // Track actual section positions, including changes caused by disclosures,
    // history navigation and responsive reflow. Schedule at most one read per frame.
    const sections = [...nav.querySelectorAll('a[href^="#"]')].map(link => ({
        link, section: document.getElementById(link.hash.slice(1))
    })).filter(item => item.section);
    let activeLink = null;
    let sectionFrame = 0;
    const updateCurrentSection = () => {
        sectionFrame = 0;
        // Native anchors combine the root padding and the section margin.
        // Include both so landing on an anchor immediately selects that section.
        const rootPadding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
        const sectionMargin = sections[0] ? parseFloat(getComputedStyle(sections[0].section).scrollMarginTop) || 0 : 0;
        const readingLine = Math.max(headerRow.getBoundingClientRect().bottom + 32, rootPadding + sectionMargin + 2);
        let current = sections[0];
        for (const item of sections) {
            if (item.section.getBoundingClientRect().top <= readingLine) current = item;
        }
        if (Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2) {
            current = sections[sections.length - 1];
        }
        if (current && current.link !== activeLink) {
            activeLink?.removeAttribute('aria-current');
            activeLink = current.link;
            activeLink.setAttribute('aria-current', 'location');
        }
    };
    const scheduleSectionUpdate = () => {
        if (!sectionFrame) sectionFrame = requestAnimationFrame(updateCurrentSection);
    };
    addEventListener('scroll', scheduleSectionUpdate, { passive: true });
    addEventListener('resize', scheduleSectionUpdate, { passive: true });
    addEventListener('hashchange', scheduleSectionUpdate);
    document.querySelectorAll('.collection-disclosure').forEach(disclosure => {
        disclosure.addEventListener('toggle', scheduleSectionUpdate);
    });
    updateCurrentSection();

    if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(([entry]) => {
            const height = Math.ceil(entry.borderBoxSize?.[0]?.blockSize || entry.contentRect.height);
            document.documentElement.style.setProperty('--header-row-height', `${height}px`);
        });
        observer.observe(headerRow);
        new ResizeObserver(scheduleSectionUpdate).observe(document.querySelector('main'));
    }
}
