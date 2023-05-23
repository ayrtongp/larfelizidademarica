import React, { useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';

import Sidebar from '../../components/Sidebar';
import PortalHeader from '@/components/PortalHeader';
import WelcomeBanner from '@/components/Dashboard/WelcomeBanner';
import DashboardsSinaisVitais from '@/components/Dashboard/DashboardsSinaisVitais';
// import WelcomeBanner from '../partials/dashboard/WelcomeBanner';
// import DashboardAvatars from '../partials/dashboard/DashboardAvatars';
// import FilterButton from '../partials/actions/FilterButton';
// import Datepicker from '../partials/actions/Datepicker';
// import DashboardCard01 from '../partials/dashboard/DashboardCard01';
// import Banner from '../partials/Banner';

function index() {

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <PermissionWrapper href='/portal'>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        {/* Content area */}
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/*  Site header */}
          <PortalHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main>
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
              {/* Welcome banner */}
              <WelcomeBanner />
              {/* index actions */}
              <div className="sm:flex sm:justify-between sm:items-center mb-8">
                {/* Left: Avatars */}
                {/* <DashboardAvatars /> */}
                {/* Right: Actions */}
                <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                  <button className="btn bg-indigo-500 hover:bg-indigo-600 text-white">
                    <svg className="w-4 h-4 fill-current opacity-50 shrink-0" viewBox="0 0 16 16">
                      <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
                    </svg>
                    <span className="hidden md:block ml-2">Atalhos</span>
                  </button>
                </div>
              </div>
              {/* Cards */}
              <div className="grid grid-cols-12 gap-6">
                {/* Sinais Vitais) */}
                <DashboardsSinaisVitais />
              </div>
            </div>
          </main>
          {/* <Banner /> */}
        </div>
      </div>
    </PermissionWrapper>
  );
}

export default index;