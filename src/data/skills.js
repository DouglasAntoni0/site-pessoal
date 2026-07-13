/**
 * @typedef {Object} Skill
 * @property {string} id
 * @property {string} label
 * @property {string} icon
 * @property {'blue'|'cyan'|'amber'|'violet'|'emerald'|'magenta'} tone
 */

/**
 * @typedef {Object} SkillGroup
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {'blue'|'cyan'|'amber'|'violet'|'emerald'|'magenta'} tone
 * @property {ReadonlyArray<Skill>} skills
 */

const group = (id, title, description, tone, entries) => ({
    id,
    title,
    description,
    tone,
    skills: entries.map(([skillId, label, icon, skillTone = tone]) => ({
        id: skillId,
        label,
        icon,
        tone: skillTone
    }))
});

const rawGroups = [
    group('languages', 'Linguagens & Web', 'Base técnica para criar, compreender e validar aplicações em diferentes stacks.', 'blue', [
        ['javascript-node', 'JavaScript (Node.js)', 'brand-nodedotjs', 'emerald'],
        ['typescript', 'TypeScript', 'brand-typescript'],
        ['python', 'Python', 'brand-python'],
        ['ruby', 'Ruby', 'brand-ruby', 'magenta'],
        ['csharp', 'C#', 'brand-dotnet', 'violet'],
        ['java', 'Java', 'brand-java', 'amber'],
        ['php', 'PHP', 'brand-php', 'violet'],
        ['go', 'Go', 'brand-go', 'cyan'],
        ['html5', 'HTML5', 'brand-html5', 'amber'],
        ['css3', 'CSS3', 'brand-css', 'violet'],
        ['react', 'React', 'brand-react', 'cyan'],
        ['json', 'JSON', 'brand-json'],
        ['xml', 'XML', 'brand-xml', 'cyan'],
        ['yaml', 'YAML (YAML/YML)', 'brand-yaml', 'magenta'],
        ['markdown', 'Markdown', 'brand-markdown'],
        ['dotenv', '.env', 'brand-dotenv', 'amber']
    ]),
    group('automation', 'Automação & Frameworks', 'Ferramentas para suítes confiáveis, rastreáveis e preparadas para evolução contínua.', 'cyan', [
        ['cypress', 'Cypress', 'brand-cypress', 'emerald'],
        ['playwright', 'Playwright', 'brand-playwright', 'magenta'],
        ['webdriverio', 'WebdriverIO', 'brand-webdriverio', 'magenta'],
        ['selenium', 'Selenium WebDriver', 'brand-selenium', 'emerald'],
        ['jest', 'Jest', 'brand-jest', 'magenta'],
        ['mocha', 'Mocha', 'brand-mocha', 'amber'],
        ['pytest', 'PyTest', 'brand-pytest'],
        ['robot-framework', 'Robot Framework', 'brand-robotframework'],
        ['faker', 'Faker.js', 'brand-faker', 'emerald']
    ]),
    group('api-data-performance', 'API, Dados & Performance', 'Validação de contratos, massa de dados e comportamento sob carga.', 'amber', [
        ['postman', 'Postman', 'brand-postman'],
        ['insomnia', 'Insomnia', 'brand-insomnia', 'violet'],
        ['swagger', 'Swagger/OpenAPI', 'brand-swagger', 'emerald'],
        ['rest-api', 'REST API', 'api'],
        ['postgresql', 'PostgreSQL', 'brand-postgresql', 'blue'],
        ['mongodb', 'MongoDB', 'brand-mongodb', 'emerald'],
        ['sql', 'SQL', 'database', 'blue'],
        ['nosql', 'NoSQL', 'database-nodes', 'emerald'],
        ['k6', 'K6', 'brand-k6', 'violet'],
        ['jmeter', 'JMeter', 'brand-apachejmeter', 'magenta'],
        ['load-metrics', 'Métricas & Cenários de Carga', 'chart']
    ]),
    group('mobile', 'Ecossistema Mobile', 'Automação nativa e preparação de ambientes Android e iOS.', 'violet', [
        ['appium', 'Appium', 'brand-appium', 'magenta'],
        ['appium-inspector', 'Appium Inspector', 'inspect', 'magenta'],
        ['maestro', 'Maestro', 'brand-maestro', 'violet'],
        ['android-studio', 'Android Studio', 'brand-androidstudio', 'emerald'],
        ['mobile-emulators', 'Emuladores Android/iOS', 'device-stack', 'cyan']
    ]),
    group('devops', 'DevOps & Versionamento', 'Automação de qualidade integrada ao fluxo de código e entrega.', 'emerald', [
        ['git', 'Git', 'brand-git', 'magenta'],
        ['git-flow', 'Git Flow', 'flow-arrow', 'cyan'],
        ['branches-prs', 'Branches & Pull Requests', 'git-branch', 'violet'],
        ['github-actions', 'GitHub Actions', 'brand-githubactions', 'blue'],
        ['gitlab-ci', 'GitLab CI', 'brand-gitlab', 'amber'],
        ['jenkins', 'Jenkins', 'brand-jenkins', 'magenta'],
        ['docker', 'Docker', 'brand-docker', 'blue']
    ]),
    group('quality', 'Qualidade, Métodos & Segurança', 'Práticas para antecipar riscos, documentar evidências e proteger cada release.', 'magenta', [
        ['ai', 'Inteligência Artificial (IA)', 'brain', 'violet'],
        ['cybersecurity', 'Cybersecurity', 'shield-check', 'emerald'],
        ['agile', 'Agile / Scrum / Kanban', 'cycle', 'cyan'],
        ['bdd', 'BDD / Cucumber / Gherkin', 'brand-cucumber', 'emerald'],
        ['jira', 'Jira', 'brand-jira', 'blue'],
        ['trello', 'Trello', 'brand-trello', 'blue'],
        ['manual-tests', 'Testes Manuais', 'checklist', 'cyan'],
        ['unit-tests', 'Testes Unitários', 'unit-test', 'blue'],
        ['integration-tests', 'Testes de Integração', 'layers', 'violet'],
        ['e2e-tests', 'Testes E2E', 'route', 'emerald'],
        ['regression-tests', 'Testes de Regressão', 'repeat', 'amber'],
        ['exploratory-tests', 'Testes Exploratórios', 'search', 'cyan'],
        ['contract-tests', 'Testes de Contrato', 'contract', 'violet'],
        ['performance-tests', 'Testes de Performance', 'gauge', 'amber']
    ])
];

const allowedTones = new Set(['blue', 'cyan', 'amber', 'violet', 'emerald', 'magenta']);
const ids = new Set();

for (const skillGroup of rawGroups) {
    if (!allowedTones.has(skillGroup.tone) || ids.has(skillGroup.id)) {
        throw new TypeError(`Invalid skill group: ${skillGroup.id}`);
    }
    ids.add(skillGroup.id);
    for (const skill of skillGroup.skills) {
        if (!skill.label || !skill.icon || !allowedTones.has(skill.tone) || ids.has(skill.id)) {
            throw new TypeError(`Invalid skill: ${skill.id}`);
        }
        ids.add(skill.id);
        Object.freeze(skill);
    }
    Object.freeze(skillGroup.skills);
    Object.freeze(skillGroup);
}

const skillCount = rawGroups.reduce((total, skillGroup) => total + skillGroup.skills.length, 0);
if (rawGroups.length !== 6 || skillCount !== 62) {
    throw new TypeError(`Expected 6 skill groups and 62 skills, received ${rawGroups.length} and ${skillCount}`);
}

/** @type {ReadonlyArray<SkillGroup>} */
export const skillGroups = Object.freeze(rawGroups);
export const totalSkills = skillCount;
