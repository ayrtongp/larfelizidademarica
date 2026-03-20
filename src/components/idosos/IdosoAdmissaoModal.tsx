import React, { useEffect, useState } from 'react';
import ModalPadrao from '@/components/ModalPadrao';
import Button_M3 from '@/components/Formularios/Button_M3';
import S_idosoDetalhes from '@/services/S_idosoDetalhes';
import { T_Admissao } from '@/types/T_idosoDetalhes';
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

const MODALIDADES = [
  { value: 'residencia_fixa',       label: 'Residência Fixa' },
  { value: 'residencia_temporaria', label: 'Residência Temporária' },
  { value: 'centro_dia',            label: 'Centro Dia' },
  { value: 'hotelaria',             label: 'Hotelaria' },
];

const emptyAdmissao = {
  dataEntrada: '',
  modalidadePrincipal: 'residencia_fixa',
  motivoEntrada: '',
  numProntuario: '',
};

const IdosoAdmissaoModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, usuariosJaVinculados }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [usuarios, setUsuarios] = useState<UsuarioProfissional[]>([]);
  const [busca, setBusca] = useState('');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioProfissional | null>(null);
  const [admissao, setAdmissao] = useState({ ...emptyAdmissao });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setUsuarioSelecionado(null);
      setBusca('');
      setAdmissao({ ...emptyAdmissao });
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

  const handleChange = (field: string, value: string) => {
    setAdmissao((prev) => ({ ...prev, [field]: value }));
  };

  const handleSalvar = async () => {
    if (!usuarioSelecionado) return;
    setErro('');

    if (!admissao.dataEntrada) { setErro('Data de entrada é obrigatória.'); return; }

    try {
      setSaving(true);
      const result = await S_idosoDetalhes.create({
        usuarioId: usuarioSelecionado._id,
        admissao: {
          dataEntrada: admissao.dataEntrada,
          modalidadePrincipal: admissao.modalidadePrincipal as T_Admissao['modalidadePrincipal'],
          motivoEntrada: admissao.motivoEntrada || undefined,
          numProntuario: admissao.numProntuario || undefined,
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
          <h2 className="text-lg font-bold text-gray-800 mb-1">Admitir Idoso</h2>
          <p className="text-sm text-gray-500 mb-4">Selecione um usuário do sistema para admitir como idoso.</p>

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
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Já admitido</span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Se o idoso não tiver cadastro, crie um novo usuário primeiro no <strong>Admin Panel</strong>.
          </p>
        </div>
      )}

      {step === 2 && usuarioSelecionado && (
        <div>
          <button onClick={() => setStep(1)} className="text-sm text-indigo-600 hover:underline mb-3">← Voltar</button>
          <h2 className="text-lg font-bold text-gray-800 mb-1">
            {usuarioSelecionado.nome} {usuarioSelecionado.sobrenome}
          </h2>
          <p className="text-sm text-gray-500 mb-4">Preencha os dados de admissão.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Data de Entrada *</label>
              <input
                type="date"
                value={admissao.dataEntrada}
                onChange={(e) => handleChange('dataEntrada', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Modalidade *</label>
              <select
                value={admissao.modalidadePrincipal}
                onChange={(e) => handleChange('modalidadePrincipal', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                {MODALIDADES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Nº Prontuário</label>
              <input
                type="text"
                value={admissao.numProntuario}
                onChange={(e) => handleChange('numProntuario', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Ex: PRN-001"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Motivo da Entrada</label>
              <input
                type="text"
                value={admissao.motivoEntrada}
                onChange={(e) => handleChange('motivoEntrada', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {erro && <p className="text-red-500 text-sm mt-3">{erro}</p>}

          <div className="flex gap-2 mt-5 justify-end">
            <Button_M3 label="Cancelar" onClick={onClose} bgColor="gray" type="button" />
            <Button_M3 label={saving ? 'Admitindo...' : 'Admitir Idoso'} onClick={handleSalvar} type="button" disabled={saving} />
          </div>
        </div>
      )}
    </ModalPadrao>
  );
};

export default IdosoAdmissaoModal;
