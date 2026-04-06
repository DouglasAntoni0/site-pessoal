const projectsData = [
    {
        id: "modal-1",
        number: "01",
        title: "Automação de Performance com K6",
        summary: "Testes de carga, stress e spike para resiliência de APIs.",
        tags: ["K6", "Performance", "Stress Test"],
        tools: ["K6 (JavaScript)", "Grafana/InfluxDB", "CLI Automation"],
        desc: `Implementação de arquitetura de performance voltada diretamente à resiliência e estabilidade da infraestrutura. A aplicação dos testes engloba não apenas disparo cego de requisições, mas cenários hiper-realistas utilizando Load, Soak, Spike e Stress testing.<br><br>Foram desenvolvidos <em>thresholds</em> rígidos de validação para forçar o failover caso a latência p95 ultrapassasse os limites de SLA aceitáveis (500ms) ou a taxa de erros de chamadas superasse 1%. Essa arquitetura atua como a primeira barreira contra gargalos de produção.`,
        code: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 2000 },
    { duration: '5m', target: 2000 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};`,
        repo: "https://github.com/DouglasAntoni0/projeto-completo-k6",
        visualClass: "k6-visual",
        iconClass: "ph-gauge",
        reverseBorder: false
    },
    {
        id: "modal-2",
        number: "02",
        title: "Web Testing E2E com Cypress (NinjaDoCypress)",
        summary: "Framework ponta a ponta focado em robustez e CI/CD.",
        tags: ["Cypress", "E2E", "Mock/Stub"],
        tools: ["Cypress.io", "JavaScript/Node.js", "API Interception"],
        desc: `Projeto complexo e escalável que atesta a saúde das aplicações front-end integrando UI, manipulação de banco de dados e chamadas de API, de forma unificada. Evitei o uso abusivo da interface para ações de setup e foquei na perfomance através de rotas customizadas de injeção de tokens.<br><br>Criação de comandos customizados incrivelmente robustos para otimizar drasticamente o tempo de execução (setup dinâmico de massa de dados na camada de rede em vez da camada de UI).`,
        code: `Cypress.Commands.add('loginE2E', (email, password) => {
  cy.session([email, password], () => {
    cy.request('POST', '/api/auth', { email, password }).then((resp) => {
      window.localStorage.setItem('token', resp.body.token);
    });
    cy.visit('/dashboard');
    cy.get('[data-cy="user-menu"]').should('be.visible');
  });
});`,
        repo: "https://github.com/DouglasAntoni0/ninjadocypress",
        visualClass: "cypress-visual",
        iconClass: "ph-terminal-window",
        reverseBorder: true
    },
    {
        id: "modal-3",
        number: "03",
        title: "Playwright Avançado & CI/CD",
        summary: "Automação cross-browser paralela com Page Object Model.",
        tags: ["Playwright", "CI/CD", "POM"],
        tools: ["Playwright Test", "Page Object Model", "GitHub Actions"],
        desc: `Automação cross-browser configurada para paralelismo extremo usando o poder do motor do ecossistema Playwright. O projeto adota estritamente o paradigma Page Object Model (POM) garantindo manutenção isolada e clara.<br><br>Foram desenhadas asserções dinâmicas de alta confiabilidade (auto-waiting e expect patterns), em conjunto com a interceptação de chamadas de rede mockadas garantindo previsibilidade. Toda a esteira está configurada com GitHub Actions (CI/CD).`,
        code: `import { test, expect } from '@playwright/test';
import { MoviesPage } from '../pages/MoviesPage';

test.describe('Validação de Cadastro', () => {
  test('Deve cadastrar e validar no banco', async ({ page, request }) => {
    const moviesPage = new MoviesPage(page);
    await moviesPage.navigate();
    await moviesPage.submitMovie('O Farofeiro 2', 'Comédia', '2026');
    
    const response = await page.waitForResponse('**/api/movies');
    expect(response.status()).toBe(201);
  });
});`,
        repo: "https://github.com/DouglasAntoni0/playwrightcomplete",
        visualClass: "playwright-visual",
        iconClass: "ph-browsers",
        reverseBorder: false
    }
];
