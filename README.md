# Douglas QA

Código do site pessoal de Douglas Antonio, Software Quality Engineer. Reúne projetos de automação, estudos de caso, competências, certificados e currículo para download.

[Site publicado](https://douglasqa.netlify.app/) · [Execuções de qualidade](https://github.com/DouglasAntoni0/site-pessoal/actions/workflows/e2e-tests.yml) · [Currículo em PDF](https://douglasqa.netlify.app/assets/Douglas_Antonio_QA_Engineer.pdf)

## Visão geral

A aplicação é estática: o build gera o conteúdo em HTML, e o JavaScript acrescenta navegação, modais e efeitos de interação. Coleções usam `<details>` nativo; links para repositórios, certificados e currículo continuam disponíveis sem JavaScript.

O layout se adapta a celulares, tablets e desktops. Animações contínuas são desativadas em telas compactas, dispositivos touch e com `prefers-reduced-motion`. As verificações automatizadas incluem navegação por teclado, conteúdo sem JavaScript, ausência de rolagem horizontal e carregamento dos recursos.

## Executar localmente

Requisitos: **Node.js 22 e npm**, além de **Python 3** disponível como `python` no `PATH`. O CI usa Node 22 e Python 3.11 para o Robot Framework.

```bash
npm ci
npm run build
npm run serve
```

Abra [http://127.0.0.1:4173](http://127.0.0.1:4173). Após alterar os fontes, execute `npm run build` novamente e atualize o navegador. O servidor serve `dist/`, que é recriado a cada build.

## Organização do projeto

| Caminho | Responsabilidade |
| --- | --- |
| [`src/index.html`](src/index.html) | Estrutura semântica, textos principais, navegação e contatos. |
| [`src/styles/`](src/styles/) | Estilos, componentes, breakpoints e preferências de movimento. |
| [`src/scripts/`](src/scripts/) | Navegação, modais e animações nativas. |
| [`src/data/`](src/data/) | Projetos, competências, certificados e estudos de caso. |
| [`src/assets/`](src/assets/) | Fontes locais, ícones e respectivas licenças. |
| [`assets/`](assets/) | Currículo, certificados originais e evidências dos projetos. |
| [`scripts/`](scripts/) | Build, geração de conteúdo, limites de tamanho e Lighthouse. |
| [`tests/`](tests/) | Testes unitários, suítes de navegador e validação Android. |
| [`netlify.toml`](netlify.toml) | Build de produção, cache e cabeçalhos de segurança. |
| `dist/` | Saída gerada, ignorada pelo Git e publicada no Netlify. |

O [build](scripts/build-static.mjs) minifica o HTML, agrupa CSS e JavaScript com esbuild e coloca hashes nos nomes dos bundles e fontes. Os dados completos dos projetos são carregados na primeira abertura de um modal. Prévias WebP dos certificados são geradas com Sharp; os arquivos originais permanecem disponíveis.

Fontes, ícones e código da interface são locais. As animações usam Web Animations API, um `IntersectionObserver` compartilhado e um agendador de `requestAnimationFrame` para atualizações de rolagem e interação.

### Ícones das competências

Os 62 ícones são SVGs completos inseridos no HTML durante o build, com dimensões e atributos de desenho explícitos. Sua exibição independe de referências `<use>` externas, fontes de ícones ou inicialização JavaScript.

O [catálogo de ícones](src/assets/icons/skills/README.md) documenta os vetores de contorno, as marcas das ferramentas e suas licenças. Os testes verificam pixels efetivamente desenhados em tela móvel, incluindo bloqueio dos arquivos externos de ícones, rotação, rolagem e navegação sem JavaScript.

## Atualizar conteúdo

| Alteração | Onde editar |
| --- | --- |
| Textos, contatos e links principais | [`src/index.html`](src/index.html) |
| Projetos e participação voluntária | [`src/data/projects.js`](src/data/projects.js) |
| Estudos de caso e evidências | [`src/data/case-studies.js`](src/data/case-studies.js) e `assets/evidence/` |
| Certificados | [`src/data/certificates.js`](src/data/certificates.js) e `assets/certificates/` |
| Competências e categorias | [`src/data/skills.js`](src/data/skills.js) |
| Ícones das competências | `src/assets/icons/skills/` e seu registro de origens em `sources.json` |
| Currículo | [`assets/Douglas_Antonio_QA_Engineer.pdf`](assets/Douglas_Antonio_QA_Engineer.pdf) |

Para trocar o currículo, substitua o PDF mantendo o caminho acima. Isso preserva o botão de download e os links já compartilhados. Para adicionar um certificado, inclua o original em `assets/certificates/` e cadastre seus dados; as prévias WebP de imagens PNG são geradas automaticamente.

Depois de atualizar conteúdo, gere `dist/`, confira os links e execute as verificações correspondentes à alteração. As evidências dos estudos de caso devem manter data, escopo e referência à execução ou ao commit original: são registros históricos, não indicadores do estado atual dos projetos.

## Testes e qualidade

### Preparar as ferramentas

Depois de `npm ci`, instale os navegadores do Playwright e as dependências do Robot Framework. As suítes Selenium/Robot precisam do Chrome disponível no computador. O Lighthouse usa o Chromium instalado pelo Playwright, cuja revisão acompanha o `package-lock.json`, com um perfil temporário novo por execução.

```bash
npx playwright install chromium firefox webkit
python -m pip install -r requirements-robot.txt
```

No Linux, use `npx playwright install --with-deps chromium firefox webkit` para incluir as bibliotecas do sistema exigidas pelos navegadores, como no CI. Caso o executável do Cypress não tenha sido baixado durante a instalação, execute `npx cypress install`.

### Comandos

| Comando | Verificação |
| --- | --- |
| `npm run check:js` | Sintaxe dos módulos e scripts listados em `package.json`. |
| `npm run test:unit` | Testes unitários, incluindo a política de avaliação do Lighthouse. |
| `npm audit --audit-level=moderate` | Vulnerabilidades moderadas ou superiores nas dependências. |
| `npm run test:budget` | Build e limites de tamanho e requisições críticas. |
| `npm run test:playwright` | Suíte completa em Chromium e testes `@smoke` em Firefox/WebKit. |
| `npm run test:cypress` | Conteúdo, navegação e fluxos da interface. |
| `npm run test:selenium` | Fluxos e geometria em dimensões de desktop, tablet e celular. |
| `npm run test:robot` | Cenários E2E com Robot Framework e SeleniumLibrary. |
| `npm run test:lighthouse` | Três medições no perfil móvel e avaliação dos limites. |
| `npm run test:all` | Sintaxe, testes unitários, orçamento e as quatro suítes E2E. |

As suítes E2E e o Lighthouse geram o build e iniciam seus servidores locais. Execute-os sequencialmente, pois compartilham `dist/` e diretórios de resultados. Auditoria de dependências, Lighthouse e Android têm comandos próprios, executados separadamente de `test:all`.

O [workflow Quality gates](.github/workflows/e2e-tests.yml) executa seis etapas em pull requests, pushes na `main` e acionamento manual: build e orçamentos, Playwright, Cypress, Selenium, Robot e Lighthouse. Os resultados de cada commit ficam no [GitHub Actions](https://github.com/DouglasAntoni0/site-pessoal/actions/workflows/e2e-tests.yml).

### Relatórios

| Ferramenta | Saída local |
| --- | --- |
| Playwright | `playwright-report/index.html` e `test-results/`, com rastros e capturas das falhas. |
| Cypress | Resultado no terminal e capturas de falha em `cypress/screenshots/`. |
| Selenium | Resultado no terminal. |
| Robot Framework | `test-results/robot/log.html`, `report.html` e `output.xml`. |
| Lighthouse | `.lighthouseci/run-*.html`, `run-*.json` e `assessment.json`; em caso de erro, `failure.json` e logs disponíveis do navegador. |
| Android físico | `artifacts/android/report.json` e capturas de tela. |

O CI disponibiliza relatórios de Playwright, Robot e Lighthouse como artefatos, com retenção configurada de sete dias. Abra o relatório local do Playwright com `npx playwright show-report`.

### Limites de desempenho

| Medida | Limite |
| --- | --- |
| Requisições críticas identificadas no build | Até 8 |
| JavaScript e CSS | Até 20 KiB Brotli cada |
| HTML, bundles, fontes e ícones críticos | Até 250 KiB Brotli no total |
| Elementos do DOM no carregamento inicial | Até 900 |
| Lighthouse Performance | Mediana ≥ 95 |
| Lighthouse Accessibility, Best Practices e SEO | 100 em cada execução |
| LCP | Mediana ≤ 2,5 s |
| CLS | Mediana ≤ 0,05 |
| TBT | Mediana ≤ 150 ms |

Os limites são definidos em [`scripts/check-budgets.mjs`](scripts/check-budgets.mjs), [`scripts/lighthouse-policy.mjs`](scripts/lighthouse-policy.mjs) e nos testes Playwright. O Lighthouse usa três execuções; os arquivos completos permitem conferir a variação entre elas. O agente de métricas da hospedagem é verificado separadamente dos recursos gerados pelo build.

### Android físico

Com ADB instalado, conecte o aparelho, autorize a depuração USB, desbloqueie a tela e mantenha o Chrome visível:

```bash
npm run test:android
```

O teste usa o site publicado por padrão, abre uma aba própria no Chrome e a fecha ao terminar. Verifica fluxos por eventos de toque e grava evidências em `artifacts/android/`. Exige um aparelho físico autorizado; ausência de dispositivo é tratada como falha. Com mais de um aparelho conectado, defina `ANDROID_SERIAL`. A variável `BASE_URL` permite escolher outra publicação. Esse teste é executado manualmente, fora do CI.

## Publicação e métricas

O Netlify publica `dist/` após executar `npm run build`, conforme [`netlify.toml`](netlify.toml). Bundles com hash recebem cache imutável; HTML e ícones usam revalidação. O mesmo arquivo configura CSP e os demais cabeçalhos de segurança.

Em produção, o Netlify pode injetar o agente assíncrono de Real User Monitoring. A CSP permite a origem do agente e o endpoint de coleta observado pelo projeto. O [painel RUM](https://app.netlify.com/projects/douglasqa/logs-and-metrics/rum) reúne métricas reais como LCP, INP, CLS e FCP, com filtros por dispositivo e percentil. Os gráficos dependem de visitas e são atualizados em intervalos de uma hora. Consulte a [documentação do Netlify](https://docs.netlify.com/manage/monitoring/real-user-monitoring/).

Resultados de Lighthouse são medições de laboratório; o INP e a experiência dos visitantes devem ser acompanhados no RUM. Os testes de acessibilidade com axe-core cobrem regras WCAG 2.2 AA automatizáveis. A validação manual complementa essa cobertura com Safari em iPhone físico, leitores de tela, zoom e uso prolongado em redes variadas. Cada relatório deve registrar os ambientes efetivamente utilizados.

## Direitos e licenças

O código e o conteúdo autoral de Douglas Antonio têm todos os direitos reservados. Cópia, redistribuição, comercialização ou criação de trabalhos derivados exigem autorização prévia e expressa do autor.

Fontes, bibliotecas e ícones de terceiros mantêm suas próprias licenças. As atribuições dos ícones estão no [catálogo de competências](src/assets/icons/skills/README.md), e as licenças das fontes estão em [`src/assets/fonts/`](src/assets/fonts/).

[Douglas Antonio](https://www.linkedin.com/in/douglas-antonio-qa/) © 2026
