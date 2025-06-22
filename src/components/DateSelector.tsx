import React, { useState, useEffect } from 'react';

interface DateSelectorProps {
  handleSetDataInicial: (dataInicial: string) => void;
  handleSetDataFinal: (dataFinal: string) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ handleSetDataInicial, handleSetDataFinal }) => {
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    if (selectedMonth !== '') {
      // Calcula o primeiro e último dia do mês selecionado
      const [month, year] = selectedMonth.split('/');
      const numericMonth = monthMap[month.toLowerCase()];
      const firstDayOfMonth = new Date(Number(year), Number(numericMonth), 1);
      const lastDayOfMonth = new Date(Number(year), Number(numericMonth) + 1, 0);

      // Formata as datas para o formato 'yyyy-mm-dd'
      const formattedFirstDay = formatDate(firstDayOfMonth);
      const formattedLastDay = formatDate(lastDayOfMonth);

      // Atualiza os estados
      handleSetDataInicial(formattedFirstDay);
      handleSetDataFinal(formattedLastDay);
    }
  }, [selectedMonth]);

  const monthMap: { [key: string]: number } = {
    'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
    'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
    'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
  };

  const formatDate = (date: any) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();

    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const formattedDate = `${date.toLocaleString('default', { month: 'long' })}/${date.getFullYear().toString()}`;
      options.push(
        <option key={i} value={formattedDate}>
          {formattedDate}
        </option>
      );
    }

    return options;
  };

  return (
    <div className='border p-2 rounded-md bg-gray-200 max-w-[200px]'>
      <label htmlFor="monthSelector" className='font-bold'>Escolha o mês:</label>
      <select
        id="monthSelector"
        onChange={(e) => setSelectedMonth(e.target.value)}
        value={selectedMonth}
      >
        <option value="" disabled>
          Selecione um mês
        </option>
        {generateMonthOptions()}
      </select>
    </div>
  );
};

export default DateSelector;
