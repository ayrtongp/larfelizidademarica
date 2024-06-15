import { notifyError, notifySuccess } from "@/utils/Functions";
import SubmitButtonM2 from "../Formularios/SubmitButtonM2";
import TextInputM2 from "../Formularios/TextInputM2";
import { useEffect, useState } from "react";
import SelectSearchInputM2 from "../Formularios/SelectSeachInputM2";
import T_Padrao from "../Tabelas/T_Padrao";
import TabelaPadrao from "../TabelaPadrao";
import GruposUsuario_getGruposUsuario from "@/actions/GruposUsuario_getGruposUsuario";

interface Option {
  value: string;
  label: string;
}

const NovoGrupoUsuario = ({ usuarios, grupos }: any) => {

  const [loading, setLoading] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Option | null>(null);
  const [selectedGrupo, setSelectedGrupo] = useState<Option | null>(null);
  const [n_grupos, setN_grupos] = useState([]);
  const [n_usuarios, setN_Usuarios] = useState([]);
  const [gruposUsuario, setGruposUsuario] = useState([]);

  useEffect(() => {
    async function fetchData() {
      if (usuarios.length > 0 && grupos.length > 0) {
        const optionsUsuarios = usuarios.map((item: any) => ({
          value: item._id,
          label: `${item.nome} ${item.sobrenome}`
        }));
        setN_Usuarios(optionsUsuarios)

        const optionsGrupos = grupos.map((item: any) => ({
          value: item._id,
          label: `${item.cod_grupo} (${item.nome_grupo})`
        }));
        setN_grupos(optionsGrupos)
      }
    }
    fetchData()
  }, [usuarios, grupos])

  useEffect(() => {
    async function fetchData() {
      if (selectedUsuario != null && selectedUsuario != undefined) {
        const gruposDoUsuario = await GruposUsuario_getGruposUsuario(selectedUsuario?.value);
        setGruposUsuario(gruposDoUsuario);
      }
    }
    fetchData()
  }, [selectedUsuario])

  const handleOptionUsuario = (option: any) => {
    setSelectedUsuario(option);
  };

  const handleOptionGrupo = (option: any) => {
    setSelectedGrupo(option);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (selectedGrupo && selectedUsuario) {
      try {
        setLoading(true)

        const res = await fetch(`/api/Controller/GruposUsuario?type=new`, {
          method: 'POST',
          body: JSON.stringify({ id_usuario: selectedUsuario.value, id_grupo: selectedGrupo.value }),
        });
        if (res.ok) {
          setSelectedGrupo(null)
          setSelectedUsuario(null)
          notifySuccess('Adicionado com sucesso!')
          setLoading(false)
        } else {
          notifyError('Houve um problema ao adicionar o registro')
          setLoading(false)
        }

      } catch (error) {
        setLoading(false)
        console.error(error)
      }
    }

  }

  return (
    <div className='grid grid-cols-12 gap-2 border rounded-md shadow-xl p-2 bg-white'>
      <h1 className='font-bold text-xl mx-auto col-span-full'>Vincular Usuário a Grupos</h1>
      {grupos.length > 0 && usuarios.length > 0 && (
        <>
          <div className='col-span-full sm:col-span-6'>
            <SelectSearchInputM2 label2="Lista de Usuários" name="lista_usuarios" options={n_usuarios} onOptionSelect={handleOptionUsuario} />
          </div>
          <div className='col-span-full sm:col-span-6'>
            <SelectSearchInputM2 label2="Lista de Grupos" name="lista_grupos" options={n_grupos} onOptionSelect={handleOptionGrupo} />
          </div>
        </>
      )}
      <div className='col-span-full'>
        <SubmitButtonM2 label='Salvar Grupo-Usuário' onClick={handleSubmit} />
      </div>

      <hr className="my-10" />

      <div className="col-span-full">
        <TabelaPadrao
          esconderPaginacao
          id="t_gruposUsuario"
          resultData={gruposUsuario}
          arrayHeaderNames={['_id', 'Grupos Pertecentes']}
          arrayRowsNames={['_id', 'nome_grupo']}
          onRowClick={() => null}
          handlePageChange={() => null}
        />
      </div>

    </div>
  )
}

export default NovoGrupoUsuario;