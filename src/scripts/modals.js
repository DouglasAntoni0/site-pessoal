function focusableElements(modal) {
    return [...modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.offsetParent !== null);
}

export function initModals(projectMap) {
    const overlay = document.getElementById('modal-overlay');
    const projectModal = document.getElementById('project-modal');
    const certificateModal = document.getElementById('certificate-viewer-modal');
    const projectTitle = document.getElementById('project-modal-title');
    const projectDescription = document.getElementById('project-modal-description');
    const projectTools = document.getElementById('project-modal-tools');
    const projectCode = document.getElementById('project-modal-code');
    const projectLink = document.getElementById('project-modal-link');
    const certificateTitle = document.getElementById('certificate-modal-title');
    const certificateSchool = document.getElementById('certificate-modal-school');
    const certificateImage = document.getElementById('certificate-modal-image');
    const certificateOpen = document.getElementById('certificate-modal-open');
    if (!overlay || !projectModal || !certificateModal) return;

    let lastFocusedElement = null;

    const activeModal = () => document.querySelector('.glass-modal.active');

    const closeAll = ({ restoreFocus = true } = {}) => {
        for (const modal of document.querySelectorAll('.glass-modal.active')) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        }
        overlay.classList.remove('active');
        document.body.classList.remove('modal-open');
        if (restoreFocus && lastFocusedElement instanceof HTMLElement) {
            lastFocusedElement.focus({ preventScroll: true });
        }
    };

    const openModal = (modal, trigger) => {
        closeAll({ restoreFocus: false });
        lastFocusedElement = trigger instanceof HTMLElement ? trigger : document.activeElement;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        overlay.classList.add('active');
        document.body.classList.add('modal-open');
        const control = modal.querySelector('.close-modal') || modal;
        setTimeout(() => control.focus({ preventScroll: true }), 0);
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
        projectLink.href = project.repoUrl;
    };

    const populateCertificate = (trigger) => {
        const image = trigger.dataset.certificateImage;
        const preview = trigger.dataset.certificatePreview || image;
        const title = trigger.dataset.certificateTitle || 'Certificado';
        const school = trigger.dataset.certificateSchool || 'Certificado';
        if (!image || !preview) return false;
        certificateTitle.textContent = title;
        certificateSchool.textContent = school;
        certificateImage.alt = `Certificado ${title} - ${school}`;
        certificateImage.src = preview;
        certificateOpen.href = image;
        return true;
    };

    document.addEventListener('click', (event) => {
        const projectTrigger = event.target.closest('.trigger-modal[data-project-id]');
        if (projectTrigger) {
            const project = projectMap.get(projectTrigger.dataset.projectId);
            if (project) {
                event.preventDefault();
                populateProject(project);
                openModal(projectModal, projectTrigger);
            }
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
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
}
