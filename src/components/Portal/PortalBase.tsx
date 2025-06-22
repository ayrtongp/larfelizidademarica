import React, { useState } from 'react';
import PermissionWrapper from '@/components/PermissionWrapper';

import Sidebar from '../../components/Sidebar/Sidebar';
import PortalHeader from '@/components/PortalHeader';
import WelcomeBanner from '@/components/Dashboard/WelcomeBanner';
import BreadCrumb from '../BreadCrumb';

function Dashboard({ children }: any) {

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden bg-sky-50">

        {/*  Site header */}
        <PortalHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className='bg-sky-50 h-full'>
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