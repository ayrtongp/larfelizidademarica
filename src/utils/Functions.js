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
  const hora = data.getHours() ; // ajuste para o GMT-3

  if (hora >= 6 && hora < 12) {
    return "Bom dia";
  } else if (hora >= 12 && hora < 18) {
    return "Boa tarde";
  } else {
    return "Boa noite";
  }
}