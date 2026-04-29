import React, { useEffect, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import PortalBase from '@/components/Portal/PortalBase';
import { useHasGroup } from '@/hooks/useHasGroup';
import {
  T_DataImportante,
  T_DataImportanteCat,
  DATA_IMPORTANTE_CAT_LABELS,
  DATA_IMPORTANTE_CAT_COLORS,
  sortDatasImportantes,
} from '@/types/T_datasImportantes';
import {
  DatasImportantes_GET_getAll,
  DatasImportantes_POST_new,
  DatasImportantes_PUT_update,
  DatasImportantes_DELETE,
} from '@/actions/DatasImportante';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaCalendarAlt, FaRedo } from 'react-icons/fa';

// ── Constantes ─────────────────────────────────────────────────────────────

const CATEGORIAS = Object.keys(DATA_IMPORTANTE_CAT_LABELS) as T_DataImportanteCat[];

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDataDisplay(data: string, recorrente: boolean): string {
  const [, mes, dia] = data.split('-');
  if (!mes || !dia) return data;
  return recorrente
    ? `${dia} de ${MESES[parseInt(mes, 10) - 1]}`
    : `${dia}/${mes}/${data.split('-')[0]}`;
}

const EMPTY_FORM: Omit<T_DataImportante, '_id' | 'createdAt' | 'updatedAt'> = {
  titulo:     '',
  data:       '',
  recorrente: true,
  categoria:  'feriado_nacional',
  horario:    '',
  observacao: '',
};

// ── Modal de criação / edição ──────────────────────────────────────────────

interface ModalProps {
  initial: typeof EMPTY_FORM & { _id?: string };
  onClose: () => void;
  onSaved: (item: T_DataImportante) => void;
}

const FormModal: React.FC<ModalProps> = ({ initial, onClose, onSaved }) => {
  const isNew = !initial._id;
  const [form, setForm] = useState({ ...initial });
  const [saving, setSaving] = useState(false);

  const set = (field: string, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // Quando recorrente muda, ajustar o campo data se necessário
  function handleRecorrenteChange(val: boolean) {
    set('recorrente', val);
    // Limpa data para forçar preenchimento correto
    set('data', '');
  }

  // Para recorrente: data é MM-DD (derivada de dois selects)
  // Para não-recorrente: data é YYYY-MM-DD (input type="date")
  const [mesSel,  setMesSel]  = useState(() => {
    const parts = form.data?.split('-') ?? [];
    return parts[1] || '01';
  });
  const [diaSel,  setDiaSel]  = useState(() => {
    const parts = form.data?.split('-') ?? [];
    return parts[2] || '01';
  });

  useEffect(() => {
    if (form.recorrente && mesSel && diaSel) {
      set('data', `2000-${mesSel.padStart(2,'0')}-${diaSel.padStart(2,'0')}`);
    }
  }, [mesSel, diaSel, form.recorrente]);

  const diasNoMes = (mes: number) =>
    new Date(2000, mes, 0).getDate();

  async function handleSave() {
    if (!form.titulo.trim() || !form.data) {
      notifyError('Título e data são obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        titulo:     form.titulo.trim(),
        data:       form.data,
        recorrente: form.recorrente,
        categoria:  form.categoria,
        horario:    form.horario?.trim() || '',
        observacao: form.observacao?.trim() || '',
      };
      if (isNew) {
        const { id } = await DatasImportantes_POST_new(payload);
        onSaved({ ...payload, _id: String(id) });
        notifySuccess('Data criada!');
      } else {
        await DatasImportantes_PUT_update(initial._id!, payload);
        onSaved({ ...payload, _id: initial._id });
        notifySuccess('Data atualizada!');
      }
    } catch (e: unknown) {
      notifyError(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400';
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{isNew ? 'Nova data importante' : 'Editar data'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><FaTimes size={13} /></button>
        </div>

        <div className="space-y-3">
          {/* Título */}
          <div>
            <label className={labelCls}>Título *</label>
            <input
              value={form.titulo} onChange={e => set('titulo', e.target.value)}
              placeholder="Ex: Natal, Reunião Anual..."
              autoFocus className={inputCls}
            />
          </div>

          {/* Recorrente */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">Repete todo ano?</label>
            <div className="flex gap-2">
              {([true, false] as const).map(v => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => handleRecorrenteChange(v)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    form.recorrente === v ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {v ? 'Sim' : 'Não'}
                </button>
              ))}
            </div>
          </div>

          {/* Data */}
          {form.recorrente ? (
            <div>
              <label className={labelCls}>Dia e mês *</label>
              <div className="flex gap-2">
                <select
                  value={mesSel}
                  onChange={e => setMesSel(e.target.value)}
                  className={inputCls}
                >
                  {MESES.map((m, i) => (
                    <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                  ))}
                </select>
                <select
                  value={diaSel}
                  onChange={e => setDiaSel(e.target.value)}
                  className="w-24 shrink-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  {Array.from({ length: diasNoMes(parseInt(mesSel, 10)) }, (_, i) => i + 1).map(d => (
                    <option key={d} value={String(d).padStart(2, '0')}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className={labelCls}>Data *</label>
              <input
                type="date"
                value={form.data}
                onChange={e => set('data', e.target.value)}
                className={inputCls}
              />
            </div>
          )}

          {/* Categoria */}
          <div>
            <label className={labelCls}>Categoria *</label>
            <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className={inputCls}>
              {CATEGORIAS.map(c => (
                <option key={c} value={c}>{DATA_IMPORTANTE_CAT_LABELS[c]}</option>
              ))}
            </select>
          </div>

          {/* Horário */}
          <div>
            <label className={labelCls}>Horário (opcional)</label>
            <input
              type="time" value={form.horario || ''}
              onChange={e => set('horario', e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Observação */}
          <div>
            <label className={labelCls}>Observação (opcional)</label>
            <textarea
              value={form.observacao || ''}
              onChange={e => set('observacao', e.target.value)}
              rows={2} placeholder="Informações adicionais..."
              className={inputCls + ' resize-none'}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando...' : isNew ? 'Criar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Página principal ───────────────────────────────────────────────────────

const DatasImportantesPage = () => {
  const { hasGroup, loading: loadingPerm } = useHasGroup('coordenacao');
  const [items,   setItems]   = useState<T_DataImportante[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<(typeof EMPTY_FORM & { _id?: string }) | null>(null);

  useEffect(() => {
    if (!hasGroup) {
      setLoading(false);
      return;
    }

    DatasImportantes_GET_getAll()
      .then(data => setItems(sortDatasImportantes(data)))
      .catch(() => notifyError('Erro ao carregar datas.'))
      .finally(() => setLoading(false));
  }, [hasGroup]);

  async function handleDelete(item: T_DataImportante) {
    if (!confirm(`Excluir "${item.titulo}"?`)) return;
    try {
      await DatasImportantes_DELETE(item._id!);
      setItems(prev => sortDatasImportantes(prev.filter(i => i._id !== item._id)));
      notifySuccess('Excluída.');
    } catch (e: unknown) {
      notifyError(e instanceof Error ? e.message : 'Erro ao excluir.');
    }
  }

  function openNew() {
    setModal({ ...EMPTY_FORM });
  }

  function openEdit(item: T_DataImportante) {
    setModal({
      _id:        item._id,
      titulo:     item.titulo,
      data:       item.data,
      recorrente: item.recorrente,
      categoria:  item.categoria,
      horario:    item.horario || '',
      observacao: item.observacao || '',
    });
  }

  function handleSaved(saved: T_DataImportante) {
    setItems(prev => {
      const exists = prev.find(i => i._id === saved._id);
      const next = exists
        ? prev.map(i => i._id === saved._id ? saved : i)
        : [...prev, saved];
      return sortDatasImportantes(next);
    });
    setModal(null);
  }

  if (loadingPerm) return null;
  if (!hasGroup) {
    return (
      <PermissionWrapper href="/portal">
        <PortalBase>
          <div className="col-span-full flex justify-center py-20 text-center">
            <div>
              <p className="text-xl font-semibold text-gray-700">Sem permissão</p>
              <p className="text-sm text-gray-500 mt-2">Você não tem acesso ao módulo de Coordenação.</p>
            </div>
          </div>
        </PortalBase>
      </PermissionWrapper>
    );
  }

  // Agrupa por mês para exibição
  const grouped: Record<string, T_DataImportante[]> = {};
  items.forEach(item => {
    const mes = item.data.split('-')[1] ?? '01';
    if (!grouped[mes]) grouped[mes] = [];
    grouped[mes].push(item);
  });

  return (
    <PermissionWrapper href="/portal/administrativo" groups={['coordenacao']}>
      <PortalBase>
        <div className="col-span-full max-w-3xl mx-auto w-full space-y-5 pb-10">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <FaCalendarAlt size={18} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Datas Importantes</h1>
                <p className="text-sm text-gray-500">{items.length} {items.length === 1 ? 'data cadastrada' : 'datas cadastradas'}</p>
              </div>
            </div>
            <button
              onClick={openNew}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <FaPlus size={12} /> Nova data
            </button>
          </div>

          {/* Lista por mês */}
          {loading ? (
            <div className="text-center py-16 text-sm text-gray-400">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <FaCalendarAlt size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Nenhuma data cadastrada.</p>
              <button onClick={openNew} className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors">
                Adicionar primeira data
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.keys(grouped).sort().map(mes => (
                <div key={mes} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {MESES[parseInt(mes, 10) - 1]}
                    </h3>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {grouped[mes].map(item => (
                      <li key={item._id} className="flex items-center gap-3 px-5 py-3.5">
                        {/* Dia */}
                        <div className="w-10 shrink-0 text-center">
                          <span className="text-lg font-bold text-gray-800 leading-none block">
                            {item.data.split('-')[2]}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-900 truncate">{item.titulo}</span>
                            {item.recorrente && (
                              <span className="flex items-center gap-1 text-xs text-indigo-500">
                                <FaRedo size={9} /> anual
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DATA_IMPORTANTE_CAT_COLORS[item.categoria]}`}>
                              {DATA_IMPORTANTE_CAT_LABELS[item.categoria]}
                            </span>
                            {item.horario && (
                              <span className="text-xs text-gray-400">{item.horario}</span>
                            )}
                            {item.observacao && (
                              <span className="text-xs text-gray-400 truncate max-w-xs">{item.observacao}</span>
                            )}
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Editar"
                          >
                            <FaEdit size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Excluir"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {modal && (
          <FormModal
            initial={modal}
            onClose={() => setModal(null)}
            onSaved={handleSaved}
          />
        )}
      </PortalBase>
    </PermissionWrapper>
  );
};

export default DatasImportantesPage;
