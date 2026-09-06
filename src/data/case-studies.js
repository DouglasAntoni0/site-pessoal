// Historical execution evidence, checked on 2026-09-06. These are not live status badges.
export const caseStudies = {
    'modal-1': {
        label: 'Performance · k6',
        problem: 'Avaliar o comportamento de APIs sob diferentes volumes de acesso e tornar os limites de aceitação explícitos.',
        contribution: 'Organizei cenários de smoke, carga, stress, spike e soak, com dados reutilizáveis, métricas e thresholds por tipo de teste.',
        result: 'Smoke e Load Test aprovados no GitHub Actions em 03/04/2026. O job de carga executou o teste durante cerca de 20 minutos.',
        scope: 'Essa execução também aprovou quatro testes de funcionalidades do k6. Stress e REST API foram ignorados nessa execução. Limites configurados não representam latências medidas.',
        outcome: 'Smoke e carga aprovados',
        date: '03/04/2026',
        runUrl: 'https://github.com/DouglasAntoni0/Projeto-completo-k6/actions/runs/23960586197',
        sourceUrl: 'https://github.com/DouglasAntoni0/Projeto-completo-k6/blob/d6134adb51058350d22b4870da3501c48343083f/tests/types/load-test.js',
        image: 'assets/evidence/k6-ci.svg',
        imageAlt: 'Resumo da execução k6 de 03/04/2026: Smoke e Load Test aprovados; Stress e REST API ignorados.'
    },
    'modal-3': {
        label: 'Web + API · Playwright',
        problem: 'Validar login, leads, filmes e séries de uma plataforma de streaming, com dados de teste independentes.',
        contribution: 'Estruturei Actions/Page Objects e fixtures, preparação por API e PostgreSQL, com aplicação e banco iniciados no pipeline.',
        result: '22 testes aprovados em 16,4 segundos na execução de 09/07/2026, conforme o log do GitHub Actions.',
        scope: 'O tempo é o da suíte nessa execução. Não representa desempenho da aplicação nem garante o mesmo resultado em outra versão ou navegador.',
        outcome: '22 testes aprovados',
        date: '09/07/2026',
        runUrl: 'https://github.com/DouglasAntoni0/playwrightcomplete/actions/runs/29051662124',
        sourceUrl: 'https://github.com/DouglasAntoni0/playwrightcomplete/blob/84193b174bd85d867c1edb996eca5cc4ebbdb0ce/projects/zombieplus/tests/e2e/movies.spec.js',
        image: 'assets/evidence/playwright-ci.svg',
        imageAlt: 'Resumo da execução Playwright de 09/07/2026: 22 testes aprovados em 16,4 segundos.'
    },
    'modal-4': {
        label: 'Mobile · Android',
        problem: 'Exercitar componentes e gestos de um aplicativo Android de forma repetível, incluindo login, seleção e swipe.',
        contribution: 'Implementei a trilha Yodapp com WebdriverIO e Appium, configuração de emulador Android e execução no GitHub Actions.',
        result: '7 de 7 arquivos de teste aprovados em 3 minutos e 37 segundos na execução Android de 11/07/2026.',
        scope: 'O resultado pertence à trilha JavaScript do Yodapp em emulador Android. Não é uma validação de iPhone, aparelho físico ou de todas as trilhas do repositório.',
        outcome: '7 arquivos de teste aprovados',
        date: '11/07/2026',
        runUrl: 'https://github.com/DouglasAntoni0/QAx-Mobile/actions/runs/29164974739',
        sourceUrl: 'https://github.com/DouglasAntoni0/QAx-Mobile/blob/b2faa58320935592c54b9aab47c8ca84f2555436/projects-javascript/yodapp-robot/tests/swipe.spec.js',
        image: 'assets/evidence/mobile-ci.svg',
        imageAlt: 'Resumo da execução Yodapp de 11/07/2026: 7 arquivos de teste aprovados em emulador Android, em 3 minutos e 37 segundos.'
    }
};
