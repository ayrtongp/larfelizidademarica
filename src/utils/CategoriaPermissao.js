import axios from 'axios';
import { getUserID } from "../utils/Login";

export async function Permissoes(tipo_permissao) {
  try {
    const userId = getUserID()
    const getData = { id: userId, tipo_permissao: tipo_permissao }
    const response = await axios.post('/api/Controller/CategoriaPermissaoController', getData);
    return response.data
  } catch (error) {
<<<<<<< HEAD
=======
    console.log(error)
>>>>>>> 7339cee648b4818c5c69565314a70e00f419a26e
  }
}