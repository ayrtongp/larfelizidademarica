import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


export function formatDateBR(data) {
  const date = new Date(data);

  const options = { timeZone: "UTC", year: "numeric", month: "numeric", day: "numeric" };

  const formattedDate = date.toLocaleDateString("pt-BR", options);
  return formattedDate;
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