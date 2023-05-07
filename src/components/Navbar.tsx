import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { AiOutlineMenu, AiOutlineClose } from 'react-icons/ai'
import logoLar from "../../public/images/lar felizidade logo transparente.png";

const Navbar = () => {

  const [nav, setNav] = useState(false)
  const [color, setColor] = useState('transparent')
  const [textColor, setTextColor] = useState('white')

  const handleNav = () => {
    setNav(!nav)
  }

  useEffect(() => {
    const changeColor = () => {

      if (window.scrollY >= 90) {
        setColor('#fff')
        setTextColor('#000')
      } else {
        setColor('transparent')
        setTextColor('#fff')
      }

    }

    window.addEventListener('scroll', changeColor)

  }, []);

  return (
    <div style={{ backgroundColor: `${color}` }} className="fixed left-0 top-0 w-full z-10 ease-in duration-300"> {/** FIRST DIV */}
      <div className="max-w-[1240px] m-auto flex justify-between items-center text-white p-4"> {/** SECOND DIV */}
        <Link href='/' className="flex">
          <Image alt='logo lar' src={logoLar} width={108} height={108} />
        </Link>
        <ul style={{ color: `${textColor}` }} className="hidden sm:flex">
          <li className="p-4">
            <Link href='/'>Home</Link>
          </li>
          <li className="p-4">
            <Link href='/#gallery'>Galeria de Imagens</Link>
          </li>
          <li className="p-4">
            <Link href='/#aboutus'>Sobre Nós</Link>
          </li>
          <li className="p-4">
            <Link href='/#contact'>Contato</Link>
          </li>
        </ul>

        {/** Mobile Button */}
        <div onClick={handleNav} className="block sm:hidden z-10">
          {nav ? <AiOutlineClose size={20} style={{ color: `${textColor}` }} /> : <AiOutlineMenu size={20} style={{ color: `${textColor}` }} />}
        </div>

        {/** Mobile Menu */}
        <div className={
          nav
            ? "sm:hidden absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center w-full h-screen bg-black text-center ease-in duration-300"
            : "sm:hidden absolute top-0 left-[-100%] right-0 bottom-0 flex justify-center items-center w-full h-screen bg-black text-center ease-in duration-300"
        }
        >
          <ul >
            <li className="p-4 text-4xl hover:text-gray-500">
              <Link href='/'>Home</Link>
            </li>
            <li className="p-4 text-4xl hover:text-gray-500">
              <Link href='/#gallery'>Galeria de Imagens</Link>
            </li>
            <li className="p-4 text-4xl hover:text-gray-500">
              <Link href='/aboutus'>Sobre Nós</Link>
            </li>
            <li className="p-4 text-4xl hover:text-gray-500">
              <Link href='/contact'>Contato</Link>
            </li>
          </ul>
        </div>

      </div> {/** SECOND DIV */}
    </div > /** FIRST DIV */
  )
}

export default Navbar;