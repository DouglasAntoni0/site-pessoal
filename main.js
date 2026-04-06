document.addEventListener('DOMContentLoaded', () => {

    /** 1. INJEÇÃO DINÂMICA (Baseada no projects-data.js) **/
    const projectsContainer = document.getElementById('projects-container');
    const modalsContainer = document.getElementById('modals-container');

    projectsData.forEach(p => {
        // Injeção de Card na Timeline
        const reverseClass = p.reverseBorder ? 'reversed' : '';
        const tagsHtml = p.tags.map(tag => `<span class="min-tag">${tag}</span>`).join('');
        
        projectsContainer.innerHTML += `
            <article class="project-row ${reverseClass} gs-reveal" data-tilt data-tilt-max="5" data-tilt-speed="400" data-tilt-glare="true" data-tilt-max-glare="0.2">
                <div class="project-content glass-panel tilt-glow">
                    <div class="project-info">
                        <h3>${p.number}. ${p.title}</h3>
                        <div class="card-tags">${tagsHtml}</div>
                        <p>${p.summary}</p>
                        <button class="btn-text-link trigger-modal" data-modal="${p.id}">Ver Detalhes <i class="ph ph-arrow-right"></i></button>
                    </div>
                    <div class="project-visual ${p.visualClass}">
                        <div class="animated-gradient-overlay"></div>
                        <i class="ph ${p.iconClass}"></i>
                    </div>
                </div>
            </article>
        `;

        // Injeção do Modal
        const toolsHtml = p.tools.map(tool => `<span class="modal-badge"><i class="ph-fill ph-check-circle"></i> ${tool}</span>`).join('');
        
        modalsContainer.innerHTML += `
            <div class="glass-modal" id="${p.id}">
                <button class="close-modal"><i class="ph ph-x"></i></button>
                <div class="modal-body">
                    <h2 class="stagger-el">${p.title}</h2>
                    <div class="modal-tech stagger-el">${toolsHtml}</div>
                    <p class="modal-desc stagger-el">${p.desc}</p>
                    <div class="code-container stagger-el">
<pre><code class="language-javascript">${p.code}</code></pre>
                    </div>
                    <a href="${p.repo}" target="_blank" class="btn btn-primary btn-modal stagger-el">
                        <i class="ph-fill ph-github-logo"></i> Acessar Repositório no GitHub
                    </a>
                </div>
            </div>
        `;
    });

    /** 2. INICIALIZAÇÃO DE BIBLIOTECAS (PÓS-INJEÇÃO) **/
    
    // Highlight.js
    hljs.highlightAll();

    // Vanilla Tilt Reiniciar nos novos inputs
    VanillaTilt.init(document.querySelectorAll("[data-tilt]"));

    /** 3. ENGINE AURORA BOREAL FÍSICA **/
    
    // Para não quebrar caso GSAP altere transforms originais, setamos via var CSS ou passamos positions absolutos
    // Usaremos as propriedades X/Y simples nativas para evitar lag de memória
    const orbs = document.querySelectorAll('.aurora-orb');
    let orbTweenEnabled = true;
    
    document.addEventListener('mousemove', (e) => {
        if(!orbTweenEnabled) return;
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        orbs.forEach((orb, index) => {
            const speed = (index + 1) * 35;
            const moveX = (x * speed) - (speed / 2);
            const moveY = (y * speed) - (speed / 2);
            
            // GSAP é hiper otimizado comparado à style.transform manual
            gsap.to(orb, { x: moveX, y: moveY, duration: 2, ease: "power2.out" });
        });
    });

    /** 4. GSAP & SCROLLTRIGGER INITIALIZATION **/
    gsap.registerPlugin(ScrollTrigger);

    /* --- SplitText Manual Agresivo --- */
    try {
        const splitTexts = document.querySelectorAll('.split-text');
        splitTexts.forEach(el => {
            const words = el.innerText.split(' ');
            el.innerHTML = words.map(w => 
                `<span style="display:inline-block; overflow:hidden; vertical-align: bottom; padding-top: 10px;">
                    <span class="word" style="display:inline-block; transform: translateY(110%); opacity: 0;">${w}</span>
                </span>`
            ).join(' ');
        });

        // Garantir que todos os outros elementos do Hero comecem com opacidade 0 pra GSAP
        gsap.set('.hero-subtitle, .hero-paragraph, .hero-actions', { opacity: 0, y: 30 });

        const tlHero = gsap.timeline({ delay: 0.1 });
        tlHero.to('.hero-title .word', {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.05,
            ease: "back.out(1.5)",
            clearProps: "all"
        })
        .to('.hero-subtitle', 
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", clearProps: "all" }, 
            "-=0.5"
        )
        .to('.hero-paragraph', 
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", clearProps: "all" }, 
            "-=0.6"
        )
        .to('.hero-actions', 
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", clearProps: "all" }, 
            "-=0.6"
        );
    } catch(err) {
        console.error("Critical GSAP Error on Hero", err);
        document.querySelectorAll('.word, .hero-subtitle, .hero-paragraph, .hero-actions').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }

    // Global Scroll Reveals (Elements GS-REVEAL)
    document.querySelectorAll('.gs-reveal, .gs-animate-up').forEach((elem) => {
        // Ignora elementos que já fomos animar antes ou separadamente (como herdados)
        if (elem.closest('.hero-section')) return; 
        
        gsap.fromTo(elem, 
            { y: 100, opacity: 0, scale: 0.95 },
            { 
                y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "expo.out",
                scrollTrigger: {
                    trigger: elem,
                    start: "top 85%",
                    toggleActions: "play none none none"
                }
            }
        );
    });

    /** 5. MAGNETIC PHYSICS BUTTONS E BLOCOS **/
    document.querySelectorAll('.magnetic-btn, .magnetic-menu').forEach(elem => {
        elem.addEventListener('mousemove', (e) => {
            const rect = elem.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            const strength = elem.classList.contains('magnetic-menu') ? 12 : 25;

            gsap.to(elem, {
                x: x / rect.width * strength,
                y: y / rect.height * strength,
                duration: 0.3,
                ease: "power2.out",
                transformPerspective: 500
            });
            
            const text = elem.querySelector('span:not(.btn-glow), .contact-info');
            if (text) {
                gsap.to(text, {
                    x: x / rect.width * (strength / 1.5),
                    y: y / rect.height * (strength / 1.5),
                    duration: 0.3,
                    ease: "power2.out"
                });
            }
        });

        elem.addEventListener('mouseleave', () => {
            gsap.to(elem, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
            const text = elem.querySelector('span:not(.btn-glow), .contact-info');
            if (text) {
                gsap.to(text, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
            }
        });
    });

    /** 6. MODAL GLASSMORPHISM LÓGICA & STAGGER **/
    const modalOverlay = document.getElementById('modal-overlay');
    const body = document.body;

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if(!modal) return;
        
        modalOverlay.classList.add('active');
        modal.classList.add('active');
        body.classList.add('modal-open');

        const staggerEls = modal.querySelectorAll('.stagger-el');
        gsap.set(staggerEls, { y: 40, opacity: 0, scale: 0.98 });
        
        gsap.to(staggerEls, {
            y: 0, opacity: 1, scale: 1,
            duration: 0.7, stagger: 0.15, ease: "back.out(1.5)", delay: 0.1
        });
    }

    function closeAllModals() {
        document.querySelectorAll('.glass-modal').forEach(m => m.classList.remove('active'));
        modalOverlay.classList.remove('active');
        body.classList.remove('modal-open');
    }

    // Bind dinamico pois botoes foram injetados pós-DOM!
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.trigger-modal');
        if(btn) {
            const modalId = btn.getAttribute('data-modal');
            openModal(modalId);
        }
        
        const closeBtn = e.target.closest('.close-modal');
        if(closeBtn) {
            closeAllModals();
        }
    });

    modalOverlay.addEventListener('click', closeAllModals);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllModals(); });

});
