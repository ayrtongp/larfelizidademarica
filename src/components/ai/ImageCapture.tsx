import React, { useRef, useState } from 'react';
import { BsCamera, BsImage, BsX } from 'react-icons/bs';

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
  label?: string;
}

const ImageCapture = ({ onFile, disabled, label = 'Adicionar imagem' }: Props) => {
  const [preview, setPreview] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onFile(file);
    e.target.value = '';
  }

  function clear() {
    setPreview(null);
  }

  return (
    <div className="flex flex-col gap-2">
      {preview ? (
        <div className="relative w-full max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="w-full rounded-lg border border-gray-200 object-contain max-h-48" />
          <button
            type="button"
            onClick={clear}
            className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-0.5 hover:bg-opacity-70"
          >
            <BsX size={16} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          {/* Câmera (mobile abre câmera diretamente; desktop abre seletor) */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => cameraRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-40 transition-colors"
          >
            <BsCamera size={14} />
            Câmera
          </button>

          {/* Arquivo */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-40 transition-colors"
          >
            <BsImage size={14} />
            {label}
          </button>
        </div>
      )}

      {/* Input câmera — capture="environment" usa câmera traseira no mobile */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />

      {/* Input arquivo — sem capture, abre galeria/explorador */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};

export default ImageCapture;
