import React, { useEffect, useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';

import Sidebar from '../../components/Sidebar/Sidebar';
import PortalHeader from '@/components/PortalHeader';
import WelcomeBanner from '@/components/Dashboard/WelcomeBanner';
import DashboardsSinaisVitais from '@/components/Dashboard/DashboardsSinaisVitais';
import { useRouter } from 'next/router';
import SinaisNaoRegistradosHoje from '@/components/Dashboard/SinaisNaoRegistradosHoje';
import AnotacoesNaoRegistradasHoje from '@/components/Dashboard/AnotacoesNaoRegistradasHoje';
import EvolucaoResidente from '@/components/Dashboard/EvolucaoResidente';
import CalendarioM1 from '@/components/Diversos/CalendarioM1';
import { Residentes_GET_getAniversarios } from '@/actions/Residentes';
import { formatDateBR } from '@/utils/Functions';
import { DatasImportantes_GET_getAll } from '@/actions/DatasImportante';
// import WelcomeBanner from '../partials/dashboard/WelcomeBanner';
// import DashboardAvatars from '../partials/dashboard/DashboardAvatars';
// import FilterButton from '../partials/actions/FilterButton';
// import Datepicker from '../partials/actions/Datepicker';
// import DashboardCard01 from '../partials/dashboard/DashboardCard01';
// import Banner from '../partials/Banner';

function Index() {

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [eventos, setEventos] = useState<any>([]);

  // -------------------------
  // -------------------------
  // FUNCTIONS
  // -------------------------
  // -------------------------

  async function getBirths() {
    const res = await Residentes_GET_getAniversarios()
    const resMapped = res.map((item: any) => {
      const [dia, mes, ano] = formatDateBR(item.data_nascimento).split('/')
      const anoAtual = (new Date()).getFullYear()
      const dataFormatada = `${dia}/${mes}/${anoAtual}`
      return ({
        data: dataFormatada,
        titulo: `Aniversário - ${item.apelido}`
      })
    });
    setEventos(resMapped)
  }

  async function getDatasImportantes() {
    const res = await DatasImportantes_GET_getAll();
    setEventos((prevEventos: any) => [...prevEventos, ...res])
  }

  // -------------------------
  // -------------------------
  // USEEFFECT
  // -------------------------
  // -------------------------

  useEffect(() => {
    getBirths()
    getDatasImportantes()
  }, [])

  // -------------------------
  // -------------------------
  // RETURN
  // -------------------------
  // -------------------------

  return (
    <PermissionWrapper href='/portal'>
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <PortalHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main>
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
              <WelcomeBanner />
              <div className="sm:flex sm:justify-between sm:items-center mb-8">
              </div>

              {/* GRID INI */}
              <div className="grid grid-cols-12 gap-6">

                {/* GRID PART */}
                <div className='col-span-full sm:col-span-6 lg:col-span-4'>
                  <CalendarioM1 eventos={eventos} />
                </div>

                {/* GRID PART */}
                <div className='col-span-full sm:col-span-6 lg:col-span-4'>
                  <EvolucaoResidente />
                </div>

              </div>
            </div>
          </main>
        </div>
      </div>
    </PermissionWrapper>
  );
}

export default Index;