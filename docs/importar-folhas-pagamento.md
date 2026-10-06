# Importar folhas de pagamento no Portal LAR

Procedimento de referencia para transformar a folha mensal em registro do portal e anexar o PDF original.

## Fluxo usado pelo portal

O modulo fica em `/portal/rh/folha-pagamento`.

1. Ler o PDF e confirmar o periodo pela linha `01/MM/AAAA ... 30/31/MM/AAAA`.
2. Extrair os lancamentos de cada colaborador: proventos, descontos, total bruto, total de descontos e liquido.
3. Normalizar valores brasileiros (`1.234,56` vira `1234.56`) e CPF (somente numeros).
4. Relacionar o CPF com `funcionarios_clt.dadosPessoais.cpf`; usar `usuarioId` para obter nome e `contrato.cargo` para o cargo.
5. Antes de inserir, verificar duplicidade em `folha_pagamento` por `periodo.mes` e `periodo.ano`.
6. Criar um documento em `folha_pagamento` com os itens e totais calculados.
7. Enviar o PDF ao R2 privado usando os mesmos campos do frontend:
   - `resource`: `rh`
   - `folder`: `folha_pagamento`
   - `collection`: ID da folha criada
   - `createdBy` e `userId`: ID do usuario administrativo
   - `isPublic`: `false`
8. Atualizar a folha com `filename`, `cloudFilename` (ID do registro R2), `size`, `format: application/pdf` e `cloudURL: ''`.
9. Verificar no banco os totais, o nome do arquivo, o ID R2 e `isPublic: false`.

O endpoint de upload e `/r2_upload` do servico definido em `NEXT_PUBLIC_URLDO`. O token usado deve ser um JWT valido assinado com `JWT_SECRET`, contendo `userId`.

## Regras de reconciliacao

- Nao fazer correspondencia somente pelo nome quando houver CPF disponivel.
- Se o CPF nao existir em `funcionarios_clt` e o liquido for zero, ignorar esse colaborador.
- Se o CPF nao existir e houver valor diferente de zero, parar e corrigir o cadastro ou registrar explicitamente um item sem vinculo CLT. Nao inventar um ObjectId.
- Recalcular os totais a partir dos itens e conferir com o resumo do PDF antes do upload.
- Nao substituir uma folha ja existente sem confirmacao explicita.

## Execucao de agosto e setembro de 2026

| Periodo | PDF | Colaboradores | Itens registrados | Bruto | Descontos | Liquido |
|---|---|---:|---:|---:|---:|---:|
| 08/2026 | `Folha_de_Pagamento-Folha_-_08_2026 (1).PDF` | 15 | 14 | R$ 22.843,81 | R$ 2.006,87 | R$ 20.836,94 |
| 09/2026 | `Folha_de_Pagamento-Folha_-_09_2026.PDF` | 14 | 13 | R$ 21.744,88 | R$ 1.922,25 | R$ 19.822,63 |

Nair Medeiros (CPF `06970878759`) aparece com liquido zero e nao tem registro CLT, por isso foi ignorada.

Bianca Santos de Cerqueira Inacio (CPF `12733090739`) existe como usuaria, mas nao tem registro em `funcionarios_clt`. Para preservar os totais exatos dos PDFs, ela foi incluida nos dois documentos com o identificador explicito `cpf:12733090739`, sem fingir que existe vinculo CLT.

Registros criados:

- 08/2026: folha `6ac5157311a1ac43dc6266fc`; R2 `6ac51576fe8ac100d06a533e`.
- 09/2026: folha `6ac5157511a1ac43dc6266fd`; R2 `6ac51577fe8ac100d06a533f`.

## Historico no projeto

O arquivo `scripts/import-folha-pagamento.mjs` contem o padrao anterior de importacao por JSON: consulta `funcionarios_clt`, cruza por CPF, ignora apenas funcionarios sem cadastro cujo liquido seja zero, bloqueia periodos duplicados e grava em `folha_pagamento`. O fluxo acima mantem essas regras e acrescenta a leitura do PDF e o anexo no R2.
