import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import logoLar from '../../public/images/lar felizidade logo transparente.png'
import { HiSearch, HiMail, HiBell } from 'react-icons/hi'
import MenuDropDown from './MenuDropDown'
import { FaBell } from 'react-icons/fa'
import Notifications from './PortalHeader/Notifications'
import { useRouter } from 'next/router'
import { Comunicados_GET_countNaoLidosPeloUsuario } from '@/actions/Comunicados'
import { getUserID } from '@/utils/Login'

const PortalHeader = ({ sidebarOpen, setSidebarOpen }: any) => {

  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [countNotifications, setCountNotifications] = useState<number>(0)
  const router = useRouter();
  async function fetchNotifications() {
    const result = await Comunicados_GET_countNaoLidosPeloUsuario(getUserID())
    setCountNotifications(result.count)
  }

  useEffect(() => {
    async function fetchData() {
      fetchNotifications();
    }

    fetchData()
  }, [router.pathname])

  return (
    <header className="sticky top-0 bg-white border-b border-slate-200 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 -mb-px">

          {/* Header: Left side */}
          <div className="flex">

            {/* Hamburger button */}
            <button
              className="text-slate-500 hover:text-slate-600 lg:hidden"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={(e) => { e.stopPropagation(); setSidebarOpen(!sidebarOpen); }}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="5" width="16" height="2" />
                <rect x="4" y="11" width="16" height="2" />
                <rect x="4" y="17" width="16" height="2" />
              </svg>
            </button>

          </div>

          {/* Header: Right side */}
          <div className="flex items-center">

            {/* <button
              className={`w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition duration-150 rounded-full ml-3 ${searchModalOpen && 'bg-slate-200'}`}
              onClick={(e) => { e.stopPropagation(); setSearchModalOpen(true); }}
              aria-controls="search-modal"
            >
              <span className="sr-only">Search</span>
              <svg className="w-4 h-4" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path className="fill-current text-slate-500" d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z" />
                <path className="fill-current text-slate-400" d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z" />
              </svg>
            </button> */}
            {/* <SearchModal id="search-modal" searchId="search" modalOpen={searchModalOpen} setModalOpen={setSearchModalOpen} /> */}

            {/* <Notifications /> */}
            <Notifications count={countNotifications} />

            {/*  Divider */}
            <hr className="w-px h-6 bg-slate-200 mx-3" />

            {/* <UserMenu /> */}
            <MenuDropDown />

          </div>

        </div>
      </div>
    </header>
  )
}

export default PortalHeader
