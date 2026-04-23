import React, { useState } from 'react';
import ModalPadrao from '@/components/ModalPadrao';
import Button_M3 from '@/components/Formularios/Button_M3';
import S_idosoDetalhes from '@/services/S_idosoDetalhes';
import { T_Admissao } from '@/types/T_idosoDetalhes';
import { GENDER_LABELS } from '@/types/T_patient';
import { getUserID } from '@/utils/Login';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (novoId: string) => void;
  usuariosJaVinculados?: string[]; // mantido por compat, não usado no novo fluxo
}

const MODALIDADES = [
  { value: 'residencia_fixa',       label: 'Residência Fixa' },
  { value: 'residencia_temporaria', label: 'Residência Temporária' },
  { value: 'centro_dia',            label: 'Centro Dia' },
  { value: 'hotelaria',             label: 'Hotelaria' },
];

const GENEROS = Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }));

const emptyPatient = {
  nome: '',
  sobrenome: '',
  gender: 'unknown' as const,
  birthDate: '',
  cpf: '',
  phone: '',
};

const emptyAdmissao = {
  dataEntrada: '',
  modalidadePrincipal: 'residencia_fixa' as T_Admissao['modalidadePrincipal'],
  motivoEntrada: '',
  numProntuario: '',
};

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50';

const IdosoAdmissaoModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [patient, setPatient] = useState({ ...emptyPatient });
  const [admissao, setAdmissao] = useState({ ...emptyAdmissao });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  const reset = () => {
    setStep(1);
    setPatient({ ...emptyPatient });
    setAdmissao({ ...emptyAdmissao });
    setErro('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleNextStep = () => {
    setErro('');
    if (!patient.nome.trim()) { setErro('Nome é obrigatório.'); return; }
    if (!patient.sobrenome.trim()) { setErro('Sobrenome é obrigatório.'); return; }
    if (!patient.birthDate) { setErro('Data de nascimento é obrigatória.'); return; }
    setStep(2);
  };

  const handleSalvar = async () => {
    setErro('');
    if (!admissao.dataEntrada) { setErro('Data de entrada é obrigatória.'); return; }

    try {
      setSaving(true);
      const result = await S_idosoDetalhes.create({
        patient: {
          nome:      patient.nome.trim(),
          sobrenome: patient.sobrenome.trim(),
          gender:    patient.gender,
          birthDate: patient.birthDate || undefined,
          cpf:       patient.cpf.trim() || undefined,
          phone:     patient.phone.trim() || undefined,
        },
        admissao: {
          dataEntrada:          admissao.dataEntrada,
          modalidadePrincipal:  admissao.modalidadePrincipal,
          motivoEntrada:        admissao.motivoEntrada.trim() || undefined,
          numProntuario:        admissao.numProntuario.trim() || undefined,
        },
        createdBy: getUserID(),
      });
      reset();
      onSuccess(String(result.id));
    } catch {
      setErro('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const setP = (field: string, value: string) =>
    setPatient((prev) => ({ ...prev, [field]: value }));

  const setA = (field: string, value: string) =>
    setAdmissao((prev) => ({ ...prev, [field]: value }));

  return (
    <ModalPadrao isOpen={isOpen} onClose={handleClose}>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-5">
        {[1, 2].map((n) => (
          <React.Fragment key={n}>
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
              ${step === n ? 'bg-indigo-600 text-white' : step > n ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {step > n ? '✓' : n}
            </div>
            {n < 2 && <div className={`flex-1 h-0.5 ${step > n ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 1: Dados do Paciente ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">Dados do idoso</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nome" required>
              <input className={inputCls} value={patient.nome}
                onChange={(e) => setP('nome', e.target.value)} placeholder="Primeiro nome" />
            </Field>
            <Field label="Sobrenome" required>
              <input className={inputCls} value={patient.sobrenome}
                onChange={(e) => setP('sobrenome', e.target.value)} placeholder="Sobrenome" />
            </Field>
            <Field label="Data de nascimento" required>
              <input className={inputCls} type="date" value={patient.birthDate}
                onChange={(e) => setP('birthDate', e.target.value)} />
            </Field>
            <Field label="Gênero" required>
              <select className={inputCls} value={patient.gender}
                onChange={(e) => setP('gender', e.target.value)}>
                {GENEROS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </Field>
            <Field label="CPF">
              <input className={inputCls} value={patient.cpf}
                onChange={(e) => setP('cpf', e.target.value)} placeholder="000.000.000-00" />
            </Field>
            <Field label="Telefone">
              <input className={inputCls} value={patient.phone}
                onChange={(e) => setP('phone', e.target.value)} placeholder="(00) 00000-0000" />
            </Field>
          </div>

          {erro && <p className="text-red-500 text-xs">{erro}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button_M3 label="Cancelar" onClick={handleClose} bgColor="gray" type="button" />
            <Button_M3 label="Próximo →" onClick={handleNextStep} type="button" />
          </div>
        </div>
      )}

      {/* ── Step 2: Dados de Admissão ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <button onClick={() => setStep(1)} className="text-xs text-indigo-500 hover:underline mb-1">
              ← Voltar
            </button>
            <h2 className="text-base font-bold text-gray-800">
              {patient.nome} {patient.sobrenome}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Dados de admissão na ILPI</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Data de entrada" required>
              <input className={inputCls} type="date" value={admissao.dataEntrada}
                onChange={(e) => setA('dataEntrada', e.target.value)} />
            </Field>
            <Field label="Modalidade" required>
              <select className={inputCls} value={admissao.modalidadePrincipal}
                onChange={(e) => setA('modalidadePrincipal', e.target.value)}>
                {MODALIDADES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Field>
            <Field label="Nº Prontuário">
              <input className={inputCls} value={admissao.numProntuario}
                onChange={(e) => setA('numProntuario', e.target.value)} placeholder="Ex: PRN-001" />
            </Field>
            <Field label="Motivo da entrada">
              <input className={inputCls} value={admissao.motivoEntrada}
                onChange={(e) => setA('motivoEntrada', e.target.value)} />
            </Field>
          </div>

          {erro && <p className="text-red-500 text-xs">{erro}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button_M3 label="Cancelar" onClick={handleClose} bgColor="gray" type="button" />
            <Button_M3
              label={saving ? 'Admitindo...' : 'Admitir Paciente'}
              onClick={handleSalvar}
              type="button"
              disabled={saving}
            />
          </div>
        </div>
      )}

    </ModalPadrao>
  );
};

export default IdosoAdmissaoModal;
