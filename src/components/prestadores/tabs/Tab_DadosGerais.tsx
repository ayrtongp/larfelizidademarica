import React, { useEffect, useState } from 'react';
import Button_M3 from '@/components/Formularios/Button_M3';
import { T_DadosPrestador, T_EnderecoPrestador } from '@/types/T_prestadoresServico';
import S_prestadoresServico from '@/services/S_prestadoresServico';
import { notifyError, notifySuccess } from '@/utils/Functions';

interface Props {
  prestadorId: string;
  tipoPessoa: 'pf' | 'pj';
  dados: T_DadosPrestador;
  endereco: T_EnderecoPrestador;
  onUpdate: (data: { dados: T_DadosPrestador; endereco: T_EnderecoPrestador; tipoPessoa: 'pf' | 'pj' }) => void;
}

const UFs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const Tab_DadosGerais: React.FC<Props> = ({ prestadorId, tipoPessoa: tipoPessoaInit, dados, endereco, onUpdate }) => {
  const [tipoPessoa, setTipoPessoa] = useState<'pf' | 'pj'>(tipoPessoaInit);
  const [form, setForm] = useState<T_DadosPrestador>({ ...dados });
  const [end, setEnd] = useState<T_EnderecoPrestador>({ ...endereco });
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    setTipoPessoa(tipoPessoaInit);
    setForm({ ...dados });
    setEnd({ ...endereco });
  }, [tipoPessoaInit, dados, endereco]);

  const handleFormChange = (field: keyof T_DadosPrestador, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEndChange = (field: keyof T_EnderecoPrestador, value: string) => {
    setEnd((prev) => ({ ...prev, [field]: value }));
  };

  const buscarCep = async () => {
    const cep = end.cep?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setEnd((prev) => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }));
      }
    } catch { /* silently fail */ }
    finally { setLoadingCep(false); }
  };

  const handleSalvar = async () => {
    try {
      setSaving(true);
      await S_prestadoresServico.updateDados(prestadorId, { dados: form, endereco: end, tipoPessoa });
      onUpdate({ dados: form, endereco: end, tipoPessoa });
      notifySuccess('Dados atualizados!');
    } catch {
      notifyError('Erro ao salvar dados.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500';
  const labelClass = 'block text-xs text-gray-600 mb-1';

  return (
    <div className="space-y-6">
      {/* Tipo de Pessoa */}
      <div>
        <p className={labelClass}>Tipo de Pessoa</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="radio" checked={tipoPessoa === 'pf'} onChange={() => setTipoPessoa('pf')} /> Pessoa Física (PF)
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="radio" checked={tipoPessoa === 'pj'} onChange={() => setTipoPessoa('pj')} /> Pessoa Jurídica (PJ)
          </label>
        </div>
      </div>

      {/* Dados identificação */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          {tipoPessoa === 'pj' ? 'Dados da Empresa' : 'Dados Pessoais'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tipoPessoa === 'pf' ? (
            <div>
              <label className={labelClass}>CPF</label>
              <input type="text" value={form.cpf ?? ''} onChange={(e) => handleFormChange('cpf', e.target.value)}
                className={inputClass} placeholder="000.000.000-00" />
            </div>
          ) : (
            <>
              <div>
                <label className={labelClass}>CNPJ</label>
                <input type="text" value={form.cnpj ?? ''} onChange={(e) => handleFormChange('cnpj', e.target.value)}
                  className={inputClass} placeholder="00.000.000/0000-00" />
              </div>
              <div>
                <label className={labelClass}>Razão Social</label>
                <input type="text" value={form.razaoSocial ?? ''} onChange={(e) => handleFormChange('razaoSocial', e.target.value)}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nome Fantasia</label>
                <input type="text" value={form.nomeFantasia ?? ''} onChange={(e) => handleFormChange('nomeFantasia', e.target.value)}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Inscrição Municipal</label>
                <input type="text" value={form.inscricaoMunicipal ?? ''} onChange={(e) => handleFormChange('inscricaoMunicipal', e.target.value)}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Inscrição Estadual</label>
                <input type="text" value={form.inscricaoEstadual ?? ''} onChange={(e) => handleFormChange('inscricaoEstadual', e.target.value)}
                  className={inputClass} />
              </div>
            </>
          )}
        </div>
      </div>

      <hr />

      {/* Endereço */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Endereço</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>CEP</label>
            <div className="flex gap-2">
              <input type="text" value={end.cep ?? ''} onChange={(e) => handleEndChange('cep', e.target.value)}
                onBlur={buscarCep} className={inputClass} placeholder="00000-000" maxLength={9} />
              <button type="button" onClick={buscarCep}
                className="px-3 py-2 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 whitespace-nowrap">
                {loadingCep ? '...' : 'Buscar'}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Logradouro</label>
            <input type="text" value={end.logradouro ?? ''} onChange={(e) => handleEndChange('logradouro', e.target.value)}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Número</label>
            <input type="text" value={end.numero ?? ''} onChange={(e) => handleEndChange('numero', e.target.value)}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Complemento</label>
            <input type="text" value={end.complemento ?? ''} onChange={(e) => handleEndChange('complemento', e.target.value)}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Bairro</label>
            <input type="text" value={end.bairro ?? ''} onChange={(e) => handleEndChange('bairro', e.target.value)}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Cidade</label>
            <input type="text" value={end.cidade ?? ''} onChange={(e) => handleEndChange('cidade', e.target.value)}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Estado (UF)</label>
            <select value={end.estado ?? ''} onChange={(e) => handleEndChange('estado', e.target.value)}
              className={inputClass}>
              <option value="">— selecione —</option>
              {UFs.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button_M3 label={saving ? 'Salvando...' : 'Salvar Dados'} onClick={handleSalvar} type="button" disabled={saving} />
      </div>
    </div>
  );
};

export default Tab_DadosGerais;
