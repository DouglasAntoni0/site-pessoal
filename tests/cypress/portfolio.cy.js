const externalHosts = [
  'https://fonts.googleapis.com/**',
  'https://fonts.gstatic.com/**',
  'https://cdnjs.cloudflare.com/**',
  'https://unpkg.com/**'
];

function blockExternalAssets() {
  externalHosts.forEach((host) => {
    cy.intercept(host, { forceNetworkError: true });
  });
}

function expectNoHorizontalOverflow() {
  cy.document().then((doc) => {
    const htmlOverflow = doc.documentElement.scrollWidth - doc.documentElement.clientWidth;
    const bodyOverflow = doc.body.scrollWidth - doc.body.clientWidth;
    expect(htmlOverflow).to.be.at.most(1);
    expect(bodyOverflow).to.be.at.most(1);
  });
}

describe('Portfolio Douglas QA', () => {
  beforeEach(() => {
    blockExternalAssets();
    cy.visit('/');
  });

  it('carrega hero, navegação e projetos sem erros críticos', () => {
    cy.title().should('eq', 'Douglas Antonio | Software Quality Engineer');
    cy.get('h1').should('contain.text', 'Engenharia de Qualidade Escalável');
    cy.get('.trigger-modal').should('have.length', 5);
    expectNoHorizontalOverflow();
  });

  it('navega pelas seções principais', () => {
    cy.contains('a', 'Visão & Tech').click();
    cy.contains('Shift-Left & Operações').should('be.visible');
    cy.contains('a', 'Projetos').click();
    cy.contains('Arsenal de').should('be.visible');
    cy.contains('a', 'Open Source').click();
    cy.contains('Voluntariado').should('be.visible');
  });

  it('abre e fecha modal de projeto', () => {
    cy.get('.trigger-modal').first().click();
    cy.get('.glass-modal.active').should('be.visible').and('contain.text', 'Automação de Performance com K6');
    cy.contains('K6 (JavaScript)').should('be.visible');
    cy.get('.glass-modal.active .close-modal').click();
    cy.get('.glass-modal.active').should('not.exist');
  });

  it('valida responsividade mobile básica', () => {
    cy.viewport(390, 844);
    cy.reload();
    cy.contains('a', 'Open Source').should('be.visible');
    cy.get('h1').should('be.visible');
    expectNoHorizontalOverflow();
  });
});
