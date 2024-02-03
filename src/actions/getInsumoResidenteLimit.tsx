import React from "react";

interface getProps {
  residenteId: string;
  insumoId: string;
  limit?: number;
  page?: number;
}

export default async function getInsumoResidenteLimit({ residenteId, insumoId, limit = 20, page = 1 }: getProps) {
  try {
    const url = `/api/Controller/InsumoEstoque?type=getInsumoResidenteLimit&residenteId=${residenteId}&insumoId=${insumoId}&limit=${limit}&page=${page}`
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Erro na solicitação: ${res.status}`);
    }
    else {
      const data = await res.json();
      return data
    }
  } catch (error) {
    console.error('Catch Error {getInsumoResidenteLimit}:', error);
  }
}