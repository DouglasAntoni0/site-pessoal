import { projects } from '../data/projects.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

function createIcon(icon) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.classList.add('project-visual-symbol', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', '0 0 24 24');

    const use = document.createElementNS(SVG_NS, 'use');
    const href = `assets/icons/sprite.svg#${icon}`;
    use.setAttribute('href', href);
    use.setAttributeNS(XLINK_NS, 'href', href);
    svg.append(use);
    return svg;
}

function createProjectCard(project) {
    const article = document.createElement('article');
    article.className = `project-row theme-${project.theme} reveal${project.reversed ? ' reversed' : ''}`;
    article.dataset.projectId = project.id;

    const content = document.createElement('div');
    content.className = 'project-content glass-panel';

    const info = document.createElement('div');
    info.className = 'project-info';

    const title = document.createElement('h3');
    title.textContent = `${project.number}. ${project.title}`;

    const tags = document.createElement('div');
    tags.className = 'card-tags';
    for (const tag of project.tags) {
        const badge = document.createElement('span');
        badge.className = 'min-tag';
        badge.textContent = tag;
        tags.append(badge);
    }

    const summary = document.createElement('p');
    summary.textContent = project.summary;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'btn-text-link trigger-modal';
    trigger.dataset.projectId = project.id;
    trigger.setAttribute('aria-controls', 'project-modal');
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.textContent = 'Ver detalhes';

    const visual = document.createElement('div');
    visual.className = 'project-visual';
    visual.setAttribute('aria-hidden', 'true');
    visual.append(createIcon(project.icon));

    info.append(title, tags, summary, trigger);
    content.append(info, visual);
    article.append(content);
    return article;
}

export function renderProjects() {
    const mainContainer = document.getElementById('projects-container');
    const volunteerContainer = document.getElementById('volunteer-container');
    if (!mainContainer || !volunteerContainer) return new Map();

    const mainFragment = document.createDocumentFragment();
    const volunteerFragment = document.createDocumentFragment();
    const projectMap = new Map();

    for (const project of projects) {
        projectMap.set(project.id, project);
        const card = createProjectCard(project);
        (project.category === 'volunteer' ? volunteerFragment : mainFragment).append(card);
    }

    mainContainer.replaceChildren(mainFragment);
    volunteerContainer.replaceChildren(volunteerFragment);
    return projectMap;
}
