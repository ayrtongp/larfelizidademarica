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
        <div className="w-full flex flex-col bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Grade do calendário */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-bold text-gray-800 capitalize">
                        {getMonthName(renderMes)}, {renderAno}
                    </span>
                    <div className="flex items-center gap-3">
                        <button aria-label="mês anterior" className="p-1 rounded hover:bg-gray-100 text-gray-600">
                            <FaChevronLeft id='cLeft' onClick={handleClickChevronMonth} />
                        </button>
                        <button aria-label="próximo mês" className="p-1 rounded hover:bg-gray-100 text-gray-600">
                            <FaChevronRight id='cRight' onClick={handleClickChevronMonth} />
                        </button>
                    </div>
                </div>

                <table className="w-full">
                    <thead>
                        <tr>
                            {weekDays.map((day, index) => <ThColName key={index} name={day} />)}
                        </tr>
                    </thead>
                    <tbody>
                        {renderSemanas.map((week: any, i: number) => (
                            <tr key={i}>
                                {week.map((dayWeek: any, j: number) => {
                                    const testeDia = diasMarcados.includes(dayWeek);
                                    if (dayWeek == renderDia) {
                                        return (
                                            <td key={j}>
                                                <CalendarCurrentDay day={dayWeek} color='indigo' />
                                            </td>
                                        );
                                    }
                                    return (
                                        <td key={j} className={testeDia ? 'bg-purple-200 rounded-full' : ''}>
                                            <div className="px-1 py-1.5 text-center flex w-full justify-center">
                                                <p className="text-sm text-gray-500 font-medium">{dayWeek || ''}</p>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Eventos do mês */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Eventos</p>
                {eventos.length > 0
                    ? sortEventsByDate(eventos).map((evento: EventosProps, index: number) => {
                        const dataFormatada = testDateString(evento.data) ? evento.data : 'Data Inválida';
                        const convertedDate = testDateString(evento.data) ? createDateFromString(evento.data) : new Date(1900, 1, 1) as any;
                        const compareDates = (convertedDate.getMonth() + convertedDate.getFullYear()) === (renderMes + renderAno);
                        if (!compareDates) return null;
                        return (
                            <EventDetails key={index} data={dataFormatada} horario={evento.horario} titulo={evento.titulo} observacao={evento.observacao} />
                        );
                    })
                    : <p className="text-sm text-gray-400">Nenhum evento neste mês</p>
                }
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
        const [, mes] = evento.data.split('/');
        const mesComparado = parseInt(mes) - 1

        // Compara o mês e o ano do evento com o mês e o ano atual
        return mesAtual === mesComparado
    });

    return eventosDoMes;
}