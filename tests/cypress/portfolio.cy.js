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
    cy.contains('a', 'Atuação').click();
    cy.contains('Da estratégia de teste').should('be.visible');
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
    cy.contains('a', 'Currículo').should('have.attr', 'href', 'assets/Douglas_Antonio_QA_Engineer.pdf');
    cy.get('h1').should('be.visible');
    expectNoHorizontalOverflow();
  });

  it('todas as 32 tech-tags possuem um ícone', () => {
    cy.get('.tech-tag').should('have.length', 32);
    cy.get('.tech-tag').each(($tag) => {
      cy.wrap($tag).find('i').should('have.length', 1);
    });
  });

  it('layout tablet 768px sem overflow horizontal', () => {
    cy.viewport(768, 1024);
    cy.reload();
    cy.get('h1').should('be.visible');
    cy.contains('a', 'Projetos').should('be.visible');
    expectNoHorizontalOverflow();
  });

  it('layout mobile estreito 320px mantém tudo na tela', () => {
    cy.viewport(320, 740);
    cy.reload();
    cy.get('h1').should('be.visible');
    cy.contains('a', 'Contato').should('be.visible');
    expectNoHorizontalOverflow();
  });

  it('cards de contato possuem links corretos e seguros', () => {
    cy.get('.contact-link').should('have.length', 3);
    cy.get('a.whatsapp-card').should('have.attr', 'href').and('include', 'wa.me');
    cy.get('a.linkedin-card').should('have.attr', 'href').and('include', 'linkedin.com');
    cy.get('a.github-card').should('have.attr', 'href').and('include', 'github.com');
    cy.get('.contact-link').each(($link) => {
      cy.wrap($link).should('have.attr', 'rel').and('include', 'noopener');
    });
  });

  it('footer está visível com copyright', () => {
    cy.get('footer').scrollIntoView().should('be.visible');
    cy.get('footer').should('contain.text', 'Douglas Antonio');
  });

  it('meta viewport está presente', () => {
    cy.document().then((doc) => {
      const viewport = doc.querySelector('meta[name="viewport"]');
      expect(viewport).to.not.be.null;
      expect(viewport.getAttribute('content')).to.include('width=device-width');
    });
  });
});
