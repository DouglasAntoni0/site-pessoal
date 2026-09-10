# Douglas QA

Código do site pessoal de Douglas Antonio, Software Quality Engineer. Reúne projetos de automação, estudos de caso, competências, certificados e currículo para download.

[Site publicado](https://douglasqa.netlify.app/) · [Execuções de qualidade](https://github.com/DouglasAntoni0/site-pessoal/actions/workflows/e2e-tests.yml) · [Currículo em PDF](https://douglasqa.netlify.app/assets/Douglas_Antonio_QA_Engineer.pdf)

## Visão geral

A aplicação é estática: o build gera o conteúdo em HTML, e o JavaScript acrescenta navegação, modais e efeitos de interação. Coleções usam `<details>` nativo; links para repositórios, certificados e currículo continuam disponíveis sem JavaScript.

O layout se adapta a celulares, tablets e desktops. Animações contínuas são desativadas em telas compactas, dispositivos touch e com `prefers-reduced-motion`. As verificações automatizadas incluem navegação por teclado, conteúdo sem JavaScript, ausência de rolagem horizontal e carregamento dos recursos.

## Preparar o projeto

Requisitos: **Node.js 22 e npm**, além de **Python 3** disponível como `python` no `PATH`. O CI usa Node 22 e Python 3.11 para o Robot Framework.

```bash
npm ci
npm run build
```

O build recria `dist/` para publicação no Netlify. Todas as suítes que acessam a aplicação usam exclusivamente [https://douglasqa.netlify.app/](https://douglasqa.netlify.app/). Nenhum comando de teste inicia um servidor da aplicação.

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

Fontes, ícones e código da interface são locais. As animações usam Web Animations API, um `IntersectionObserver` para as entradas de seção e um agendador de `requestAnimationFrame` para atualizações de rolagem e interação.

### Texto e interações

A navegação destaca a seção atual com `aria-current="location"`, inclusive após rolagem, navegação pelo histórico e mudança de tamanho da tela. Botões respondem ao pressionamento; as coleções usam abertura nativa com uma transição curta de opacidade. Movimento reduzido e economia de dados preservam o conteúdo e desativam os movimentos opcionais.

A apresentação usa ciano nas ações principais, títulos claros e cores de categoria nos ícones. Cargas horárias usam vírgula decimal. Todos os projetos apresentam problema, contribuição e evidência; os três destaques incluem resultados históricos de execução, e os demais apontam para documentação em commits identificados. Títulos oficiais dos certificados são preservados.

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

O Playwright está fixado em 1.63.0 para manter seus navegadores compatíveis com o Lighthouse 13.4.1. No Firefox, a configuração declara um mouse de desktop no runner Linux sem periféricos; os contextos de toque continuam usando `hasTouch`. Os cenários de movimento verificam essas capacidades antes de validar os efeitos.

### Comandos

| Comando | Verificação |
| --- | --- |
| `npm run check:js` | Sintaxe dos módulos e scripts listados em `package.json`. |
| `npm run test:unit` | Testes unitários, incluindo a política de avaliação do Lighthouse. |
| `npm audit --audit-level=moderate` | Vulnerabilidades moderadas ou superiores nas dependências. |
| `npm run test:budget` | Build e limites de tamanho e requisições críticas. |
| `npm run test:deployment` | Disponibilidade, hash do HTML e identificação da publicação testada. |
| `npm run test:playwright` | Suíte funcional completa em Chromium, Firefox e WebKit, no site público. |
| `npm run test:cypress` | Conteúdo, navegação e fluxos da interface. |
| `npm run test:selenium` | Fluxos e geometria em dimensões de desktop, tablet e celular. |
| `npm run test:robot` | Cenários E2E com Robot Framework e SeleniumLibrary. |
| `npm run test:lighthouse` | Três medições no perfil móvel e avaliação dos limites. |
| `npm run test:visual` | Comparação de 12 capturas com referências revisadas, em desktop e celular. |
| `npm run test:coverage` | Cobertura V8 do JavaScript executado no site público, associada aos fontes. |
| `npm run test:links` | Disponibilidade HTTP dos links da página e dos detalhes dos projetos. |
| `npm run test:appium` | Sete jornadas em Chrome de um emulador Android, no site público; job próprio no Actions. |
| `npm run test:all` | Verificações de código e suítes de navegador; Appium e Android físico exigem ambiente Android e têm comandos próprios. |

Playwright, Cypress, Selenium, Robot, visual, cobertura, links, Lighthouse e Android acessam o mesmo site público. A configuração rejeita outra `BASE_URL`. Execute os comandos sequencialmente: o Playwright recria sua pasta de resultados e a medição de desempenho deve rodar sem outros testes de navegador concorrentes no computador.

O [workflow Quality gates](.github/workflows/e2e-tests.yml) executa essas verificações no GitHub Actions. Na `main`, aguarda o Netlify publicar o mesmo SHA em `deployment.json` antes de iniciar as suítes. Em pull requests, os testes de navegador verificam a versão atualmente publicada; não validam uma interface inédita da branch. Análises de código continuam verificando o checkout. O relatório de implantação identifica a versão observada.

A [matriz de cobertura](docs/test-coverage.md) relaciona os cenários automatizados, as simulações de falha e os casos manuais. Testes aprovados não demonstram ausência absoluta de defeitos nem equivalem a testes em todos os aparelhos.

### Relatórios

| Ferramenta | Saída local |
| --- | --- |
| Playwright | `playwright-report/index.html` e `test-results/`, com rastros e capturas das falhas. |
| Cypress | Resultado no terminal e capturas de falha em `cypress/screenshots/`. |
| Selenium | Resultado no terminal. |
| Robot Framework | `artifacts/robot/log.html`, `report.html` e `output.xml`. |
| Regressão visual | `artifacts/visual-report/` e `artifacts/visual-results/`, incluindo imagens esperada, atual e diferença em falhas. |
| Cobertura | `artifacts/coverage/index.html`, `coverage-summary.json` e `measurement.json`. |
| Links | `artifacts/links/report.json`, com aprovados, falhas e verificações inconclusivas separados. |
| Publicação | `artifacts/deployment/verified.json`. |
| Appium Android virtual | `artifacts/appium/report.json`, log e capturas por jornada. |
| Lighthouse | `.lighthouseci/run-*.html`, `run-*.json` e `assessment.json`; em caso de erro, `failure.json` e logs disponíveis do navegador. |
| Android físico | `artifacts/android/report.json` e capturas de tela. |

O CI disponibiliza os relatórios como artefatos, com retenção de sete dias. Os arquivos HTML podem ser abertos após baixar o artefato.

### Referências visuais e cobertura de código

As referências ficam em `tests/visual/baselines/<sistema>/<projeto>/`. O Actions usa Ubuntu 24.04 e a revisão de Chromium do lockfile. Uma execução normal compara as imagens e falha diante de diferenças acima da tolerância de 0,2% dos pixels; nunca atualiza automaticamente as referências. Para uma mudança visual intencional, use o acionamento manual `update_visual_snapshots`, baixe as imagens, revise-as e só então faça commit. Essa execução gera referências; não é uma aprovação da regressão visual. No Windows, as referências são separadas por sistema.

A cobertura usa V8 e os source maps baixados da própria publicação, sem instrumentar ou hospedar uma cópia do site. O JavaScript obtido do navegador precisa ser idêntico, byte a byte, ao bundle público correspondente; os fontes embutidos no mapa também são conferidos com o checkout, normalizando apenas as quebras de linha. Os cinco módulos de `src/scripts/` devem constar no relatório. Limites: 90% de linhas e instruções, 85% de funções e 75% de ramos medidos pelo V8. Os contextos especiais criados separadamente, como o teste sem JavaScript, têm testes funcionais próprios e não entram no percentual coletado nas páginas padrão. Os percentuais não representam a proporção de todos os comportamentos possíveis.

O verificador de links não envia mensagens nem preenche formulários. Respostas de bloqueio ou autenticação são registradas como inconclusivas e exigem revisão manual; não são contadas como links aprovados. Destinos inexistentes ou indisponíveis fazem a verificação falhar.

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

### Android virtual e físico

O CI também executa Appium 3.7.0 com UiAutomator2 8.6.1 em um emulador Android API 35 com Chrome. As dependências ficam isoladas em `tests/appium/`, com lockfile próprio. Os sete fluxos verificam conteúdo, ícones, menu, todos os projetos e certificados, disponibilidade do currículo, recarregamento/contatos e texto ampliado. O relatório registra `physical: false`. A conexão local do Appium controla o emulador; a aplicação continua sendo carregada do Netlify. A suíte exige emulador e não faz parte do comando genérico `test:all`.

Após `npm ci --prefix tests/appium`, execute `npm run prepare:appium`. O UiAutomator2 8.6.1 inclui um shrinkwrap que fixa Morgan 1.11.0; a preparação aplica Morgan 1.12.0 dentro desse pacote e confere as versões realmente instaladas. O Actions executa a preparação e as auditorias de dependências antes de abrir o emulador.

Com ADB instalado, conecte o aparelho, autorize a depuração USB, desbloqueie a tela e mantenha o Chrome visível:

```bash
npm run test:android
```

O teste usa exclusivamente o site público, abre uma aba própria no Chrome e a fecha ao terminar. Verifica fluxos por eventos de toque e grava evidências em `artifacts/android/`. Exige um aparelho físico autorizado; ausência de dispositivo é tratada como falha. Com mais de um aparelho conectado, defina `ANDROID_SERIAL`. Esse teste é executado manualmente, fora do CI. A conexão ADB/CDP local controla o navegador do aparelho; ela não hospeda a aplicação.

## Publicação e métricas

O Netlify publica `dist/` após executar `npm run build`, conforme [`netlify.toml`](netlify.toml). Bundles com hash recebem cache imutável; HTML e ícones usam revalidação. O mesmo arquivo configura CSP e os demais cabeçalhos de segurança.

Em produção, o Netlify pode injetar o agente assíncrono de Real User Monitoring. A CSP permite a origem do agente e o endpoint de coleta observado pelo projeto. O [painel RUM](https://app.netlify.com/projects/douglasqa/logs-and-metrics/rum) reúne métricas reais como LCP, INP, CLS e FCP, com filtros por dispositivo e percentil. Os gráficos dependem de visitas e são atualizados em intervalos de uma hora. Consulte a [documentação do Netlify](https://docs.netlify.com/manage/monitoring/real-user-monitoring/).

Resultados de Lighthouse são medições de laboratório; o INP e a experiência dos visitantes devem ser acompanhados no RUM. Os testes de acessibilidade com axe-core cobrem regras WCAG 2.2 AA automatizáveis. A validação manual complementa essa cobertura com Safari em iPhone físico, leitores de tela, zoom e uso prolongado em redes variadas. Cada relatório deve registrar os ambientes efetivamente utilizados.

## Direitos e licenças

O código e o conteúdo autoral de Douglas Antonio têm todos os direitos reservados. Cópia, redistribuição, comercialização ou criação de trabalhos derivados exigem autorização prévia e expressa do autor.

Fontes, bibliotecas e ícones de terceiros mantêm suas próprias licenças. As atribuições dos ícones estão no [catálogo de competências](src/assets/icons/skills/README.md), e as licenças das fontes estão em [`src/assets/fonts/`](src/assets/fonts/).

[Douglas Antonio](https://www.linkedin.com/in/douglas-antonio-qa/) © 2026
