document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Initialize Syntax Highlighting
    hljs.highlightAll();

    // 2. Aurora Boreal Mouse Interactivity (Parallax)
    const orbs = document.querySelectorAll('.aurora-orb');
    
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        orbs.forEach((orb, index) => {
            const speed = (index + 1) * 35; // Incrementada volatilidade
            const moveX = (x * speed) - (speed / 2);
            const moveY = (y * speed) - (speed / 2);
            
            orb.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    });

    // 3. GSAP & ScrollTrigger Initialization
    gsap.registerPlugin(ScrollTrigger);

    /* --- Aggressive Text Reveal (SplitText Manual) --- */
    const splitTexts = document.querySelectorAll('.split-text');
    let delayReveal = 0.2; // Delay inicial do Hero

    splitTexts.forEach(el => {
        // Separação agressiva palavra por palavra ou letra por letra
        const words = el.innerText.split(' ');
        el.innerHTML = words.map(w => 
            `<span style="display:inline-block; overflow:hidden; vertical-align: bottom;">
                <span class="word" style="display:inline-block; transform: translateY(110%); opacity: 0;">${w}</span>
            </span>`
        ).join(' ');

        // Animação das palavras explodindo de baixo pra cima
        gsap.to(el.querySelectorAll('.word'), {
            y: "0%",
            opacity: 1,
            duration: 1,
            stagger: 0.1, // O segredo da agressividade
            ease: "back.out(1.7)", // Back ease causa o rebote agressivo
            delay: delayReveal
        });
    });

    // Hero Other Elements Reveal
    const heroBadge = document.querySelector('.hero-badge');
    const heroPara = document.querySelector('.hero-paragraph');
    const heroBtns = document.querySelector('.hero-actions');

    const tlHero = gsap.timeline();
    
    tlHero.fromTo(heroBadge, 
        { y: -30, opacity: 0, scale: 0.8 }, 
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(2)", delay: 0.1 }
    )
    .fromTo(heroPara, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, 
        "+=1.0" // Espera a cascata de texto acabar +-
    )
    .fromTo(heroBtns, 
        { y: 20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, 
        "-=0.6"
    );

    // Global Scroll Reveals (Todos os Elementos gs-reveal)
    const revealElements = document.querySelectorAll('.gs-reveal');
    revealElements.forEach((elem) => {
        gsap.fromTo(elem, 
            { y: 100, opacity: 0, scale: 0.95 },
            { 
                y: 0, 
                opacity: 1, 
                scale: 1,
                duration: 1.2, 
                ease: "expo.out",
                scrollTrigger: {
                    trigger: elem,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    });

    // 4. Magnetic Element Logic Aprimorado
    const magneticElements = document.querySelectorAll('.magnetic-btn, .magnetic-menu');
    
    magneticElements.forEach(elem => {
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

    // 5. Modal Logic com Animação Stagger Agressiva
    const modalTriggers = document.querySelectorAll('.trigger-modal');
    const closeBtns = document.querySelectorAll('.close-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const body = document.body;

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        
        // Exibe overlay e modal wrapper
        modalOverlay.classList.add('active');
        modal.classList.add('active');
        body.classList.add('modal-open');

        // Seleciona todos os stagger-el dentro Deste modal e aplica o cascata
        const staggerEls = modal.querySelectorAll('.stagger-el');
        
        // Reseta os elementos antes para garantir sempre o trigger do stagger
        gsap.set(staggerEls, { y: 40, opacity: 0, scale: 0.98 });
        
        // Roda a animação de cascata
        gsap.to(staggerEls, {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.7,
            stagger: 0.15, // Cascata element por element
            ease: "back.out(1.5)",
            delay: 0.1 // atraso leve pra esperar o vidro renderizar
        });
    }

    function closeAllModals() {
        const modals = document.querySelectorAll('.glass-modal');
        modals.forEach(m => m.classList.remove('active'));
        modalOverlay.classList.remove('active');
        body.classList.remove('modal-open');
    }

    modalTriggers.forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            openModal(modalId);
        });
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    modalOverlay.addEventListener('click', closeAllModals);
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });

});
