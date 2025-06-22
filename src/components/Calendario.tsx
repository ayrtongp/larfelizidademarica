import { useState } from "react";

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () => {
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    setCurrentDate(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
    setCurrentDate(nextMonth);
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const weeksInMonth = Math.ceil((daysInMonth + startDay) / 7);

  return (
    <div className="bg-white p-4 rounded-md shadow border">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={handlePrevMonth} className="text-gray-500 hover:text-gray-700">
          {"<"}
        </button>
        <h2 className="text-2xl font-semibold">{`${currentDate.toLocaleDateString("pt-BR", { month: "long" })} ${currentDate.getFullYear()}`}</h2>
        <button onClick={handleNextMonth} className="text-gray-500 hover:text-gray-700">
          {">"}
        </button>
      </div>
      <table className="table-fixed">
        <thead>
          <tr>
            <th className="px-1 w-1/7">Dom</th>
            <th className="px-1 w-1/7">Seg</th>
            <th className="px-1 w-1/7">Ter</th>
            <th className="px-1 w-1/7">Qua</th>
            <th className="px-1 w-1/7">Qui</th>
            <th className="px-1 w-1/7">Sex</th>
            <th className="px-1 w-1/7">Sáb</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: weeksInMonth }, (_, rowIndex) => {
            return (
              <tr key={rowIndex}>
                {Array.from({ length: 7 }, (_, colIndex) => {
                  const dayOffset = (rowIndex * 7 + colIndex) - startDay;
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1 + dayOffset);
                  const isDateInMonth = rowIndex === 0 && colIndex < startDay ? false : dayOffset < daysInMonth;
                  const isDateToday = date.toDateString() === new Date().toDateString();

                  return (
                    <td key={colIndex} className={`${isDateInMonth ? "cursor-pointer" : "bg-gray-100"} text-center py-2`}
                      onClick={() => { if (isDateInMonth) { setCurrentDate(date); } }}>
                      <div className={`${isDateToday ? "bg-blue-500 text-white" : ""} rounded-full w-6 h-6 flex items-center justify-center`}>
                        {isDateInMonth ? date.getDate() : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Calendar;
