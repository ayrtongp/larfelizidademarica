import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import logoLar from '../../public/images/lar felizidade logo transparente.png'
import { HiSearch, HiMail, HiBell } from 'react-icons/hi'
import MenuDropDown from './MenuDropDown'

const Navportal = () => {
  
  return (
    <header className='sticky top-0 z-[999] rounded shadow-slate-300 border-b'>
      <div className='app-header md:px-6 px-[15px]  dark:bg-slate-800 shadow-base dark:shadow-base3 bg-white
        dark:border-b dark:border-slate-700 dark:border-opacity-60 md:py-6 py-3'>
        <div className='flex justify-between items-center h-full'>
          <div className='flex items-center md:space-x-4 space-x-2 space-x-reverse'> {/* DIV LEFT SIDE NAVPORTAL */}
            <div className='max-h-[64px] max-w-[64px]'> {/* DIV LOGO */}
              <Link href='/portal'>
                <Image src={logoLar} alt='/' className='w-full h-full' />
              </Link>
            </div> {/* DIV LOGO */}
            <div className='hidden items-center xl:text-sm text-lg xl:text-slate-400 text-slate-800 dark:text-slate-300 px-1'>
              <button><HiSearch width={64} height={64} /></button>
              <span className='xl:inline-block hidden'>Buscar...</span>
            </div>
          </div> {/* DIV LEFT SIDE NAVPORTAL */}
          <div className='nav-tools flex items-center lg:space-x-6 '> {/* DIV RIGHT SIDE NAVPORTAL */}
            <div className='relative inline-block mx-2'> {/* DIV BUTTON MAIL */}
              <div className='block w-full'>
                <button>
                  <div className='hidden label-className-custom'> {/* HIDDEN */}
                    <span className='relative h-[42px] w-[42px] lg:bg-slate-100 lg:dark:bg-slate-900 dark:text-white text-slate-900 cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center'>
                      <HiMail />
                      <span className='absolute lg:right-0 lg:top-0 -top-1 -right-1 h-5 w-5 bg-red-500 text-[12px] 
                      font-semibold flex flex-col items-center justify-center rounded-full text-white z-[99]'>
                        2
                      </span>
                    </span>
                  </div>
                </button>
              </div>
            </div> {/* DIV BUTTON MAIL */}
            <div className='hidden relative'> {/* DIV BUTTON BELL */} {/* HIDDEN */}
              <div className='block w-full'>
                <button>
                  <div className='label-className-custom'>
                    <span className='relative h-[42px] w-[42px] lg:bg-slate-100 lg:dark:bg-slate-900 dark:text-white text-slate-900 cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center'>
                      <HiBell />
                      <span className='absolute lg:right-0 lg:top-0 -top-1 -right-1 h-5 w-5 bg-red-500 text-[12px] 
                      font-semibold flex flex-col items-center justify-center rounded-full text-white z-[99]'>
                        10
                      </span>
                    </span>
                  </div>
                </button>
              </div>
            </div> {/* DIV BUTTON BELL */}
            <MenuDropDown />

          </div> {/* DIV RIGHT SIDE NAVPORTAL */}
        </div>
      </div>
    </header>
  )
}

export default Navportal
