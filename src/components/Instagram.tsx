import React from 'react'
import InstagramImg from './InstagramImg'
import image1 from '../../public/images/Lar Felizidade BG Site.png'

const Instagram = () => {
  return (
    <div className='max-w-[1240px] mx-auto text-center py-24'>
      <p className='text-2xl font-bold'>Siga no INSTAGRAM</p>
      <p className='pb-4'>Lar Felizidade</p>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 p-4'>
        <InstagramImg socialImg={image1} />
        <InstagramImg socialImg={image1} />
        <InstagramImg socialImg={image1} />
        <InstagramImg socialImg={image1} />
        <InstagramImg socialImg={image1} />
        <InstagramImg socialImg={image1} />
      </div>
    </div>
  )
}

export default Instagram
