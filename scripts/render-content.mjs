import { projects } from '../src/data/projects.js';
import { certificates } from '../src/data/certificates.js';

export function escapeHtml(value) {
    return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function projectCard(project) {
    const e = escapeHtml;
    return `<article class="project-row theme-${e(project.theme)} reveal${project.reversed ? ' reversed' : ''}" data-project-id="${e(project.id)}">
      <div class="project-content glass-panel"><div class="project-info">
        ${project.caseStudy ? `<p class="project-category">${e(project.caseStudy.label)}</p>` : ''}
        <h3>${e(project.title)}</h3>
        <div class="card-tags">${project.tags.map(tag => `<span class="min-tag">${e(tag)}</span>`).join('')}</div>
        <p>${e(project.summary)}</p>
        ${project.caseStudy?.outcome ? `<p class="project-outcome">${e(project.caseStudy.outcome)} <span>· ${e(project.caseStudy.date)}</span></p>` : ''}
        <a class="btn-text-link trigger-modal" data-project-id="${e(project.id)}" href="${e(project.repoUrl)}" target="_blank" rel="noopener noreferrer">Acessar repositório</a>
      </div><div class="project-visual" aria-hidden="true"><svg class="project-visual-symbol icon" viewBox="0 0 24 24"><use href="assets/icons/sprite.svg#${e(project.icon)}"/></svg></div></div>
    </article>`;
}

function collection(id, label, inner) {
    return `<details class="collection-disclosure" id="${id}"><summary><span class="when-closed">${label}</span><span class="when-open">Mostrar apenas os destaques</span></summary>${inner}</details>`;
}

export function renderMainProjects() {
    const main = projects.filter(project => project.category === 'main');
    const featured = main.filter(project => project.caseStudy?.featured);
    const remaining = main.filter(project => !project.caseStudy?.featured);
    return `<div class="projects-timeline">${featured.map(projectCard).join('')}</div>`
        + collection('projects-more', `Ver mais ${remaining.length} projetos`, `<div class="projects-timeline">${remaining.map(projectCard).join('')}</div>`);
}

export function renderVolunteer() {
    return projects.filter(project => project.category === 'volunteer').map(projectCard).join('');
}

function certificateCard(certificate) {
    const e = escapeHtml;
    return `<article class="certification-card glass-panel reveal">
      <div class="certification-topline"><span class="certification-school">${e(certificate.school)}</span></div>
      <h3>${e(certificate.title)}</h3><p>${e(certificate.description)}</p>
      <div class="certification-meta"><span>${e(certificate.date)}</span><span>${e(certificate.hours)}</span></div>
      <a class="certification-view-btn" href="${e(certificate.pdf || certificate.image)}" target="_blank" rel="noopener noreferrer"
        data-certificate-title="${e(certificate.title)}" data-certificate-school="${e(certificate.school)}"
        data-certificate-image="${e(certificate.image)}" data-certificate-preview="${e(certificate.preview)}"
        ${certificate.pdf ? `data-certificate-pdf="${e(certificate.pdf)}"` : ''}>Ver certificado</a>
    </article>`;
}

export function renderCertificates() {
    return `<div class="certifications-grid">${certificates.filter(c => c.featured).map(certificateCard).join('')}</div>`
        + collection('certificates-more', `Ver todos os ${certificates.length} certificados`, `<div class="certifications-grid">${certificates.filter(c => !c.featured).map(certificateCard).join('')}</div>`);
}
