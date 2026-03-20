import React, { useEffect, useState } from 'react';
import ModalPadrao from '@/components/ModalPadrao';
import Button_M3 from '@/components/Formularios/Button_M3';
import S_prestadoresServico from '@/services/S_prestadoresServico';
import { T_ContratoPrestador } from '@/types/T_prestadoresServico';
import { getUserID } from '@/utils/Login';

interface UsuarioProfissional {
  _id: string;
  nome: string;
  sobrenome: string;
  funcao?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (novoId: string) => void;
  usuariosJaVinculados: string[];
}

const TIPOS_COBRANCA = [
  { value: 'hora', label: 'Por hora' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'fixo', label: 'Valor fixo' },
  { value: 'diaria', label: 'Diária' },
];

const PERIODICIDADE = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
];

const emptyContrato = {
  tipoServico: '',
  tipoCobranca: 'mensal',
  valor: '',
  dataInicio: '',
  periodicidadePagamento: 'mensal',
  emiteNF: false,
};

const PrestadorLinkModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, usuariosJaVinculados }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [usuarios, setUsuarios] = useState<UsuarioProfissional[]>([]);
  const [busca, setBusca] = useState('');
  const [tipoPessoa, setTipoPessoa] = useState<'pf' | 'pj'>('pf');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioProfissional | null>(null);
  const [contrato, setContrato] = useState({ ...emptyContrato });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setUsuarioSelecionado(null);
      setBusca('');
      setTipoPessoa('pf');
      setContrato({ ...emptyContrato });
      setErro('');
      loadUsuarios();
    }
  }, [isOpen]);

  const loadUsuarios = async () => {
    try {
      const res = await fetch('/api/Controller/Usuario?type=getProfissionais');
      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch {
      setUsuarios([]);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) =>
    `${u.nome} ${u.sobrenome}`.toLowerCase().includes(busca.toLowerCase())
  );

  const handleSelectUsuario = (u: UsuarioProfissional) => {
    if (usuariosJaVinculados.includes(u._id)) return;
    setUsuarioSelecionado(u);
    setStep(2);
  };

  const handleChange = (field: string, value: any) => {
    setContrato((prev) => ({ ...prev, [field]: value }));
  };

  const handleSalvar = async () => {
    if (!usuarioSelecionado) return;
    setErro('');

    if (!contrato.tipoServico.trim()) { setErro('Tipo de serviço é obrigatório.'); return; }
    if (!contrato.valor || isNaN(parseFloat(String(contrato.valor)))) { setErro('Valor inválido.'); return; }
    if (!contrato.dataInicio) { setErro('Data de início é obrigatória.'); return; }

    try {
      setSaving(true);
      const result = await S_prestadoresServico.create({
        usuarioId: usuarioSelecionado._id,
        tipoPessoa,
        contrato: {
          tipoServico: contrato.tipoServico.trim(),
          tipoCobranca: contrato.tipoCobranca as T_ContratoPrestador['tipoCobranca'],
          valor: parseFloat(String(contrato.valor).replace(',', '.')),
          dataInicio: contrato.dataInicio,
          periodicidadePagamento: contrato.periodicidadePagamento as T_ContratoPrestador['periodicidadePagamento'],
          emiteNF: contrato.emiteNF,
        },
        createdBy: getUserID(),
      });
      onSuccess(String(result.id));
    } catch {
      setErro('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPadrao isOpen={isOpen} onClose={onClose}>
      {step === 1 && (
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Vincular Prestador de Serviço</h2>
          <p className="text-sm text-gray-500 mb-4">Selecione um usuário do sistema para vincular como prestador.</p>

          <input
            type="text"
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3 focus:outline-none focus:border-indigo-500"
          />

          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 border rounded">
            {usuariosFiltrados.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">Nenhum usuário encontrado.</p>
            )}
            {usuariosFiltrados.map((u) => {
              const jaVinculado = usuariosJaVinculados.includes(u._id);
              return (
                <div
                  key={u._id}
                  onClick={() => handleSelectUsuario(u)}
                  className={`flex items-center justify-between px-3 py-2.5 text-sm ${jaVinculado ? 'opacity-40 cursor-not-allowed' : 'hover:bg-indigo-50 cursor-pointer'}`}
                >
                  <div>
                    <p className="font-medium text-gray-800">{u.nome} {u.sobrenome}</p>
                    {u.funcao && <p className="text-gray-500 text-xs">{u.funcao}</p>}
                  </div>
                  {jaVinculado && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Já vinculado</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && usuarioSelecionado && (
        <div>
          <button onClick={() => setStep(1)} className="text-sm text-indigo-600 hover:underline mb-3">← Voltar</button>
          <h2 className="text-lg font-bold text-gray-800 mb-1">
            {usuarioSelecionado.nome} {usuarioSelecionado.sobrenome}
          </h2>
          <p className="text-sm text-gray-500 mb-4">Preencha os dados mínimos do contrato de prestação.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Tipo de Pessoa *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" checked={tipoPessoa === 'pf'} onChange={() => setTipoPessoa('pf')} /> Pessoa Física (PF)
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" checked={tipoPessoa === 'pj'} onChange={() => setTipoPessoa('pj')} /> Pessoa Jurídica (PJ)
                </label>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Tipo de Serviço *</label>
              <input
                type="text"
                value={contrato.tipoServico}
                onChange={(e) => handleChange('tipoServico', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Ex: Fisioterapia, TI, Limpeza"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tipo de Cobrança *</label>
              <select
                value={contrato.tipoCobranca}
                onChange={(e) => handleChange('tipoCobranca', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                {TIPOS_COBRANCA.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Valor (R$) *</label>
              <input
                type="text"
                value={contrato.valor}
                onChange={(e) => handleChange('valor', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Ex: 2500.00"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Data de Início *</label>
              <input
                type="date"
                value={contrato.dataInicio}
                onChange={(e) => handleChange('dataInicio', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Periodicidade de Pagamento</label>
              <select
                value={contrato.periodicidadePagamento}
                onChange={(e) => handleChange('periodicidadePagamento', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                {PERIODICIDADE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="emiteNF"
                checked={contrato.emiteNF}
                onChange={(e) => handleChange('emiteNF', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="emiteNF" className="text-sm text-gray-700 cursor-pointer">Emite Nota Fiscal (NF)</label>
            </div>
          </div>

          {erro && <p className="text-red-500 text-sm mt-3">{erro}</p>}

          <div className="flex gap-2 mt-5 justify-end">
            <Button_M3 label="Cancelar" onClick={onClose} bgColor="gray" type="button" />
            <Button_M3 label={saving ? 'Salvando...' : 'Vincular Prestador'} onClick={handleSalvar} type="button" disabled={saving} />
          </div>
        </div>
      )}
    </ModalPadrao>
  );
};

export default PrestadorLinkModal;
