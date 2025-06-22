import { Contrato } from '@/types/Contrato'
import { formatDateBR, formatToBRL } from '@/utils/Functions'
import React from 'react'

interface Props {
    contratos: Contrato[]
}

const ListarContratos = ({ contratos }: Props) => {
    return (
        <div className='col-span-full mt-5 border shadow-md rounded-md p-2 bg-white'>
            <h1 className='uppercase font-bold italic text-xl my-4 pl-6'>Tabela de Contratos</h1>
            <div className='overflow-auto text-xs'>
                <table className='table-auto text-center whitespace-nowrap'>
                    <thead>
                        <tr className='bg-black text-white uppercase'>
                            <th className='px-2 py-1 border-b'>Núm. / Ano</th>
                            <th className='px-2 py-1 border-b'>Data de Início</th>
                            <th className='px-2 py-1 border-b'>Residente</th>
                            <th className='px-2 py-1 border-b'>Ativo</th>
                            <th className='px-2 py-1 border-b'>Valor</th>
                            <th className='px-2 py-1 border-b'>Vigência</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contratos.length > 0 && contratos.map((contrato: Contrato, index: number) => (
                            <tr key={index}>
                                <td className='px-2 py-1 border-b'>{contrato.numero}/{contrato.ano}</td>
                                <td className='px-2 py-1 border-b'>{formatDateBR(contrato.data_inicio)}</td>
                                <td className='px-2 py-1 border-b'>{contrato.residenteId}</td>
                                <td className='px-2 py-1 border-b'>{contrato.ativo ? 'Sim' : 'Não'}</td>
                                <td className='px-2 py-1 border-b'>{formatToBRL(parseFloat(contrato.valor_mensalidade.toString()))}</td>
                                <td className='px-2 py-1 border-b'>{contrato.vigencia}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ListarContratos