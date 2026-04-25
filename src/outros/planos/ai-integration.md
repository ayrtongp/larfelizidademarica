# Integração AI — OpenAI (ChatGPT) e Gemini

Planejado e implementado em 24/04/2026.

---

## Objetivo

Camada de integração com provedores de IA via API key, estruturada para crescer sem reescritas.
Nenhuma funcionalidade exposta em tela ainda — apenas a fundação.

---

## Arquivos criados

| Arquivo | Responsabilidade |
|---|---|
| `src/types/T_ai.ts` | Tipos: `T_AIRequest`, `T_AIResponse`, `T_AIUsage`, `IAIProvider` |
| `src/utils/ai/index.ts` | Factory `getProvider()` e `listProviders()` |
| `src/utils/ai/providers/openai.ts` | Adaptador OpenAI — `POST /v1/chat/completions` via fetch |
| `src/utils/ai/providers/gemini.ts` | Adaptador Gemini — `generateContent` via fetch |
| `src/utils/ai/prompts/index.ts` | Registro central de prompts reutilizáveis (vazio por ora) |
| `src/pages/api/Controller/C_ai.ts` | API route `POST /api/Controller/C_ai` |
| `src/services/S_ai.ts` | Service client-side: `S_ai.complete(req)` |

---

## Variáveis de ambiente necessárias (`.env.local`)

```env
OPENAI_API_KEY=sk-...
OPENAI_DEFAULT_MODEL=gpt-4o-mini

GEMINI_API_KEY=AIza...
GEMINI_DEFAULT_MODEL=gemini-1.5-flash
```

Todas server-side — nunca usar `NEXT_PUBLIC_` para chaves de IA.

---

## Como usar (quando chegar a hora)

```typescript
// No servidor (dentro de um API route ou Server Action):
import { getProvider } from '@/utils/ai';

const response = await getProvider('openai').complete({
  provider: 'openai',
  prompt: 'Resuma este relatório...',
  systemPrompt: 'Você é um assistente clínico.',
});

// No cliente (via hook/componente React):
import S_ai from '@/services/S_ai';

const response = await S_ai.complete({
  provider: 'gemini',
  prompt: 'Liste os medicamentos em uso...',
});
```

---

## Como crescer

- **Novo provider**: criar `src/utils/ai/providers/claude.ts` implementando `IAIProvider`, registrar em `src/utils/ai/index.ts`
- **Prompts reutilizáveis**: adicionar constantes em `src/utils/ai/prompts/index.ts`
- **Histórico de conversa**: adicionar `messages?: { role: string; content: string }[]` ao `T_AIRequest`
- **Logging para MongoDB**: adicionar inserção na collection `ai_logs` dentro de `C_ai.ts` após chamada bem-sucedida
- **Streaming**: adicionar `stream?: boolean` ao request e retornar `ReadableStream` no controller
