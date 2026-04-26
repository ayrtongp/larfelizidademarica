import { T_AIImage, T_AIImageMimeType, T_AIRequest, T_AIResponse } from '@/types/T_ai';

const MAX_PX = 800;
const JPEG_QUALITY = 0.75;

// Redimensiona e comprime a imagem via canvas antes de enviar (evita timeout no serverless)
async function compressImage(file: File): Promise<{ base64: string; mimeType: T_AIImageMimeType }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType: 'image/jpeg' });
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Converte File/Blob para T_AIImage com compressão automática
async function fileToImage(file: File): Promise<T_AIImage> {
  return compressImage(file);
}

const BACKEND_URL = process.env.NEXT_PUBLIC_URLDO ?? 'https://lobster-app-gbru2.ondigitalocean.app';

async function complete(req: T_AIRequest): Promise<T_AIResponse> {
  const res = await fetch(`${BACKEND_URL}/ai/complete`, {
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
