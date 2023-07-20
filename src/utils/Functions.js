import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

export function formatDateBR(data) {
  const date = new Date(data);

  const options = { timeZone: "UTC", year: "numeric", month: "numeric", day: "numeric" };

  const formattedDate = date.toLocaleDateString("pt-BR", options);
  return formattedDate;
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
      console.log(data)
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
  const brazilTimeOffset = -3 * 60; // Brazil time offset in minutes (-3 hours)

  // Apply the offset to the current date
  const brazilTime = new Date(currentDate.getTime() + brazilTimeOffset * 60 * 1000);

  const year = brazilTime.getFullYear();
  const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brazilTime.getDate()).padStart(2, '0');
  const hours = String(brazilTime.getHours()).padStart(2, '0');
  const minutes = String(brazilTime.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
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