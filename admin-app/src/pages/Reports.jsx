import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader } from '../components/Card';
import { TrendingUp, Users, Calendar,
  CheckCircle, Clock, BarChart2,
  Activity, Coffee, Star, MapPin, Plane, Sun, ChevronRight, Download, Printer,
  Table, PieChart
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtRs = (n) => `Rs ${Number(n || 0).toLocaleString('en-MU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNum = (n) => Number(n || 0).toLocaleString();
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const statusColor = (s) => {
  const status = s?.toLowerCase();
  if (status === 'confirmed' || status === 'completed' || status === 'paid') return 'bg-green-50 text-green-700 border-green-100';
  if (status === 'pending') return 'bg-yellow-50 text-yellow-700 border-yellow-100';
  if (status === 'cancelled' || status === 'overdue') return 'bg-red-50 text-red-700 border-red-100';
  return 'bg-gray-50 text-gray-500 border-gray-100';
};

const ActivityIcon = ({ type }) => {
  switch (type?.toLowerCase()) {
    case 'lounge': return <Coffee size={13} className="text-amber-500" />;
    case 'hotel': return <Star size={13} className="text-red-500" />;
    case 'tour': return <MapPin size={13} className="text-green-500" />;
    case 'cruise': return <Plane size={13} className="text-sky-500" />;
    default: return <Sun size={13} className="text-orange-500" />;
  }
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = 'red', loading }) => {
  const colors = {
    red: 'bg-red-50 text-brand-red border-red-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    blue: 'bg-red-50 text-red-600 border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    Card: 'border border-gray-100 shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-md transition-shadow duration-300',
  };
  return (
    <Card className={colors.Card}>
      <CardContent className="p-7">
        <div className="flex items-start justify-between mb-5">
          <div className={`p-4 rounded-2xl border ${colors[color]}`}>
            <Icon size={26} />
          </div>
          {!loading && <div className="h-2 w-2 rounded-full bg-gray-200 mt-2" />}
        </div>
        {loading ? (
          <div className="space-y-2">
            <div className="h-10 w-32 bg-gray-50 animate-pulse rounded-xl" />
            <div className="h-3 w-16 bg-gray-50 animate-pulse rounded-lg" />
          </div>
        ) : (
          <div>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-none">{value}</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-3">{label}</p>
            {sub && <p className="text-[10px] font-bold text-gray-400/60 mt-2 uppercase tracking-tight line-clamp-1">{sub}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Mini bar chart (CSS-only) ────────────────────────────────────────────────
const MiniBar = ({ value, max, color = 'bg-brand-red' }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
const Reports = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  // KPIs
  const [stats, setStats] = useState({
    totalBookings: 0, confirmedBookings: 0, pendingBookings: 0, cancelledBookings: 0,
    totalRevenue: 0, totalCustomers: 0, totalSubscribers: 0
  });

  // Data Arrays for Reports
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [monthlyBookings, setMonthlyBookings] = useState([]);
  const [topActivities, setTopActivities] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBookingStats(),
        fetchCustomerStats(),
        fetchMonthlyBookings(),
        fetchTopActivities(),
        fetchRecentBookings(),
        fetchFullBookings(),
        fetchFullCustomers(),
      ]);
    } catch (error) {
      console.error('Reports fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFullBookings = async () => {
    const { data } = await supabase.from('bookings').select('*, customers(first_name, last_name, email)').order('created_at', { ascending: false });
    setBookings(data || []);
  };

  const fetchFullCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    setCustomers(data || []);
  };

  const fetchBookingStats = async () => {
    const { data } = await supabase.from('bookings').select('status, amount, total_price, booking_items(amount)');
    if (!data) return;
    
    const confirmedStatuses = ['confirmed', 'completed', 'paid'];
    const confirmed = data.filter(b => b.status?.toLowerCase() === 'confirmed' || b.status?.toLowerCase() === 'completed').length;
    const pending = data.filter(b => b.status?.toLowerCase() === 'pending').length;
    const cancelled = data.filter(b => b.status?.toLowerCase() === 'cancelled').length;
    
    const revenue = data
      .filter(b => confirmedStatuses.includes(b.status?.toLowerCase()))
      .reduce((sum, b) => {
        if (b.booking_items?.length) return sum + b.booking_items.reduce((is, it) => is + (Number(it.amount) || 0), 0);
        return sum + Number(b.total_price || b.amount || 0);
      }, 0);

    setStats(prev => ({ ...prev, totalBookings: data.length, confirmedBookings: confirmed, pendingBookings: pending, cancelledBookings: cancelled, totalRevenue: revenue }));
    setStatusBreakdown([
      { label: 'Confirmed', count: confirmed, color: 'bg-green-400' },
      { label: 'Pending', count: pending, color: 'bg-yellow-400' },
      { label: 'Cancelled', count: cancelled, color: 'bg-red-400' },
    ]);
  };

  const fetchCustomerStats = async () => {
    const { data } = await supabase.from('customers').select('is_subscriber');
    if (!data) return;
    setStats(prev => ({ ...prev, totalCustomers: data.length, totalSubscribers: data.filter(c => c.is_subscriber).length }));
  };

    // Invoices are currently inactive/dead as per audit
  const fetchMonthlyBookings = async () => {
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); sixMonthsAgo.setDate(1);
    const { data } = await supabase.from('bookings').select('created_at, total_price, amount').gte('created_at', sixMonthsAgo.toISOString());
    if (!data) return;
    const map = {};
    data.forEach(b => {
      const d = new Date(b.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map[key]) map[key] = { month: MONTH_NAMES[d.getMonth()], year: d.getFullYear(), count: 0, revenue: 0 };
      map[key].count += 1;
      map[key].revenue += Number(b.total_price || b.amount || 0);
    });
    const rows = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      rows.push(map[key] || { month: MONTH_NAMES[d.getMonth()], year: d.getFullYear(), count: 0, revenue: 0 });
    }
    setMonthlyBookings(rows);
  };

  const fetchTopActivities = async () => {
    const { data } = await supabase.from('bookings').select('service_name, service_type, total_price, amount');
    if (!data) return;
    const map = {};
    data.forEach(b => {
      const key = b.service_name || 'Unknown';
      if (!map[key]) map[key] = { name: key, type: b.service_type, count: 0, revenue: 0 };
      map[key].count += 1;
      map[key].revenue += Number(b.total_price || b.amount || 0);
    });
    setTopActivities(Object.values(map).sort((a, b) => b.count - a.count).slice(0, 7));
  };

  const fetchRecentBookings = async () => {
    const { data } = await supabase.from('bookings').select('*, customers(first_name, last_name)').order('created_at', { ascending: false }).limit(8);
    setRecentBookings(data || []);
  };

  // ─── Export Logic ───────────────────────────────────────────────────────────
  const handleExportExcel = (type) => {
    setExportLoading(true);
    let data = [];
    let name = "report";

    if (type === 'bookings') {
      data = bookings.map(b => ({
        Date: new Date(b.created_at).toLocaleDateString(),
        Customer: `${b.customers?.first_name} ${b.customers?.last_name}`,
        Activity: b.service_name,
        Type: b.service_type,
        Amount: b.total_price,
        Status: b.status
      }));
      name = "Booking_Ledger";
    } else if (type === 'customers') {
      data = customers.map(c => ({
        Name: `${c.first_name} ${c.last_name}`,
        Email: c.email,
        Phone: c.phone,
        Joined: new Date(c.created_at).toLocaleDateString(),
        Subscriber: c.is_subscriber ? 'Yes' : 'No'
      }));
      name = "Customer_Directory";
    } else if (type === 'performance') {
        data = topActivities.map(a => ({
            Activity: a.name,
            Category: a.type,
            Count: a.count,
            Revenue: a.revenue
        }));
        name = "Service_Performance";
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${name}_${new Date().toISOString().split('T')[0]}.xlsx`);
    setExportLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  // ─── Renderers ──────────────────────────────────────────────────────────────
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Total Bookings" value={fmtNum(stats.totalBookings)} color="red" loading={loading} />
        <StatCard icon={TrendingUp} label="Booking Revenue" value={fmtRs(stats.totalRevenue)} color="green" loading={loading} />
        <StatCard icon={Users} label="Total Customers" value={fmtNum(stats.totalCustomers)} color="blue" loading={loading} sub={`${fmtNum(stats.totalSubscribers)} subscribers`} />
        <StatCard icon={CheckCircle} label="Confirmed" value={fmtNum(stats.confirmedBookings)} color="green" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-slate-300 rounded-3xl bg-white shadow-xl shadow-gray-100">
          <CardHeader className="border-b border-gray-100 p-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <BarChart2 size={16} className="text-brand-red" /> Revenue Trend
            </h3>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-end gap-2 h-40 mb-4">
              {monthlyBookings.map((row, i) => {
                const maxCount = Math.max(...monthlyBookings.map(r => r.count), 1);
                const h = Math.max((row.count / maxCount) * 100, 5);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-brand-red/80 rounded-t-lg transition-all hover:bg-brand-red" style={{ height: `${h}%` }} />
                    <span className="text-[9px] font-bold text-gray-400 uppercase">{row.month}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-300 rounded-3xl bg-white shadow-xl shadow-gray-100">
            <CardHeader className="border-b border-gray-100 p-6">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <PieChart size={16} className="text-brand-red" /> Status Mix
                </h3>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                {statusBreakdown.map(s => (
                    <div key={s.label}>
                        <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1">
                            <span>{s.label}</span>
                            <span>{fmtNum(s.count)}</span>
                        </div>
                        <MiniBar value={s.count} max={stats.totalBookings} color={s.color} />
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-300 rounded-3xl bg-white shadow-xl shadow-gray-100">
          <CardHeader className="border-b border-gray-100 p-6 flex justify-between items-center">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <Star size={16} className="text-brand-red" /> Performance
            </h3>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {topActivities.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-300">#{(i+1)}</span>
                      <ActivityIcon type={row.type} />
                      <span className="text-xs font-black text-gray-900">{row.name}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-xs font-bold text-brand-red">{fmtRs(row.revenue)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="border border-slate-300 rounded-3xl bg-white shadow-xl shadow-gray-100">
          <CardHeader className="border-b border-gray-100 p-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <Clock size={16} className="text-brand-red" /> Recent Activity
            </h3>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="text-xs font-black text-gray-900">{b.customers?.first_name} {b.customers?.last_name}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{b.service_name}</p>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${statusColor(b.status)}`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTableReport = (data, columns, title) => (
    <Card className="border border-slate-300 rounded-3xl bg-white shadow-xl shadow-gray-200/50 print:shadow-none print:border-none overflow-hidden">
      <CardHeader className="border-b border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">{title}</h2>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Found {data.length} records</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <Button variant="outline" size="sm" onClick={() => handleExportExcel(activeTab)} disabled={exportLoading} className="rounded-xl border-slate-300 text-gray-600 flex items-center gap-2">
            <Download size={14} /> XLSX
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl border-slate-300 text-gray-600 flex items-center gap-2">
            <Printer size={14} /> PDF/Print
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr>
                {columns.map(col => (
                  <th key={col.key} className="text-left px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/80 transition-colors group">
                  {columns.map(col => (
                    <td key={col.key} className="px-8 py-5 whitespace-nowrap">
                      {col.render ? col.render(row) : <span className="text-xs font-black text-gray-900">{row[col.key] || '—'}</span>}
                    </td>
                  ))}
                </tr>
              ))}
              {data.length === 0 && (
                  <tr>
                      <td colSpan={columns.length} className="px-8 py-20 text-center text-gray-400 text-sm">No data available in this report</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity, desc: 'Overview of business performance' },
    { id: 'bookings', label: 'Booking Ledger', icon: Table, desc: 'Detailed transaction history' },
    { id: 'customers', label: 'Customer Directory', icon: Users, desc: 'Client database & loyalty track' },
    { id: 'performance', label: 'Sales by Service', icon: Star, desc: 'Product performance metrics' },
  ];

  return (
    <div className="print:p-0">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Intelligence Centre</h1>
          <p className="text-gray-400 text-sm font-medium">Generate, analyze and export operational business reports</p>
        </div>
        <div className="flex items-center gap-2">
            {/* <Button variant="outline" onClick={fetchAll} disabled={loading} className="rounded-xl border-slate-300 text-gray-500 flex items-center gap-2">
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                Refresh Data
            </Button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* ── Selection Sidebar ── */}
        <div className="lg:col-span-1 space-y-2 print:hidden">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left p-4 rounded-3xl transition-all duration-300 group flex items-start gap-4 ${
                activeTab === item.id 
                  ? 'bg-brand-red text-white shadow-xl shadow-red-500/20' 
                  : 'bg-white border border-gray-100 text-gray-500 hover:border-brand-red/30'
              }`}
            >
              <div className={`p-2.5 rounded-2xl ${activeTab === item.id ? 'bg-white/10' : 'bg-gray-50 group-hover:bg-red-50 group-hover:text-brand-red'}`}>
                <item.icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black uppercase tracking-widest">{item.label}</p>
                <p className={`text-[10px] font-bold mt-0.5 truncate ${activeTab === item.id ? 'text-white/60' : 'text-gray-400'}`}>{item.desc}</p>
              </div>
              {activeTab === item.id && <ChevronRight size={16} className="mt-2" />}
            </button>
          ))}
        </div>

        {/* ── Main Report Area ── */}
        <div className="lg:col-span-3">
          {activeTab === 'dashboard' && renderDashboard()}
          
          {activeTab === 'bookings' && renderTableReport(
            bookings,
            [
              { key: 'created_at', label: 'Date', render: (r) => <span className="text-xs font-bold text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span> },
              { key: 'customer', label: 'Client', render: (r) => (
                <div>
                  <p className="text-xs font-black text-gray-900">{r.customers?.first_name} {r.customers?.last_name}</p>
                  <p className="text-[10px] text-gray-400 font-bold">{r.customers?.email}</p>
                </div>
              )},
              { key: 'service_name', label: 'Activity', render: (r) => (
                <div className="flex items-center gap-2">
                  <ActivityIcon type={r.service_type} />
                  <span className="text-xs font-black text-gray-900">{r.service_name}</span>
                </div>
              )},
              { key: 'total_price', label: 'Revenue', render: (r) => <span className="text-xs font-black text-brand-red">{fmtRs(r.total_price || r.amount)}</span> },
              { key: 'status', label: 'Status', render: (r) => <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${statusColor(r.status)}`}>{r.status}</span> },
            ],
            'Booking Transaction Ledger'
          )}

          {activeTab === 'customers' && renderTableReport(
            customers,
            [
              { key: 'name', label: 'Identity', render: (r) => (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 uppercase">
                    {r.first_name?.charAt(0)}{r.last_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900">{r.first_name} {r.last_name}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{r.phone || 'No phone'}</p>
                  </div>
                </div>
              )},
              { key: 'email', label: 'Contact', render: (r) => <span className="text-xs font-bold text-gray-600">{r.email}</span> },
              { key: 'created_at', label: 'Joining Date', render: (r) => <span className="text-[11px] font-black text-gray-400 uppercase">{new Date(r.created_at).toLocaleDateString('en-MU', { month: 'short', day: 'numeric', year: 'numeric' })}</span> },
              { key: 'is_subscriber', label: 'Newsletter', render: (r) => (
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${r.is_subscriber ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                  {r.is_subscriber ? 'ACTIVE' : 'INACTIVE'}
                </span>
              )},
            ],
            'Customer Base Directory'
          )}

          {activeTab === 'performance' && renderTableReport(
              topActivities,
              [
                { key: 'name', label: 'Service Item', render: (r) => (
                  <div className="flex items-center gap-3">
                    <ActivityIcon type={r.type} />
                    <span className="text-xs font-black text-gray-900">{r.name}</span>
                  </div>
                )},
                { key: 'type', label: 'Category', render: (r) => <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{r.type}</span> },
                { key: 'count', label: 'Units Sold', render: (r) => <span className="text-xs font-black text-gray-900">{r.count}</span> },
                { key: 'revenue', label: 'Total Yield', render: (r) => <span className="text-xs font-black text-brand-red">{fmtRs(r.revenue)}</span> },
                { key: 'avg', label: 'Unit Price', render: (r) => <span className="text-[10px] font-bold text-gray-400">{fmtRs(r.revenue / r.count)}</span> },
              ],
              'Detailed Service Performance'
          )}
        </div>
      </div>

      {/* ── Print Specific Styles ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: auto; margin: 20mm; }
          body { background: white !important; font-family: 'Inter', sans-serif; }
          .print\\:hidden, nav, header, aside, .lg\\:col-span-1 { display: none !important; }
          .lg\\:col-span-3 { width: 100% !important; grid-column: span 4 / span 4 !important; position: static !important; transform: none !important; }
          .Card, .CardContent { border: none !important; box-shadow: none !important; padding-left: 0 !important; padding-right: 0 !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th { background: #f9fafb !important; color: #4b5563 !important; border-bottom: 2px solid #e5e7eb !important; }
          td { border-bottom: 1px solid #f3f4f6 !important; }
          .text-brand-red { color: #e11d48 !important; }
          
          /* Force visibility of what we want to print */
          .lg\\:col-span-3, .lg\\:col-span-3 * { visibility: visible !important; }
          
          /* Custom report header for print */
          .print-header { display: block !important; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 10px; }
        }
        .print-header { display: none; }
      `}} />

      {/* Invisible Print Header */}
      <div className="print-header">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-[0.3em]">Business Report</h1>
            <p className="text-[10px] font-bold text-gray-400">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-widest">Royal Travel Agency Ltd</p>
            <p className="text-[8px] font-bold text-gray-400">Operations Intelligence Unit</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
