import React, { useRef, useState } from 'react';
import { FaUpload } from 'react-icons/fa';
import LoadingSpinner from '../LoadingSpinner';
import Button_M3 from './Button_M3';
import { getUserDetails, notifyError, notifySuccess } from '@/utils/Functions';
import { Arquivos_POST_novoArquivo } from '@/actions/Arquivos';
import { uploadArquivoPasta } from '@/actions/DO_UploadFile';
import type { InfoProps } from '@/types/Arquivos_InfoProps';

interface Props {
  infoProps: InfoProps;
  folders: string;
  triggerEffect: () => void;
  /** Opcional: restringe o tipo de arquivo (ex.: "image/*"). Mantido opcional p/ retrocompatibilidade */
  accept?: string;
  /** Opcional: sugere usar câmera no mobile (ex.: 'environment' | 'user'). Retrocompatível. */
  capture?: string;
  /** Opcional: permitir múltiplos arquivos. Retrocompatível (padrão: false). */
  multiple?: boolean;
  /** Opcional: rota do seu backend Node/Express para upload (multipart). Se não for passada, usa as Actions atuais. */
  uploadUrl?: string;
  /** Headers extras para o POST (ex.: Authorization). */
  headers?: Record<string, string>;
  /** Campos extras que seu backend espera no multipart. */
  extraFields?: Record<string, string>;
  /** Callback opcional com o payload retornado pelo backend. */
  onUploaded?: (payload: any) => void;
}

const File_M4: React.FC<Props> = ({
  infoProps,
  folders,
  triggerEffect,
  accept,
  capture,
  multiple = false,
  uploadUrl,
  headers,
  extraFields,
  onUploaded,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Abre o seletor de arquivo (ou câmera, conforme props)
  const openPicker = () => inputRef.current?.click();

  // Apenas seleciona o arquivo (upload é feito no botão "Salvar Arquivo")
  const handleSelect: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  // Faz o upload — preferindo backend externo (uploadUrl), senão ações atuais
  const handleSave = async () => {
    if (!file) {
      notifyError('Anexe um arquivo antes de clicar em enviar!');
      return;
    }

    setLoading(true);
    try {
      const dadosUsuario = getUserDetails();

      // ROTA 1: Backend Express externo (multipart)
      if (uploadUrl) {
        const form = new FormData();
        form.append('file', file);
        form.append('folders', folders); // ex.: lfz-public/residentes/<id>/fotos
        form.append('dbName', infoProps.dbName);
        form.append('residenteId', String(infoProps.residenteId ?? ''));
        if (infoProps.descricao) form.append('descricao', infoProps.descricao);
        if (dadosUsuario?.nome) form.append('nomeUsuario', dadosUsuario.nome);
        if (extraFields) Object.entries(extraFields).forEach(([k, v]) => form.append(k, v));

        const res = await fetch(uploadUrl, {
          method: 'POST',
          body: form,
          headers, // não defina Content-Type manualmente
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok || payload?.status !== 'OK') {
          notifyError(payload?.error || payload?.message || 'Erro no upload.');
          setLoading(false);
          return;
        }

        notifySuccess('Upload realizado com sucesso.');
        onUploaded?.(payload);
        setFile(null);
        if (inputRef.current) inputRef.current.value = '';
        triggerEffect();
        return;
      }

      // ROTA 2: Actions existentes (fallback)
      const response: any = await uploadArquivoPasta(file, folders, dadosUsuario?.nome);
      if (response?.status !== 'OK') {
        notifyError('Erro ao realizar Upload');
        setLoading(false);
        return;
      }

      const [successArquivo] = await Arquivos_POST_novoArquivo(infoProps, response);
      if (!successArquivo) {
        notifyError('Erro ao salvar no banco de dados');
        setLoading(false);
        return;
      }

      notifySuccess('Upload realizado com sucesso.');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      triggerEffect();
    } catch (err) {
      notifyError('Falha ao enviar o arquivo.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Input real (oculto) — agora com props opcionais accept/capture/multiple */}
      <input
        ref={inputRef}
        id="fileInput"
        type="file"
        className="hidden"
        onChange={handleSelect}
        accept={accept}
        // @ts-expect-error: atributo HTML padrão aceita string; mantemos retrocompatibilidade
        capture={capture}
        multiple={multiple}
      />

      {/* Linha com ícone de upload e nome do arquivo */}
      <div className="flex w-full items-center gap-3 text-sm">
        <button
          type="button"
          onClick={openPicker}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 font-medium hover:bg-neutral-100"
          aria-label="Selecionar arquivo"
        >
          <FaUpload className="h-4 w-4" /> Selecionar arquivo
        </button>
        <span className="truncate text-neutral-700">
          {file ? file.name : 'Nenhum arquivo selecionado'}
        </span>
      </div>

      {/* Botão de salvar */}
      <Button_M3 label="Salvar Arquivo" onClick={handleSave} />
    </div>
  );
};

export default File_M4;

// (Opcional) Componente de barra de progresso — mantido aqui caso evolua para upload com progresso.
export const ProgressBar = ({ value = 0 }: { value?: number }) => (
  <div className="w-72 rounded-lg border bg-white p-4 shadow">
    <div className="h-4 w-full rounded-full bg-gray-300">
      <div
        className="h-full rounded-full bg-violet-500 text-center text-xs text-white transition-all duration-150"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      >
        {`${Math.max(0, Math.min(100, value))}%`}
      </div>
    </div>
  </div>
);