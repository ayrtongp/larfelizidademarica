import Image from 'next/image'
import React from 'react'
import Enfermagem from '../../public/images/servicos/cuidados-de-saude.png'
import Hospedagem from '../../public/images/servicos/dia-e-noite.png'
import Atividades from '../../public/images/servicos/fisiologia.png'
import Fisioterapia from '../../public/images/servicos/fisioterapia.png'
import Eventos from '../../public/images/servicos/fogueira.png'
import Musicoterapia from '../../public/images/servicos/instrumento.png'
import Medico from '../../public/images/servicos/medico.png'
import Hortoterapia from '../../public/images/servicos/plantar.png'
import Nutricionista from '../../public/images/servicos/prancheta.png'

const servicosOferecidos = [
  { src: Enfermagem, alt: 'enfermagem', h3: 'Equipe de Enfermagem' },
  { src: Hospedagem, alt: 'hospedagem', h3: 'Hospedagem Dia/Noite' },
  { src: Atividades, alt: 'atividades', h3: 'Atividades Físicas' },
  { src: Fisioterapia, alt: 'fisioterapia', h3: 'Fisioterapia' },
  { src: Eventos, alt: 'eventos', h3: 'Eventos' },
  { src: Musicoterapia, alt: 'musicoterapia', h3: 'Musicoterapia' },
  { src: Medico, alt: 'medico', h3: 'Médico' },
  { src: Hortoterapia, alt: 'hortoterapia', h3: 'Hortoterapia' },
  { src: Nutricionista, alt: 'nutricionista', h3: 'Nutricionista' },
]

const Servicos = () => {
  return (
    <div>
      <h1 className='text-center mb-3 mt-6 font-bold text-3xl' >Serviços Oferecidos</h1>
      <div className="flex flex-wrap justify-center items-center gap-1">
        {servicosOferecidos.map((servico, index) => {
          return (
            <div key={index} className='flex text-center flex-col items-center w-[150px] h-[100px] bg-white p-2'>
              <div className='w-[40px] h-[40px] mb-2'>
                <Image src={servico.src} alt={servico.alt} />
              </div>
              <h3>{servico.h3}</h3>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Servicos
