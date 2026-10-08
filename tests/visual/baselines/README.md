# Referências visuais

As imagens foram capturadas exclusivamente em https://douglasqa.netlify.app/,
com fontes carregadas. A apresentação inicial usa movimento normal, congelado
na captura, para incluir os halos; os demais estados usam movimento reduzido.
Desktop: 1440 × 900; mobile:
390 × 844; DPR 1. O diretório separa a renderização por sistema operacional.

As primeiras referências Linux foram revisadas a partir do Actions
[34407860374](https://github.com/DouglasAntoni0/site-pessoal/actions/runs/34407860374),
com a publicação `64a1281da813b2881fd4bca9cae8db66db229b55`.
Elas incluem a correção que mantém a imagem inteira dentro do modal de certificado.

A revisão de texto, cores e navegação foi capturada em 11/09/2026, com a publicação
`0d5543172352cfedbd8c5269a2b144ec7773e9ba`. As referências Linux foram revisadas
a partir do Actions [34642486157](https://github.com/DouglasAntoni0/site-pessoal/actions/runs/34642486157),
e as referências Windows foram capturadas da mesma publicação.

A identificação dos projetos como uma seleção do site foi revisada na publicação
`4473fb28562f9071823d49dbabc942470e5eec3b`. Apenas a referência desktop da seção
inicial mudou: Linux no Actions [34645173431](https://github.com/DouglasAntoni0/site-pessoal/actions/runs/34645173431)
e Windows na mesma publicação.

Os certificados Postman e Javascript para QAs foram revisados em 08/10/2026,
na publicação `75b9d9c86bf4ffc1d24a917e6fe1a9c0e4f64b64`. Apenas as referências
de certificados expandidos em desktop/celular mudaram: Linux no Actions
[37848508380](https://github.com/DouglasAntoni0/site-pessoal/actions/runs/37848508380)
e Windows na mesma publicação. As outras dez capturas permaneceram compatíveis.

A paleta azul-marinho e os cartões mais claros foram revisados em 08/10/2026,
a partir da alteração `23330320b53770ba985db94dd59cfe48c20be180`.
As doze referências de cada plataforma foram recapturadas e revisadas:
Windows no site público e Linux no Actions
[37854871266](https://github.com/DouglasAntoni0/site-pessoal/actions/runs/37854871266),
com a publicação `30f715af64204d4f1516f817fd359a6320506e49` confirmada.
O gerador manual usa `--update-snapshots=all` para renovar todas as imagens,
inclusive alterações de cores que permaneçam dentro da tolerância de comparação.

A recuperação do contraste, dos gradientes por categoria e da iluminação da
apresentação inicial foi revisada em 08/10/2026, na publicação
`60e52de9005a751cdcbdf13c10d6385210f7c8e3`. As doze referências Windows foram
capturadas no site público e as doze Linux no Actions
[37857475818](https://github.com/DouglasAntoni0/site-pessoal/actions/runs/37857475818),
com o mesmo commit publicado confirmado. A revisão inclui desktop, celular,
menu, os dois modais, competências e certificados expandidos.

A execução normal compara os pixels e não atualiza os arquivos. Mudanças
intencionais precisam de nova captura e revisão antes de substituir a referência.
O cabeçalho fixo é ocultado apenas nas capturas das seções longas; ele é
verificado separadamente e permanece nas capturas da viewport e dos modais.
