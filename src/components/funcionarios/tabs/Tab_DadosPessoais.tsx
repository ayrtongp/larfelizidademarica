import React, { useEffect, useState } from 'react';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_CTPS, T_DadosPessoais, T_Endereco } from '@/types/T_funcionariosCLT';
import S_funcionariosCLT from '@/services/S_funcionariosCLT';
import { notifyError, notifySuccess } from '@/utils/Functions';

interface Props {
  funcionarioId: string;
  dadosPessoais: T_DadosPessoais;
  endereco: T_Endereco;
  ctps: T_CTPS;
  pisPasep?: string;
  onUpdate: (data: { dadosPessoais: T_DadosPessoais; endereco: T_Endereco; ctps: T_CTPS; pisPasep: string }) => void;
}

const ESTADO_CIVIL = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
  { value: 'outro', label: 'Outro' },
];

const ESCOLARIDADE = [
  { value: 'fundamental_incompleto', label: 'Fundamental Incompleto' },
  { value: 'fundamental_completo', label: 'Fundamental Completo' },
  { value: 'medio_incompleto', label: 'Médio Incompleto' },
  { value: 'medio_completo', label: 'Médio Completo' },
  { value: 'superior_incompleto', label: 'Superior Incompleto' },
  { value: 'superior_completo', label: 'Superior Completo' },
  { value: 'pos_graduacao', label: 'Pós-Graduação' },
];

const UFs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const Tab_DadosPessoais: React.FC<Props> = ({ funcionarioId, dadosPessoais, endereco, ctps, pisPasep, onUpdate }) => {
  const [dp, setDp] = useState<T_DadosPessoais>({ ...dadosPessoais });
  const [end, setEnd] = useState<T_Endereco>({ ...endereco });
  const [ctpsForm, setCtpsForm] = useState<T_CTPS>({ ...ctps });
  const [pis, setPis] = useState(pisPasep ?? '');
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    setDp({ ...dadosPessoais });
    setEnd({ ...endereco });
    setCtpsForm({ ...ctps });
    setPis(pisPasep ?? '');
  }, [dadosPessoais, endereco, ctps, pisPasep]);

  const handleDpChange = (field: keyof T_DadosPessoais, value: any) => {
    setDp((prev) => ({ ...prev, [field]: value }));
  };

  const handleEndChange = (field: keyof T_Endereco, value: string) => {
    setEnd((prev) => ({ ...prev, [field]: value }));
  };

  const handleCtpsChange = (field: keyof T_CTPS, value: string) => {
    setCtpsForm((prev) => ({ ...prev, [field]: value }));
  };

  const buscarCep = async () => {
    const cep = end.cep?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) { notifyError('CEP inválido.'); return; }
    try {
      setLoadingCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) { notifyError('CEP não encontrado.'); return; }
      setEnd((prev) => ({
        ...prev,
        logradouro: data.logradouro ?? prev.logradouro,
        bairro: data.bairro ?? prev.bairro,
        cidade: data.localidade ?? prev.cidade,
        estado: data.uf ?? prev.estado,
      }));
    } catch {
      notifyError('Erro ao buscar CEP.');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleSalvar = async () => {
    try {
      setSaving(true);
      await S_funcionariosCLT.updateDadosPessoais(funcionarioId, {
        dadosPessoais: dp,
        endereco: end,
        ctps: ctpsForm,
        pisPasep: pis,
      });
      onUpdate({ dadosPessoais: dp, endereco: end, ctps: ctpsForm, pisPasep: pis });
      notifySuccess('Dados pessoais atualizados!');
    } catch {
      notifyError('Erro ao salvar dados pessoais.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Dados Pessoais */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-1">Dados Pessoais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">CPF</label>
            <input type="text" value={dp.cpf} onChange={(e) => handleDpChange('cpf', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="000.000.000-00" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">RG</label>
            <input type="text" value={dp.rg ?? ''} onChange={(e) => handleDpChange('rg', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Órgão Emissor RG</label>
            <input type="text" value={dp.rgOrgaoEmissor ?? ''} onChange={(e) => handleDpChange('rgOrgaoEmissor', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Ex: SSP/RJ" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Data Emissão RG</label>
            <input type="date" value={dp.rgDataEmissao ?? ''} onChange={(e) => handleDpChange('rgDataEmissao', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Gênero</label>
            <select value={dp.genero ?? ''} onChange={(e) => handleDpChange('genero', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
              <option value="">— selecione —</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Estado Civil</label>
            <select value={dp.estadoCivil ?? ''} onChange={(e) => handleDpChange('estadoCivil', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
              <option value="">— selecione —</option>
              {ESTADO_CIVIL.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Nome da Mãe</label>
            <input type="text" value={dp.nomeMae ?? ''} onChange={(e) => handleDpChange('nomeMae', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Nome do Pai</label>
            <input type="text" value={dp.nomePai ?? ''} onChange={(e) => handleDpChange('nomePai', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Naturalidade</label>
            <input type="text" value={dp.naturalidade ?? ''} onChange={(e) => handleDpChange('naturalidade', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Nacionalidade</label>
            <input type="text" value={dp.nacionalidade ?? ''} onChange={(e) => handleDpChange('nacionalidade', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Escolaridade</label>
            <select value={dp.escolaridade ?? ''} onChange={(e) => handleDpChange('escolaridade', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
              <option value="">— selecione —</option>
              {ESCOLARIDADE.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">PIS/PASEP</label>
            <input type="text" value={pis} onChange={(e) => setPis(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Deficiência (deixe em branco se não houver)</label>
            <input type="text" value={dp.deficiencia ?? ''} onChange={(e) => handleDpChange('deficiencia', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
      </div>

      {/* CTPS */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-1">CTPS — Carteira de Trabalho</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Número</label>
            <input type="text" value={ctpsForm.numero ?? ''} onChange={(e) => handleCtpsChange('numero', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Série</label>
            <input type="text" value={ctpsForm.serie ?? ''} onChange={(e) => handleCtpsChange('serie', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">UF</label>
            <select value={ctpsForm.uf ?? ''} onChange={(e) => handleCtpsChange('uf', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
              <option value="">— selecione —</option>
              {UFs.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Data de Emissão</label>
            <input type="date" value={ctpsForm.dataEmissao ?? ''} onChange={(e) => handleCtpsChange('dataEmissao', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-1">Endereço</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">CEP</label>
              <input type="text" value={end.cep ?? ''} onChange={(e) => handleEndChange('cep', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="00000-000" maxLength={9} />
            </div>
            <button onClick={buscarCep} disabled={loadingCep}
              className="px-3 py-2 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600 disabled:opacity-50 whitespace-nowrap">
              {loadingCep ? 'Buscando...' : 'Buscar CEP'}
            </button>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Logradouro</label>
            <input type="text" value={end.logradouro ?? ''} onChange={(e) => handleEndChange('logradouro', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Número</label>
            <input type="text" value={end.numero ?? ''} onChange={(e) => handleEndChange('numero', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Complemento</label>
            <input type="text" value={end.complemento ?? ''} onChange={(e) => handleEndChange('complemento', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Bairro</label>
            <input type="text" value={end.bairro ?? ''} onChange={(e) => handleEndChange('bairro', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Cidade</label>
            <input type="text" value={end.cidade ?? ''} onChange={(e) => handleEndChange('cidade', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Estado (UF)</label>
            <select value={end.estado ?? ''} onChange={(e) => handleEndChange('estado', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
              <option value="">— selecione —</option>
              {UFs.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button_M3 label={saving ? 'Salvando...' : 'Salvar Dados Pessoais'} onClick={handleSalvar} type="button" disabled={saving} />
      </div>
    </div>
  );
};

export default Tab_DadosPessoais;
