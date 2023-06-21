import { Menu, Transition } from '@headlessui/react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { HiChevronDown, HiUser, HiOutlineCog, HiOutlineLogout } from 'react-icons/hi'
import profilephoto from '../../public/images/Lar Felizidade BG Site.png'
import Image from 'next/image'
import { Logout, updateProfile } from "../utils/Login";
import { useRouter } from 'next/router'
import Link from 'next/link'

const MenuDropDown = ({ props }: any) => {
  const router = useRouter();
  const [nome, setNome] = useState();
  const [foto, setFoto] = useState();

  useEffect(() => {
    const userIdString = localStorage.getItem('userInfo');
    if (userIdString) {
      const { nome, fotoPerfil } = updateProfile()
      setNome(nome)
      setFoto(fotoPerfil)
    }
  }, [])

  const handleLogout = () => {
    Logout(router)
  }

  return (
    <div className="">
      <Menu as="div" className="relative inline-block text-left">
        <div className=''>
          <Menu.Button className="inline-flex items-center w-full justify-center rounded-md bg-black bg-opacity-20 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
            <div className='lg:h-8 lg:w-8 h-7 w-7 rounded-full'>
              <Image src={foto ? foto : profilephoto} width={64} height={64} alt='/' id='foto_perfil' className='block w-full h-full object-cover rounded-full' />
            </div>
            <span className='ml-2 text-black font-bold sm:block hidden'>{nome}</span>
            <HiChevronDown className="sm:block hidden ml-2 -mr-1 h-5 w-5 text-violet-200 hover:text-violet-100" aria-hidden="true" />
          </Menu.Button>
        </div>
        <Transition as={Fragment}
          enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">

          <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-1 py-1"> {/* HIDDEN */}
              <Menu.Item>
                {({ active }) => (
                  <Link href='/portal/configuracoes'>
                    <button className={`${active ? 'bg-violet-500 text-white' : 'text-gray-900'} group flex w-full rounded-md px-2 py-2 text-sm`}>
                      <HiUser className='mr-2 h-5 w-5' aria-hidden='true' fill="#8B5CF6" stroke="#C4B5FD" strokeWidth="2" />
                      Perfil
                    </button>
                  </Link>
                )}
              </Menu.Item>
            </div>

            <div className="px-1 py-1 hidden"> {/* HIDDEN */}
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${active ? 'bg-violet-500 text-white' : 'text-gray-900'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}                  >
                    <HiOutlineCog className='mr-2 h-5 w-5' aria-hidden='true' fill="#8B5CF6" stroke="#C4B5FD" strokeWidth="2" />
                    Configurações
                  </button>
                )}
              </Menu.Item>
            </div>

            <div className="px-1 py-1">
              <Menu.Item>
                {({ active }) => (
                  <button onClick={handleLogout} className={`${active ? 'bg-violet-500 text-white' : 'text-gray-900'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}                  >
                    <HiOutlineLogout className='mr-2 h-5 w-5' aria-hidden='true' fill="#8B5CF6" stroke="#C4B5FD" strokeWidth="2" />
                    Logout
                  </button>
                )}
              </Menu.Item>
            </div>

          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}

export default MenuDropDown;