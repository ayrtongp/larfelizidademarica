import { notifyError, notifySuccess } from "@/utils/Functions";
import SubmitButtonM2 from "../Formularios/SubmitButtonM2";
import TextInputM2 from "../Formularios/TextInputM2";
import { useState } from "react";
import SelectInputM2 from "../Formularios/SelectInputM2";
import { UNIDADE_BASE_OPTIONS, UNIDADE_ENTRADA_OPTIONS } from "@/models/insumos.model";

interface Categoria {
  option: string;
  value: string;
}

interface Props {
  listaDeCategorias: Categoria[];
}

const EMPTY_FORM = {
  nome_insumo: "",
  unidade_base: "",
  unidade_entrada: "",
  fator_conversao: 1,
  estoque_minimo: 0,
  cod_categoria: "",
  descricao: "",
};

function AjudaEmbalagemModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-base">Como preencher Embalagem e Unidades</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">&times;</button>
        </div>

        <p className="text-sm text-gray-600">
          Esses campos ensinam o sistema a entender a diferença entre
          <strong> como o produto chega </strong> e <strong> como você conta no estoque</strong>.
        </p>

        <div className="bg-indigo-50 rounded-xl p-4 space-y-3 text-sm">
          <p className="font-semibold text-indigo-800">Exemplo: Losartana 50mg</p>
          <div className="space-y-2 text-gray-700">
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">1</span>
              <p><strong>Como conta no estoque:</strong> comprimido<br />
                <span className="text-gray-500 text-xs">A menor unidade que você entrega ou anota.</span></p>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">2</span>
              <p><strong>Como chega do fornecedor:</strong> caixa<br />
                <span className="text-gray-500 text-xs">A embalagem que vem na nota fiscal.</span></p>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">3</span>
              <p><strong>Quantos por embalagem:</strong> 30<br />
                <span className="text-gray-500 text-xs">Quantos comprimidos tem dentro de 1 caixa.</span></p>
            </div>
          </div>
          <div className="border-t border-indigo-200 pt-3 text-indigo-700 font-medium text-xs">
            Resultado: ao lançar &quot;2 caixas&quot; o sistema já soma 60 comprimidos automaticamente.
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-800">
          <strong>E se a caixa vier com quantidade diferente?</strong><br />
          <span className="text-xs">Sem problema. Na hora de lançar a entrada você pode ajustar o número — o sistema aceita caixa de 30 e caixa de 60 do mesmo produto.</span>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
          <strong>Produto que não vem em embalagem?</strong><br />
          <span className="text-xs">Deixe &quot;Como chega&quot; em branco. O sistema funciona normalmente sem conversão.</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}

const CadastroInsumo: React.FC<Props> = ({ listaDeCategorias }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [ajudaOpen, setAjudaOpen] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'fator_conversao' ? (parseInt(value) || 1)
            : name === 'estoque_minimo' ? (parseInt(value) || 0)
            : value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`/api/Controller/Insumos?type=new`, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        notifySuccess('Adicionado com sucesso!');
        setFormData(EMPTY_FORM);
      } else {
        const err = await res.json().catch(() => ({}));
        notifyError(err.message || 'Houve um problema ao adicionar o registro');
      }
    } catch (error) {
      console.error(error);
      notifyError('Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  };

  const semConversao = !formData.unidade_entrada || formData.fator_conversao <= 1;
  const hintConversao = !semConversao
    ? `1 ${formData.unidade_entrada} = ${formData.fator_conversao} ${formData.unidade_base || '?'}`
    : '';

  return (
    <>
      {ajudaOpen && <AjudaEmbalagemModal onClose={() => setAjudaOpen(false)} />}

      <div className='grid grid-cols-12 gap-2 border rounded-md shadow-xl p-2 bg-white w-[95%] my-2'>
        <h1 className='font-bold text-xl mx-auto col-span-full'>Cadastro de Insumo</h1>

        {/* Dados básicos */}
        <div className='col-span-full sm:col-span-4'>
          <TextInputM2 label='Nome do Insumo' name='nome_insumo' value={formData.nome_insumo} disabled={false} onChange={handleChange} />
        </div>
        <div className='col-span-full sm:col-span-4'>
          <SelectInputM2 options={listaDeCategorias} label='Categoria' name='cod_categoria' value={formData.cod_categoria} disabled={false} onChange={handleChange} />
        </div>
        <div className='col-span-full sm:col-span-4'>
          <TextInputM2 label='Descrição' name='descricao' value={formData.descricao} disabled={false} onChange={handleChange} />
        </div>

        {/* Seção: Embalagem e Unidades */}
        <div className='col-span-full mt-2'>
          <div className='flex items-center gap-2 mb-2'>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Embalagem e Unidades</p>
            <button
              type="button"
              onClick={() => setAjudaOpen(true)}
              className='w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold hover:bg-indigo-200 transition-colors flex items-center justify-center'
              title="Como preencher estes campos?"
            >
              ?
            </button>
          </div>
          <div className='grid grid-cols-12 gap-2'>

            <div className='col-span-full sm:col-span-4'>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Como conta no estoque</label>
              <input
                list="unidade-base-list"
                name='unidade_base'
                value={formData.unidade_base}
                onChange={handleChange}
                placeholder="ex: comprimido, ml, g..."
                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400'
              />
              <datalist id="unidade-base-list">
                {UNIDADE_BASE_OPTIONS.map(u => <option key={u} value={u} />)}
              </datalist>
            </div>

            <div className='col-span-full sm:col-span-4'>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Como chega do fornecedor <span className='text-gray-400'>(opcional)</span></label>
              <input
                list="unidade-entrada-list"
                name='unidade_entrada'
                value={formData.unidade_entrada}
                onChange={handleChange}
                placeholder="ex: caixa, frasco, pacote..."
                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400'
              />
              <datalist id="unidade-entrada-list">
                {UNIDADE_ENTRADA_OPTIONS.map(u => <option key={u} value={u} />)}
              </datalist>
            </div>

            <div className='col-span-full sm:col-span-4'>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Quantos por embalagem</label>
              <input
                type='number'
                name='fator_conversao'
                min={1}
                value={formData.fator_conversao}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400'
              />
              {hintConversao && (
                <p className='text-xs text-indigo-600 mt-1'>{hintConversao}</p>
              )}
            </div>
          </div>
        </div>

        {/* Estoque mínimo */}
        <div className='col-span-full sm:col-span-4 mt-2'>
          <label className='block text-xs font-medium text-gray-600 mb-1'>
            Estoque Mínimo <span className='text-gray-400'>(alerta de reposição)</span>
          </label>
          <input
            type='number'
            name='estoque_minimo'
            min={0}
            value={formData.estoque_minimo}
            onChange={handleChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400'
          />
          <p className='text-xs text-gray-400 mt-1'>0 = sem alerta de reposição</p>
        </div>

        <div className='col-span-full'>
          <SubmitButtonM2 label='Salvar Insumo' onClick={handleSubmit} />
        </div>
      </div>
    </>
  );
};

export default CadastroInsumo;
