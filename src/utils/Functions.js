import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

export function getUserDetails() {
  const itemExists = localStorage.getItem('userInfo') !== null && localStorage.getItem('userInfo') !== undefined
  if (itemExists) {
    const data = JSON.parse(localStorage.getItem('userInfo'))
    return data
  } else {
    return 'problem trying to get details'
  }
}

export function isComentarioVazio(html) {
  const texto = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
  return texto.length === 0;
};

export function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export function formatDateBRHora(data) {
  const date = new Date(data);

  const options = { timeZone: "America/Sao_Paulo", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" };

  const formattedDate = date.toLocaleDateString("pt-BR", options);
  return formattedDate;
}

export function formatStringDate(format, data) {
  if (format == 'yymmdd') {
    const formattedDate = data.split('-').join('').slice(2);
    return formattedDate;
  }
  else if (format == 'dd/mm/yy') {
    const [year, month, day] = data.split('-');
    const formattedDate = `${day}/${month}/${year.slice(2)}`;
    return formattedDate;
  }
  else if (format == 'yyyy-mm-dd') {
    if (data !== undefined) {
      const [year, month, day] = data.split('-');
      const formattedDate = `${day}/${month}/${year.slice(2)}`;
      return formattedDate;
    }
  }
}

export function formatarTexto(texto) {
  if (texto != undefined && texto != null && texto != '') {
    // Remove acentos e converte para minúsculo
    texto = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    // Remove espaços em branco no início e fim da string
    texto = texto.trim();
    // Remove todos os espaços em branco da string
    texto = texto.replace(/\s+/g, '');
    return texto;
  }
}

export function getCurrentDateTime() {
  const currentDate = new Date();
  const options = { timeZone: "America/Sao_Paulo", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" };
  const formattedDate = currentDate.toLocaleDateString("pt-BR", options);

  const [date, hour] = formattedDate.replace(',', '').split(' ')
  const [day, month, year] = date.split('/')

  return `${year}-${month}-${day} ${hour}`;
}

export function notifyError(error) {
  toast.error(error, {
    position: "top-right", autoClose: 3000, hideProgressBar: false,
    closeOnClick: true, pauseOnHover: false, progress: undefined, theme: "light",
  });
}

export function notifySuccess(success) {
  toast.success(success, {
    position: "top-right", autoClose: 3000, hideProgressBar: false,
    closeOnClick: true, pauseOnHover: false, progress: undefined, theme: "light",
  });
}

export function saudacao() {
  const data = new Date();
  const hora = data.getHours(); // ajuste para o GMT-3

  if (hora >= 6 && hora < 12) {
    return "Bom dia";
  } else if (hora >= 12 && hora < 18) {
    return "Boa tarde";
  } else {
    return "Boa noite";
  }
}

export function calcularIdade(dataDeNascimento) {
  var hoje = new Date();
  var dateParaFormatar = new Date(dataDeNascimento);
  var idade = hoje.getFullYear() - dateParaFormatar.getFullYear();
  var mes = hoje.getMonth() - dateParaFormatar.getMonth();

  if (mes < 0 || (mes === 0 && hoje.getDate() < dateParaFormatar.getDate())) {
    idade--;
  }

  return idade;
}

export function pillsBadge(color, text) {
  if (color == 'green') {
    return (<span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">{text}</span>)
  }
  else if (color == 'red') {
    return (<span className="bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-300">{text}</span>)
  }
  else if (color == 'yellow') {
    return (<span className="bg-yellow-100 text-yellow-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-yellow-900 dark:text-yellow-300">{text}</span>)
  }
}

export async function getID(id) {
  const result = await axios.get(`/api/Controller/SinaisVitaisController?id=${id}`)
  return result.data.sinalVital
}

export async function getGridSinaisVitaisByID(id) {
  const result = await axios.get(`/api/Controller/SinaisVitaisController?id=${id}`)
  return result.data.sinalVital.lista_sinais
}

export function formatDateBR(data) {
  const arrayTest = ['', null, undefined, ' ']
  if (!arrayTest.includes(data)) {
    const date = new Date(data);

    const options = { timeZone: "UTC", year: "numeric", month: "numeric", day: "numeric" };

    const formattedDate = date.toLocaleDateString("pt-BR", options);
    return formattedDate;
  }
  else {
    return ''
  }
}

export function formatToBRL(number) {
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function slice3Points(string, qntSlice, startSlice) {
  if (string.length > qntSlice) {
    return string.slice(startSlice, (qntSlice + startSlice)) + "..."
  }
  else {
    return string
  }

}