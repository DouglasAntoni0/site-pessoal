function focusableElements(modal) {
    return [...modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.offsetParent !== null);
}

export function initModals(loadProjects) {
    const overlay = document.getElementById('modal-overlay');
    const projectModal = document.getElementById('project-modal');
    const certificateModal = document.getElementById('certificate-viewer-modal');
    const projectTitle = document.getElementById('project-modal-title');
    const projectDescription = document.getElementById('project-modal-description');
    const projectTools = document.getElementById('project-modal-tools');
    const projectCode = document.getElementById('project-modal-code');
    const projectLink = document.getElementById('project-modal-link');
    const projectCase = document.getElementById('project-modal-case');
    const certificateTitle = document.getElementById('certificate-modal-title');
    const certificateSchool = document.getElementById('certificate-modal-school');
    const certificateImage = document.getElementById('certificate-modal-image');
    const certificateOpen = document.getElementById('certificate-modal-open');
    const certificateStatus = document.getElementById('certificate-modal-status');
    if (!overlay || !projectModal || !certificateModal) return;

    // Native links work even when this enhancement cannot run.
    for (const trigger of document.querySelectorAll('.trigger-modal, .certification-view-btn')) {
        trigger.setAttribute('role', 'button');
        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.setAttribute('aria-controls', trigger.matches('.trigger-modal') ? 'project-modal' : 'certificate-viewer-modal');
        if (trigger.matches('.trigger-modal')) trigger.textContent = 'Ver detalhes';
        trigger.addEventListener('keydown', event => {
            if (event.key !== ' ') return;
            event.preventDefault();
            trigger.click();
        });
    }

    let lastFocusedElement = null;
    let focusFrame = 0;
    let projectRequest = 0;
    const background = [...document.querySelectorAll('.glass-header, main, .skip-link')];

    const activeModal = () => document.querySelector('.glass-modal.active');

    const closeAll = ({ restoreFocus = true } = {}) => {
        projectRequest += 1;
        cancelAnimationFrame(focusFrame);
        background.forEach(element => { element.inert = false; });
        if (restoreFocus && lastFocusedElement instanceof HTMLElement) {
            lastFocusedElement.focus({ preventScroll: true });
        } else if (document.activeElement?.closest('.glass-modal')) {
            document.activeElement.blur();
        }
        for (const modal of document.querySelectorAll('.glass-modal.active')) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            modal.inert = true;
        }
        overlay.classList.remove('active');
        document.body.classList.remove('modal-open');
    };

    const openModal = (modal, trigger) => {
        closeAll({ restoreFocus: false });
        lastFocusedElement = trigger instanceof HTMLElement ? trigger : document.activeElement;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        modal.inert = false;
        overlay.classList.add('active');
        document.body.classList.add('modal-open');
        const control = modal.querySelector('.close-modal') || modal;
        background.forEach(element => { element.inert = true; });
        focusFrame = requestAnimationFrame(() => {
            if (!modal.classList.contains('active')) return;
            // Firefox needs the formerly hidden dialog laid out before accepting focus.
            modal.getBoundingClientRect();
            control.focus({ preventScroll: true });
        });
    };

    const populateProject = (project) => {
        projectTitle.textContent = project.title;
        projectDescription.replaceChildren(...project.description.map((paragraph) => {
            const element = document.createElement('p');
            element.textContent = paragraph;
            return element;
        }));
        projectTools.replaceChildren(...project.tools.map((tool) => {
            const badge = document.createElement('span');
            badge.className = 'modal-badge';
            badge.textContent = tool;
            return badge;
        }));
        projectCode.textContent = project.code;
        projectCode.closest('.code-container').hidden = false;
        projectLink.href = project.repoUrl;
        projectCase.replaceChildren();
        projectCase.hidden = !project.caseStudy;
        if (project.caseStudy) {
            const study = project.caseStudy;
            for (const [label, content] of [['Problema', study.problem], ['Minha contribuição', study.contribution], ['Resultado verificado', study.result]]) {
                const heading = document.createElement('h3');
                heading.textContent = label;
                const paragraph = document.createElement('p');
                paragraph.textContent = content;
                projectCase.append(heading, paragraph);
            }
            const figure = document.createElement('figure');
            const img = document.createElement('img');
            img.src = study.image;
            img.alt = study.imageAlt;
            img.width = 720;
            img.height = 280;
            const caption = document.createElement('figcaption');
            caption.textContent = 'Resumo visual dos dados da execução indicada. ' + study.scope;
            figure.append(img, caption);
            projectCase.append(figure);
            for (const [label, href] of [['Ver execução no GitHub', study.runUrl], ['Consultar teste de origem', study.sourceUrl]]) {
                const link = document.createElement('a');
                link.textContent = label;
                link.href = href;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                projectCase.append(link);
            }
        }
    };

    const populateCertificate = (trigger) => {
        const image = trigger.dataset.certificateImage;
        const preview = trigger.dataset.certificatePreview || image;
        const title = trigger.dataset.certificateTitle || 'Certificado';
        const school = trigger.dataset.certificateSchool || 'Certificado';
        if (!image || !preview) return false;
        certificateTitle.textContent = title;
        certificateSchool.textContent = school;
        certificateImage.hidden = true;
        certificateStatus.hidden = false;
        certificateStatus.textContent = 'Carregando certificado…';
        certificateImage.alt = `Certificado ${title} - ${school}`;
        certificateImage.src = preview;
        certificateOpen.href = trigger.dataset.certificatePdf || image;
        certificateOpen.textContent = trigger.dataset.certificatePdf
            ? 'Abrir PDF original em nova guia'
            : 'Abrir imagem em nova guia';
        return true;
    };

    const showProject = async trigger => {
        const request = ++projectRequest;
        trigger.setAttribute('aria-busy', 'true');
        try {
            const projectMap = await loadProjects();
            if (request !== projectRequest) return;
            const project = projectMap.get(trigger.dataset.projectId);
            if (!project) throw new Error('Project data unavailable');
            populateProject(project);
        } catch {
            if (request !== projectRequest) return;
            projectTitle.textContent = trigger.closest('article').querySelector('h3').textContent;
            projectDescription.textContent = 'Não foi possível carregar os detalhes. Você pode consultar o projeto no repositório.';
            projectTools.replaceChildren();
            projectCase.hidden = true;
            projectCode.closest('.code-container').hidden = true;
            projectLink.href = trigger.href;
        } finally {
            trigger.removeAttribute('aria-busy');
        }
        if (request === projectRequest) openModal(projectModal, trigger);
    };

    certificateImage.addEventListener('load', () => {
        certificateImage.hidden = false;
        certificateStatus.hidden = true;
    });
    certificateImage.addEventListener('error', () => {
        certificateImage.hidden = true;
        certificateStatus.hidden = false;
        certificateStatus.textContent = 'Não foi possível carregar a prévia. Use o botão abaixo para abrir o documento original.';
    });

    document.addEventListener('click', (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const projectTrigger = event.target.closest('.trigger-modal[data-project-id]');
        if (projectTrigger) {
            event.preventDefault();
            void showProject(projectTrigger);
            return;
        }

        const certificateTrigger = event.target.closest('.certification-view-btn');
        if (certificateTrigger && populateCertificate(certificateTrigger)) {
            event.preventDefault();
            openModal(certificateModal, certificateTrigger);
            return;
        }

        if (event.target.closest('.close-modal')) closeAll();
    });

    overlay.addEventListener('click', () => closeAll());

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') projectRequest += 1;
        const modal = activeModal();
        if (!modal) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            closeAll();
            return;
        }
        if (event.key !== 'Tab') return;

        const focusable = focusableElements(modal);
        if (!focusable.length) {
            event.preventDefault();
            modal.focus();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!modal.contains(document.activeElement)) {
            event.preventDefault();
            first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
}
