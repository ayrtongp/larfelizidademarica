import React, { useState, useEffect } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar/Sidebar';
import PortalHeader from '@/components/PortalHeader';
import WelcomeBanner from '@/components/Dashboard/WelcomeBanner';
import BreadCrumb from '../BreadCrumb';
import { getUserID } from '@/utils/Login';

function Dashboard({ children }: any) {

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertas, setAlertas] = useState<{ vencidas: number; hoje: number } | null>(null);
  const [alertaDismissed, setAlertaDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const uid = getUserID();
      if (!uid) return;
      fetch(`/api/Controller/C_tarefas?type=alertas&userId=${uid}`)
        .then(r => r.ok ? r.json() : { alertas: [] })
        .then(d => {
          const lista = d.alertas ?? [];
          const hj = new Date().toISOString().split('T')[0];
          const vencidas = lista.filter((t: any) => t.prazo < hj).length;
          const hojeCt  = lista.filter((t: any) => t.prazo === hj).length;
          if (vencidas + hojeCt > 0) setAlertas({ vencidas, hoje: hojeCt });
        })
        .catch(() => {});
    } catch {}
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden bg-sky-50">

        {/*  Site header */}
        <PortalHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className='bg-sky-50 h-full'>
          {/* Banner de alertas de tarefas */}
          {alertas && !alertaDismissed && (
            <div className='bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3 text-sm'>
              <div className='flex items-center gap-2 text-amber-800'>
                <span>⚠️</span>
                <span>
                  {alertas.vencidas > 0 && <><strong>{alertas.vencidas}</strong> tarefa{alertas.vencidas > 1 ? 's' : ''} vencida{alertas.vencidas > 1 ? 's' : ''}</>}
                  {alertas.vencidas > 0 && alertas.hoje > 0 && ' · '}
                  {alertas.hoje > 0 && <><strong>{alertas.hoje}</strong> vence{alertas.hoje > 1 ? 'm' : ''} hoje</>}
                  {'. '}
                  <Link href='/portal/tarefas' className='underline font-medium hover:text-amber-900'>Ver tarefas</Link>
                </span>
              </div>
              <button onClick={() => setAlertaDismissed(true)} className='text-amber-600 hover:text-amber-800 text-lg leading-none shrink-0'>&times;</button>
            </div>
          )}
          <div className="px-4 sm:px-6 lg:px-8 py-4 w-full mx-auto">

            {/* Cards */}
            <div className="grid grid-cols-12 gap-1">
              <div className='col-span-full'>
                <BreadCrumb />
              </div>
              {children}

            </div>

          </div>
        </main>

      </div>
    </div>
  );
}

export default Dashboard;