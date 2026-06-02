import { getUserID } from '@/utils/Login';

const EXPRESS_URL = process.env.NEXT_PUBLIC_URLDO ?? 'https://lobster-app-gbru2.ondigitalocean.app';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') ?? '';
}

/**
 * Faz upload de um arquivo para o Cloudflare R2 via proxy Next.js.
 * pasta format: "resource/folder/collection" ex: "funcionarios_clt/{id}/folha_ponto"
 */
export async function uploadArquivoPasta(file: File, pasta: string, fullName: string) {
  const parts = pasta.split('/').filter(Boolean);
  const resource   = parts[0] ?? 'documentos';
  const folder     = parts[1] ?? 'sem_folder';
  const collection = parts[2] ?? parts[0] ?? 'documentos';

  const userId = getUserID() ?? 'guest';
  const token  = getToken();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('originalName', file.name);
  formData.append('createdBy', userId);
  formData.append('userId', userId);
  formData.append('collection', collection);
  formData.append('folder', folder);
  formData.append('resource', resource);
  formData.append('isPublic', 'false');

  try {
    const response = await fetch('/api/proxy/r2-upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[R2] Upload failed:', response.status, err);
      return false;
    }

    const result = await response.json();
    if (!result.ok) {
      console.error('[R2] Upload not ok:', result);
      return false;
    }

    return {
      status: 'OK',
      cloudURL: '',                      // privado — URL resolvida via r2FileId
      filename: file.name,
      cloudFilename: String(result.file.id), // ID do documento arquivosr2 (usado para deleção)
      r2FileId: String(result.file.id),
      size: String(file.size),
      format: file.type || (file.name.split('.').pop() ?? ''),
      fullName,
    };
  } catch (error) {
    console.error('[R2] Upload error:', error);
    return false;
  }
}

/**
 * Busca a URL assinada de um arquivo R2 e abre em nova aba.
 * Usa o r2FileId (ou cloudFilename) armazenado no documento.
 */
export async function abrirArquivoR2(r2FileId: string): Promise<void> {
  const token = getToken();
  try {
    const res = await fetch(`/api/proxy/r2-url?id=${encodeURIComponent(r2FileId)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Sem acesso ao arquivo');
    const { url } = await res.json();
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (err) {
    console.error('[R2] Erro ao abrir arquivo:', err);
    alert('Não foi possível abrir o arquivo. Tente novamente.');
  }
}

/**
 * Remove um arquivo do R2 pelo r2FileId (ID do documento arquivosr2 no MongoDB).
 * O parâmetro folderPath é ignorado (mantido para compatibilidade de chamadas existentes).
 */
export async function deleteArquivoPastaSubPasta(_folderPath: string, r2FileId: string) {
  try {
    const response = await fetch(
      `${EXPRESS_URL}/r2_delete?id=${encodeURIComponent(r2FileId)}`,
      { method: 'DELETE', mode: 'cors', credentials: 'omit', cache: 'no-store' }
    );

    if (!response.ok) {
      const txt = await response.text().catch(() => '');
      console.error('[R2] Delete failed:', response.status, txt);
      return { responseOk: false, message: 'Falha ao deletar arquivo.' };
    }

    return { responseOk: true, message: 'Arquivo deletado com sucesso!' };
  } catch (error) {
    console.error('[R2] Delete error:', error);
    return { responseOk: false, message: 'Falha ao deletar arquivo.' };
  }
}
