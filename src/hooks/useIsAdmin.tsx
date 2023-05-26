import { useEffect, useState } from "react";

export const useIsAdmin = () => {
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    async function fetchAdminStatus() {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') as string);
      const userId = userInfo.id;
      const response = await fetch(`/api/Controller/UsuarioController?id=${userId}&registro=admin`, { method: "GET" });
      const data = await response.json();
      const boolean = data.usuario?.admin === "S";
      setAdmin(boolean);
    }

    fetchAdminStatus();
  }, []);

  return admin;
}