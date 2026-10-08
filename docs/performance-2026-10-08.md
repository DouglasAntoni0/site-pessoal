# Renderização durante rolagem e interações

Os dois certificados Udemy e a redução dos efeitos contínuos foram publicados em 08/10/2026, na versão `75b9d9c86bf4ffc1d24a917e6fe1a9c0e4f64b64`, em https://douglasqa.netlify.app/. O deploy havia sido ignorado por falta de créditos em 03/10; após a renovação, foi executado novamente e a versão foi conferida em `deployment.json`.

## Causa e correção

Gradientes de texto e borda, sombras pulsantes e grandes fundos animados provocavam repinturas e processamento contínuo. No diagnóstico de 03/10, pausar somente quatro desses efeitos no navegador eliminou as repinturas em repouso e reduziu o trabalho da thread principal durante a rolagem em aproximadamente 49%, sem substituir conteúdo nem respostas de rede.

Na correção publicada, gradientes, sombras e fundo permanecem estáticos. Os ornamentos restantes usam transformação/opacidade e pausam quando seus elementos saem da viewport. A rolagem suave, o feedback dos botões e as entradas curtas permanecem disponíveis, respeitando movimento reduzido, touch e economia de dados.

## Comparação antes/depois

Três rodadas por versão, Chrome instalado em modo headless, viewport 1920 × 1080, DPR 2, aproximadamente quatro segundos por fase. Rolagem: 32 eventos de roda de 120 px, espaçados por 100 ms. A medição usa eventos `Paint` do trace CDP e a diferença de `TaskDuration` da thread principal. Valores abaixo são medianas.

| Medida | Antes, `61ebf31` em 03/10 | Depois, `75b9d9c` em 08/10 |
| --- | ---: | ---: |
| Repinturas com a página parada | 1.440 | 0 |
| Trabalho da thread principal em repouso | 1.593,862 ms | 359,745 ms |
| Repinturas durante a rolagem | 1.376 | 136 |
| Trabalho da thread principal durante a rolagem | 1.114,663 ms | 411,789 ms |
| Tempo de pintura durante a rolagem | 534,089 ms | 25,781 ms |

A comparação registrou aproximadamente 63% menos trabalho da thread principal durante a rolagem e 77% menos em repouso. Nenhum erro JavaScript foi observado nessas rodadas. Houve dois intervalos de frame acima de 50 ms na primeira rolagem posterior, com máximo de 116,8 ms; nas outras duas rodadas posteriores não houve intervalo acima de 50 ms. Portanto, o resultado não significa ausência absoluta de pausas em qualquer ambiente.

São medições de laboratório realizadas em dias diferentes no mesmo computador, não uma medição de INP nem garantia de desempenho em todos os aparelhos. Carga de outros processos e variação do ambiente podem afetar os números. O experimento controlado inicial e a eliminação das repinturas sustentam a causa de renderização identificada. Métricas dos visitantes devem continuar sendo acompanhadas no RUM do Netlify.

## Prevenção de regressões

O teste de movimento em `presentation.spec.js` verifica que animações contínuas usam transformação/opacidade, que efeitos fora da viewport pausam e que o painel inicial retoma ao voltar. Um ornamento parcialmente visível na seção anterior pode continuar animado; a validação usa sua geometria real em vez de assumir que toda animação deve parar ao chegar ao contato.

Os testes de certificados verificam os 18 cursos, carregamento das prévias, disponibilidade dos originais e os dados e SHA-256 dos dois novos arquivos. As referências visuais da seção expandida são separadas por sistema e foram revisadas para a inclusão intencional dos dois cartões. As suítes de navegador continuam usando exclusivamente o endereço público.
