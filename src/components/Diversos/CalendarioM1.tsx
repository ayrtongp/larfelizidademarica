import React, { useEffect, useState } from 'react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface EventosProps {
    data: string; // FORMATO ::: dd/mm/yyyy => Ex.: 20/10/2023
    titulo: string;
    horario?: string;
    observacao?: string;
}

interface Props {
    eventos: EventosProps[]
}

const CalendarioM1 = ({ eventos }: Props) => {
    const [renderDia, setRenderDia] = useState<number>(0);
    const [renderMes, setRenderMes] = useState<number>(0);
    const [renderAno, setRenderAno] = useState<number>(0);
    const [renderSemanas, setRenderSemanas] = useState<any>([]);
    const [diasMarcados, setDiasMarcados] = useState<number[]>([]);

    const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

    useEffect(() => { // INITIAL STATES
        const { year, month, day } = getCurrentMonth();
        const weeks = generateCalendar(year, month);
        setRenderDia(day)
        setRenderMes(month)
        setRenderAno(year)
        setRenderSemanas(weeks)

        const eventosDoMes = filtrarEventosDoMes(eventos, month)
        const diasParaMarcar = eventosDoMes.map((evento: any) => parseInt(evento.data.split('/')[0]))
        setDiasMarcados(diasParaMarcar)
    }, [])

    // #############################################
    // HANDLERS
    // #############################################

    const handleClickChevronMonth = (e: any) => {
        let newDate
        if (e.target.id == 'cLeft') {
            newDate = new Date(renderAno, renderMes - 1)
        }
        else if (e.target.id == 'cRight') {
            newDate = new Date(renderAno, renderMes + 1)
        }
        else {
            newDate = new Date(renderAno, renderMes)
        }

        const year = newDate.getFullYear()
        const month = newDate.getMonth()
        const weeks = generateCalendar(year, month);

        setRenderDia(1)
        setRenderMes(month)
        setRenderAno(year)
        setRenderSemanas(weeks)

        const eventosDoMes = filtrarEventosDoMes(eventos, month)
        const diasParaMarcar = eventosDoMes.map((evento: any) => parseInt(evento.data.split('/')[0]))
        setDiasMarcados(diasParaMarcar)
    }

    // #############################################
    // RETURN
    // #############################################

    return (
        <div className="flex items-center justify-center py-2 px-2">
            <div className="max-w-3xl w-full shadow-lg flex sm:flex-row flex-col justify-center">
                <div className="md:p-8 p-5 dark:bg-gray-800 bg-white rounded-t max-w-sm">
                    <div className="px-2 flex items-center justify-between">
                        <span tabIndex={0} className="focus:outline-none  text-base font-bold dark:text-gray-100 text-gray-800">{getMonthName(renderMes)}, {renderAno}</span>
                        <div className="flex items-center">
                            <button aria-label="calendar backward" className="focus:text-gray-400 hover:text-gray-400 text-gray-800 dark:text-gray-100">
                                <FaChevronLeft id='cLeft' onClick={handleClickChevronMonth} />
                            </button>
                            <button aria-label="calendar forward" className="focus:text-gray-400 hover:text-gray-400 ml-3 text-gray-800 dark:text-gray-100">
                                <FaChevronRight id='cRight' onClick={handleClickChevronMonth} />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    {weekDays.map((day: any, index: number) => <ThColName key={index} name={day} />)}
                                </tr>
                            </thead>

                            <tbody>

                                {renderSemanas.map((week: any, i: number) => (
                                    <tr key={i}>
                                        {week.map((dayWeek: any, j: number) => {
                                            const testeDia = diasMarcados.includes(dayWeek)

                                            if (dayWeek == renderDia) {
                                                return (
                                                    <td key={j} className=''>
                                                        <CalendarCurrentDay day={dayWeek} color='indigo' />
                                                    </td>
                                                )
                                            }
                                            else {
                                                return (
                                                    <td key={j} className={`${testeDia ? 'bg-purple-300 rounded-full' : ''}`}>
                                                        <div className={`px-2 py-2 text-center cursor-pointer flex w-full justify-center}`}>
                                                            <p className="text-base mx-auto text-gray-500 dark:text-gray-100 font-medium"> {dayWeek || ''}</p>
                                                        </div>
                                                    </td>
                                                )
                                            }
                                        }
                                        )}
                                    </tr>
                                ))}

                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="md:py-8 py-5 md:px-16 px-5 dark:bg-gray-700 bg-gray-50 rounded-b w-full">
                    <div className="px-4 flex flex-col gap-2">
                        {eventos.length > 0 && sortEventsByDate(eventos).map((evento: EventosProps, index: number) => {

                            const dataFormatada = testDateString(evento.data) ? evento.data : 'Data Inválida'
                            const convertedDate = testDateString(evento.data) != null ? createDateFromString(evento.data) : new Date(1900, 1, 1) as any
                            const convertedDate1 = convertedDate.getMonth() + convertedDate.getFullYear()
                            const convertedDate2 = renderMes + renderAno
                            const compareDates = convertedDate1 == convertedDate2
                            if (compareDates) {
                                return (
                                    <EventDetails key={index} data={dataFormatada} horario={evento.horario} titulo={evento.titulo} observacao={evento.observacao} />
                                )
                            }
                        })}
                        {eventos.length <= 0 && (
                            <div>Nenhum evento identificado no período</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}

export default CalendarioM1

// #########################################
// COMPONENTES AUXILIARES
// #########################################

const ThColName: React.FC<any> = ({ name }) => {
    return (
        <th>
            <div className="w-full flex justify-center">
                <p className="text-base font-medium text-center text-gray-800 dark:text-gray-100">{name}</p>
            </div>
        </th>
    )
}

const CalendarCurrentDay: React.FC<{ day: number | string, color: string }> = ({ day, color }) => {
    return (
        <div className="w-full h-full">
            <div className="flex items-center justify-center w-full rounded-full cursor-pointer">
                <a role="link" tabIndex={0} className={`focus:outline-none  focus:ring-2 focus:ring-offset-2 focus:ring-${color}-700 focus:bg-${color}-500 hover:bg-${color}-500 text-base w-8 h-8 flex items-center justify-center font-medium text-white bg-${color}-700 rounded-full`}>{day}</a>
            </div>
        </div>
    )
}

const EventDetails: React.FC<{ data: string, horario?: string, titulo: string, observacao?: string }> = ({ data, horario, titulo, observacao }) => {
    return (
        <div className="border-b pb-2 mb-2 border-gray-400 border-dashed">
            <p className="text-xs font-light text-gray-500 dark:text-gray-300 flex flex-row gap-4"><span>{data}</span> <span>{horario}</span></p>
            <a tabIndex={0} className="focus:outline-none text-lg font-medium leading-5 text-gray-800 dark:text-gray-100 mt-2">{titulo}</a>
            <p className="text-sm text-gray-600 dark:text-gray-300">{observacao}</p>
        </div>
    )
}

// #########################################
// FUNÇÕES
// #########################################

function getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    return { year, month, day };
};

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
};

function getMonthName(monthIndex: number) {
    const date = new Date();
    date.setMonth(monthIndex);
    return date.toLocaleString('pt-BR', { month: 'long' });
};

function generateCalendar(year: number, month: number) {
    const firstDay = getFirstDayOfMonth(year, month) - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weeks = [];
    let currentDay = 1;
    for (let week = 0; week <= 5; week++) {
        const days = [];
        for (let day = 0; day < 7; day++) {
            if (week === 0 && day < firstDay || currentDay > daysInMonth) {
                days.push(null);
            } else {
                days.push(currentDay++);
            }
        }
        weeks.push(days);
    }
    return weeks;
};

function createDateFromString(dateString: string): Date | null {
    if (!testDateString(dateString)) {
        console.error("Invalid date format. Please use DD/MM/YYYY.");
        return null;
    }
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
};

function testDateString(dateString: string): boolean {
    const regex = /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/(\d{4})$/
    return regex.test(dateString);
}

function sortEventsByDate(events: EventosProps[]): EventosProps[] {
    return events.sort((a, b) => {
        const dateA = createDateFromString(a.data);
        const dateB = createDateFromString(b.data);

        if (dateA && dateB) {
            return dateA.getTime() - dateB.getTime();
        } else {
            return 0;
        }
    });
};

function filtrarEventosDoMes(eventos: any, mesAtual: number) {

    // Filtra os eventos do mês atual
    const eventosDoMes = eventos.filter((evento: any) => {
        // Converte a data do evento de string para Date
        const [dia, mes, ano] = evento.data.split('/');
        const mesComparado = parseInt(mes) - 1

        // Compara o mês e o ano do evento com o mês e o ano atual
        return mesAtual === mesComparado
    });

    return eventosDoMes;
}