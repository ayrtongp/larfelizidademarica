import { notifyError, notifySuccess } from "@/utils/Functions";
import { useEffect, useState } from "react";
import SelectSearchInputM2 from "../Formularios/SelectSeachInputM2";
import GruposUsuario_getGruposUsuario from "@/actions/GruposUsuario_getGruposUsuario";
import { FaTag, FaUser } from "react-icons/fa";

interface Option {
  value: string;
  label: string;
}

interface GrupoUsuario {
  _id: string;
  nome_grupo: string;
  cod_grupo?: string;
}

const NovoGrupoUsuario = ({ usuarios, grupos }: any) => {
  const [loading, setLoading] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Option | null>(null);
  const [selectedGrupo, setSelectedGrupo] = useState<Option | null>(null);
  const [n_grupos, setN_grupos] = useState<Option[]>([]);
  const [n_usuarios, setN_usuarios] = useState<Option[]>([]);
  const [gruposUsuario, setGruposUsuario] = useState<GrupoUsuario[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(false);

  useEffect(() => {
    if (usuarios?.length > 0 && grupos?.length > 0) {
      setN_usuarios(usuarios.map((u: any) => ({ value: u._id, label: `${u.nome} ${u.sobrenome}` })));
      setN_grupos(grupos.map((g: any) => ({ value: g._id, label: `${g.cod_grupo} — ${g.nome_grupo}` })));
    }
  }, [usuarios, grupos]);

  useEffect(() => {
    if (!selectedUsuario) { setGruposUsuario([]); return; }
    async function fetchGrupos() {
      setLoadingGrupos(true);
      try {
        const result = await GruposUsuario_getGruposUsuario(selectedUsuario!.value);
        setGruposUsuario(Array.isArray(result) ? result : []);
      } finally {
        setLoadingGrupos(false);
      }
    }
    fetchGrupos();
  }, [selectedUsuario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrupo || !selectedUsuario) {
      notifyError('Selecione um usuário e um grupo.');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/Controller/GruposUsuario?type=new`, {
        method: 'POST',
        body: JSON.stringify({ id_usuario: selectedUsuario.value, id_grupo: selectedGrupo.value }),
      });
      if (res.ok) {
        notifySuccess('Grupo vinculado com sucesso!');
        setSelectedGrupo(null);
        // Recarrega grupos do usuário selecionado
        const result = await GruposUsuario_getGruposUsuario(selectedUsuario.value);
        setGruposUsuario(Array.isArray(result) ? result : []);
      } else {
        notifyError('Erro ao vincular grupo.');
      }
    } catch (error) {
      console.error(error);
      notifyError('Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-5'>
      <p className='text-sm text-gray-500'>
        Selecione um usuário e um grupo de permissão para vinculá-los.
      </p>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='w-full'>
            <SelectSearchInputM2
              label2='Usuário'
              name='lista_usuarios'
              options={n_usuarios}
              onOptionSelect={(opt) => setSelectedUsuario(opt)}
            />
          </div>
          <div className='w-full'>
            <SelectSearchInputM2
              label2='Grupo de Permissão'
              name='lista_grupos'
              options={n_grupos}
              onOptionSelect={(opt) => setSelectedGrupo(opt)}
            />
          </div>
        </div>

        {/* Preview da seleção */}
        {(selectedUsuario || selectedGrupo) && (
          <div className='flex flex-wrap gap-2 text-xs'>
            {selectedUsuario && (
              <span className='flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-full'>
                <FaUser size={10} /> {selectedUsuario.label}
              </span>
            )}
            {selectedGrupo && (
              <span className='flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full'>
                <FaTag size={10} /> {selectedGrupo.label}
              </span>
            )}
          </div>
        )}

        <button type='submit' disabled={loading || !selectedUsuario || !selectedGrupo}
          className='bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded transition-colors'>
          {loading ? 'Vinculando...' : 'Vincular Grupo ao Usuário'}
        </button>
      </form>

      {/* Grupos do usuário selecionado */}
      {selectedUsuario && (
        <div>
          <div className='flex items-center gap-2 mb-2'>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
              Grupos de {selectedUsuario.label}
            </p>
            {loadingGrupos && <span className='text-xs text-gray-400'>Carregando...</span>}
          </div>

          {!loadingGrupos && gruposUsuario.length === 0 && (
            <p className='text-sm text-gray-400 italic'>Este usuário não possui grupos vinculados.</p>
          )}

          {gruposUsuario.length > 0 && (
            <div className='flex flex-wrap gap-2'>
              {gruposUsuario.map((g: GrupoUsuario) => (
                <span key={g._id}
                  className='flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full border border-gray-200'>
                  <FaTag size={9} className='text-gray-400' />
                  {g.nome_grupo}
                  {g.cod_grupo && <span className='text-gray-400'>({g.cod_grupo})</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NovoGrupoUsuario;
