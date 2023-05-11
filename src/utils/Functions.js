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
    position: "top-right", autoClose: 5000, hideProgressBar: false,
    closeOnClick: true, pauseOnHover: true, progress: undefined, theme: "light",
  });
}

export function notifySuccess(success) {
  toast.success(success, {
    position: "top-right", autoClose: 5000, hideProgressBar: false,
    closeOnClick: true, pauseOnHover: true, progress: undefined, theme: "light",
  });
}