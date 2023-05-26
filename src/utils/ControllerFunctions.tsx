import { useEffect, useState } from "react";

export function getIsAdmin() {
  const [admin, setAdmin] = useState(false);

  async function myFuntction() {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') as string)
    const userId = userInfo.id
    const response = await fetch(`/api/Controller/UsuarioController?id=${userId}&registro=admin`, { method: "GET", });
    const data = await response.json()
    const boolean = await data.usuario?.admin === "S" ? true : false
    setAdmin(boolean)
  }

  myFuntction()

  return admin
}