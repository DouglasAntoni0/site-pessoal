document.addEventListener('DOMContentLoaded', () => {
    const mainProjectsContainer = document.getElementById('projects-container');
    const volunteerContainer = document.getElementById('volunteer-container');
    const modalsContainer = document.getElementById('modals-container');
    const modalOverlay = document.getElementById('modal-overlay');
    const body = document.body;
    const hasGsap = typeof gsap !== 'undefined';
    const hasScrollTrigger = typeof ScrollTrigger !== 'undefined';
    const hasHighlight = typeof hljs !== 'undefined';
    const hasVanillaTilt = typeof VanillaTilt !== 'undefined';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const safeProjectsData = typeof projectsData !== 'undefined' && Array.isArray(projectsData) ? projectsData : [];
    let lastFocusedElement = null;

    const escapeHtml = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const safeClass = (value) => String(value ?? '').replace(/[^\w -]/g, '').trim();

    function renderProjects() {
        if (!mainProjectsContainer || !modalsContainer) return;

        safeProjectsData.forEach((project) => {
            const reverseClass = project.reverseBorder ? 'reversed' : '';
            const tagsHtml = (project.tags || [])
                .map((tag) => `<span class="min-tag">${escapeHtml(tag)}</span>`)
                .join('');
            const toolsHtml = (project.tools || [])
                .map((tool) => `<span class="modal-badge"><i class="ph-fill ph-check-circle" aria-hidden="true"></i>${escapeHtml(tool)}</span>`)
                .join('');
            const icon = safeClass(project.iconClass || 'ph-terminal-window');
            const visualClass = safeClass(project.visualClass || 'default-bg');
            const modalId = escapeHtml(project.id);
            const titleId = `${modalId}-title`;

            const cardHtml = `
                <article class="project-row ${reverseClass} gs-reveal" data-tilt data-tilt-max="5" data-tilt-speed="400" data-tilt-glare="true" data-tilt-max-glare="0.2">
                    <div class="project-content glass-panel tilt-glow">
                        <div class="project-info">
                            <h3>${escapeHtml(project.number)}. ${escapeHtml(project.title)}</h3>
                            <div class="card-tags">${tagsHtml}</div>
                            <p>${escapeHtml(project.summary)}</p>
                            <button type="button" class="btn-text-link trigger-modal" data-modal="${modalId}" aria-controls="${modalId}" aria-haspopup="dialog">
                                Ver Detalhes <i class="ph ph-arrow-right" aria-hidden="true"></i>
                            </button>
                        </div>
                        <div class="project-visual ${visualClass}" aria-hidden="true">
                            <div class="animated-gradient-overlay"></div>
                            <i class="ph ${icon}"></i>
                        </div>
                    </div>
                </article>
            `;

            if (project.category === 'volunteer' && volunteerContainer) {
                volunteerContainer.insertAdjacentHTML('beforeend', cardHtml);
            } else {
                mainProjectsContainer.insertAdjacentHTML('beforeend', cardHtml);
            }

            modalsContainer.insertAdjacentHTML('beforeend', `
                <div class="glass-modal" id="${modalId}" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="${titleId}" tabindex="-1">
                    <button type="button" class="close-modal" aria-label="Fechar detalhes do projeto">
                        <i class="ph ph-x" aria-hidden="true"></i>
                    </button>
                    <div class="modal-body">
                        <h2 class="stagger-el" id="${titleId}">${escapeHtml(project.title)}</h2>
                        <p class="modal-desc stagger-el">${project.desc || ''}</p>
                        <div class="modal-stack stagger-el">${toolsHtml}</div>
                        <div class="code-container stagger-el">
                            <pre><code class="language-javascript">${escapeHtml(project.code)}</code></pre>
                        </div>
                        <a href="${escapeHtml(project.repo)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-modal stagger-el">
                            <i class="ph-fill ph-github-logo" aria-hidden="true"></i> Acessar Repositório
                        </a>
                    </div>
                </div>
            `);
        });
    }

    function splitTextIntoWords(element) {
        const text = element.textContent.trim().replace(/\s+/g, ' ');
        const fragment = document.createDocumentFragment();

        element.textContent = '';
        text.split(' ').forEach((word, index) => {
            if (index > 0) fragment.append(' ');

            const mask = document.createElement('span');
            mask.style.display = 'inline-block';
            mask.style.overflow = 'hidden';
            mask.style.verticalAlign = 'bottom';
            mask.style.paddingTop = '10px';

            const inner = document.createElement('span');
            inner.className = 'word';
            inner.textContent = word;
            inner.style.display = 'inline-block';
            inner.style.transform = 'translateY(110%)';
            inner.style.opacity = '0';

            mask.append(inner);
            fragment.append(mask);
        });

        element.append(fragment);
    }

    function revealEverything() {
        document.querySelectorAll('.word, .hero-subtitle, .hero-paragraph, .hero-actions, .stagger-el').forEach((element) => {
            element.style.opacity = '1';
            element.style.transform = 'none';
        });
    }

    function initAnimations() {
        if (!hasGsap || prefersReducedMotion) {
            revealEverything();
            return;
        }

        try {
            if (hasScrollTrigger) {
                gsap.registerPlugin(ScrollTrigger);
            }

            document.querySelectorAll('.split-text').forEach(splitTextIntoWords);
            gsap.set('.hero-subtitle, .hero-paragraph, .hero-actions', { opacity: 0, y: 30 });

            gsap.timeline({ 
                delay: 0.1,
                onComplete: () => {
                    document.querySelectorAll('.hero-title span').forEach(span => {
                        span.style.overflow = 'visible';
                    });
                }
            })
                .to('.hero-title .word', {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    stagger: 0.05,
                    ease: 'back.out(1.5)',
                    clearProps: 'transform,opacity'
                })
                .to('.hero-subtitle',
                    { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity' },
                    '-=0.5'
                )
                .to('.hero-paragraph',
                    { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity' },
                    '-=0.6'
                )
                .to('.hero-actions',
                    { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity' },
                    '-=0.6'
                );

            if (hasScrollTrigger) {
                document.querySelectorAll('.gs-reveal, .gs-animate-up').forEach((element) => {
                    if (element.closest('.hero-section')) return;

                    gsap.fromTo(element,
                        { y: 80, opacity: 0, scale: 0.97 },
                        {
                            y: 0,
                            opacity: 1,
                            scale: 1,
                            duration: 1,
                            ease: 'expo.out',
                            scrollTrigger: {
                                trigger: element,
                                start: 'top 86%',
                                toggleActions: 'play none none none'
                            }
                        }
                    );
                });
            }
        } catch (error) {
            console.error('Animation fallback applied', error);
            revealEverything();
        }
    }

    function initHoverEffects() {
        if (!hasGsap || !hasFinePointer || prefersReducedMotion) return;

        document.addEventListener('mousemove', (event) => {
            const x = event.clientX / window.innerWidth;
            const y = event.clientY / window.innerHeight;

            document.querySelectorAll('.aurora-orb').forEach((orb, index) => {
                const speed = (index + 1) * 35;
                const moveX = (x * speed) - (speed / 2);
                const moveY = (y * speed) - (speed / 2);
                gsap.to(orb, { x: moveX, y: moveY, duration: 2, ease: 'power2.out' });
            });
        });

        document.querySelectorAll('.magnetic-btn, .magnetic-menu').forEach((element) => {
            element.addEventListener('mousemove', (event) => {
                const rect = element.getBoundingClientRect();
                const x = event.clientX - rect.left - rect.width / 2;
                const y = event.clientY - rect.top - rect.height / 2;
                const strength = element.classList.contains('magnetic-menu') ? 12 : 25;
                const text = element.querySelector('span:not(.btn-glow), .contact-info');

                gsap.to(element, {
                    x: x / rect.width * strength,
                    y: y / rect.height * strength,
                    duration: 0.3,
                    ease: 'power2.out',
                    transformPerspective: 500
                });

                if (text) {
                    gsap.to(text, {
                        x: x / rect.width * (strength / 1.5),
                        y: y / rect.height * (strength / 1.5),
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                }
            });

            element.addEventListener('mouseleave', () => {
                const text = element.querySelector('span:not(.btn-glow), .contact-info');
                gsap.to(element, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
                if (text) {
                    gsap.to(text, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
                }
            });
        });

        if (hasVanillaTilt) {
            VanillaTilt.init(document.querySelectorAll('[data-tilt]'));
        }
    }

    function getFocusableElements(modal) {
        return [...modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
            .filter((element) => element.offsetParent !== null);
    }

    function openModal(modalId) {
        if (!modalOverlay) return;

        const modal = document.getElementById(modalId);
        if (!modal) return;

        closeAllModals(false);
        lastFocusedElement = document.activeElement;
        modalOverlay.classList.add('active');
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        body.classList.add('modal-open');

        const staggerElements = modal.querySelectorAll('.stagger-el');
        if (hasGsap && !prefersReducedMotion) {
            gsap.set(staggerElements, { y: 32, opacity: 0, scale: 0.98 });
            gsap.to(staggerElements, {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.55,
                stagger: 0.08,
                ease: 'back.out(1.35)',
                delay: 0.05
            });
        }

        const closeButton = modal.querySelector('.close-modal');
        const focusModalControl = () => (closeButton || modal).focus({ preventScroll: true });
        focusModalControl();
        window.requestAnimationFrame(focusModalControl);
        window.setTimeout(focusModalControl, 80);
    }

    function closeAllModals(restoreFocus = true) {
        document.querySelectorAll('.glass-modal.active').forEach((modal) => {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        });

        if (modalOverlay) {
            modalOverlay.classList.remove('active');
        }

        body.classList.remove('modal-open');

        if (restoreFocus && lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus({ preventScroll: true });
        }
    }

    function initModalEvents() {
        document.addEventListener('click', (event) => {
            const trigger = event.target.closest('.trigger-modal');
            if (trigger) {
                event.preventDefault();
                openModal(trigger.getAttribute('data-modal'));
                return;
            }

            if (event.target.closest('.close-modal')) {
                closeAllModals();
            }
        });

        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => closeAllModals());
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeAllModals();
                return;
            }

            const activeModal = document.querySelector('.glass-modal.active');
            if (event.key !== 'Tab' || !activeModal) return;

            const focusableElements = getFocusableElements(activeModal);
            if (focusableElements.length === 0) {
                event.preventDefault();
                activeModal.focus();
                return;
            }

            const first = focusableElements[0];
            const last = focusableElements[focusableElements.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });
    }

    renderProjects();

    if (hasHighlight) {
        hljs.highlightAll();
    }

    initAnimations();
    initHoverEffects();
    initModalEvents();
});
