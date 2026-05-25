import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Users, Calendar, Loader2, TrendingUp, DollarSign, ArrowRight, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

import { resolveImageUrl } from '../utils/image';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAdmins: 0,
    totalCustomers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    todayBookings: 0,
    todayRevenue: 0
  });
  const [recentAdmins, setRecentAdmins] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const { count: adminCount } = await supabase.from('admins').select('*', { count: 'exact', head: true });
      const { count: customerCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
      const { count: bookingCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true });

      const { data: admins } = await supabase
        .from('admins')
        .select('id, username, email, role, created_at, photo_url, name')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          id,
          total_price,
          amount,
          status,
          service_type,
          created_at,
          customers (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: allBookingsData } = await supabase
        .from('bookings')
        .select('total_price, amount, status, created_at');

      const allBookings = allBookingsData || [];
      const confirmedStatuses = ['confirmed', 'completed', 'paid'];
      
      const revenue = allBookings
        .filter(b => confirmedStatuses.includes(b.status?.toLowerCase()))
        .reduce((sum, b) => sum + (Number(b.total_price || b.amount) || 0), 0);

      const todayBookings = allBookings.filter(b => new Date(b.created_at) >= startOfToday);
      const todayTotal = todayBookings.length;
      const todayRevenue = todayBookings
        .filter(b => confirmedStatuses.includes(b.status?.toLowerCase()))
        .reduce((sum, b) => sum + (Number(b.total_price || b.amount) || 0), 0);

      setStats({
        totalAdmins: adminCount || 0,
        totalCustomers: customerCount || 0,
        totalBookings: bookingCount || 0,
        totalRevenue: revenue,
        todayBookings: todayTotal,
        todayRevenue: todayRevenue
      });

      setRecentAdmins(admins || []);
      setRecentBookings(bookings || []);
      setLastSynced(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Dashboard Data Master Sync Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Enterprise Dashboard</h1>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Real-time business intelligence & monitoring</p>
        </div>
        <div className="flex flex-col items-end">
          {/* <button
            onClick={fetchDashboardData}
            className="group bg-white border border-slate-300 text-gray-600 px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-brand-red hover:text-brand-red transition-all flex items-center shadow-sm"
          >
            <span className="mr-2 group-hover:rotate-180 transition-transform duration-500">↻</span> Refresh Metrics
          </button> */}
          {lastSynced && (
            <span className="text-[10px] text-gray-300 font-black mt-2 uppercase tracking-tight">
              Last Synced: {lastSynced}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-slate-200">
          <div className="p-6 bg-white rounded-full shadow-xl shadow-gray-100 mb-4">
            <Loader2 className="animate-spin text-brand-red" size={40} />
          </div>
          <p className="text-gray-400 font-black uppercase tracking-[0.2em] animate-pulse">Syncing Global Data Engine...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div onClick={() => navigate('/team')} className="group cursor-pointer transform hover:-translate-y-1 transition-all duration-300">
              <Card className="bg-white border border-slate-200 shadow-sm group-hover:shadow-xl group-hover:border-red-100 rounded-[2rem] overflow-hidden">
                <CardContent className="p-6 text-left">
                  <div className="flex justify-between items-center mb-4 pt-2">
                    <Users size={28} className="text-brand-red" />
                    <ArrowRight size={18} className="text-slate-200 group-hover:text-brand-red transition-colors" />
                  </div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Staff</h3>
                  <div className="text-3xl font-black text-slate-900 tracking-tighter">{stats.totalAdmins}</div>
                </CardContent>
              </Card>
            </div>

            <div onClick={() => navigate('/bookings')} className="group cursor-pointer transform hover:-translate-y-1 transition-all duration-300">
              <Card className="bg-white border border-slate-200 shadow-sm group-hover:shadow-xl group-hover:border-green-100 rounded-[2rem] overflow-hidden">
                <CardContent className="p-6 text-left">
                  <div className="flex justify-between items-center mb-4 pt-2">
                    <Calendar size={28} className="text-green-600" />
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full mb-1">+{stats.todayBookings} TODAY</span>
                      <ArrowRight size={18} className="text-slate-200 group-hover:text-green-600 transition-colors" />
                    </div>
                  </div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Bookings</h3>
                  <div className="text-3xl font-black text-slate-900 tracking-tighter">{stats.totalBookings}</div>
                </CardContent>
              </Card>
            </div>

            <div onClick={() => navigate('/reports')} className="group cursor-pointer transform hover:-translate-y-1 transition-all duration-300">
              <Card className="bg-white border border-slate-200 shadow-sm group-hover:shadow-xl group-hover:border-amber-100 rounded-[2rem] overflow-hidden">
                <CardContent className="p-6 text-left">
                  <div className="flex justify-between items-center mb-4 pt-2">
                    <DollarSign size={28} className="text-amber-600" />
                    <div className="flex items-center text-green-600 font-black text-[9px] bg-green-50 px-2 py-0.5 rounded-full">
                      <TrendingUp size={12} className="mr-1" /> LIVE
                    </div>
                  </div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Revenue</h3>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">Rs {stats.totalRevenue.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border border-slate-200 shadow-sm rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center">
                  <Users size={16} className="mr-3 text-brand-red" /> Recent Staff Activity
                </CardTitle>
                <button onClick={() => navigate('/team')} className="text-[10px] font-black uppercase tracking-widest text-brand-red hover:underline flex items-center gap-1">
                  View All <ExternalLink size={10} />
                </button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <tbody className="bg-white divide-y divide-slate-100">
                      {recentAdmins.length > 0 ? recentAdmins.map((admin) => (
                        <tr key={admin.id} onClick={() => navigate(`/team/edit/${admin.id}`)} className="group cursor-pointer hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                                <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-400 mr-3 overflow-hidden group-hover:border-red-200 transition-colors">
                                  {admin.photo_url ? (
                                    <img 
                                      src={resolveImageUrl(admin.photo_url)} 
                                      alt={admin.name} 
                                      className="w-full h-full object-cover" 
                                      onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name || admin.username || 'U')}&size=100&background=F3F4F6&color=9CA3AF`;
                                      }}
                                    />
                                  ) : (
                                    admin.name?.charAt(0).toUpperCase() || admin.username?.charAt(0).toUpperCase()
                                  )}
                                </div>
                              <div className="text-left">
                                <div className="text-sm font-black text-slate-900 group-hover:text-brand-red transition-colors">{admin.name || admin.username}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{admin.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full border ${
                              admin.role === 'admin' ? 'bg-red-50 text-brand-red border-red-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                            }`}>
                              {admin.role}
                            </span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-right">
                             <ArrowRight size={14} className="ml-auto text-slate-200 group-hover:text-brand-red transform group-hover:translate-x-1 transition-all" />
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={3} className="p-12 text-center text-slate-400 font-black uppercase tracking-widest italic">No System Activity Found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center">
                  <Calendar size={16} className="mr-3 text-green-600" /> Recent Bookings
                </CardTitle>
                <button onClick={() => navigate('/bookings')} className="text-[10px] font-black uppercase tracking-widest text-green-600 hover:underline flex items-center gap-1">
                  View All <ExternalLink size={10} />
                </button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <tbody className="bg-white divide-y divide-slate-100">
                      {recentBookings.length > 0 ? recentBookings.map((booking) => (
                        <tr key={booking.id} onClick={() => navigate('/bookings', { state: { highlightId: booking.id } })} className="group cursor-pointer hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="text-left">
                              <div className="text-sm font-black text-slate-900 group-hover:text-green-600 transition-colors">
                                {booking.customers
                                  ? `${booking.customers.first_name} ${booking.customers.last_name}`
                                  : 'Guest Traveler'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{booking.service_type} • {formatDate(booking.check_in_date || booking.date || booking.created_at)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-right">
                            <div className="text-sm font-black text-slate-900 mb-0.5">Rs {Number(booking.total_price || booking.amount || 0).toLocaleString()}</div>
                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-lg border ${
                              booking.status?.toLowerCase() === 'confirmed' || booking.status?.toLowerCase() === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                              booking.status?.toLowerCase() === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                'bg-red-50 text-red-700 border-red-100'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-right">
                             <ArrowRight size={14} className="ml-auto text-slate-200 group-hover:text-green-600 transform group-hover:translate-x-1 transition-all" />
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={3} className="p-12 text-center text-slate-400 font-black uppercase tracking-widest italic">No Bookings Recorded</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
export default Dashboard;
