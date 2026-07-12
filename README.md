# Douglas QA — Portfólio profissional

Portfólio pessoal de Douglas Antonio, Software Quality Engineer, com foco em automação E2E, API, mobile, performance, Shift-Left e CI/CD.

A aplicação é estática e foi desenhada para entregar a mesma experiência funcional em celulares antigos, tablets e desktops. Efeitos avançados são aprimoramento progressivo: dispositivos touch, telas compactas e usuários com `prefers-reduced-motion` recebem uma versão sem animações contínuas.

## Arquitetura

- `src/index.html`: marcação semântica e conteúdo público.
- `src/styles/`: base, layout, componentes, movimento e breakpoints.
- `src/scripts/`: navegação, projetos, modais e efeitos nativos.
- `src/data/projects.js`: dados tipados por JSDoc, validados por allowlists.
- `src/assets/`: fontes WOFF2 locais, licenças e sprite SVG.
- `scripts/build-static.mjs`: gera HTML, CSS e JavaScript minificados e versionados por hash.
- `dist/`: saída de produção gerada; é o único diretório publicado e testado.

O runtime não carrega bibliotecas, fontes ou ícones de terceiros. Animações usam Web Animations API, um único `IntersectionObserver` e, durante interação desktop, no máximo um `requestAnimationFrame`.

## Desenvolvimento

Requer Node.js 22 e Python 3 para o servidor estático e as suítes Selenium/Robot.

```bash
npm ci
npm run build
npm run serve
```

Abra `http://127.0.0.1:4173`. Não edite `dist/` diretamente: ele é recriado a cada build.

## Qualidade

```bash
npm run check:js
npm run test:budget
npm run test:playwright
npm run test:cypress
npm run test:selenium
pip install -r requirements-robot.txt
npm run test:robot
npm run test:lighthouse
```

`npm run test:all` executa as quatro suítes E2E após sintaxe e orçamento. O CI usa Node 22 em pull requests e na `main`, testa Chromium integralmente, executa smokes em Firefox/WebKit e roda Lighthouse três vezes no perfil móvel.

Orçamentos de produção:

- até 8 requisições críticas;
- JS e CSS com até 20 KiB Brotli cada;
- HTML, bundles e fontes com até 250 KiB Brotli;
- DOM com até 900 nós;
- Lighthouse: Performance ≥ 95 e Accessibility/Best Practices/SEO = 100;
- LCP ≤ 2,5 s, CLS ≤ 0,05 e TBT ≤ 150 ms.

## Direitos autorais

Este site, seu conteúdo, código, identidade visual e demais ativos são uma obra pessoal de Douglas Antonio. Todos os direitos são reservados. Cópia, redistribuição, comercialização ou criação de trabalhos derivados exigem autorização prévia e expressa do autor.

[Douglas Antonio](https://www.linkedin.com/in/douglas-antonio-qa/) © 2026 — Engenharia de Qualidade Escalável.
