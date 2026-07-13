function expectNoHorizontalOverflow() {
  cy.document().then(doc => {
    expect(doc.documentElement.scrollWidth - doc.documentElement.clientWidth).to.be.at.most(1);
    expect(doc.body.scrollWidth - doc.body.clientWidth).to.be.at.most(1);
  });
}

describe('Portfolio Douglas QA', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('carrega hero, projetos e recursos somente locais', () => {
    cy.title().should('eq', 'Douglas Antonio | Software Quality Engineer');
    cy.get('h1').should('contain.text', 'Qualidade que antecipa riscos');
    cy.get('#projects-container article').should('have.length', 9);
    cy.get('#volunteer-container article').should('have.length', 1);
    cy.get('.trigger-modal').should('have.length', 10);
    cy.get('#project-modal').should('have.length', 1);
    cy.window().then(win => {
      const foreign = win.performance.getEntriesByType('resource')
        .map(entry => new URL(entry.name))
        .filter(url => url.origin !== win.location.origin);
      expect(foreign).to.deep.equal([]);
    });
    expectNoHorizontalOverflow();
  });

  it('abre o modal compartilhado com texto escapado e restaura o foco', () => {
    cy.get('.trigger-modal').first().focus().click();
    cy.get('#project-modal.active')
      .should('be.visible')
      .and('contain.text', 'Automação de Performance com K6')
      .and('contain.text', 'K6 (JavaScript)');
    cy.get('#project-modal a[target="_blank"]').should('have.attr', 'rel').and('include', 'noopener');
    cy.get('body').type('{esc}');
    cy.get('#project-modal').should('not.have.class', 'active');
    cy.get('.trigger-modal').first().should('have.focus');
  });

  it('certificações usam preview WebP e preservam o PNG original', () => {
    cy.get('#certifications .certification-card').should('have.length', 13);
    cy.get('#certifications .certification-support-card').should('have.length', 2);
    cy.get('#certifications .certification-view-btn').first().click();
    cy.get('#certificate-viewer-modal').should('have.class', 'active');
    cy.get('#certificate-modal-image').should('have.attr', 'src').and('match', /previews\/.+\.webp$/);
    cy.get('#certificate-modal-open').should('have.attr', 'href').and('match', /\.png$/);
    cy.get('body').type('{esc}');
    cy.get('#certificate-viewer-modal').should('not.have.class', 'active');
  });

  it('menu mobile fecha por Escape, link e clique externo', () => {
    cy.viewport(390, 844);
    cy.get('#primary-nav').should('not.be.visible');
    cy.get('#menu-toggle').click().should('have.attr', 'aria-expanded', 'true');
    cy.get('body').type('{esc}');
    cy.get('#primary-nav').should('not.be.visible');
    cy.get('#menu-toggle').should('have.focus');

    cy.get('#menu-toggle').click();
    cy.get('#primary-nav a[href="#projects"]').click();
    cy.get('#primary-nav').should('not.be.visible');

    cy.get('#menu-toggle').click();
    cy.get('main').click('topLeft');
    cy.get('#primary-nav').should('not.be.visible');
  });

  for (const [label, width, height] of [
    ['móvel mínimo', 280, 653],
    ['móvel', 390, 844],
    ['paisagem', 667, 375],
    ['tablet', 768, 1024],
    ['desktop', 1440, 900]
  ]) {
    it(`layout ${label} (${width}x${height}) não cria overflow`, () => {
      cy.viewport(width, height);
      cy.reload();
      cy.get('h1').should('be.visible');
      expectNoHorizontalOverflow();
      cy.window().then(win => {
        const header = win.document.querySelector('.glass-header').getBoundingClientRect();
        const title = win.document.querySelector('.hero-title').getBoundingClientRect();
        expect(title.top).to.be.at.least(header.bottom);
        expect(title.bottom).to.be.at.most(win.innerHeight);
      });
    });
  }

  it('preserva seções, currículo, tags e contatos', () => {
    cy.get('section[id]').then(sections => {
      expect([...sections].map(section => section.id))
        .to.deep.equal(['hero', 'vision', 'quality', 'certifications', 'projects', 'volunteer', 'contact']);
    });
    cy.get('[data-skill-group]').should('have.length', 6);
    cy.get('.skill-chip').should('have.length', 62).each(chip => {
      cy.wrap(chip).find('svg use').should('have.attr', 'href').and('match', /^assets\/icons\/sprite\.svg#/);
    });
    cy.get('#certifications')
      .should('contain.text', 'Formação avançada')
      .and('contain.text', 'Leitura: intermediária')
      .and('contain.text', 'Conversação: básico-intermediária')
      .and('not.contain.text', 'Expira');
    cy.get('.contact-link').should('have.length', 3).each(link => {
      cy.wrap(link).should('have.attr', 'rel').and('include', 'noopener');
    });
    cy.contains('a', 'Baixar currículo').should('have.attr', 'href', 'assets/Douglas_Antonio_QA_Engineer.pdf');
  });

  it('mantém conteúdo visível com texto a 200%', () => {
    cy.viewport(320, 800);
    cy.document().then(doc => { doc.documentElement.style.fontSize = '200%'; });
    cy.get('h1').should('be.visible');
    cy.get('#menu-toggle').should('be.visible');
    expectNoHorizontalOverflow();
  });
});
