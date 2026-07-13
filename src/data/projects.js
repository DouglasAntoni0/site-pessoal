/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} number
 * @property {'main'|'volunteer'} category
 * @property {string} title
 * @property {string} summary
 * @property {string[]} tags
 * @property {string[]} tools
 * @property {string[]} description
 * @property {string} code
 * @property {string} repoUrl
 * @property {'k6'|'cypress'|'playwright'|'mobile'|'ai'|'multi'|'pytest'|'selenium'|'bdd'|'volunteer'} theme
 * @property {'gauge'|'browsers'|'device-mobile'|'brain'|'check-square'|'flow-arrow'|'heart'} icon
 * @property {boolean} reversed
 */
const rawProjects = [
    {
        id: "modal-1",
        number: "01",
        category: "main",
        title: "Automação de Performance com K6",
        summary: "Testes de carga, stress e spike para resiliência de APIs.",
        tags: ["K6", "Performance", "Stress Test"],
        tools: ["K6 (JavaScript)", "Grafana/InfluxDB", "CLI Automation"],
        description: ["Implementação de arquitetura de performance voltada diretamente à resiliência e estabilidade da infraestrutura. A aplicação dos testes engloba não apenas disparo cego de requisições, mas cenários hiper-realistas utilizando Load, Soak, Spike e Stress testing.", "Foram desenvolvidos thresholds rígidos de validação para forçar o failover caso a latência p95 ultrapassasse os limites de SLA aceitáveis (500ms) ou a taxa de erros de chamadas superasse 1%. Essa arquitetura atua como a primeira barreira contra gargalos de produção."],
        code: `import http from 'k6/http';\nimport { check, sleep } from 'k6';\n\nexport const options = {\n  stages: [\n    { duration: '2m', target: 2000 },\n    { duration: '5m', target: 2000 },\n    { duration: '2m', target: 0 },\n  ],\n  thresholds: {\n    http_req_duration: ['p(95)<500'],\n    http_req_failed: ['rate<0.01'],\n  },\n};`,
        repoUrl: "https://github.com/DouglasAntoni0/projeto-completo-k6",
        theme: "k6",
        icon: "gauge",
        reversed: false
    },
    {
        id: "modal-2",
        number: "02",
        category: "main",
        title: "Web Testing E2E com Cypress",
        summary: "Page Objects, dados dinâmicos e evidências visuais integrados ao CI/CD.",
        tags: ["Cypress", "E2E", "Faker.js", "CI/CD"],
        tools: ["Cypress", "Page Objects", "Fixtures", "Faker.js", "Relatórios visuais", "GitHub Actions"],
        description: ["Infraestrutura de automação Web E2E estruturada com Page Objects para separar a lógica dos testes dos elementos da interface, facilitando manutenção e reaproveitamento.", "Fixtures e Faker.js geram massas independentes e representativas. Relatórios com evidências visuais aceleram a triagem, enquanto o GitHub Actions executa a suíte continuamente antes das entregas."],
        code: `Cypress.Commands.add('loginE2E', (email, password) => {\n  cy.session([email, password], () => {\n    cy.request('POST', '/api/auth', { email, password }).then((resp) => {\n      window.localStorage.setItem('token', resp.body.token);\n    });\n    cy.visit('/dashboard');\n    cy.get('[data-cy="user-menu"]').should('be.visible');\n  });\n});`,
        repoUrl: "https://github.com/DouglasAntoni0/ninjadocypress",
        theme: "cypress",
        icon: "check-square",
        reversed: true
    },
    {
        id: "modal-3",
        number: "03",
        category: "main",
        title: "Playwright Avançado & CI/CD",
        summary: "Ecossistema E2E, API e dados com execução cross-browser e rastreabilidade.",
        tags: ["Playwright", "API", "PostgreSQL", "CI/CD"],
        tools: ["Playwright Test", "Actions / Page Objects", "PostgreSQL", "Fixtures JSON", "HTML Reporter", "Screenshots & Traces", "GitHub Actions"],
        description: ["Arquitetura criada para uma plataforma de streaming com Actions/Page Objects, execução cross-browser e asserções resilientes. A separação entre regras, páginas e dados reduz acoplamento e simplifica a evolução da suíte.", "A preparação e limpeza de massa combinam PostgreSQL e Fixtures JSON para manter cenários independentes. HTML Reporter, screenshots e traces preservam evidências detalhadas, e o GitHub Actions oferece feedback contínuo antes do deploy."],
        code: `import { test, expect } from '@playwright/test';\nimport { MoviesPage } from '../pages/MoviesPage';\n\ntest.describe('Validação de Cadastro', () => {\n  test('Deve cadastrar e validar no banco', async ({ page, request }) => {\n    const moviesPage = new MoviesPage(page);\n    await moviesPage.navigate();\n    await moviesPage.submitMovie('O Farofeiro 2', 'Comédia', '2026');\n    \n    const response = await page.waitForResponse('**/api/movies');\n    expect(response.status()).toBe(201);\n  });\n});`,
        repoUrl: "https://github.com/DouglasAntoni0/playwrightcomplete",
        theme: "playwright",
        icon: "browsers",
        reversed: false
    },
    {
        id: "modal-4",
        number: "04",
        category: "main",
        title: "QAx-Mobile: Automação Android",
        summary: "Framework de testes automatizados para aplicações Mobile usando Appium.",
        tags: ["Appium", "WebdriverIO", "Robot Framework", "Mobile"],
        tools: ["Appium", "WebdriverIO", "Robot Framework", "MongoDB", "Android Studio", "GitHub Actions"],
        description: ["Ecossistema de automação mobile para testes E2E em aplicativos Android nativos (Yodapp e MarkX), com implementações em WebdriverIO/JavaScript e Robot Framework/Python.", "Scripts de apoio preparam e removem dados dinamicamente no MongoDB para reduzir falsos positivos e dependências entre cenários. A execução no GitHub Actions transforma cada alteração em feedback automatizado e rastreável."],
        code: `describe('Tarefas', () => {\n  it('deve cadastrar uma nova tarefa', async () => {\n    await loginScreen.doLogin('admin', 'qaninja')\n    await tasksScreen.create('Estudar Appium e Maestro')\n    await expect(await tasksScreen.taskName('Estudar Appium')).toBeDisplayed()\n  })\n})`,
        repoUrl: "https://github.com/DouglasAntoni0/QAx-Mobile",
        theme: "mobile",
        icon: "device-mobile",
        reversed: true
    },
    {
        id: "modal-5",
        number: "05",
        category: "main",
        title: "QA Automaton IA: Self-Healing",
        summary: "Playwright + GPT-4 para Self-Healing e Geração de Dados.",
        tags: ["Playwright", "OpenAI", "TypeScript"],
        tools: ["Playwright", "TypeScript", "OpenAI API", "GitHub Actions"],
        description: ["Projeto experimental de vanguarda unindo Inteligência Artificial a testes E2E. O framework utiliza TypeScript e Playwright integrado à API da OpenAI para duas frentes inovadoras: geração dinâmica de massa de dados sintéticos e um mecanismo de 'Self-Healing'. Quando a automação falha por um locator quebrado na UI, a IA analisa o DOM em tempo real e encontra o novo seletor correspondente, permitindo que o teste continue sem interrupções."],
        code: `import { test, expect } from '@playwright/test';\nimport { getHealedLocator } from '../support/self-healing/locator';\n\ntest('Deve curar locator quebrado via IA', async ({ page }) => {\n  const brokenLocator = '#old-btn-submit';\n  const targetDesc = 'Botão de confirmar cadastro';\n  \n  // A IA analisa o DOM e retorna o novo locator corrigido\n  const healedLocator = await getHealedLocator(page, brokenLocator, targetDesc);\n  \n  await page.locator(healedLocator).click();\n  await expect(page.locator('.success-msg')).toBeVisible();\n});`,
        repoUrl: "https://github.com/DouglasAntoni0/automacao-inteligente-qa",
        theme: "ai",
        icon: "brain",
        reversed: false
    },
    {
        id: "modal-6",
        number: "06",
        category: "main",
        title: "Multi-Framework QA: Dogfooding",
        summary: "Cobertura de testes do próprio site com 4 frameworks distintos.",
        tags: ["Cypress", "Playwright", "Robot", "Selenium"],
        tools: ["Cypress", "Playwright", "Robot Framework", "Selenium", "Node.js", "Python"],
        description: ["Aplicando o conceito de 'Dogfooding', desenvolvi uma suíte completa de testes E2E para garantir a qualidade visual e funcional deste próprio portfólio. Para demonstrar proficiência nas principais tecnologias do mercado, a automação foi escrita simultaneamente em 4 frameworks diferentes: Cypress, Playwright, Robot Framework e Selenium WebDriver. Os scripts validam a responsividade, o comportamento do Glassmorphism e a lógica de abertura dos modais."],
        code: `*** Settings ***\nLibrary    SeleniumLibrary\n\n*** Test Cases ***\nValidar Abertura de Modais de Projetos\n    Open Browser    https://douglasqa.netlify.app    chrome\n    Wait Until Element Is Visible    css=.project-row\n    Click Element    css=.trigger-modal[data-modal="modal-1"]\n    Wait Until Element Is Visible    css=.glass-modal.active\n    Sleep    1s\n    Click Element    css=.close-modal\n    Close Browser`,
        repoUrl: "https://github.com/DouglasAntoni0/site-pessoal",
        theme: "multi",
        icon: "check-square",
        reversed: true
    },
    {
        id: "modal-7",
        number: "07",
        category: "main",
        title: "Pytest: Gerenciador de Tarefas",
        summary: "Suíte completa de testes para aplicação Python/Flask.",
        tags: ["Pytest", "Python", "Flask"],
        tools: ["Pytest", "Flask", "Playwright", "GitHub Actions"],
        description: ["Suíte profissional de testes para um gerenciador de tarefas em Python, cobrindo desde a regra de domínio até fluxos de ponta a ponta. A arquitetura combina fixtures em camadas, testes parametrizados e validações de CRUD, regras de negócio, serialização e persistência JSON.", "O projeto também valida uma API Flask com test client, exercita páginas HTML com Playwright em navegador real e mantém a execução em GitHub Actions. O foco é demonstrar cobertura ampla, clareza de cenários, tratamento de casos extremos e confiança para evoluir a aplicação sem regressões."],
        code: `import pytest\nfrom task_manager.models import Tarefa, Status\n\n@pytest.mark.parametrize('status_destino', [\n    Status.EM_ANDAMENTO,\n    Status.CONCLUIDA,\n    Status.ARQUIVADA,\n])\ndef test_transicao_de_status_valida(status_destino):\n    tarefa = Tarefa(titulo='Validar fluxo crítico')\n\n    tarefa.alterar_status(status_destino)\n\n    assert tarefa.status == status_destino`,
        repoUrl: "https://github.com/DouglasAntoni0/pytest",
        theme: "pytest",
        icon: "check-square",
        reversed: false
    },
    {
        id: "modal-8",
        number: "08",
        category: "main",
        title: "Selenium JS Toolshop QA",
        summary: "Automação web E2E com Selenium puro em JavaScript.",
        tags: ["Selenium", "JavaScript", "Mocha"],
        tools: ["Selenium WebDriver", "Mocha", "Chai", "Faker", "Mochawesome"],
        description: ["Projeto de automação web criado do zero com Selenium WebDriver puro em JavaScript para a plataforma Practice Software Testing Toolshop. A suíte cobre fluxos realistas de e-commerce, incluindo login, cadastro, busca, carrinho, checkout, pagamento e contato.", "A arquitetura usa Page Object Model, seletores centralizados, massa dinâmica com Faker e apoio de API pública para preparar dados antes da execução. As esperas são explícitas e orientadas a sinais reais da interface, com relatórios Mochawesome e pipeline em GitHub Actions para manter execução reproduzível."],
        code: `describe('Checkout como convidado', () => {\n  it('deve finalizar compra com valor correto', async () => {\n    await catalogPage.searchProduct('hammer');\n    await productPage.addToCart();\n    await cartPage.updateQuantity(2);\n\n    expect(await cartPage.total()).to.equal(expectedTotal);\n    await checkoutPage.finishAsGuest(testData.customer);\n    expect(await orderPage.successMessage()).to.contain('Payment was successful');\n  });\n});`,
        repoUrl: "https://github.com/DouglasAntoni0/selenium",
        theme: "selenium",
        icon: "browsers",
        reversed: true
    },
    {
        id: "modal-9",
        number: "09",
        category: "main",
        title: "BDD com Cucumber | Starbugs Coffee",
        summary: "Cenários BDD em português para jornada de compra.",
        tags: ["Cucumber", "Ruby", "BDD"],
        tools: ["Ruby", "Cucumber", "Capybara", "Selenium", "GitHub Actions"],
        description: ["Projeto de automação E2E para a aplicação Starbugs Coffee, construído com Ruby, Cucumber, Capybara e Selenium WebDriver. Os cenários são escritos em Gherkin em português para documentar o comportamento esperado do produto de forma clara para negócio, QA e desenvolvimento.", "A base usa Page Object para separar ações de tela dos steps, reduzindo duplicação e facilitando manutenção. A cobertura inclui catálogo, pedidos, endereço, pagamento, confirmação de compra e regras de cupons válidos, expirados e inválidos, com execução preparada para CI/CD no GitHub Actions."],
        code: `Cenário: Comprar café com cupom válido\n  Dado que acesso a loja Starbugs\n  Quando escolho o produto "Expresso Gelado"\n  E informo o cupom "MEUCAFE"\n  E finalizo o pedido com pagamento PIX\n  Então devo ver a confirmação da compra\n  E o desconto deve ser aplicado no total`,
        repoUrl: "https://github.com/DouglasAntoni0/BDD-cucumber",
        theme: "bdd",
        icon: "flow-arrow",
        reversed: false
    },
    {
        id: "modal-10",
        number: "10",
        category: "volunteer",
        title: "SouJunior: Automação Open Source",
        summary: "Qualidade colaborativa da análise de requisitos ao feedback contínuo em produção.",
        tags: ["Playwright", "Cypress", "API", "BDD", "Open Source"],
        tools: ["Playwright", "Cypress", "GitHub Actions", "Bug Tracking", "BDD / Gherkin", "Evidências de QA"],
        description: ["Atuação como Software Quality Engineer voluntário na SouJunior, analisando requisitos e transformando critérios de negócio em cenários claros para proteger fluxos importantes da plataforma.", "A rotina combina testes manuais, regressivos e exploratórios, bug tracking com passos de reprodução e evidências, validações de API e automação E2E em Cypress e Playwright.", "Cenários BDD/Gherkin aproximam qualidade, produto e desenvolvimento. As suítes executadas no GitHub Actions ampliam a rastreabilidade e entregam feedback contínuo para decisões de release mais seguras."],
        code: `import { test, expect } from '@playwright/test';\n\ntest.describe('Iniciativas - SouJunior', () => {\n  test('Deve carregar a página com sucesso', async ({ page }) => {\n    await page.goto('/iniciativas');\n    \n    const title = page.locator('h1');\n    await expect(title).toContainText('Nossas Iniciativas');\n    \n    const cards = page.locator('.iniciativa-card');\n    await expect(cards.first()).toBeVisible();\n  });\n});`,
        repoUrl: "https://github.com/DouglasAntoni0/Testes-E2E-SouJunior",
        theme: "volunteer",
        icon: "heart",
        reversed: true
    }
];
const allowedThemes = new Set(['k6', 'cypress', 'playwright', 'mobile', 'ai', 'multi', 'pytest', 'selenium', 'bdd', 'volunteer']);
const allowedIcons = new Set(['gauge', 'browsers', 'device-mobile', 'brain', 'check-square', 'flow-arrow', 'heart']);

/** @type {ReadonlyArray<Project>} */
export const projects = Object.freeze(rawProjects.map((project) => {
    if (!allowedThemes.has(project.theme) || !allowedIcons.has(project.icon)) {
        throw new TypeError(`Invalid project presentation token: ${project.id}`);
    }
    if (!project.repoUrl.startsWith('https://github.com/')) {
        throw new TypeError(`Invalid project URL: ${project.id}`);
    }
    return Object.freeze({ ...project, description: Object.freeze([...project.description]) });
}));
