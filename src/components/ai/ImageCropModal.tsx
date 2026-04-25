import React, { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/utils/cropImage';

interface Props {
  imageSrc: string;
  onCrop: (dataUrl: string) => void;
  onClose: () => void;
}

const RATIOS = [
  { label: 'Livre',  value: 0      },   // 0 = usa proporção natural da imagem
  { label: '4:3',    value: 4/3    },
  { label: '3:4',    value: 3/4    },
  { label: '16:9',   value: 16/9   },
  { label: '1:1',    value: 1      },
];

const ImageCropModal = ({ imageSrc, onCrop, onClose }: Props) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [naturalAspect, setNaturalAspect] = useState<number>(4/3);
  const [selectedRatio, setSelectedRatio] = useState<number>(0); // 0 = livre (natural)

  // Detecta proporção natural da imagem para o modo "Livre"
  useEffect(() => {
    const img = new window.Image();
    img.src = imageSrc;
    img.onload = () => {
      setNaturalAspect(img.naturalWidth / img.naturalHeight);
    };
  }, [imageSrc]);

  const aspect = selectedRatio === 0 ? naturalAspect : selectedRatio;

  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const result = await getCroppedImg(imageSrc, croppedAreaPixels, 'base64');
      onCrop(result);
    } finally {
      setSaving(false);
    }
  }

  // "Usar foto inteira" — converte a URL original diretamente para base64 via canvas
  async function handleUseAll() {
    setSaving(true);
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; });
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      onCrop(canvas.toDataURL('image/jpeg', 0.92));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">

      {/* Proporções */}
      <div className="bg-gray-900 px-4 pt-3 pb-2 flex items-center gap-2 shrink-0">
        <span className="text-gray-400 text-xs shrink-0">Proporção:</span>
        <div className="flex gap-1.5 flex-wrap">
          {RATIOS.map(r => (
            <button
              key={r.label}
              onClick={() => { setSelectedRatio(r.value); setCrop({ x: 0, y: 0 }); setZoom(1); }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedRatio === r.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Área de crop */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* Controles inferiores */}
      <div className="bg-gray-900 px-4 py-3 flex flex-col sm:flex-row items-center gap-3">
        {/* Zoom */}
        <div className="flex items-center gap-3 flex-1 w-full">
          <span className="text-white text-xs shrink-0">Zoom</span>
          <input
            type="range" min={1} max={3} step={0.01} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-indigo-500"
          />
        </div>

        {/* Ações */}
        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none px-3 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleUseAll}
            disabled={saving}
            className="flex-1 sm:flex-none px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500 disabled:opacity-50 transition-colors"
          >
            Foto inteira
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 sm:flex-none px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Processando...' : 'Confirmar corte'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
