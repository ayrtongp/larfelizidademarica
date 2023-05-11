import axios from 'axios';
import { getUserID } from "../utils/Login";

export async function Permissoes(tipo_permissao) {
  try {
    const userId = getUserID()
    const getData = { id: userId, tipo_permissao: tipo_permissao }
    const response = await axios.post('/api/Controller/CategoriaPermissaoController', getData);
    return response.data
  } catch (error) {
  }
}