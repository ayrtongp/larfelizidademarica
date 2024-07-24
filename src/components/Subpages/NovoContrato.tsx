import React, { useState } from 'react'
import Select_M3 from '../Formularios/Select_M3'
import { Residente } from '@/types/Residente'
import { Contrato } from '@/types/Contrato'
import Date_M3 from '../Formularios/Date_M3'
import Number_M3 from '../Formularios/Number_M3'
import Button_M3 from '../Formularios/Button_M3'
import { Contratos_POST_create } from '@/actions/Contratos'
import { notifyError, notifySuccess } from '@/utils/Functions'

interface Props {
    residentes: Residente[]
}

const NovoContrato = ({ residentes }: Props) => {

    const initialContrato: Contrato = {
        ano: 0, ativo: true, numero: 0,
        data_inicio: '', dia_pagamento: 0, regime_pagamento: '',
        residenteId: '', tipo_contrato: '', tipoVigencia: '',
        valor_mensalidade: 0, vigencia: 0
    }

    const [formData, setFormData] = useState<Contrato>(initialContrato);


    // ###################
    // OPTIONS
    // ###################

    const residenteOptions = residentes.map((residente: Residente, index: number) => {
        return ({ value: residente._id, label: residente.nome })
    })

    const vigenciaOptions = [
        { value: 'dia', label: "Dia(s)" },
        { value: 'mes', label: "Mes(es)" },
        { value: 'ano', label: "Ano(s)" },
    ]

    const tipoContratoOptions = [
        { value: 'diaria', label: "Diária" },
        { value: 'centroDia', label: "Centro-Dia" },
        { value: 'residencia', label: "Residência" },
    ]

    const regimeOptions = [
        { value: 'antecipado', label: "Antecipado" },
        { value: 'vencimento', label: "No Vencimento" },
    ]

    // ###################
    // HANDLERS
    // ###################

    const handleChange = (e: any) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value
        }));
    };

    const handleCreateContrato = async () => {
        const objetosDiferentes: boolean = compararObjetos(formData, initialContrato, ['ano', 'ativo', 'numero'])
        const keys: (keyof Contrato)[] = ['data_inicio', 'dia_pagamento', 'regime_pagamento', 'residenteId', 'tipo_contrato', 'tipoVigencia', 'valor_mensalidade', 'vigencia'];

        for (let key of keys) {
            const valor = formData[key as keyof Contrato]
            if (valor == '' || valor == 0)
                return notifyError(`Campo ${key} não preenchido corretamente!`)
        }

        if (!objetosDiferentes) {
            return notifyError('O contrato não foi preenchido corretamente!')
        }

        if (objetosDiferentes) {
            const novoContrato = await Contratos_POST_create(formData)
            if (novoContrato.message === 'OK') {
                notifySuccess('Contrato criado com sucesso')
                setFormData(initialContrato)
            }
        }
    }

    // ###################
    // RETURN
    // ###################

    return (
        <div className='col-span-full mt-5 border shadow-md rounded-md p-2 bg-white'>
            <h1 className='uppercase font-bold italic text-xl my-4 pl-6'>Novo Contrato</h1>
            <div className='grid grid-cols-12 gap-3'>
                <Select_M3 disabled={false} label='Pessoa Idosa' name='residenteId' value={formData.residenteId} options={residenteOptions} onChange={handleChange} className='col-span-full sm:col-span-6' />
                <Date_M3 disabled={false} label='Data de Início' name='data_inicio' value={formData.data_inicio} onChange={handleChange} className='col-span-full sm:col-span-6' />
                <Select_M3 disabled={false} label='Tipo de Vigência' name='tipoVigencia' value={formData.tipoVigencia} options={vigenciaOptions} onChange={handleChange} className='col-span-full sm:col-span-6' />
                <Number_M3 disabled={false} label='Quantidade Vigência' name='vigencia' value={formData.vigencia} onChange={handleChange} className={'col-span-full sm:col-span-6'} />
                <Select_M3 disabled={false} label='Modalidade Contrato' name='tipo_contrato' value={formData.tipo_contrato} options={tipoContratoOptions} onChange={handleChange} className='col-span-full sm:col-span-6' />
                <Select_M3 disabled={false} label='Regime Pagamento' name='regime_pagamento' value={formData.regime_pagamento} options={regimeOptions} onChange={handleChange} className='col-span-full sm:col-span-6' />
                <Number_M3 disabled={false} label='Valor do Contrato' name='valor_mensalidade' value={formData.valor_mensalidade} onChange={handleChange} className={'col-span-full sm:col-span-6'} />
                <Number_M3 disabled={false} label='Dia do Pagamento' name='dia_pagamento' value={formData.dia_pagamento} onChange={handleChange} className={'col-span-full sm:col-span-6'} />
                <Button_M3 label='Criar Contrato' onClick={handleCreateContrato} bgColor='purple' className='col-span-full text-center my-4' />
            </div>
        </div>
    )
}

export default NovoContrato

function compararObjetos(obj1: any, obj2: any, ignorarCampos: string[]): boolean {
    // Verifica cada chave do objeto
    for (let key in obj1) {
        if (obj1[key] === obj2[key] && !ignorarCampos.includes(key)) {
            return false; // Se algum valor for igual, retorna false
        }
    }
    return true; // Se todos os valores forem diferentes, retorna true
}
