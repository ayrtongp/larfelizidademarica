import axios from 'axios';
import Image from 'next/image';
import React, { useEffect, useState } from 'react'
import ImagemPadrao from '../../../public/images/lar felizidade logo transparente.png'
import Residentes_getAll from '@/actions/Residentes_getAll';
import Residentes_put_toggleIsAtivo from '@/actions/Residentes_put_toggleIsAtivo';
import { notifyError, notifySuccess } from '@/utils/Functions';
import Modalpadrao from '../ModalPadrao';
import { SINAL_VITAL_OPTIONS, validarSinalVital } from '@/models/sinaisvitaisv2.model';
import TextInputM2 from '../Formularios/TextInputM2';
import { Residentes_PUT_alterarDados, Residentes_PUT_alterarLimites } from '@/actions/Residentes';
import TabelaGenerica from '../TabelaGenerica';

type ListaData = {
  apelido: string;
  cpf: string;
  createdAt: string;
  data_entrada: string;
  data_nascimento: string;
  foto_base64: string;
  genero: string;
  informacoes: string;
  is_ativo: string;
  nome: string;
  updatedAt: string;
  _id: string;
  limitesSinais?: { tipo: string; valorMin: string; valorMax: string }[];
}

const ListaResidentesAtivos = () => {
  const [listaUsuarios, setListaUsuarios] = useState<ListaData[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [residenteSelecionado, setResidenteSelecionado] = useState<ListaData | null>(null);
  const [limites, setLimites] = useState<{ [tipo: string]: { valorMin: string; valorMax: string } }>({});

  useEffect(() => {
    async function fetchResidentes() {
      const residentes = await Residentes_getAll();
      setListaUsuarios(residentes);
    }

    fetchResidentes();
  }, []);

  const handleChangeIsAtivo = async (e: any) => {
    const tr = e.target.closest('tr');
    const idCell = tr.dataset.id
    const isAtivo = tr.dataset.value
    const result = await Residentes_put_toggleIsAtivo(idCell, isAtivo)

    if (result) {
      notifySuccess("Alterado com sucesso")
    } else {
      notifyError("Não foi possível alterar.")
    }
  }

  const handleOpenModal = (residente: any) => {
    setResidenteSelecionado(residente._id);
    // Preenche limites atuais ou vazio
    const limitesObj: { [tipo: string]: { valorMin: string; valorMax: string } } = {};
    SINAL_VITAL_OPTIONS.forEach(opt => {
      const limite = residente.limitesSinais?.find((l: any) => l.tipo === opt.value);
      limitesObj[opt.value] = {
        valorMin: limite ? String(limite.valorMin) : "",
        valorMax: limite ? String(limite.valorMax) : "",
      };
    });
    setLimites(limitesObj);
    setModalOpen(true);
  };

  const handleLimiteChange = (tipo: string, campo: "valorMin" | "valorMax", value: string) => {
    setLimites(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [campo]: value
      }
    }));
  };


  const handleSalvarLimites = async () => {
    if (!residenteSelecionado) return;
    const limitesArray = Object.entries(limites)
      .filter(([_, v]) => v.valorMin !== "" && v.valorMax !== "");

    // Validação dos limites usando validarSinalVital e regras de negócio
    for (const lim of limitesArray) {
      const tipo = lim[0];
      const valorMin = lim[1].valorMin;
      const valorMax = lim[1].valorMax;

      const minValidation = validarSinalVital(tipo, valorMin);
      const maxValidation = validarSinalVital(tipo, valorMax);

      if (!minValidation.valido) {
        notifyError(`Mínimo inválido para ${tipo}: ${minValidation.erro}`);
        return;
      }
      if (!maxValidation.valido) {
        notifyError(`Máximo inválido para ${tipo}: ${maxValidation.erro}`);
        return;
      }
    }


    // Monta array final para envio
    const limitesToSend = limitesArray.map(([tipo, v]) => ({
      tipo,
      valorMin: v.valorMin,
      valorMax: v.valorMax,
    }));

    try {
      const [data, ok] = await Residentes_PUT_alterarLimites({
        idResidente: residenteSelecionado,
        body: { limitesSinais: limitesToSend }
      });
      if (ok) {
        notifySuccess("Limites salvos com sucesso!");
        setModalOpen(false);
      } else {
        notifyError("Erro ao salvar limites.");
      }
    } catch {
      notifyError("Erro ao salvar limites.");
    }
  };

  return (
    <div className='flex flex-col gap-5'>
      <div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
        <table className='table-auto w-full text-xs bg-white'>
          <thead className='uppercase'>
            <tr className='bg-black text-white font-bold'>
              <th className='px-2 py-1'>Apelido</th>
              <th className='px-2 py-1'>Nome</th>
              <th className='px-2 py-1'>Ativo</th>
              <th className='px-2 py-1'>ID</th>
            </tr>
          </thead>
          <tbody >
            {listaUsuarios.map((linha, index) => {
              const imagemUsuario = linha.foto_base64
              if (linha.is_ativo === 'S') {
                return (
                  <tr onClick={() => handleOpenModal(linha)} key={index} data-id={linha?._id} data-value={linha.is_ativo} className={`border-b ${index % 2 == 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className='px-2 py-1 whitespace-nowrap min-w-[160px]'>
                      <div className='flex flex-row items-center gap-1 justify-start'>
                        <Image className='rounded-full w-10 h-10' width={30} height={30} src={imagemUsuario ? imagemUsuario : ImagemPadrao} alt={linha?.nome} />
                        {linha?.apelido}
                      </div>
                    </td>
                    <td className='text-center px-2 py-1 whitespace-nowrap'>{linha?.nome}</td>
                    <td className='text-center px-2 py-1 whitespace-nowrap' onClick={handleChangeIsAtivo}>
                      <SelectSimNao linha={linha.is_ativo} />
                    </td>
                    <td className='text-center px-2 py-1 whitespace-nowrap'>{linha?._id}</td>
                  </tr>
                )
              }
            })}
          </tbody>
        </table>

      </div>

      <div className='p-3 bg-white'>
        <div className='my-4'>
          <h2 className='font-bold text-lg'>Residentes Inativos</h2>
        </div>
        <TabelaGenerica rowsPerPage={20} dados={listaUsuarios.filter(f => f.is_ativo === "N")} colunas={[
          { key: 'apelido', label: 'Apelido' },
          { key: 'nome', label: 'Nome' },
          { key: 'is_ativo', label: 'Ativo' },
          { key: '_id', label: 'ID' },
        ]} />
      </div>

      <Modalpadrao isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="p-2">
          <h3 className="font-bold mb-2">Limites de Sinais Vitais</h3>
          {SINAL_VITAL_OPTIONS.map(opt => (
            <div key={opt.value} className="flex items-center gap-2 mb-2">
              <span className="w-40">{opt.label}</span>
              <TextInputM2
                label="Mín"
                name={`min-${opt.value}`}
                value={limites[opt.value]?.valorMin || ""}
                onChange={e => handleLimiteChange(opt.value, "valorMin", e.target.value)}
              />
              <TextInputM2
                label="Máx"
                name={`max-${opt.value}`}
                value={limites[opt.value]?.valorMax || ""}
                onChange={e => handleLimiteChange(opt.value, "valorMax", e.target.value)}
              />
              <span className="text-xs text-gray-500">{opt.placeholder}</span>
            </div>
          ))}
          <div className="flex justify-end gap-2 mt-4">
            <button className="bg-gray-300 px-3 py-1 rounded" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={handleSalvarLimites}>Salvar</button>
          </div>
        </div>
      </Modalpadrao>
    </div>
  )
}

export default ListaResidentesAtivos


const SelectSimNao = ({ linha }: any) => {
  if (linha == "S") linha = true
  else linha = false
  return (
    <div className="flex justify-center items-center border rounded-md border-gray-300 w-20 h-8 mx-auto">
      <div className={`w-1/2 h-full flex justify-center items-center ${linha ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-800 cursor-pointer'}`}>
        S
      </div>
      <div className={`w-1/2 flex h-full justify-center items-center ${!linha ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-800 cursor-pointer'}`}>
        N
      </div>
    </div>
  )
}