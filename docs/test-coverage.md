# Matriz de testes do site público

Alvo único: **https://douglasqa.netlify.app/**. As suítes antigas e novas não iniciam servidor da aplicação. Verificações de sintaxe, dependências, build e política de desempenho são análises do repositório, sem navegação.

## Casos automatizados

| Área | Cenários e resultado esperado | Implementação |
| --- | --- | --- |
| Carregamento | Título, conteúdo, quantidade de cards/ícones, ausência de erro de execução e recursos inesperados | `portfolio.spec.js`, Cypress, Selenium, Robot |
| Responsividade | 11 dimensões de 280 a 1920 px; título abaixo do cabeçalho, sem overflow; rotação sem reload | `portfolio.spec.js`; Selenium/Cypress em dimensões adicionais |
| Coleções | Abrir/fechar projetos e certificados por teclado e ponteiro, preservar itens ocultos | `experience.spec.js` |
| Projetos | Todos os 10 projetos, textos, código, repositório e dez estudos de caso (três com execuções históricas); imagens sob demanda | `audit.spec.js`, `experience.spec.js` |
| Certificados | Todos os 16 certificados, prévias carregadas, originais HTTP 200, PDF Maestro reconhecido | `audit.spec.js` |
| Ícones | Todos os 62 SVGs pintados; bloqueio de arquivos de ícones, sem JavaScript, rotação e histórico | `icons.spec.js` |
| Currículo | Download pelo botão, conteúdo PDF, tipo HTTP, nome e SHA-256 iguais ao documento versionado | REG-01 |
| Links internos e metadados | IDs únicos, âncoras existentes, URL canônica, idioma, descrição, contatos e proteção de nova aba | REG-02 |
| Rolagem suave | Menu completo, logo e ações da apresentação percorrem posições intermediárias nos dois sentidos, por clique ou teclado; destino abaixo do cabeçalho em desktop e celular | `navigation.spec.js` |
| Hospedagem | HTTPS público, CSP, anti-sniffing, proteção contra frames, revalidação do HTML, cache imutável e recurso inexistente 404 | REG-03 |
| Teclado | Link de salto transfere a navegação para o conteúdo; Espaço, Enter, Tab, Shift+Tab e Escape | REG-04, REG-06, `audit.spec.js` |
| Menu | Clique, Escape, fora do menu, link; foco inicial; breakpoint 960/961 px; último link em tela baixa com texto ampliado | REG-05, `portfolio.spec.js`, `audit.spec.js` |
| Modais | Botão e fundo fecham cada modal; foco devolvido; bloqueio do conteúdo de fundo removido; um único modal ativo | REG-06 |
| Concorrência | Dois projetos aguardando rede mostram o último pedido; certificado cancela projeto pendente; Escape cancela abertura | REG-07, REG-08, `experience.spec.js` |
| Rede indisponível | Falha real induzida no navegador preserva link de fallback; conexão restaurada e reload recuperam detalhes reais | REG-09, `experience.spec.js` |
| Preview lento ou ausente | Estado de carregamento, imagem real ao liberar rede, mensagem de erro e link original; recuperação | REG-10, `audit.spec.js` |
| Fontes ausentes | Texto e vetores permanecem utilizáveis sem fontes web; menu funcional; sem overflow | REG-11 |
| APIs opcionais | Sem IntersectionObserver, ResizeObserver e Element.animate, conteúdo, modais e menu funcionam | REG-12 |
| Apresentação e navegação ativa | Seção atual ao rolar, histórico, âncora inicial, redimensionamento, pressionamento/cancelamento e abertura de coleções com movimento reduzido | `presentation.spec.js` |
| Movimento | Touch sem tilt; movimento reduzido e troca durante a sessão; economia de dados; contadores finais | REG-13, `portfolio.spec.js`, `audit.spec.js` |
| Histórico e cache | Voltar, avançar e recarregar em âncora preservam conteúdo e funções; módulo dos projetos solicitado só uma vez por sessão | REG-14, REG-15, `experience.spec.js` |
| Uso repetido | 20 ciclos alternando projeto/certificado; sem crescimento do DOM, duplicação de modal, foco preso ou erro de execução | REG-15 |
| Acessibilidade automatizada | axe WCAG 2.2 AA: página, coleções expandidas, ambos os modais, menu aberto e mensagem de falha | REG-16, `experience.spec.js` |
| Aparência | Comparação de hero, competências, modal de projeto, modal de certificado, certificados expandidos e navegação, em desktop/celular | `tests/visual/public-site.spec.js` |
| Links externos | Destinos reais extraídos da página e dos modais; HTTP, redirecionamentos, falhas e bloqueios separados | `scripts/check-public-links.mjs` |
| Código executado | JavaScript real do site em Chromium; mapas conferidos por conteúdo; relatório dos cinco módulos e limites mínimos | `scripts/run-coverage.mjs` |
| Desempenho | Três medições Lighthouse no site público; limites originais de performance, LCP, CLS, TBT, SEO, boas práticas e acessibilidade | `scripts/run-lighthouse.mjs` |
| Android físico | Chrome do aparelho, toques, hero, menu, projetos, certificado, contatos e erros; modelo/versão/capturas registrados | `tests/android/site.android.mjs` |
| Android virtual | Appium/UiAutomator2 e Chrome em Android API 35: sete jornadas; todos os projetos e certificados, navegação, currículo, recarga e texto ampliado | `tests/appium/site.appium.mjs`, job Appium no Actions |

Os 51 testes funcionais Playwright são executados integralmente nos três motores: **153 execuções**, sem reduzir Firefox/WebKit a smoke tests. Os 12 casos visuais são comparações separadas. Cypress, Selenium e Robot preservam suas suítes existentes. Os testes de falha abortam ou atrasam requisições reais da publicação; não fornecem respostas falsas de sucesso.

A medição de posições intermediárias da rolagem usa DPR 1 e executa seus dois cenários sequencialmente por motor, para reduzir interferência da renderização no tempo da animação. Os demais testes mantêm a escala original de cada dispositivo. O Appium aguarda a chegada à âncora antes de capturar a tela ou iniciar outra ação.

No CI, a suíte WebKit inteira roda em macOS 15; Chromium e Firefox rodam em Ubuntu 24.04. WebKit no macOS representa a composição gráfica da plataforma do Safari, enquanto a versão para Linux apresentou amostras insuficientes durante as animações nativas de rolagem.

## Casos manuais complementares

Todos usam a mesma URL pública. Preencher dispositivo, navegador/versão, data, resultado e evidência ao executar; a presença nesta matriz não significa aprovação.

| ID | Procedimento | Resultado esperado | Automação e limite |
| --- | --- | --- | --- |
| MAN-01 | iPhone físico: Safari, retrato/paisagem, abrir menu e os dois modais, baixar currículo, voltar à página | Conteúdo legível, controles tocáveis, download/visualização do PDF e foco corretos | Pendente de aparelho; WebKit automatizado não equivale a iPhone real |
| MAN-02 | Android físico: executar `npm run test:android`; repetir com fonte do sistema ampliada | Sem corte ou travamento; fluxos completos por toque | Script cobre configuração corrente; fonte do sistema exige conferência adicional |
| MAN-03 | NVDA + Chrome/Firefox: navegar por títulos, regiões, link de salto, coleções e diálogos | Anúncios e ordem de leitura coerentes; fundo do modal inacessível; foco restaurado | Exige escuta e julgamento humano |
| MAN-04 | TalkBack/Android e VoiceOver/iPhone: explorar e ativar controles por gestos | Nome, função, estado e alternativas dos documentos anunciados | Exige leitores de tela reais |
| MAN-05 | Zoom real do navegador a 200% e 400%, texto ampliado pelo sistema e teclado virtual | Conteúdo e ações acessíveis, sem sobreposição que impeça a interação | CSS a 200% automatizado não substitui todas essas configurações |
| MAN-06 | Aparelho com pouca memória: alternar aplicativos, bloquear/desbloquear e voltar ao site | Página utilizável ao retornar, sem controles presos | Não provado pela emulação de viewport |
| MAN-07 | Wi-Fi/4G instáveis: trocar rede durante download e abertura de certificado | Alternativa utilizável em erro e recuperação após recarregar | Falhas controladas automatizadas cobrem parte das combinações |
| MAN-08 | Usar o site por 30 minutos, alternando navegação, orientação e modais | Sem degradação progressiva perceptível, registro de memória e erros | 20 ciclos automatizados não são ensaio prolongado de todos os aparelhos |
| MAN-09 | Abrir destinos marcados como inconclusivos em `artifacts/links/report.json` | Página correta ou defeito documentado | Bloqueio de robô/autenticação não conta como aprovação |
| MAN-10 | Conferir contraste percebido, identidade visual, clareza dos textos e imagens em telas reais | Leitura confortável, hierarquia clara e imagens corretas | Pixels e axe não avaliam toda a qualidade visual |

## Interpretação dos resultados

O CI registra o SHA publicado antes dos testes da main. Não se deve usar um resultado da versão anterior como aprovação de uma alteração ainda não publicada. Os artefatos do Actions documentam ambiente, falhas e medições; casos físicos/manuais só são considerados executados quando têm evidência própria.

Cobertura de código mede trechos executados, não todas as combinações de entrada. Da mesma forma, 153 execuções em três motores não representam todos os navegadores, sistemas, redes e dispositivos existentes. Novos recursos e defeitos encontrados devem ampliar esta matriz.
