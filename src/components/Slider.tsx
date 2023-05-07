import React, { useState } from 'react';
import Image from 'next/image';
import { FaArrowAltCircleLeft, FaArrowAltCircleRight } from 'react-icons/fa'


const Slider = ({ slides }: { slides: any[] }) => {

  const [current, setCurrent] = useState(0);
  const length = slides.length;

  const nextSlide = () => {
    setCurrent(current === length - 1 ? 0 : current + 1)
  }

  const previousSlide = () => {
    setCurrent(current === 0 ? length - 1 : current - 1)
  }

  if (!Array.isArray(slides) || slides.length <= 0) {
    return null
  }

  return (
    <div className='bg-[#b98fb9]'>
      <div id='gallery' className='max-w-[540px] mx-auto'>
        <h1 className='text-2xl font-bold text-center p-4'>Galeria de Imagens</h1>
        <div className='relative flex justify-center p-4'>
          {slides.map((slide: any, index: number) => {
            return (

              <div key={index} className={index === current ? 'opacity-[1] ease-in duration-1000' : 'opacity-0'}>

                <FaArrowAltCircleLeft onClick={previousSlide}
                  className='absolute top-[50%] left-[30px] text-white cursor-pointer select-none z-[2]' size={50} />
                {
                  index === current && (
                    <Image src={slide.image} alt="/" width="360" height="200" className='rounded-lg' />
                  )
                }
                <FaArrowAltCircleRight onClick={nextSlide}
                  className='absolute top-[50%] right-[30px] text-white cursor-pointer select-none z-[2]' size={50} />
              </div>

            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Slider;