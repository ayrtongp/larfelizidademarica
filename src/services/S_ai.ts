import { T_AIImage, T_AIImageMimeType, T_AIRequest, T_AIResponse } from '@/types/T_ai';

// Converte File/Blob para T_AIImage (base64 puro + mimeType)
async function fileToImage(file: File): Promise<T_AIImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, base64] = result.split(',');
      const mimeType = header.replace('data:', '').replace(';base64', '') as T_AIImageMimeType;
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function complete(req: T_AIRequest): Promise<T_AIResponse> {
  const res = await fetch('/api/Controller/C_ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro desconhecido.' }));
    throw new Error(err.message ?? 'Erro na requisição de IA.');
  }

  return res.json();
}

const S_ai = { complete, fileToImage };
export default S_ai;
