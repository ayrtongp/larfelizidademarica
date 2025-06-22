import React, { useEffect, useState } from "react";

type Idoso = {
  _id: number;
  nome: string;
  dataNascimento: string;
  dataEntrada: string;
};

function calcularIdade(dataDeNascimento: string) {
  var hoje = new Date();
  var dateParaFormatar = new Date(dataDeNascimento);
  var idade = hoje.getFullYear() - dateParaFormatar.getFullYear();
  var mes = hoje.getMonth() - dateParaFormatar.getMonth();

  if (mes < 0 || (mes === 0 && hoje.getDate() < dateParaFormatar.getDate())) {
    idade--;
  }

  return idade as unknown as string;
}

function calcularTempoDeEstadia(data: string) {
  var dataAtual = new Date();
  var dataFornecida = new Date(data);

  var anos = dataAtual.getFullYear() - dataFornecida.getFullYear();
  var meses = dataAtual.getMonth() - dataFornecida.getMonth();
  var dias = dataAtual.getDate() - dataFornecida.getDate();

  if (dias < 0) { meses--; }

  if (meses < 0) { anos--; meses += 12; }

  if (anos === 0 && meses === 0) { return "menos de um mês"; }
  else if (anos === 0) { return meses + " meses"; }
  else if (meses === 0) { return anos + " anos"; }
  else { return anos + " anos e " + meses + " meses"; }
}

const TabelaIdosos = () => {

  const [data, setData] = useState<Idoso[]>([]);
  const fetchData = async () => {
    const response = await fetch('/api/IdosoController');
    const json = await response.json();
    setData(json);
  }


  useEffect(() => {
    fetchData()
  }, []);

  return (
    <div className="text-sm">
      <table className="table-auto border-collapse border">
        <thead>
          <tr className="bg-black font-bold text-white">
            <th className="hidden px-4 py-1 border">ID</th>
            <th className="px-4 py-1 border">Nome do Idoso</th>
            <th className="px-4 py-1 border">Idade</th>
            <th className="hidden sm:block px-4 py-1 border">Tempo de Estadia</th>
          </tr>
        </thead>
        <tbody>
          {data.map((idoso, index) => (
            <tr key={idoso._id} className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
              <td className="hidden px-4 py-1 border">{idoso._id}</td>
              <td className="px-4 py-1 border">{idoso.nome}</td>
              <td className="px-4 py-1 border">{calcularIdade(idoso.dataNascimento)}</td>
              <td className="hidden sm:block px-4 py-1 border">{calcularTempoDeEstadia(idoso.dataEntrada)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TabelaIdosos;