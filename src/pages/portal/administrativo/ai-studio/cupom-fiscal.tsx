import React, { useRef, useState } from 'react';
import PortalBase from '@/components/Portal/PortalBase';
import PermissionWrapper from '@/components/PermissionWrapper';
import ImageCropModal from '@/components/ai/ImageCropModal';
import S_ai from '@/services/S_ai';
import S_cupomFiscal from '@/services/S_cupomFiscal';
import { T_ItemCupom, T_CategoriaCupom, CATEGORIAS_CUPOM } from '@/types/T_cupomFiscal';
import { SYSTEM_PROMPT_CUPOM_FISCAL, PROMPT_CUPOM_FISCAL } from '@/utils/ai/prompts';
import { uploadArquivoPasta } from '@/actions/DO_UploadFile';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { getUserID, updateProfile } from '@/utils/Login';
import { FaCamera, FaUpload, FaRobot, FaFileExcel, FaCopy, FaImage, FaSave, FaPlus, FaTrash, FaCheckCircle, FaRedo } from 'react-icons/fa';
import * as XLSX from 'xlsx';

// ── Helpers ────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10); }

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function round2(v: number) { return Math.round(v * 100) / 100; }

function getUserInfo() {
  const profile = updateProfile();
  const userId = getUserID() ?? '';
  const nome = profile ? `${profile.nome ?? ''} ${profile.sobrenome ?? ''}`.trim() : '';
  return { userId, nome };
}

function parseAIResponse(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
  }
  return JSON.parse(cleaned);
}

// ── Tipos internos ─────────────────────────────────

type Step = 'upload' | 'cropping' | 'interpreting' | 'result' | 'saving' | 'saved';

interface CupomState {
  estabelecimento: { nome: string; cnpj: string };
  cupom: { dataCompra: string; horaCompra: string; numeroCupom: string; chaveAcesso: string };
  itens: T_ItemCupom[];
  totalInformado: number;
  descontos: number;
  acrescimos: number;
  formaPagamento: string;
  rawJson: string;
  rawText: string;
}

// ── Componente ─────────────────────────────────────

export default function CupomFiscalPage() {
  const [step, setStep] = useState<Step>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cupom, setCupom] = useState<CupomState | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // ── Upload ───────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setStep('cropping');
    };
    reader.readAsDataURL(file);
  };

  const handleCropDone = async (croppedDataUrl: string) => {
    setImagePreview(croppedDataUrl);
    setCropSrc(null);

    const res = await fetch(croppedDataUrl);
    const blob = await res.blob();
    setImageFile(new File([blob], 'cupom.jpg', { type: 'image/jpeg' }));
    setStep('upload');
  };

  // ── Interpretar ──────────────────────────────────

  const handleInterpretar = async () => {
    if (!imageFile) return;
    setStep('interpreting');

    try {
      const image = await S_ai.fileToImage(imageFile);
      const response = await S_ai.complete({
        provider: 'gemini',
        prompt: PROMPT_CUPOM_FISCAL,
        systemPrompt: SYSTEM_PROMPT_CUPOM_FISCAL,
        image,
        jsonMode: true,
        temperature: 0.1,
      });

      const data = parseAIResponse(response.text);
      const itens: T_ItemCupom[] = (data.itens ?? []).map((item: any, i: number) => ({
        localId: uid(),
        descricaoOriginal: item.descricaoOriginal ?? '',
        descricaoNormalizada: item.descricaoNormalizada ?? item.descricaoOriginal ?? '',
        quantidade: Number(item.quantidade) || 1,
        unidade: item.unidade ?? 'UN',
        precoUnitario: Number(item.precoUnitario) || 0,
        precoTotal: Number(item.precoTotal) || 0,
        categoria: (item.categoria ?? 'outros') as T_CategoriaCupom,
        observacoes: item.observacoes ?? '',
      }));

      setCupom({
        estabelecimento: {
          nome: data.estabelecimento?.nome ?? '',
          cnpj: data.estabelecimento?.cnpj ?? '',
        },
        cupom: {
          dataCompra: data.cupom?.dataCompra ?? '',
          horaCompra: data.cupom?.horaCompra ?? '',
          numeroCupom: data.cupom?.numeroCupom ?? '',
          chaveAcesso: data.cupom?.chaveAcesso ?? '',
        },
        itens,
        totalInformado: Number(data.totais?.totalInformado) || 0,
        descontos: Number(data.totais?.descontos) || 0,
        acrescimos: Number(data.totais?.acrescimos) || 0,
        formaPagamento: data.totais?.formaPagamento ?? '',
        rawJson: JSON.stringify(data, null, 2),
        rawText: data.rawText ?? '',
      });
      setStep('result');
    } catch (err: any) {
      console.error(err);
      notifyError('Não foi possível interpretar este cupom. Tente uma imagem mais nítida ou preencha manualmente.');
      setStep('upload');
    }
  };

  // ── Edição ───────────────────────────────────────

  const subtotalCalculado = cupom ? round2(cupom.itens.reduce((s, i) => s + i.precoTotal, 0)) : 0;
  const divergencia = cupom ? round2(subtotalCalculado - cupom.totalInformado) : 0;

  const updateItem = (localId: string, field: keyof T_ItemCupom, value: any) => {
    if (!cupom) return;
    setCupom(prev => {
      if (!prev) return prev;
      const itens = prev.itens.map(i => {
        if (i.localId !== localId) return i;
        const updated = { ...i, [field]: value };
        if (field === 'quantidade' || field === 'precoUnitario') {
          updated.precoTotal = round2(updated.quantidade * updated.precoUnitario);
        }
        return updated;
      });
      return { ...prev, itens };
    });
  };

  const removeItem = (localId: string) => {
    if (!cupom) return;
    setCupom(prev => prev ? { ...prev, itens: prev.itens.filter(i => i.localId !== localId) } : prev);
  };

  const addItem = () => {
    if (!cupom) return;
    setCupom(prev => prev ? {
      ...prev,
      itens: [...prev.itens, {
        localId: uid(),
        descricaoOriginal: '',
        descricaoNormalizada: '',
        quantidade: 1,
        unidade: 'UN',
        precoUnitario: 0,
        precoTotal: 0,
        categoria: 'outros',
        observacoes: '',
      }],
    } : prev);
  };

  // ── Salvar ───────────────────────────────────────

  const handleSalvar = async () => {
    if (!cupom) return;
    setStep('saving');
    try {
      const { userId, nome } = getUserInfo();
      let imagemRef: { r2FileId: string; filename: string } | undefined;

      if (imageFile) {
        const uploaded = await uploadArquivoPasta(imageFile, 'cupom_fiscal/imagens/cupom_fiscal', nome);
        if (uploaded) {
          imagemRef = { r2FileId: uploaded.r2FileId ?? uploaded.cloudFilename, filename: uploaded.filename };
        }
      }

      const result = await S_cupomFiscal.criar({
        estabelecimento: cupom.estabelecimento,
        cupom: cupom.cupom,
        itens: cupom.itens,
        totais: {
          subtotalCalculado,
          totalInformado: cupom.totalInformado,
          descontos: cupom.descontos,
          acrescimos: cupom.acrescimos,
          divergencia,
          formaPagamento: cupom.formaPagamento,
        },
        imagemRef,
        rawJsonAI: cupom.rawJson,
        rawTextAI: cupom.rawText,
        criadoPor: userId,
        criadoPorNome: nome,
      });

      setSavedId(result.id);
      setStep('saved');
      notifySuccess('Cupom salvo com sucesso!');
    } catch (err: any) {
      notifyError(err.message || 'Erro ao salvar cupom.');
      setStep('result');
    }
  };

  // ── Exportar Excel ───────────────────────────────

  const exportarExcel = () => {
    if (!cupom) return;
    const wb = XLSX.utils.book_new();

    const itensData = cupom.itens.map((item, i) => ({
      'Nº': i + 1,
      'Descrição Original': item.descricaoOriginal,
      'Descrição': item.descricaoNormalizada,
      'Qtd': item.quantidade,
      'Unidade': item.unidade,
      'Preço Unit.': item.precoUnitario,
      'Preço Total': item.precoTotal,
      'Categoria': CATEGORIAS_CUPOM.find(c => c.value === item.categoria)?.label ?? item.categoria,
    }));
    const wsItens = XLSX.utils.json_to_sheet(itensData);
    XLSX.utils.book_append_sheet(wb, wsItens, 'Itens');

    const resumoData = [
      { Campo: 'Estabelecimento', Valor: cupom.estabelecimento.nome },
      { Campo: 'CNPJ', Valor: cupom.estabelecimento.cnpj },
      { Campo: 'Data', Valor: cupom.cupom.dataCompra },
      { Campo: 'Subtotal Calculado', Valor: subtotalCalculado },
      { Campo: 'Descontos', Valor: cupom.descontos },
      { Campo: 'Total Informado', Valor: cupom.totalInformado },
      { Campo: 'Divergência', Valor: divergencia },
      { Campo: 'Pagamento', Valor: cupom.formaPagamento },
    ];
    const wsResumo = XLSX.utils.json_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    XLSX.writeFile(wb, `cupom_${cupom.estabelecimento.nome.replace(/\s/g, '_') || 'fiscal'}_${cupom.cupom.dataCompra || 'sem_data'}.xlsx`);
  };

  // ── Copiar JSON ──────────────────────────────────

  const copiarJSON = () => {
    if (!cupom) return;
    const json = JSON.stringify({
      estabelecimento: cupom.estabelecimento,
      cupom: cupom.cupom,
      itens: cupom.itens,
      totais: { subtotalCalculado, totalInformado: cupom.totalInformado, descontos: cupom.descontos, acrescimos: cupom.acrescimos, divergencia, formaPagamento: cupom.formaPagamento },
    }, null, 2);
    navigator.clipboard.writeText(json);
    notifySuccess('JSON copiado!');
  };

  // ── Gerar PNG ────────────────────────────────────

  const gerarPNG = () => {
    if (!cupom) return;
    const SCALE = 2;
    const W = 600;
    const PAD = 16;
    const ROW_H = 28;
    const HEADER_H = 80;
    const FOOTER_H = 60;
    const TABLE_H = cupom.itens.length * ROW_H + 32;
    const H = PAD + HEADER_H + TABLE_H + FOOTER_H + PAD;

    const canvas = document.createElement('canvas');
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(SCALE, SCALE);

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);

    let y = PAD;
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(cupom.estabelecimento.nome || 'Cupom Fiscal', PAD, y + 18);
    ctx.font = '11px Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    if (cupom.estabelecimento.cnpj) ctx.fillText(`CNPJ: ${cupom.estabelecimento.cnpj}`, PAD, y + 36);
    ctx.fillText(`Data: ${cupom.cupom.dataCompra}  ${cupom.cupom.horaCompra ?? ''}`, PAD, y + 52);
    ctx.fillText(`${cupom.itens.length} itens`, PAD, y + 68);
    y += HEADER_H;

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(PAD, y, W - PAD * 2, 28);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('ITEM', PAD + 8, y + 18);
    ctx.fillText('QTD', W - PAD - 180, y + 18);
    ctx.fillText('UNIT.', W - PAD - 120, y + 18);
    ctx.fillText('TOTAL', W - PAD - 50, y + 18);
    y += 28;

    ctx.font = '11px Arial, sans-serif';
    for (let i = 0; i < cupom.itens.length; i++) {
      const item = cupom.itens[i];
      if (i % 2 === 1) { ctx.fillStyle = '#f8fafc'; ctx.fillRect(PAD, y, W - PAD * 2, ROW_H); }
      ctx.fillStyle = '#1e293b';
      const desc = item.descricaoNormalizada || item.descricaoOriginal;
      ctx.fillText(desc.length > 40 ? desc.slice(0, 38) + '…' : desc, PAD + 8, y + 18);
      ctx.fillStyle = '#475569';
      ctx.fillText(String(item.quantidade), W - PAD - 180, y + 18);
      ctx.fillText(item.precoUnitario.toFixed(2), W - PAD - 120, y + 18);
      ctx.font = 'bold 11px Arial, sans-serif';
      ctx.fillText(item.precoTotal.toFixed(2), W - PAD - 50, y + 18);
      ctx.font = '11px Arial, sans-serif';
      y += ROW_H;
    }

    y += 8;
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
    y += 12;
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText(`Total: R$ ${cupom.totalInformado.toFixed(2)}`, W - PAD - 140, y + 14);
    if (cupom.formaPagamento) {
      ctx.font = '11px Arial, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(cupom.formaPagamento, PAD + 8, y + 14);
    }

    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = `cupom_${cupom.cupom.dataCompra || 'fiscal'}.png`;
      a.href = url;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  };

  // ── Nova leitura ─────────────────────────────────

  const resetar = () => {
    setStep('upload');
    setImageFile(null);
    setImagePreview(null);
    setCropSrc(null);
    setCupom(null);
    setSavedId(null);
  };

  // ── Render ───────────────────────────────────────

  return (
    <PermissionWrapper href="/portal">
      <PortalBase>
        <div className="col-span-full max-w-5xl mx-auto space-y-5">

          <div>
            <h1 className="text-xl font-bold text-gray-800">Leitor de Cupom Fiscal</h1>
            <p className="text-xs text-gray-400">Envie uma foto do cupom e a IA extrai os itens automaticamente</p>
          </div>

          {/* ── UPLOAD ────────────────────────────── */}
          {step === 'upload' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              {imagePreview && (
                <div className="flex justify-center">
                  <img src={imagePreview} alt="Preview" className="max-h-64 rounded-lg border border-gray-200" />
                </div>
              )}

              <div className="flex flex-wrap gap-3 justify-center">
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
                <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleFileSelect} className="hidden" />

                <button onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition-colors">
                  <FaCamera /> Tirar foto
                </button>
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-xl transition-colors">
                  <FaUpload /> Selecionar arquivo
                </button>
              </div>

              {imageFile && (
                <div className="flex justify-center">
                  <button onClick={handleInterpretar}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                    <FaRobot /> Interpretar cupom
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── CROPPING ──────────────────────────── */}
          {step === 'cropping' && cropSrc && (
            <ImageCropModal
              imageSrc={cropSrc}
              onCropDone={handleCropDone}
              onCancel={() => { setCropSrc(null); setStep('upload'); }}
            />
          )}

          {/* ── INTERPRETANDO ─────────────────────── */}
          {step === 'interpreting' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center space-y-4">
              <FaRobot className="text-5xl text-indigo-400 mx-auto animate-pulse" />
              <p className="text-sm text-gray-500 font-medium">Interpretando cupom fiscal...</p>
              <p className="text-xs text-gray-400">Isso pode levar alguns segundos</p>
            </div>
          )}

          {/* ── RESULTADO ─────────────────────────── */}
          {(step === 'result' || step === 'saving') && cupom && (
            <>
              {/* Resumo */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Estabelecimento</label>
                  <input value={cupom.estabelecimento.nome} onChange={e => setCupom(p => p ? { ...p, estabelecimento: { ...p.estabelecimento, nome: e.target.value } } : p)}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">CNPJ</label>
                  <input value={cupom.estabelecimento.cnpj} onChange={e => setCupom(p => p ? { ...p, estabelecimento: { ...p.estabelecimento, cnpj: e.target.value } } : p)}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Data</label>
                  <input type="date" value={cupom.cupom.dataCompra} onChange={e => setCupom(p => p ? { ...p, cupom: { ...p.cupom, dataCompra: e.target.value } } : p)}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Pagamento</label>
                  <input value={cupom.formaPagamento} onChange={e => setCupom(p => p ? { ...p, formaPagamento: e.target.value } : p)}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>

              {/* Alerta divergência */}
              {divergencia !== 0 && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-800">
                  Atenção: o total calculado ({fmtBRL(subtotalCalculado)}) difere do total informado no cupom ({fmtBRL(cupom.totalInformado)}).
                  Divergência: <strong>{fmtBRL(divergencia)}</strong>
                </div>
              )}

              {/* Tabela de itens */}
              <div ref={tableRef} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-3 py-2.5 text-left font-medium w-8">#</th>
                        <th className="px-3 py-2.5 text-left font-medium">Descrição</th>
                        <th className="px-3 py-2.5 text-center font-medium w-20">Qtd</th>
                        <th className="px-3 py-2.5 text-center font-medium w-16">Und</th>
                        <th className="px-3 py-2.5 text-right font-medium w-24">Unit.</th>
                        <th className="px-3 py-2.5 text-right font-medium w-24">Total</th>
                        <th className="px-3 py-2.5 text-left font-medium w-36">Categoria</th>
                        <th className="px-3 py-2.5 text-center font-medium w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cupom.itens.map((item, idx) => (
                        <tr key={item.localId} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>
                          <td className="px-3 py-2">
                            <input value={item.descricaoNormalizada}
                              onChange={e => updateItem(item.localId, 'descricaoNormalizada', e.target.value)}
                              className="w-full border-0 bg-transparent text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-300 rounded px-1"
                              title={item.descricaoOriginal} />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" step="any" value={item.quantidade}
                              onChange={e => updateItem(item.localId, 'quantidade', Number(e.target.value) || 0)}
                              className="w-full text-center border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                          </td>
                          <td className="px-3 py-2">
                            <input value={item.unidade}
                              onChange={e => updateItem(item.localId, 'unidade', e.target.value)}
                              className="w-full text-center border-0 bg-transparent text-sm text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-300 rounded px-1" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" step="0.01" value={item.precoUnitario}
                              onChange={e => updateItem(item.localId, 'precoUnitario', Number(e.target.value) || 0)}
                              className="w-full text-right border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-gray-800 text-sm">
                            {fmtBRL(item.precoTotal)}
                          </td>
                          <td className="px-3 py-2">
                            <select value={item.categoria}
                              onChange={e => updateItem(item.localId, 'categoria', e.target.value)}
                              className="w-full border rounded px-1 py-0.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-300">
                              {CATEGORIAS_CUPOM.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => removeItem(item.localId)} className="text-red-400 hover:text-red-600">
                              <FaTrash size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <button onClick={addItem} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                    <FaPlus size={10} /> Adicionar item
                  </button>
                  <div className="text-sm text-gray-600 flex items-center gap-4">
                    <span>{cupom.itens.length} itens</span>
                    <span className="font-semibold text-gray-800">Subtotal: {fmtBRL(subtotalCalculado)}</span>
                  </div>
                </div>
              </div>

              {/* Totais */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Subtotal calculado</label>
                  <p className="text-lg font-bold text-gray-800">{fmtBRL(subtotalCalculado)}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Total informado</label>
                  <input type="number" step="0.01" value={cupom.totalInformado}
                    onChange={e => setCupom(p => p ? { ...p, totalInformado: Number(e.target.value) || 0 } : p)}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Descontos</label>
                  <input type="number" step="0.01" value={cupom.descontos}
                    onChange={e => setCupom(p => p ? { ...p, descontos: Number(e.target.value) || 0 } : p)}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Acréscimos</label>
                  <input type="number" step="0.01" value={cupom.acrescimos}
                    onChange={e => setCupom(p => p ? { ...p, acrescimos: Number(e.target.value) || 0 } : p)}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex flex-wrap gap-3">
                <button onClick={handleSalvar} disabled={step === 'saving'}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                  <FaSave /> {step === 'saving' ? 'Salvando...' : 'Salvar no banco'}
                </button>
                <button onClick={exportarExcel}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-xl transition-colors">
                  <FaFileExcel className="text-green-600" /> Exportar Excel
                </button>
                <button onClick={copiarJSON}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-xl transition-colors">
                  <FaCopy className="text-indigo-500" /> Copiar JSON
                </button>
                <button onClick={gerarPNG}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-xl transition-colors">
                  <FaImage className="text-purple-500" /> Gerar imagem
                </button>
                <button onClick={resetar}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-xl transition-colors ml-auto">
                  <FaRedo /> Nova leitura
                </button>
              </div>
            </>
          )}

          {/* ── SALVO ─────────────────────────────── */}
          {step === 'saved' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center space-y-4">
              <FaCheckCircle className="text-5xl text-green-500 mx-auto" />
              <p className="text-lg font-semibold text-gray-800">Cupom salvo com sucesso!</p>
              <p className="text-xs text-gray-400">ID: {savedId}</p>
              <button onClick={resetar}
                className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition-colors">
                <FaRedo /> Nova leitura
              </button>
            </div>
          )}

        </div>
      </PortalBase>
    </PermissionWrapper>
  );
}
