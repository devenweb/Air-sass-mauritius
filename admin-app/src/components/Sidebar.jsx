import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  UserCheck, 
  Package, 
  Settings, 
  LogOut, 
  Home, 
  Calendar, 
  BarChart2, 
  Layers, 
  MapPin,
  X, 
  Layout, 
  MessageSquare, 
  HelpCircle, 
  Inbox,
  Mail,
  FileText,
  ChevronDown,
  Briefcase,
  Users as UsersIcon,
  Globe,
  Monitor,
  DollarSign,
  DoorOpen,
  Database,
  Sparkles
} from 'lucide-react';
import { showConfirm } from '../utils/swal';
import logo from '../assets/logo.png';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [openGroups, setOpenGroups] = useState({
    business: true,
    engagement: false,
    content: true,
    system: false
  });

  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }, [location.pathname, setIsOpen]);

  const toggleGroup = (group) => {
    setOpenGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const menuGroups = [
    {
      id: 'business',
      title: 'Business Operations',
      icon: <Briefcase size={18} />,
      items: [
        { title: 'Services', path: '/services', icon: <Package size={16} /> },
        { title: 'Categories', path: '/categories', icon: <Layers size={16} /> },
        { title: 'Price Manager', path: '/pricing', icon: <DollarSign size={16} /> },
        { title: 'Service Manager', path: '/room-manager', icon: <DoorOpen size={16} /> },
        { title: 'Bookings', path: '/bookings', icon: <Calendar size={16} /> },
        // { title: 'Orders', path: '/orders', icon: <ShoppingCart size={16} /> },
        // { title: 'Invoices', path: '/invoices', icon: <CreditCard size={16} /> },
        { title: 'Reports', path: '/reports', icon: <BarChart2 size={16} /> },
      ]
    },
    {
      id: 'engagement',
      title: 'Clients & Engagement',
      icon: <UsersIcon size={18} />,
      items: [
        { title: 'Inbox', path: '/inquiries', icon: <Inbox size={16} /> },
        { title: 'Customers', path: '/customers', icon: <UserCheck size={16} /> },
        { title: 'Subscribers', path: '/subscribers', icon: <Mail size={16} /> },
        { title: 'Reviews', path: '/reviews', icon: <MessageSquare size={16} /> },
      ]
    },
    {
      id: 'content',
      title: 'Content & CMS',
      icon: <Globe size={18} />,
      items: [
        { title: 'Site Map Orchestrator', path: '/cms', icon: <MapPin size={16} /> },
        { title: 'News Editor', path: '/news', icon: <FileText size={16} /> },
        { title: 'Hero Slider', path: '/hero-slider', icon: <Layout size={16} /> },
        { title: 'Navigation', path: '/navigation', icon: <Layers size={16} /> },
        { title: 'Marketing Popups', path: '/marketing-popups', icon: <Monitor size={16} /> },
        { title: 'FAQs', path: '/faqs', icon: <HelpCircle size={16} /> },
        { title: 'Team & Access', path: '/team', icon: <Users size={16} /> },
        { title: 'Team Page Visuals', path: '/team/visuals', icon: <Sparkles size={16} /> },
      ]
    },
    {
      id: 'system',
      title: 'System Control',
      icon: <Monitor size={18} />,
      items: [
        { title: 'Settings', path: '/settings', icon: <Settings size={16} /> },
        { title: 'Backup & Restore', path: '/backup', icon: <Database size={16} /> },
      ]
    }
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 w-64 bg-white text-gray-900 z-30 border-r border-slate-300 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-2xl lg:shadow-[20px_0_50px_-20px_rgba(0,0,0,0.05)] flex flex-col`}>

        <div className="flex flex-col items-center justify-center py-6 px-4 border-b border-slate-300 bg-white relative shrink-0">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-300"
            title="Collapse Sidebar"
          >
            <X size={18} />
          </button>
          <img 
            src={logo} 
            alt="Royal Travel Agency" 
            className="h-14 mb-3 object-contain" 
          />
        </div>

        <nav className="mt-2 px-3 flex-1 overflow-y-auto custom-scrollbar pb-20">
          <div className="mb-4">
            <Link
              to="/"
              className={`flex items-center px-4 py-3 rounded-xl mb-1 transition-all duration-300 ${location.pathname === '/'
                ? 'bg-brand-red text-white shadow-lg shadow-red-200'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <Home size={18} className="mr-3" />
              <span className="font-bold text-xs tracking-tight">Dashboard</span>
            </Link>
          </div>

          {menuGroups.map((group) => (
            <div key={group.id} className="mb-2">
              <button
                onClick={() => toggleGroup(group.id)}
                aria-expanded={openGroups[group.id]}
                aria-controls={`group-content-${group.id}`}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-slate-500 hover:text-slate-900 transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className={`transition-colors ${openGroups[group.id] ? "text-brand-red" : "text-slate-400 group-hover:text-brand-red"}`}>{group.icon}</span>
                  <span className="text-[10px] font-black tracking-widest text-slate-600 group-hover:text-slate-900">{group.title}</span>
                </div>
                <ChevronDown 
                  size={14} 
                  className={`transition-transform duration-300 ${openGroups[group.id] ? 'rotate-180 text-brand-red' : 'text-slate-400'}`} 
                />
              </button>

              <div 
                id={`group-content-${group.id}`}
                className={`overflow-hidden transition-all duration-300 ease-in-out ${openGroups[group.id] ? 'max-h-[500px] mt-1 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <ul className="pl-4 space-y-1">
                  {group.items.map((item, idx) => (
                    <li key={idx}>
                      <Link
                        to={item.path}
                        className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand-red ${location.pathname === item.path
                          ? 'bg-red-50 text-brand-red shadow-sm border border-red-100'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                      >
                        <span className="mr-3 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">{item.icon}</span>
                        <span className="font-bold text-[11px] tracking-tight">{item.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          <div className="mt-8 pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                showConfirm('Sign Out', 'Are you sure you want to exit the command center?').then((result) => {
                  if (result.isConfirmed) {
                    signOut();
                    navigate('/login');
                  }
                });
              }}
              className="w-full flex items-center px-4 py-3 rounded-xl text-slate-400 hover:text-brand-red hover:bg-red-50 transition-all duration-300 group"
            >
              <LogOut size={18} className="mr-3 group-hover:translate-x-1 transition-transform" />
              <span className="font-bold text-xs tracking-tight">Sign Out</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
