# Douglas QA — Portfólio profissional

Portfólio pessoal de Douglas Antonio, Software Quality Engineer, com foco em automação E2E, API, mobile, performance, Shift-Left e CI/CD.

A aplicação é estática, com layouts responsivos para celulares, tablets e desktops. A compatibilidade é validada por testes automatizados e checagens em aparelhos disponíveis. Efeitos avançados são aprimoramento progressivo: dispositivos touch, telas compactas e usuários com `prefers-reduced-motion` recebem uma versão sem animações contínuas.

## Arquitetura

- `src/index.html`: marcação semântica e conteúdo público.
- `src/styles/`: base, layout, componentes, movimento e breakpoints.
- `src/scripts/`: navegação, projetos, modais e efeitos nativos.
- `src/data/`: projetos, certificados, competências e estudos de caso com links para execuções históricas e código em commits específicos.
- `scripts/render-content.mjs`: gera os cartões no build. Listas expansíveis usam `<details>` nativo; links para repositórios e documentos funcionam sem JavaScript.
- `src/assets/`: fontes WOFF2 locais, licenças, ícones SVG das competências e sprite dos demais elementos.
- `scripts/build-static.mjs`: gera HTML, CSS e JavaScript minificados e versionados por hash. Os detalhes dos projetos são um módulo separado, solicitado na primeira abertura de um modal.
- `dist/`: saída de produção gerada; é o único diretório publicado e testado.

Fontes, ícones e código da interface são locais. Em produção, o Netlify pode injetar seu agente assíncrono de Real User Monitoring; a CSP permite a origem específica do agente e o endpoint de coleta observado (`ingesteer.services-prod.nsvcs.net/rum_collection`). Animações usam Web Animations API, um único `IntersectionObserver` e, durante interação desktop, no máximo um `requestAnimationFrame`.

Os 62 ícones das competências são vetores completos inseridos no HTML durante o build, com dimensões e atributos de desenho explícitos. Não dependem de referências `<use>` externas, fontes de ícones ou inicialização JavaScript. O catálogo, as origens e as licenças estão em `src/assets/icons/skills/`. Os testes verificam pixels efetivamente pintados em viewport móvel, incluindo falha dos arquivos externos de ícones, rotação, rolagem e navegação sem JavaScript.

## Desenvolvimento

Requer Node.js 22.19 ou superior e Python 3 para o servidor estático e as suítes Selenium/Robot.

```bash
npm ci
npm run build
npm run serve
```

Abra `http://127.0.0.1:4173`. Não edite `dist/` diretamente: ele é recriado a cada build.

## Qualidade

```bash
npm run check:js
npm run test:unit
npm audit --audit-level=moderate
npm run test:budget
npm run test:playwright
npm run test:cypress
npm run test:selenium
pip install -r requirements-robot.txt
npm run test:robot
npm run test:lighthouse
```

`npm run test:all` executa as quatro suítes E2E após sintaxe, testes unitários e orçamento. O CI usa Node 22 em pull requests e na `main`, testa Chromium integralmente, executa smokes em Firefox/WebKit e roda Lighthouse três vezes no perfil móvel. O CI também bloqueia vulnerabilidades moderadas ou superiores nas dependências de desenvolvimento. O axe-core verifica página, coleções abertas e modais contra regras WCAG 2.2 AA automatizáveis.

Orçamentos de produção:

- até 8 requisições críticas no build (atualmente 7); o agente de métricas injetado pela hospedagem é verificado separadamente na produção;
- JS e CSS com até 20 KiB Brotli cada;
- HTML, bundles e fontes com até 250 KiB Brotli;
- DOM com até 900 nós;
- Lighthouse: Performance ≥ 95 e Accessibility/Best Practices/SEO = 100;
- LCP ≤ 2,5 s, CLS ≤ 0,05 e TBT ≤ 150 ms.

O Lighthouse usa a mediana das três execuções para Performance, LCP, CLS e TBT. Acessibilidade, boas práticas e SEO precisam alcançar 100 em todas as execuções. Relatórios ficam em `.lighthouseci/`. TBT é uma medição de laboratório; o INP de visitantes reais deve ser consultado no Netlify.

## Teste em Android físico

Com ADB instalado, conecte e autorize a depuração USB, desbloqueie o aparelho e mantenha o Chrome aberto:

```bash
npm run test:android
```

Esse comando abre e fecha apenas uma nova aba no Chrome conectado, testa os fluxos por eventos de toque e grava evidências em `artifacts/android/`. Não reinicia o Chrome nem apaga seus dados. Exige um aparelho físico autorizado; não converte ausência de aparelho em aprovação. Com mais de um aparelho, defina `ANDROID_SERIAL`. `BASE_URL` permite testar outra publicação. Não faz parte do CI.

## Métricas e limites de cobertura

O painel [Real User Monitoring](https://app.netlify.com/projects/douglasqa/logs-and-metrics/rum) apresenta LCP, INP, CLS e FCP por dispositivo e percentil. O agente só é injetado no site de produção quando habilitado no Netlify. Os gráficos dependem de visitas e são agregados por hora; resultados de Lighthouse não substituem esses dados. [Documentação do Netlify](https://docs.netlify.com/manage/monitoring/real-user-monitoring/).

As evidências dos três estudos de caso são registros históricos de execução, com data, escopo e fonte. Os SVGs resumem esses registros; não são capturas de tela nem indicadores de status atual.

Testes automatizados e emulação não garantem funcionamento em todos os aparelhos. A validação manual deve incluir Safari em iPhone físico, leitor de tela (TalkBack/VoiceOver/NVDA), zoom e uso prolongado em redes variadas. O resultado de uma execução deve registrar apenas os ambientes efetivamente utilizados.

## Direitos autorais

Este site, seu conteúdo, código, identidade visual e demais ativos são uma obra pessoal de Douglas Antonio. Todos os direitos são reservados. Cópia, redistribuição, comercialização ou criação de trabalhos derivados exigem autorização prévia e expressa do autor.

[Douglas Antonio](https://www.linkedin.com/in/douglas-antonio-qa/) © 2026 — Engenharia de Qualidade Escalável.
