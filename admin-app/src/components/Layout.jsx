import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  return (
    <div className="flex min-h-screen bg-gray-50 max-w-[100vw] overflow-x-hidden">
      <div className="no-print">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      </div>

      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 p-2.5 bg-white/90 backdrop-blur-md shadow-xl border border-slate-200 text-gray-500 hover:text-brand-red hover:border-brand-red transition-all duration-300 rounded-2xl no-print flex items-center justify-center"
          title="Expand Command Center"
        >
          <Menu size={22} className="stroke-[2.5px]" />
        </button>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <main className={`flex-1 p-6 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};


export default Layout;
