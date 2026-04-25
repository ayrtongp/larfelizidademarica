import React, { useEffect, useRef, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { useHasGroup } from '@/hooks/useHasGroup';
import ImageCropModal from '@/components/ai/ImageCropModal';
import S_ai from '@/services/S_ai';
import { T_AIImage } from '@/types/T_ai';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { BsCamera, BsImage, BsRobot } from 'react-icons/bs';
import { FaTrash, FaChevronRight, FaTimes } from 'react-icons/fa';
import { MdSearch } from 'react-icons/md';

// ── Constants ──────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { label: 'Medicamentos',        value: 'medicamentos' },
  { label: 'Materiais de Consumo', value: 'materiais_consumo' },
  { label: 'Equipamentos',        value: 'equipamentos' },
];

// ── Types ──────────────────────────────────────────────────────────────────

interface IdosoOption  { _id: string; nome: string; }
interface InsumoOption { _id: string; nome_insumo: string; unidade: string; }

interface ReviewRow {
  localId: string;
  nomeDetectado: string;
  insumo_id: string;
  quantidade: number;
  observacoes: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getUserInfo() {
  try {
    const u = JSON.parse(localStorage.getItem('userInfo') ?? '{}');
    return { nome: u.nome ?? '', id: u.id ?? '' };
  } catch { return { nome: '', id: '' }; }
}

function parseAIJson(content: string): { nome: string; marca: string; quantidade: number; descricao: string }[] {
  const text = content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  try { return JSON.parse(text); } catch { return []; }
}

function normalizeStr(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').trim();
}

function tokenize(s: string): string[] {
  const stop = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'em', 'com', 'para', 'por', 'mg', 'ml', 'un', 'g', 'kg']);
  return normalizeStr(s).split(/\s+/).filter(function(t) { return t.length >= 2 && !stop.has(t); });
}

function findMatchingInsumo(nome: string, descricao: string, insumos: InsumoOption[]): string {
  const queryTokens = tokenize(nome + ' ' + descricao);
  if (!queryTokens.length) return '';
  let bestScore = 0;
  let bestId = '';
  for (let i = 0; i < insumos.length; i++) {
    const insumo = insumos[i];
    const iTokens = tokenize(insumo.nome_insumo);
    if (!iTokens.length) continue;
    const qSet = new Set(queryTokens);
    const iSet = new Set(iTokens);
    let inter = 0;
    qSet.forEach(function(t) { if (iSet.has(t)) inter++; });
    const union = qSet.size + iSet.size - inter;
    const score = inter / union;
    if (score > bestScore && score >= 0.30) { bestScore = score; bestId = insumo._id; }
  }
  return bestId;
}

let _localIdCounter = 0;
function newLocalId() { return String(++_localIdCounter); }

// ── NovoInsumoModal ────────────────────────────────────────────────────────

interface NovoInsumoModalProps {
  initialNome: string;
  onClose: () => void;
  onCreated: (insumo: InsumoOption) => void;
}

const NovoInsumoModal: React.FC<NovoInsumoModalProps> = ({ initialNome, onClose, onCreated }) => {
  const [nome,      setNome]      = useState(initialNome);
  const [unidade,   setUnidade]   = useState('');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving,    setSaving]    = useState(false);

  async function handleSave() {
    if (!nome.trim() || !unidade.trim() || !categoria || !descricao.trim()) {
      notifyError('Preencha todos os campos obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/Controller/Insumos?type=new', {
        method: 'POST',
        body: JSON.stringify({
          nome_insumo:  nome.trim(),
          unidade:      unidade.trim(),
          cod_categoria: categoria,
          descricao:    descricao.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { notifyError(data.message || 'Erro ao criar insumo.'); return; }
      onCreated({ _id: String(data.id), nome_insumo: nome.trim(), unidade: unidade.trim() });
      notifySuccess(`Insumo "${nome.trim()}" criado!`);
    } catch {
      notifyError('Erro ao criar insumo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Novo Insumo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><FaTimes size={13} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nome *</label>
            <input
              value={nome} onChange={e => setNome(e.target.value)} autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Unidade *</label>
            <input
              value={unidade} onChange={e => setUnidade(e.target.value)}
              placeholder="ex: comprimido, frasco, pacote..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Categoria *</label>
            <select
              value={categoria} onChange={e => setCategoria(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="">Selecionar...</option>
              {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Descrição *</label>
            <input
              value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder="ex: 50mg comprimido, 100ml frasco..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Criando...' : 'Criar insumo'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── InsumoCombobox ─────────────────────────────────────────────────────────

interface InsumoComboboxProps {
  value: string;
  insumos: InsumoOption[];
  onChange: (id: string) => void;
  onNewInsumo: (insumo: InsumoOption) => void;
  hasError?: boolean;
}

const InsumoCombobox: React.FC<InsumoComboboxProps> = ({ value, insumos, onChange, onNewInsumo, hasError }) => {
  const [inputValue, setInputValue] = useState('');
  const [open,       setOpen]       = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  const selectedInsumo = insumos.find(i => i._id === value);

  const filtered = inputValue
    ? insumos.filter(i => normalizeStr(i.nome_insumo).includes(normalizeStr(inputValue)))
    : insumos;

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setInputValue('');
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  function handleFocus() {
    if (selectedInsumo) setInputValue(selectedInsumo.nome_insumo);
    setOpen(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    if (value) onChange('');
    setOpen(true);
  }

  function handleSelect(id: string) {
    onChange(id);
    setInputValue('');
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
    setInputValue('');
    setOpen(false);
    inputRef.current?.focus();
  }

  const displayValue = open ? inputValue : (selectedInsumo ? selectedInsumo.nome_insumo : '');

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-2 transition-colors ${hasError ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-white'} focus-within:ring-1 focus-within:ring-indigo-400 focus-within:border-indigo-400`}>
        <MdSearch size={15} className="text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Buscar insumo..."
          className="flex-1 min-w-0 text-sm outline-none bg-transparent"
        />
        {(value || inputValue) && (
          <button type="button" onMouseDown={handleClear} className="text-gray-400 hover:text-gray-600 shrink-0">
            <FaTimes size={10} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {filtered.length === 0 && inputValue && (
            <p className="px-3 py-2 text-sm text-gray-400">Sem resultado para &quot;{inputValue}&quot;</p>
          )}
          {filtered.map(i => (
            <button
              key={i._id}
              type="button"
              onMouseDown={() => handleSelect(i._id)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors hover:bg-indigo-50 ${value === i._id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-800'}`}
            >
              <span className="truncate">{i.nome_insumo}</span>
              <span className="text-gray-400 text-xs shrink-0">{i.unidade}</span>
            </button>
          ))}
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setOpen(false); setShowCreate(true); }}
            className="w-full text-left px-3 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 border-t border-gray-100 font-medium transition-colors"
          >
            + {inputValue ? `Criar: "${inputValue}"` : 'Criar novo insumo'}
          </button>
        </div>
      )}

      {showCreate && (
        <NovoInsumoModal
          initialNome={inputValue}
          onClose={() => setShowCreate(false)}
          onCreated={(insumo) => {
            onNewInsumo(insumo);
            handleSelect(insumo._id);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
};

// ── Componente principal ───────────────────────────────────────────────────

const AIStudioPage = () => {
  const { loading: loadingPermission } = useHasGroup('coordenacao');

  const [idosos,  setIdosos]  = useState<IdosoOption[]>([]);
  const [insumos, setInsumos] = useState<InsumoOption[]>([]);

  const [busca,     setBusca]     = useState('');
  const [residente, setResidente] = useState<IdosoOption | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const [rawImageSrc,    setRawImageSrc]    = useState<string | null>(null);
  const [cropOpen,       setCropOpen]       = useState(false);
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null);

  const [analyzing,  setAnalyzing]  = useState(false);
  const [rows,       setRows]       = useState<ReviewRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [doneCount,  setDoneCount]  = useState(0);
  const [done,       setDone]       = useState(false);

  // ── Carregamento inicial ──────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/Controller/C_idosoDetalhes?type=getAtivos')
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => setIdosos(data.map(d => ({
        _id: d._id,
        nome: [d.usuario?.nome, d.usuario?.sobrenome].filter(Boolean).join(' ') || '—',
      }))))
      .catch(() => {});

    fetch('/api/Controller/Insumos?type=getAll')
      .then(r => r.ok ? r.json() : [])
      .then((data: InsumoOption[]) => setInsumos(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // ── Foto ─────────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawImageSrc(URL.createObjectURL(file));
    setCroppedDataUrl(null);
    setCropOpen(true);
    e.target.value = '';
  }

  // ── Análise ───────────────────────────────────────────────────────────

  async function handleAnalyze() {
    if (!croppedDataUrl) return;
    setAnalyzing(true);
    setRows([]);
    try {
      const base64 = croppedDataUrl.split(',')[1];
      const image: T_AIImage = { base64, mimeType: 'image/jpeg' };

      const response = await S_ai.complete({
        provider: 'gemini',
        prompt: `Analise esta imagem e identifique todos os produtos/itens visíveis (higiene, fraldas, medicamentos, alimentos, materiais hospitalares, etc).
Para cada item retorne um objeto com:
- nome: nome completo do produto incluindo dosagem e forma farmacêutica (ex: "Losartana 50mg comprimido", "Fralda Geriátrica G", "Pomada Bepantol 30g")
- marca: marca visível (string, "" se não identificável)
- quantidade: quantidade de unidades visíveis ou estimada (number, mínimo 1)
- descricao: informação extra relevante não incluída no nome (string, "" se não aplicável)

IMPORTANTE: Se o mesmo produto aparecer mais de uma vez na imagem, agrupe em uma única linha somando a quantidade. Não repita linhas para o mesmo produto.
Responda APENAS com um array JSON válido, sem texto adicional, sem markdown.`,
        systemPrompt: 'Você é um assistente de controle de estoque hospitalar. Analise imagens e retorne dados estruturados em JSON.',
        image,
        jsonMode: true,
      });

      const items = parseAIJson(response.content);
      if (!items.length) {
        notifyError('Não foi possível identificar itens. Tente com uma foto mais nítida.');
        return;
      }

      // Deduplicação: agrupa por nome normalizado, soma quantidades
      const grouped = new Map<string, typeof items[0]>();
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const key = normalizeStr(item.nome);
        const existing = grouped.get(key);
        if (existing) {
          existing.quantidade = (existing.quantidade || 1) + (item.quantidade || 1);
        } else {
          grouped.set(key, { ...item });
        }
      }
      const deduped = Array.from(grouped.values());

      setRows(deduped.map(item => ({
        localId:      newLocalId(),
        nomeDetectado: item.nome,
        insumo_id:    findMatchingInsumo(item.nome, item.descricao, insumos),
        quantidade:   Math.max(1, Math.round(item.quantidade || 1)),
        observacoes:  [item.marca, item.descricao].filter(Boolean).join(' — '),
      })));
    } catch (err) {
      console.error(err);
      notifyError('Erro ao analisar imagem com IA.');
    } finally {
      setAnalyzing(false);
    }
  }

  // ── Edição ────────────────────────────────────────────────────────────

  function updateRow(localId: string, field: keyof ReviewRow, value: string | number) {
    setRows(prev => prev.map(r => r.localId === localId ? { ...r, [field]: value } : r));
  }

  function removeRow(localId: string) {
    setRows(prev => prev.filter(r => r.localId !== localId));
  }

  function addRow() {
    setRows(prev => [...prev, { localId: newLocalId(), nomeDetectado: '', insumo_id: '', quantidade: 1, observacoes: '' }]);
  }

  function addInsumoToList(newInsumo: InsumoOption) {
    setInsumos(prev => [...prev, newInsumo].sort((a, b) => a.nome_insumo.localeCompare(b.nome_insumo)));
  }

  // ── Submissão ─────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!residente) return;
    const validRows = rows.filter(r => r.insumo_id && r.quantidade > 0);
    if (!validRows.length) { notifyError('Selecione o insumo em pelo menos uma linha.'); return; }

    const { nome: nomeUsuario, id: idUsuario } = getUserInfo();
    setSubmitting(true);
    try {
      await Promise.all(validRows.map(row =>
        fetch('/api/Controller/InsumoEstoque?type=addFraldaResidente', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            insumo_id:   row.insumo_id,
            quantidade:  row.quantidade,
            residente_id: residente._id,
            observacoes: row.observacoes || '—',
            nomeUsuario,
            idUsuario,
          }),
        })
      ));
      setDoneCount(validRows.length);
      setDone(true);
      notifySuccess(`${validRows.length} entrada(s) registrada(s) com sucesso!`);
    } catch {
      notifyError('Erro ao salvar entradas.');
    } finally {
      setSubmitting(false);
    }
  }

  function resetAll() {
    setResidente(null);
    setBusca('');
    setRawImageSrc(null);
    setCroppedDataUrl(null);
    setRows([]);
    setDone(false);
    setDoneCount(0);
  }

  // ── Derived ───────────────────────────────────────────────────────────

  const idososFiltrados = busca.trim()
    ? idosos.filter(i => i.nome.toLowerCase().includes(busca.toLowerCase()))
    : idosos;

  const step = done ? 'done' : !residente ? 'resident' : analyzing ? 'analyzing' : rows.length ? 'review' : 'photo';

  const pendingCount = rows.filter(r => !r.insumo_id).length;
  const readyCount   = rows.filter(r =>  r.insumo_id).length;

  if (loadingPermission) return null;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <PermissionWrapper href="/portal/administrativo">
      <PortalBase>
        <div className="col-span-full max-w-5xl mx-auto w-full space-y-5 pb-10">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <BsRobot size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Studio</h1>
              <p className="text-sm text-gray-500">Gerar Estoque por Foto</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            {(['resident', 'photo', 'review'] as const).map((s, i) => {
              const labels = { resident: '1. Residente', photo: '2. Foto', review: '3. Revisão' };
              const active = s === step || (step === 'analyzing' && s === 'photo') || (step === 'done' && s === 'review');
              const past   = (s === 'resident' && ['photo', 'analyzing', 'review', 'done'].includes(step))
                          || (s === 'photo'    && ['review', 'done'].includes(step));
              return (
                <React.Fragment key={s}>
                  {i > 0 && <FaChevronRight size={9} className="text-gray-300" />}
                  <span className={`font-medium ${active ? 'text-indigo-600' : past ? 'text-gray-500' : 'text-gray-300'}`}>
                    {labels[s]}
                  </span>
                </React.Fragment>
              );
            })}
          </div>

          {/* ── STEP 1: Residente ─────────────────────────────────────── */}
          {step === 'resident' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <p className="text-sm font-semibold text-gray-700">Para qual residente é esta entrada de estoque?</p>
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por nome..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto rounded-xl border border-gray-200">
                {idososFiltrados.length === 0 && (
                  <li className="py-8 text-center text-sm text-gray-400">Nenhum residente encontrado.</li>
                )}
                {idososFiltrados.map(i => (
                  <li key={i._id}>
                    <button
                      onClick={() => setResidente(i)}
                      className="w-full text-left px-5 py-3 text-sm hover:bg-indigo-50 text-gray-800 transition-colors"
                    >
                      {i.nome}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── STEP 2: Foto ──────────────────────────────────────────── */}
          {step === 'photo' && residente && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">
                  Entrada para: <span className="text-indigo-600">{residente.nome}</span>
                </p>
                <button onClick={() => setResidente(null)} className="text-xs text-gray-400 hover:text-gray-600">trocar</button>
              </div>

              {croppedDataUrl ? (
                <div className="space-y-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={croppedDataUrl} alt="preview" className="w-full rounded-xl border border-gray-200 object-contain max-h-80" />
                  <div className="flex gap-3 text-xs">
                    <button onClick={() => { setCroppedDataUrl(null); setRawImageSrc(null); }} className="text-gray-400 hover:text-gray-600">
                      Trocar foto
                    </button>
                    <button onClick={() => rawImageSrc && setCropOpen(true)} className="text-indigo-500 hover:text-indigo-700">
                      Recortar novamente
                    </button>
                  </div>
                  <button
                    onClick={handleAnalyze}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <BsRobot size={16} /> Analisar com IA
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Tire uma foto ou escolha um arquivo com os itens a registrar.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => cameraRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                      <BsCamera size={20} /> Câmera
                    </button>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                      <BsImage size={20} /> Arquivo
                    </button>
                  </div>
                  <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                  <input ref={fileRef}   type="file" accept="image/*" className="hidden"                             onChange={handleFileChange} />
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Analisando ────────────────────────────────────── */}
          {step === 'analyzing' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center animate-pulse">
                <BsRobot size={30} className="text-indigo-500" />
              </div>
              <p className="text-sm font-medium text-gray-700">Analisando imagem com IA...</p>
              <p className="text-xs text-gray-400">Isso pode levar alguns segundos</p>
            </div>
          )}

          {/* ── STEP 4: Revisão ───────────────────────────────────────── */}
          {step === 'review' && residente && (
            <div className="space-y-4">

              {/* Cabeçalho */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Itens detectados</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Residente: <span className="font-medium text-gray-600">{residente.nome}</span>
                    {pendingCount > 0 && <span className="ml-2 text-yellow-600">· {pendingCount} sem insumo</span>}
                  </p>
                </div>
                <button
                  onClick={() => { setRows([]); setCroppedDataUrl(null); }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Nova foto
                </button>
              </div>

              {/* Cards de itens */}
              <div className="space-y-3">
                {rows.map(row => (
                  <div
                    key={row.localId}
                    className={`rounded-2xl border p-4 space-y-2.5 bg-white transition-colors ${!row.insumo_id ? 'border-yellow-300' : 'border-gray-200'}`}
                  >
                    {/* Linha 1: nome detectado + lixeira */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        {row.nomeDetectado ? (
                          <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5 truncate max-w-xs inline-block">
                            {row.nomeDetectado}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Item adicionado manualmente</span>
                        )}
                      </div>
                      <button
                        onClick={() => removeRow(row.localId)}
                        className="text-gray-300 hover:text-red-500 p-1 shrink-0 transition-colors"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>

                    {/* Linha 2: combobox + qtd */}
                    <div className="flex gap-2">
                      <div className="flex-1 min-w-0">
                        <InsumoCombobox
                          value={row.insumo_id}
                          insumos={insumos}
                          onChange={id => updateRow(row.localId, 'insumo_id', id)}
                          onNewInsumo={addInsumoToList}
                          hasError={!row.insumo_id}
                        />
                      </div>
                      <input
                        type="number" min={1} value={row.quantidade}
                        onChange={e => updateRow(row.localId, 'quantidade', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 shrink-0 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>

                    {/* Linha 3: observações largura total */}
                    <input
                      type="text" value={row.observacoes}
                      onChange={e => updateRow(row.localId, 'observacoes', e.target.value)}
                      placeholder="Obs / marca..."
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={addRow}
                className="text-sm text-indigo-500 hover:text-indigo-700 font-medium"
              >
                + Adicionar linha
              </button>

              {pendingCount > 0 && (
                <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5">
                  {pendingCount} {pendingCount === 1 ? 'item sem insumo selecionado será ignorado' : 'itens sem insumo selecionado serão ignorados'}.
                  Use o combobox para buscar ou criar um novo insumo.
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || readyCount === 0}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {submitting ? 'Salvando...' : `Confirmar ${readyCount} entrada${readyCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}

          {/* ── STEP 5: Concluído ─────────────────────────────────────── */}
          {step === 'done' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-2xl font-bold">
                ✓
              </div>
              <div>
                <p className="text-base font-semibold text-gray-800">
                  {doneCount} entrada{doneCount !== 1 ? 's' : ''} registrada{doneCount !== 1 ? 's' : ''}!
                </p>
                <p className="text-sm text-gray-400 mt-1">Para {residente?.nome}</p>
              </div>
              <button
                onClick={resetAll}
                className="mt-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Nova Análise
              </button>
            </div>
          )}

        </div>

        {/* Crop modal */}
        {cropOpen && rawImageSrc && (
          <ImageCropModal
            imageSrc={rawImageSrc}
            onCrop={(dataUrl) => { setCroppedDataUrl(dataUrl); setCropOpen(false); }}
            onClose={() => setCropOpen(false)}
          />
        )}

      </PortalBase>
    </PermissionWrapper>
  );
};

export default AIStudioPage;
