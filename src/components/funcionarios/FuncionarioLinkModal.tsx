import React, { useEffect, useState } from 'react';
import ModalPadrao from '@/components/ModalPadrao';
import Button_M3 from '@/components/Formularios/Button_M3';
import S_funcionariosCLT from '@/services/S_funcionariosCLT';
import { T_Contrato } from '@/types/T_funcionariosCLT';
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
  usuariosJaVinculados: string[]; // lista de usuarioIds já com registro CLT
}

const TURNOS = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
  { value: 'integral', label: 'Integral' },
  { value: 'escala_12x36', label: 'Escala 12x36' },
  { value: 'escala_24x48', label: 'Escala 24x48' },
];

const TIPOS_CONTRATO = [
  { value: 'experiencia', label: 'Período de Experiência' },
  { value: 'prazo_indeterminado', label: 'Prazo Indeterminado' },
  { value: 'prazo_determinado', label: 'Prazo Determinado' },
];

const emptyContrato: Omit<T_Contrato, 'cargo' | 'setor' | 'tipoContrato' | 'cargaHorariaSemanal' | 'salarioBase' | 'dataAdmissao'> & {
  cargo: string; setor: string; tipoContrato: string; cargaHorariaSemanal: string; salarioBase: string; dataAdmissao: string;
} = {
  cargo: '',
  setor: '',
  tipoContrato: 'prazo_indeterminado',
  cargaHorariaSemanal: '44',
  turno: 'integral',
  salarioBase: '',
  dataAdmissao: '',
};

const FuncionarioLinkModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, usuariosJaVinculados }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [usuarios, setUsuarios] = useState<UsuarioProfissional[]>([]);
  const [busca, setBusca] = useState('');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioProfissional | null>(null);
  const [contrato, setContrato] = useState({ ...emptyContrato });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setUsuarioSelecionado(null);
      setBusca('');
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

  const usuariosFiltrados = usuarios.filter((u) => {
    const nomeCompleto = `${u.nome} ${u.sobrenome}`.toLowerCase();
    return nomeCompleto.includes(busca.toLowerCase());
  });

  const handleSelectUsuario = (u: UsuarioProfissional) => {
    if (usuariosJaVinculados.includes(u._id)) return;
    setUsuarioSelecionado(u);
    setStep(2);
  };

  const handleContratoChange = (field: string, value: string) => {
    setContrato((prev) => ({ ...prev, [field]: value }));
  };

  const handleSalvar = async () => {
    if (!usuarioSelecionado) return;
    setErro('');

    if (!contrato.cargo.trim()) { setErro('Cargo é obrigatório.'); return; }
    if (!contrato.setor.trim()) { setErro('Setor é obrigatório.'); return; }
    if (!contrato.salarioBase || isNaN(parseFloat(contrato.salarioBase))) { setErro('Salário base inválido.'); return; }
    if (!contrato.dataAdmissao) { setErro('Data de admissão é obrigatória.'); return; }
    if (!contrato.cargaHorariaSemanal || isNaN(parseInt(contrato.cargaHorariaSemanal))) { setErro('Carga horária inválida.'); return; }

    try {
      setSaving(true);
      const createdBy = getUserID();
      const result = await S_funcionariosCLT.create({
        usuarioId: usuarioSelecionado._id,
        contrato: {
          cargo: contrato.cargo.trim(),
          setor: contrato.setor.trim(),
          tipoContrato: contrato.tipoContrato as T_Contrato['tipoContrato'],
          cargaHorariaSemanal: parseInt(contrato.cargaHorariaSemanal),
          turno: contrato.turno as T_Contrato['turno'],
          salarioBase: parseFloat(contrato.salarioBase.replace(',', '.')),
          dataAdmissao: contrato.dataAdmissao,
        },
        createdBy,
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
          <h2 className="text-lg font-bold text-gray-800 mb-1">Vincular Funcionário CLT</h2>
          <p className="text-sm text-gray-500 mb-4">Selecione um usuário do sistema para vincular como funcionário CLT.</p>

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
          <p className="text-sm text-gray-500 mb-4">Preencha os dados mínimos do contrato CLT.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Cargo *</label>
              <input
                type="text"
                value={contrato.cargo}
                onChange={(e) => handleContratoChange('cargo', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Ex: Cuidador de Idosos"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Setor *</label>
              <input
                type="text"
                value={contrato.setor}
                onChange={(e) => handleContratoChange('setor', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Ex: Enfermagem"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Data de Admissão *</label>
              <input
                type="date"
                value={contrato.dataAdmissao}
                onChange={(e) => handleContratoChange('dataAdmissao', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Salário Base (R$) *</label>
              <input
                type="text"
                value={contrato.salarioBase}
                onChange={(e) => handleContratoChange('salarioBase', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Ex: 1500.00"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tipo de Contrato *</label>
              <select
                value={contrato.tipoContrato}
                onChange={(e) => handleContratoChange('tipoContrato', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                {TIPOS_CONTRATO.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Carga Horária Semanal (h) *</label>
              <input
                type="number"
                value={contrato.cargaHorariaSemanal}
                onChange={(e) => handleContratoChange('cargaHorariaSemanal', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                min={1}
                max={80}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Turno</label>
              <select
                value={contrato.turno}
                onChange={(e) => handleContratoChange('turno', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                {TURNOS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {erro && <p className="text-red-500 text-sm mt-3">{erro}</p>}

          <div className="flex gap-2 mt-5 justify-end">
            <Button_M3 label="Cancelar" onClick={onClose} bgColor="gray" type="button" />
            <Button_M3 label={saving ? 'Salvando...' : 'Vincular Funcionário'} onClick={handleSalvar} type="button" disabled={saving} />
          </div>
        </div>
      )}
    </ModalPadrao>
  );
};

export default FuncionarioLinkModal;
