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
import { datasImportantesToEventos } from '@/types/T_datasImportantes';
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
    const anoAtual = (new Date()).getFullYear()
    const resMapped = res
      .filter((item: any) => item.data_nascimento)
      .map((item: any) => {
        const formatted = formatDateBR(item.data_nascimento)
        if (!formatted) return null
        const [dia, mes] = formatted.split('/')
        if (!dia || !mes) return null
        return {
          data: `${dia}/${mes}/${anoAtual}`,
          titulo: `Aniversário - ${item.apelido}`
        }
      })
      .filter(Boolean);
    setEventos(resMapped)
  }

  async function getDatasImportantes() {
    const res = await DatasImportantes_GET_getAll();
    const mapped = datasImportantesToEventos(res);
    setEventos((prev: any) => [...prev, ...mapped]);
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
            <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
              <WelcomeBanner />

              <div className="flex flex-col lg:flex-row gap-6">

                {/* Calendário — compacto à esquerda no desktop */}
                <div className="w-full lg:w-80 flex-shrink-0">
                  <CalendarioM1 eventos={eventos} />
                </div>

                {/* Lista de residentes — ocupa o restante */}
                <div className="flex-1 min-w-0">
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