import React, { useState, useEffect, useRef } from 'react';

import SidebarLinkGroup from './SidebarLinkGroup';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import LogoLar from '../../../public/images/lar felizidade logo transparente.png'
import { FaArrowLeft, FaChevronDown, FaChevronUp, FaHospital, FaPuzzlePiece } from 'react-icons/fa';
import { AiOutlineDashboard } from 'react-icons/ai';
import Authorization from '../Auth/Authorization';
import ItemSubitem from './ItemSubitem';
import Item from './Item';
import { BsMegaphone, BsMegaphoneFill } from 'react-icons/bs';

const Sidebar = ({ sidebarOpen, setSidebarOpen }: any) => {
  const router = useRouter();
  const { pathname } = router;
  const trigger = useRef(null);
  const sidebar = useRef(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const dashboardMenu = [
    { title: 'Início', path: '/portal/dashboard' },
    { title: 'Evoluções', path: '/portal/dashboard/evolucoes' },
  ]

  const pessoalMenu = [
    { title: 'Idosos', path: '/portal/pessoal/idosos' },
    { title: 'Funcionários', path: '/portal/pessoal/funcionarios' },
    { title: 'Prestadores', path: '/portal/pessoal/prestadores' },
  ]

  const suprimentosMenu = [
    { title: 'Página Princpal', path: '/portal/suprimentos' },
    { title: 'Pedidos', path: '/portal/suprimentos/pedidos' },
  ]

  const administrativoMenu = [
    { title: 'Página Princpal', path: '/portal/administrativo' },
  ]

  const ocorrenciasMenu = [
    { title: 'Página Principal', path: '/portal/ocorrencias' },
    { title: 'Nova Ocorrência', path: '/portal/ocorrencias/novo' },
  ]

  const insumosMenu = [
    { title: 'Página Principal', path: '/portal/insumos' },
    { title: 'Novo Insumo', path: '/portal/insumos/novo' },
  ]

  const configMenu = [
    { title: 'Perfil', path: '/portal/configuracoes/' },
  ]

  const customClasses = {
    divBackdrop: `fixed inset-0 bg-slate-900 bg-opacity-30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`,
  }

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      const sidebarElement = sidebar.current as HTMLElement;
      const triggerElement = trigger.current as HTMLElement;
      if (!sidebarOpen || sidebarElement.contains(target as Node) || triggerElement.contains(target as Node)) return;
      setSidebarOpen(false);
    };

    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  }, [sidebarOpen, sidebar, trigger]);

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: any) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });


  return (
    <div> {/* INIT - INIT DIV */}

      {/* Sidebar backdrop (mobile only) */}
      <div className={customClasses.divBackdrop} aria-hidden="true">
      </div>

      {/* Sidebar */}
      <div id="sidebar" ref={sidebar} className={`flex flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 h-screen overflow-y-scroll lg:overflow-y-hidden no-scrollbar w-64 2xl:!w-64 shrink-0 bg-slate-800 p-4 transition-all duration-200 ease-in-out 
      ${sidebarExpanded ? `lg:w-64` : `lg:w-24`}
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-64'}`}>

        {/* Sidebar header */}
        <div className="flex flex-col justify-between mb-10 pr-3 sm:px-2">

          {/* FIRST SECTION */}
          <div className='flex flex-row justify-between'>
            {/* Close button */}
            <button ref={trigger} className="lg:hidden text-slate-500 hover:text-slate-400"
              onClick={() => setSidebarOpen(!sidebarOpen)} aria-controls="sidebar" aria-expanded={sidebarOpen}>
              <span className="sr-only">Close sidebar</span>
              <FaArrowLeft />
            </button>

            {/* Logo */}
            <Link href="/" className="block">
              <Image width={96} height={96} src={LogoLar} alt='Logo Lar Felizidade Maricá' />
            </Link>
            {/* End Logo */}
          </div>

          {/* SECOND SECTION */}

          {/* Links */}
          <div className=" space-y-8">
            {/* AGRUPAMENTO - PÁGINAS */}
            <div className='mt-4'>
              <h3 className="text-xs uppercase text-slate-500 font-semibold pl-3">
                <span className={`${sidebarExpanded ? `lg:block` : `lg:hidden`} 2xl:block`}>Páginas</span>
              </h3>

              <ul className="mt-3">

                {/* Dashboard */}
                <SidebarLinkGroup activecondition={pathname === '/' || pathname.includes('dashboard')}>
                  {(handleClick: any, open: any) => {
                    return (
                      <React.Fragment>
                        <a href="#0" className={`block text-slate-200 truncate transition duration-150 ${pathname === '/' || pathname.includes('dashboard') ? 'hover:text-slate-200' : 'hover:text-white'}`}
                          onClick={(e) => { e.preventDefault(); sidebarExpanded ? handleClick() : setSidebarExpanded(true); }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <AiOutlineDashboard color='blue' stroke='3' size={25} />
                              <span className={`text-sm font-medium ml-3 ${sidebarExpanded ? `lg:opacity-100` : `lg:opacity-0`} 2xl:opacity-100 duration-200`}>
                                Dashboard
                              </span>
                            </div>
                            {/* Icon */}
                            <div className="flex shrink-0 ml-2">
                              <FaChevronDown className={`w-3 h-3 shrink-0 ml-1 fill-current text-slate-400 ${open && 'rotate-180'}`} />
                            </div>
                          </div>
                        </a>
                        <div className={`${sidebarExpanded ? `lg:block` : `lg:hidden`} 2xl:block`}>
                          <ul className={`pl-9 mt-1 ${!open && 'hidden'}`}>
                            {dashboardMenu.map((item, index) => {
                              return (
                                <li key={index} className="mb-1 last:mb-0">
                                  <Link href={item.path} className={'block transition duration-150 truncate ' + (router.pathname === item.path ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-200')}>
                                    <span className={`text-sm font-medium ${sidebarExpanded ? `lg:opacity-100` : `lg:opacity-0`} 2xl:opacity-100 duration-200`}>{item.title}</span>
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      </React.Fragment>
                    );
                  }}
                </SidebarLinkGroup>

                <ItemSubitem
                  title='Administrativo'
                  icon={<FaHospital size={25} className={`fill-current ${pathname.includes('/portal/administrativo') ? 'text-indigo-500' : 'text-slate-500'}`} />}
                  suprimentosMenu={administrativoMenu}
                  pathname={pathname}
                  router={router}
                  setSidebarExpanded={setSidebarExpanded}
                  sidebarExpanded={sidebarExpanded}
                />

                <div className=''>
                  {/* Serviços */}
                  <li className={`px-3 py-2 rounded-sm mb-0.5 last:mb-0 ${pathname.includes('servicos') && 'bg-slate-900'}`}>
                    <Link href="/portal/servicos" className={`block text-slate-200 truncate transition duration-150 ${pathname.includes('servicos') ? 'hover:text-slate-200' : 'hover:text-white'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="grow flex items-center">
                          <FaPuzzlePiece size={24} className={`fill-current ${pathname.includes('/portal/servicos') ? 'text-indigo-500' : 'text-slate-600'}`} />
                          {/* <svg className="shrink-0 h-6 w-6" viewBox="0 0 24 24">
                            <path className={`fill-current ${pathname.includes('/portal/servicos') ? 'text-indigo-500' : 'text-slate-600'}`} d="M18.974 8H22a2 2 0 012 2v6h-2v5a1 1 0 01-1 1h-2a1 1 0 01-1-1v-5h-2v-6a2 2 0 012-2h.974zM20 7a2 2 0 11-.001-3.999A2 2 0 0120 7zM2.974 8H6a2 2 0 012 2v6H6v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5H0v-6a2 2 0 012-2h.974zM4 7a2 2 0 11-.001-3.999A2 2 0 014 7z" />
                            <path className={`fill-current ${pathname.includes('/portal/servicos') ? 'text-indigo-300' : 'text-slate-400'}`} d="M12 6a3 3 0 110-6 3 3 0 010 6zm2 18h-4a1 1 0 01-1-1v-6H6v-6a3 3 0 013-3h6a3 3 0 013 3v6h-3v6a1 1 0 01-1 1z" />
                          </svg> */}
                          <span className={`text-sm font-medium ml-3 ${sidebarExpanded ? `lg:opacity-100` : `lg:opacity-0`} 2xl:opacity-100 duration-200`}>
                            Serviços
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                </div>

                <div className=''>
                  {/* Residentes */}
                  <li className={`px-3 py-2 rounded-sm mb-0.5 last:mb-0 ${pathname.includes('residentes') && 'bg-slate-900'}`}>
                    <Link href="/portal/residentes" className={`block text-slate-200 truncate transition duration-150 ${pathname.includes('residentes') ? 'hover:text-slate-200' : 'hover:text-white'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="grow flex items-center">
                          <svg className="shrink-0 h-6 w-6" viewBox="0 0 24 24">
                            <path className={`fill-current ${pathname.includes('/portal/residentes') ? 'text-indigo-500' : 'text-slate-600'}`} d="M18.974 8H22a2 2 0 012 2v6h-2v5a1 1 0 01-1 1h-2a1 1 0 01-1-1v-5h-2v-6a2 2 0 012-2h.974zM20 7a2 2 0 11-.001-3.999A2 2 0 0120 7zM2.974 8H6a2 2 0 012 2v6H6v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5H0v-6a2 2 0 012-2h.974zM4 7a2 2 0 11-.001-3.999A2 2 0 014 7z" />
                            <path className={`fill-current ${pathname.includes('/portal/residentes') ? 'text-indigo-300' : 'text-slate-400'}`} d="M12 6a3 3 0 110-6 3 3 0 010 6zm2 18h-4a1 1 0 01-1-1v-6H6v-6a3 3 0 013-3h6a3 3 0 013 3v6h-3v6a1 1 0 01-1 1z" />
                          </svg>
                          <span className={`text-sm font-medium ml-3 ${sidebarExpanded ? `lg:opacity-100` : `lg:opacity-0`} 2xl:opacity-100 duration-200`}>
                            Residentes
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                </div>

                {/* Suprimentos */}
                <SidebarLinkGroup activecondition={suprimentosMenu.some((item) => pathname.includes(item.path))}>
                  {(handleClick: any, open: any) => {
                    return (
                      <React.Fragment>
                        <a href="#0" className={`block text-slate-200 truncate transition duration-150 ${suprimentosMenu.some((item) => pathname.includes(item.path)) ? 'hover:text-slate-200' : 'hover:text-white'}`}
                          onClick={(e) => { e.preventDefault(); sidebarExpanded ? handleClick() : setSidebarExpanded(true); }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <svg className="shrink-0 h-6 w-6" viewBox="0 0 24 24">
                                <path className={`fill-current ${pathname.includes('/portal/suprimentos') ? 'text-indigo-500' : 'text-slate-600'}`} d="M8 1v2H3v19h18V3h-5V1h7v23H1V1z" />
                                <path className={`fill-current ${pathname.includes('/portal/suprimentos') ? 'text-indigo-500' : 'text-slate-600'}`} d="M1 1h22v23H1z" />
                                <path className={`fill-current ${pathname.includes('/portal/suprimentos') ? 'text-indigo-300' : 'text-slate-400'}`} d="M15 10.586L16.414 12 11 17.414 7.586 14 9 12.586l2 2zM5 0h14v4H5z" />
                              </svg>
                              <span className={`text-sm font-medium ml-3 ${sidebarExpanded ? `lg:opacity-100` : `lg:opacity-0`} 2xl:opacity-100 duration-200`}>
                                Suprimentos
                              </span>
                            </div>
                            {/* Icon */}
                            <div className="flex shrink-0 ml-2">
                              <svg className={`w-3 h-3 shrink-0 ml-1 fill-current text-slate-400 ${open && 'rotate-180'}`} viewBox="0 0 12 12">
                                <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
                              </svg>
                            </div>
                          </div>
                        </a>
                        <div className={`${sidebarExpanded ? `lg:block` : `lg:hidden`} 2xl:block`}>
                          <ul className={`pl-9 mt-1 ${!open && 'hidden'}`}>
                            {suprimentosMenu.map((item, index) => {
                              return (
                                <li key={index} className="mb-1 last:mb-0">
                                  <Link href={item.path} className={'block transition duration-150 truncate ' + (router.pathname === item.path ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-200')}>
                                    <span className={`text-sm font-medium ${sidebarExpanded ? `lg:opacity-100` : `lg:opacity-0`} 2xl:opacity-100 duration-200`}>{item.title}</span>
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      </React.Fragment>
                    );
                  }}
                </SidebarLinkGroup>

              </ul>

              {/* More group */}
              <div className='mt-4'>
                <h3 className="text-xs uppercase text-slate-500 font-semibold pl-3">
                  <span className={`${sidebarExpanded ? `lg:block` : `lg:hidden`} 2xl:block`}>Outros</span>
                </h3>

                <ul className="mt-3">

                  {/* Configurações */}
                  <SidebarLinkGroup activecondition={configMenu.some((item) => pathname.includes(item.path))}>
                    {(handleClick: any, open: any) => {
                      return (
                        <React.Fragment>
                          <a href="#0" className={`block text-slate-200 truncate transition duration-150 ${configMenu.some((item) => pathname.includes(item.path)) ? 'hover:text-slate-200' : 'hover:text-white'}`}
                            onClick={(e) => { e.preventDefault(); sidebarExpanded ? handleClick() : setSidebarExpanded(true); }}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <svg className="shrink-0 h-6 w-6" viewBox="0 0 24 24">
                                  <path className={`fill-current ${pathname.includes('/portal/configuracoes') ? 'text-indigo-500' : 'text-slate-600'}`} d="M19.714 14.7l-7.007 7.007-1.414-1.414 7.007-7.007c-.195-.4-.298-.84-.3-1.286a3 3 0 113 3 2.969 2.969 0 01-1.286-.3z" />
                                  <path className={`fill-current ${pathname.includes('/portal/configuracoes') ? 'text-indigo-300' : 'text-slate-400'}`} d="M10.714 18.3c.4-.195.84-.298 1.286-.3a3 3 0 11-3 3c.002-.446.105-.885.3-1.286l-6.007-6.007 1.414-1.414 6.007 6.007z" />
                                  <path className={`fill-current ${pathname.includes('/portal/configuracoes') ? 'text-indigo-500' : 'text-slate-600'}`} d="M5.7 10.714c.195.4.298.84.3 1.286a3 3 0 11-3-3c.446.002.885.105 1.286.3l7.007-7.007 1.414 1.414L5.7 10.714z" />
                                  <path className={`fill-current ${pathname.includes('/portal/configuracoes') ? 'text-indigo-300' : 'text-slate-400'}`} d="M19.707 9.292a3.012 3.012 0 00-1.415 1.415L13.286 5.7c-.4.195-.84.298-1.286.3a3 3 0 113-3 2.969 2.969 0 01-.3 1.286l5.007 5.006z" />
                                </svg>
                                <span className={`text-sm font-medium ml-3 ${sidebarExpanded ? `lg:opacity-100` : `lg:opacity-0`} 2xl:opacity-100 duration-200`}>
                                  Configurações
                                </span>
                              </div>
                              {/* Icon */}
                              <div className="flex shrink-0 ml-2">
                                <svg className={`w-3 h-3 shrink-0 ml-1 fill-current text-slate-400 ${open && 'rotate-180'}`} viewBox="0 0 12 12">
                                  <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
                                </svg>
                              </div>
                            </div>
                          </a>
                          <div className={`${sidebarExpanded ? `lg:block` : `lg:hidden`} 2xl:block`}>
                            <ul className={`pl-9 mt-1 ${!open && 'hidden'}`}>
                              {configMenu.map((item, index) => {
                                return (
                                  <li key={index} className="mb-1 last:mb-0">
                                    <Link href={item.path} className={'block transition duration-150 truncate ' + (router.pathname === item.path ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-200')}>
                                      <span className={`text-sm font-medium ${sidebarExpanded ? `lg:opacity-100` : `lg:opacity-0`} 2xl:opacity-100 duration-200`}>{item.title}</span>
                                    </Link>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        </React.Fragment>
                      );
                    }}
                  </SidebarLinkGroup>

                </ul>


              </div>

            </div>
          </div>
          {/* End Links */}

          {/* Expand / collapse button */}
          <div className="pt-3 hidden lg:inline-flex 2xl:hidden justify-href-auto">
            <div className="px-3 py-2">
              <button onClick={() => setSidebarExpanded(!sidebarExpanded)}>
                <span className="sr-only">Expand / collapse sidebar</span>
                <svg className={`w-6 h-6 fill-current ${sidebarExpanded ? 'rotate-180' : null}`} viewBox="0 0 24 24">
                  <path className="text-slate-400" d="M19.586 11l-5-5L16 4.586 23.414 12 16 19.414 14.586 18l5-5H7v-2z" />
                  <path className="text-slate-600" d="M3 23H1V1h2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* END - INIT DIV */} </div>
  )
}

export default Sidebar;
