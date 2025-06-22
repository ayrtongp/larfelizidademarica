import React from "react";


export default async function getAllActiveInsumos() {
  try {
    const url = '/api/Controller/Insumos?type=getAll'
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Erro na solicitação: ${res.status}`);
    }
    else {
      const data = await res.json();
      return data
    }
  } catch (error) {
    console.error('Catch Error {getAllActiveInsumos}:', error);
  }
}