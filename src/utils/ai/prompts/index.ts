// Registro central de prompts reutilizáveis.
// Adicione constantes aqui conforme os casos de uso forem surgindo.
// Exemplo:
//   export const PROMPT_RESUMO_CLINICO = `Você é um assistente clínico...`;
//   export const PROMPT_RELATORIO_FINANCEIRO = `...`;

export const SYSTEM_PROMPT_CUPOM_FISCAL = `Você é um extrator de dados de cupons fiscais brasileiros. Analise a imagem do cupom fiscal e retorne APENAS JSON válido, sem markdown, sem texto fora do JSON. Não invente dados. Se algum campo não estiver visível, retorne null.`;

export const PROMPT_CUPOM_FISCAL = `Analise esta imagem de cupom fiscal brasileiro e extraia todos os dados em JSON.

Regras:
- Preserve a descrição original exata do cupom em "descricaoOriginal"
- Crie uma "descricaoNormalizada" mais limpa e legível (ex: "ACU REF UNIAO 1KG" → "Açúcar Refinado União 1kg")
- Valores monetários como número decimal com ponto (ex: 12.90, não 12,90)
- Quantidades podem ser inteiras ou decimais
- Classifique cada item: alimentacao, limpeza, higiene, medicamentos, manutencao, descartaveis, escritorio, outros
- Se não conseguir ler um campo, retorne null

Formato JSON esperado:
{
  "estabelecimento": { "nome": "", "cnpj": "" },
  "cupom": { "dataCompra": "YYYY-MM-DD", "horaCompra": "HH:MM", "numeroCupom": "", "chaveAcesso": "" },
  "itens": [
    { "descricaoOriginal": "", "descricaoNormalizada": "", "quantidade": 1, "unidade": "UN", "precoUnitario": 0, "precoTotal": 0, "categoria": "outros", "observacoes": "" }
  ],
  "totais": { "subtotalItens": 0, "descontos": 0, "acrescimos": 0, "totalInformado": 0, "formaPagamento": "" },
  "rawText": ""
}`;

export const AI_PROMPTS: Record<string, string> = {
  cupom_fiscal: PROMPT_CUPOM_FISCAL,
};
