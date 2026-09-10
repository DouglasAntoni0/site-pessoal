// Three dated CI results and seven documented project scopes. Sources checked on 2026-09-10.
export const caseStudies = {
    "modal-1": {
        "featured": true,
        "label": "Performance · k6",
        "problem": "Avaliar o comportamento de APIs sob diferentes volumes de acesso e tornar os limites de aceitação explícitos.",
        "contribution": "Organizei cenários de smoke, carga, stress, spike e soak, com dados reutilizáveis, métricas e thresholds por tipo de teste.",
        "result": "Smoke e Load Test aprovados no GitHub Actions em 03/04/2026. O job de carga executou o teste durante cerca de 20 minutos.",
        "scope": "Essa execução também aprovou quatro testes de funcionalidades do k6. Stress e REST API foram ignorados nessa execução. Limites configurados não representam latências medidas.",
        "outcome": "Smoke e carga aprovados",
        "date": "03/04/2026",
        "runUrl": "https://github.com/DouglasAntoni0/Projeto-completo-k6/actions/runs/23960586197",
        "sourceUrl": "https://github.com/DouglasAntoni0/Projeto-completo-k6/blob/d6134adb51058350d22b4870da3501c48343083f/tests/types/load-test.js",
        "image": "assets/evidence/k6-ci.svg",
        "imageAlt": "Resumo da execução k6 de 03/04/2026: Smoke e Load Test aprovados; Stress e REST API ignorados."
    },
    "modal-3": {
        "featured": true,
        "label": "Web + API · Playwright",
        "problem": "Validar login, leads, filmes e séries de uma plataforma de streaming, com dados de teste independentes.",
        "contribution": "Estruturei Actions/Page Objects e fixtures, preparação por API e PostgreSQL, com aplicação e banco iniciados no pipeline.",
        "result": "22 testes aprovados em 16,4 segundos na execução de 09/07/2026, conforme o log do GitHub Actions.",
        "scope": "O tempo é o da suíte nessa execução. Não representa desempenho da aplicação nem garante o mesmo resultado em outra versão ou navegador.",
        "outcome": "22 testes aprovados",
        "date": "09/07/2026",
        "runUrl": "https://github.com/DouglasAntoni0/playwrightcomplete/actions/runs/29051662124",
        "sourceUrl": "https://github.com/DouglasAntoni0/playwrightcomplete/blob/84193b174bd85d867c1edb996eca5cc4ebbdb0ce/projects/zombieplus/tests/e2e/movies.spec.js",
        "image": "assets/evidence/playwright-ci.svg",
        "imageAlt": "Resumo da execução Playwright de 09/07/2026: 22 testes aprovados em 16,4 segundos."
    },
    "modal-4": {
        "featured": true,
        "label": "Mobile · Android",
        "problem": "Exercitar componentes e gestos de um aplicativo Android de forma repetível, incluindo login, seleção e swipe.",
        "contribution": "Implementei a trilha Yodapp com WebdriverIO e Appium, configuração de emulador Android e execução no GitHub Actions.",
        "result": "7 de 7 arquivos de teste aprovados em 3 minutos e 37 segundos na execução Android de 11/07/2026.",
        "scope": "O resultado pertence à trilha JavaScript do Yodapp em emulador Android. Não é uma validação de iPhone, aparelho físico ou de todas as trilhas do repositório.",
        "outcome": "7 arquivos de teste aprovados",
        "date": "11/07/2026",
        "runUrl": "https://github.com/DouglasAntoni0/QAx-Mobile/actions/runs/29164974739",
        "sourceUrl": "https://github.com/DouglasAntoni0/QAx-Mobile/blob/b2faa58320935592c54b9aab47c8ca84f2555436/projects-javascript/yodapp-robot/tests/swipe.spec.js",
        "image": "assets/evidence/mobile-ci.svg",
        "imageAlt": "Resumo da execução Yodapp de 11/07/2026: 7 arquivos de teste aprovados em emulador Android, em 3 minutos e 37 segundos."
    },
    "modal-2": {
        "label": "Web e API · Cypress",
        "problem": "Validar a interface e as APIs com dados de teste organizados e um ambiente reproduzível.",
        "contribution": "Estruturei a automação com Cypress, preparação de dados e apoio de PostgreSQL e Docker.",
        "result": "O repositório documenta a arquitetura, os cenários web e de API e os comandos de execução.",
        "sourceUrl": "https://github.com/DouglasAntoni0/ninjadocypress/blob/119e96ae0f7b3f6885a6f7a02309b2186ae485c9/README.md"
    },
    "modal-5": {
        "label": "IA aplicada · Playwright",
        "problem": "Gerar dados sintéticos válidos e investigar a recuperação controlada de seletores em um formulário de demonstração.",
        "contribution": "Integrei a geração de dados à API da OpenAI, com validação de contrato e registro das tentativas de recuperação de seletores.",
        "result": "A documentação apresenta a prova de conceito, a validação dos dados e o uso de seletores alternativos conhecidos. A recuperação depende das alternativas disponíveis.",
        "sourceUrl": "https://github.com/DouglasAntoni0/automacao-inteligente-qa/blob/8970fb1761f82ccb202fafdd127c26e4cfadedea/README.md"
    },
    "modal-6": {
        "label": "Qualidade do portfólio",
        "problem": "Detectar regressões de conteúdo, navegação, acessibilidade e apresentação no próprio site publicado.",
        "contribution": "Organizei testes com Cypress, Playwright, Robot Framework, Selenium WebDriver e Appium em Android virtual, além de verificações de desempenho e links.",
        "result": "A documentação relaciona as suítes e seus relatórios. Os testes de navegador acessam o site público e o CI confere a versão publicada antes de executá-los.",
        "sourceUrl": "https://github.com/DouglasAntoni0/site-pessoal/blob/8f1bbee3320df99875ffcabdf3c775e8df4f1df3/README.md"
    },
    "modal-7": {
        "label": "Python · Domínio, API e interface",
        "problem": "Validar regras de tarefas, persistência e operações da API de um gerenciador em Python.",
        "contribution": "Organizei testes parametrizados, fixtures e verificações de domínio, armazenamento JSON, API Flask e interface web.",
        "result": "A documentação mapeia os testes às camadas da aplicação e descreve os casos de erro e as transições de estado.",
        "sourceUrl": "https://github.com/DouglasAntoni0/pytest/blob/b981e0114c725fe0714b300ca9ef7a31694aa897/README.md"
    },
    "modal-8": {
        "label": "Comércio eletrônico · Selenium",
        "problem": "Validar a jornada de compra e as mensagens de erro da aplicação Toolshop.",
        "contribution": "Estruturei Page Objects, dados dinâmicos e esperas explícitas para login, catálogo, carrinho, pagamento e contato.",
        "result": "O repositório relaciona os cenários implementados e documenta a arquitetura e a geração de relatórios.",
        "sourceUrl": "https://github.com/DouglasAntoni0/selenium/blob/419507f16020db4a097803e6225ed983b1a5873f/README.md"
    },
    "modal-9": {
        "label": "BDD · Cucumber",
        "problem": "Descrever e validar regras de compra e cupons em uma linguagem compartilhada com negócio e desenvolvimento.",
        "contribution": "Escrevi cenários em Gherkin em português e organizei as interações com Ruby, Cucumber, Capybara e Page Objects.",
        "result": "A documentação apresenta os cenários de catálogo, pedidos e cupons, junto às instruções de execução.",
        "sourceUrl": "https://github.com/DouglasAntoni0/BDD-cucumber/blob/d82b3feea92a5d99ed487cbb327847c6cfd0fa75/README.md"
    },
    "modal-10": {
        "label": "Voluntariado · SouJunior",
        "problem": "Identificar regressões de navegação, conteúdo e apresentação na plataforma pública da SouJunior.",
        "contribution": "Criei uma suíte independente com Cypress e Playwright, organizando cenários e registros de falhas com evidências.",
        "result": "A documentação descreve os fluxos cobertos, a organização da suíte e a interpretação das falhas encontradas.",
        "sourceUrl": "https://github.com/DouglasAntoni0/Testes-E2E-SouJunior/blob/2eadc830f6c7b8b3396bb7891caee958537cbd9b/README.md"
    }
};
