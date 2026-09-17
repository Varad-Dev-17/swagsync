import { useState } from "react";
import { Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import Sidebar from "../components/admin/Sidebar";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/50 text-[13px] font-admin">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar 
          onClose={() => setSidebarOpen(false)} 
          isCollapsed={isCollapsed}
          toggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed left-0 top-0 z-50 lg:hidden h-full"
          >
            <Sidebar onClose={() => setSidebarOpen(false)} isCollapsed={false} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className={`transition-all duration-300 min-h-screen flex flex-col relative ${isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}>
        
        {/* Toggle Button (Floating over content for Mobile only) */}
        <div className="sticky top-4 z-50 w-full h-0 pointer-events-none lg:hidden">
          <div className="absolute left-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="pointer-events-auto p-1.5 bg-transparent text-slate-700 hover:text-[#4648d4] transition-colors flex items-center justify-center"
              title="Open Sidebar"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
