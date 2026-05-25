import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Tag, Loader2, Plus, Search, Edit2, Trash2,
  LayoutGrid, List, ArrowUpDown, Package,
  ChevronDown, FileSpreadsheet, Sparkles
} from 'lucide-react';
import { resolveImageUrl } from '../utils/image';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import ExcelImport from '../components/ExcelImport';
import { bulkSyncServices } from '../services/serviceSync';
import { showAlert, showConfirm } from '../utils/swal';

const STATUSES = ['In Stock', 'Low Stock', 'Out of Stock'];

const statusBadge = (s) => {
  if (s === 'In Stock') return 'bg-green-50 text-green-700 border-green-100';
  if (s === 'Low Stock') return 'bg-yellow-50 text-yellow-700 border-yellow-100';
  if (s === 'Out of Stock') return 'bg-red-50 text-red-700 border-red-100';
  return 'bg-gray-50 text-gray-500 border-gray-100';
};

const Thumb = ({ src, size = 'sm' }) => {
  const [error, setError] = React.useState(false);
  const dim = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10';

  if (src && !error) return (
    <img
      src={resolveImageUrl(src)}
      alt=""
      className={`${dim} rounded-xl object-cover border border-gray-100 shrink-0`}
      onError={() => setError(true)}
    />
  );

  return (
    <div className={`${dim} rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0`}>
      <Tag size={size === 'sm' ? 14 : 16} className="text-gray-300" />
    </div>
  );
};

const ServiceCardImage = ({ src }) => {
  const [error, setError] = React.useState(false);

  if (src && !error) return (
    <img
      src={resolveImageUrl(src)}
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      alt=""
      onError={() => setError(true)}
    />
  );

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-200 gap-2">
      <Package size={40} className="opacity-50" />
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">No Image</span>
    </div>
  );
};

const Services = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('list');
  const [perPage] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('created_at:desc');

  const isNew = (date) => {
    if (!date) return false;
    const created = new Date(date);
    const now = new Date();
    const diff = now - created;
    return diff < 24 * 60 * 60 * 1000; // 24 hours
  };

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []).map(c => c.name);
    }
  });

  const { data: services = [], isLoading: servicesLoading, refetch: refetchServices } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          service_categories (
            categories (
              id,
              name
            )
          ),
          service_pricing (
            price,
            price_teen,
            price_child,
            price_infant,
            occupancy_pricing
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes('relation "public.services" does not exist')) return [];
        throw error;
      }
      
      return (data || []).map(s => {
        const allPrices = [];
        
        (s.service_pricing || []).forEach(p => {
          // Exclude meal supplements from lead price
          if (p.variant_id === 'meal_supplements') return;

          // Collect standard prices
          if (p.price) allPrices.push(Number(p.price));
          if (p.price_teen) allPrices.push(Number(p.price_teen));
          if (p.price_child) allPrices.push(Number(p.price_child));
          if (p.price_infant) allPrices.push(Number(p.price_infant));
          
          // Collect occupancy-based prices
          if (p.occupancy_pricing && typeof p.occupancy_pricing === 'object') {
            Object.values(p.occupancy_pricing).forEach(occ => {
              if (typeof occ === 'object' && occ !== null) {
                if (occ.price) allPrices.push(Number(occ.price));
                if (occ.teen) allPrices.push(Number(occ.teen));
                if (occ.child) allPrices.push(Number(occ.child));
                if (occ.infant) allPrices.push(Number(occ.infant));
              } else if (occ && !isNaN(Number(occ))) {
                allPrices.push(Number(occ));
              }
            });
          }
        });

        const lowestPrice = allPrices.length > 0 ? Math.min(...allPrices) : (Number(s.base_price) || 0);

        return {
          ...s,
          lowestPrice: lowestPrice,
          categories_list: s.service_categories
            ? s.service_categories.map(pc => pc.categories).filter(Boolean)
            : []
        };
      });
    }
  });

  const loading = categoriesLoading || servicesLoading;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterRegion, setFilterRegion] = useState('All');

  // Derived unique amenities from services
  const allAmenities = useMemo(() => {
    const set = new Set();
    services.forEach(s => {
      if (Array.isArray(s.amenities)) {
        s.amenities.forEach(a => set.add(a));
      }
    });
    return Array.from(set).sort();
  }, [services]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategories, filterStatus, filterRegion, minPrice, maxPrice, selectedAmenities, sortBy]);


  const openCreate = () => navigate('/services/create');
  const openEdit = (s) => navigate(`/services/edit/${s.id}`);

  const deleteService = async (id) => {
    const result = await showConfirm('Delete Service?', 'This will remove the service from your catalog.');
    if (!result.isConfirmed) return;
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      showAlert('Deleted', 'Service removed');
      refetchServices();
    } catch (e) { void e; showAlert('Error', 'Failed to delete service', 'error'); }
  };
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setFilterStatus('All');
    setMinPrice('');
    setMaxPrice('');
    setSelectedAmenities([]);
    setFilterRegion('All');
    setSortBy('created_at:desc');
    setCurrentPage(1);
  };
  
  const handleBulkImport = async (data) => {
    await bulkSyncServices(data);
    showAlert('Success', `${data.length} services imported successfully`, 'success');
    refetchServices();
  };

  const hasActiveFilters = searchTerm || selectedCategories.length > 0 || filterStatus !== 'All' || filterRegion !== 'All' || minPrice || maxPrice || selectedAmenities.length > 0;
  const selectCls = 'px-3 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red appearance-none cursor-pointer text-gray-700 hover:border-slate-300 transition-colors';

  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const processed = useMemo(() => {
    let list = [...services];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.categories_list || []).some(cat => (cat.name || '').toLowerCase().includes(q)) ||
        (s.description || '').toLowerCase().includes(q)
      );
    }

    if (selectedCategories.length > 0) {
      list = list.filter(s => (s.categories_list || []).some(cat => selectedCategories.includes(cat.name)));
    }

    if (filterStatus !== 'All') {
      list = list.filter(s => s.status === filterStatus);
    }

    if (filterRegion !== 'All') {
      list = list.filter(s => s.region === filterRegion);
    }

    if (minPrice) {
      list = list.filter(s => Number(s.lowestPrice) >= Number(minPrice));
    }

    if (maxPrice) {
      list = list.filter(s => Number(s.lowestPrice) <= Number(maxPrice));
    }

    if (selectedAmenities.length > 0) {
      list = list.filter(s => {
        if (!Array.isArray(s.amenities)) return false;
        return selectedAmenities.every(a => s.amenities.includes(a));
      });
    }

    const [field, dir] = sortBy.split(':');
    list.sort((a, b) => {
      let vA = a[field], vB = b[field];
      if (field === 'created_at') { vA = new Date(vA); vB = new Date(vB); }
      if (vA < vB) return dir === 'asc' ? -1 : 1;
      if (vA > vB) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [services, searchTerm, selectedCategories, filterStatus, minPrice, maxPrice, selectedAmenities, sortBy]);

  const totalPages = Math.ceil(processed.length / perPage);
  const handlePageChange = (p) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));
  const pageStart = (currentPage - 1) * perPage;
  const currentItems = processed.slice(pageStart, pageStart + perPage);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Service Catalog</h1>
          <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest leading-none mt-1">Agency Management & Inventory</p>
        </div>
        <div className="flex items-center gap-2">
          {/* <Button onClick={() => refetchServices()} variant="outline" className="text-gray-500 border-slate-300 flex items-center gap-2 py-1.5 h-9">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> <span className="text-xs">Sync</span>
          </Button> */}
          <Button onClick={() => setIsImportModalOpen(true)} variant="outline" className="text-gray-500 border-slate-300 flex items-center gap-2 py-1.5 h-9">
            <FileSpreadsheet size={14} /> <span className="text-xs">Import</span>
          </Button>
          <Button onClick={openCreate} className="bg-brand-red hover:opacity-90 text-white flex items-center gap-2 shadow-lg shadow-red-100 py-1.5 h-9 font-bold px-4">
            <Plus size={16} /> <span className="text-xs">Add Service</span>
          </Button>
        </div>
      </div>

      <ExcelImport 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImport={handleBulkImport} 
      />

      <Card className="border border-slate-300 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden bg-white">
        <CardHeader className="border-b border-gray-50 pb-3 bg-white px-6 pt-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-2.5 text-gray-300" size={16} />
                <input
                  type="text"
                  placeholder="Search all services…"
                  className="pl-9 pr-9 py-2.5 w-full border border-slate-300 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`px-4 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all ${showAdvanced ? 'bg-brand-red text-white border-brand-red' : 'bg-white text-gray-400 border-slate-300 hover:border-slate-300'}`}
                >
                  {showAdvanced ? 'Simple View' : 'Advanced Filters'}
                </button>
                <div className="flex items-center bg-gray-50 rounded-2xl p-1 gap-1 border border-gray-100 shrink-0">
                  <button type="button" onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-400'}`}><List size={18} /></button>
                  <button type="button" onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-400'}`}><LayoutGrid size={18} /></button>
                </div>
              </div>
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-gray-50/50 rounded-3xl border border-gray-100 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price Range (MUR)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <span className="text-gray-300">—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categories</label>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar pr-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all ${selectedCategories.includes(cat) ? 'bg-brand-red text-white border-brand-red' : 'bg-white text-gray-400 border-slate-300 hover:border-slate-300'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                  <div className="relative">
                    <select className={`${selectCls} w-full`} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                      <option value="All">All Statuses</option>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Geographical Zone</label>
                  <div className="relative">
                    <select className={`${selectCls} w-full`} value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
                      <option value="All">All Regions</option>
                      <option value="Mauritius">Mauritius (General)</option>
                      <option value="North Coast">North Coast</option>
                      <option value="South Coast">South Coast</option>
                      <option value="East Coast">East Coast</option>
                      <option value="West Coast">West Coast</option>
                      <option value="Central">Central</option>
                      <option value="North-West">North-West</option>
                      <option value="South-West">South-West</option>
                      <option value="Rodrigues">Rodrigues</option>
                      <option value="Reunion">Reunion</option>
                      <option value="Seychelles">Seychelles</option>
                      <option value="International">International</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amenities</label>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar pr-2">
                    {allAmenities.length > 0 ? allAmenities.map(amenity => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all ${selectedAmenities.includes(amenity) ? 'bg-brand-red text-white border-brand-red' : 'bg-white text-gray-400 border-slate-300 hover:border-slate-300'}`}
                      >
                        {amenity}
                      </button>
                    )) : (
                      <span className="text-[9px] font-bold text-gray-300 italic">No amenities found</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sort By:</span>
                  <div className="relative">
                    <select
                      className="pl-3 pr-7 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-red appearance-none cursor-pointer text-gray-500"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="created_at:desc">Newest First</option>
                      <option value="lowestPrice:asc">Price: Low to High</option>
                      <option value="lowestPrice:desc">Price: High to Low</option>
                      <option value="name:asc">Name: A-Z</option>
                      <option value="stock:desc">Stock: High to Low</option>
                    </select>
                    <ArrowUpDown size={10} className="absolute right-2 top-2 text-gray-300 pointer-events-none" />
                  </div>
                </div>
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters} className="text-brand-red text-[10px] font-black uppercase tracking-widest px-4 py-2 hover:bg-red-50 rounded-xl transition-colors">Clear Engine</button>
                )}
              </div>
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{processed.length} Entries Identified</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 bg-white">
          <div className="overflow-x-auto min-h-[400px] -mx-4 sm:mx-0 px-4 sm:px-0">
            {loading ? (
              <div className="py-32 flex flex-col items-center">
                <Loader2 className="animate-spin text-brand-red mb-4" size={48} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Querying Transaction Ledger...</p>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="py-32 text-center text-gray-300 font-black uppercase tracking-widest text-xs flex flex-col items-center gap-4">
                <Package size={56} className="opacity-20" />
                No matching specifications found
              </div>
            ) : viewMode === 'list' ? (
              <table className="min-w-full divide-y divide-gray-50">
                <thead className="hidden sm:table-header-group bg-gray-50/30">
                  <tr>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Specification & Pricing</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory Status</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map(s => (
                    <tr key={s.id} className="flex flex-col sm:table-row even:bg-gray-100/40 hover:bg-gray-100/60 transition-colors border-b sm:border-b-0 border-gray-100">
                      <td className="px-6 py-3 sm:table-cell">
                        <div className="flex items-center gap-4">
                          <Thumb src={s.image_url} size="md" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-black text-gray-900 leading-tight">{s.name}</p>
                                {isNew(s.created_at) && (
                                    <span className="px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest rounded-full bg-brand-red text-white animate-pulse">Just Created</span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-black text-brand-red leading-none">MUR {Number(s.lowestPrice).toLocaleString()}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {s.is_seasonal_deal && (
                                  <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1">
                                    <Sparkles size={8} /> {s.deal_note || 'Promotional'}
                                  </span>
                                )}
                                {(s.categories_list && s.categories_list.length > 0) ? (
                                  s.categories_list.map(cat => (
                                    <span key={cat.id} className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-red-50 text-brand-red border border-red-100">
                                      {cat.name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[9px] font-bold text-gray-400 border border-gray-100 px-1.5 py-0.5 rounded">Unassigned</span>
                                )}
                                {Array.isArray(s.room_types) && s.room_types.length > 0 && (
                                  <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1">
                                    {s.room_types.length} Room Types
                                  </span>
                                )}
                                {s.service_fee > 0 && (
                                  <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-purple-50 text-purple-600 border border-purple-100 flex items-center gap-1">
                                    Fee: {s.service_fee}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-2 sm:py-5 sm:table-cell">
                        <div className="flex items-center sm:flex-col sm:items-start gap-3 sm:gap-1">
                          <span className="sm:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[80px]">Status:</span>
                          <div className="flex flex-col gap-1">
                            <span className={`w-fit px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${statusBadge(s.status)}`}>{s.status}</span>
                            <p className="hidden sm:block text-[10px] font-bold text-gray-400 pl-1">{s.stock} units available</p>
                            {Array.isArray(s.room_types) && s.room_types.some(rt => rt.available) && (
                                <span className="w-fit px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-emerald-50 text-emerald-600 border border-emerald-100">Rentable</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 sm:py-3 sm:table-cell text-right">
                        <div className="flex justify-between sm:justify-end items-center gap-1">
                           <span className="sm:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">Manage:</span>
                           <div className="flex gap-1">
                             <button onClick={() => openEdit(s)} className="p-2.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all" title="Edit Specification"><Edit2 size={16} /></button>
                             <button onClick={() => deleteService(s.id)} className="p-2.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all" title="Archive Listing"><Trash2 size={16} /></button>
                           </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {currentItems.map(s => (
                  <div key={s.id} className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:border-transparent transition-all duration-500">
                    <div className="h-48 bg-gray-50 relative overflow-hidden">
                      <ServiceCardImage src={s.image_url} />
                      <div className="absolute top-4 right-4 transition-all">
                        <button onClick={() => deleteService(s.id)} className="p-3 bg-white/90 backdrop-blur rounded-2xl text-brand-red shadow-xl hover:scale-110 active:scale-95 transition-all"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-wrap gap-1">
                          {(s.categories_list && s.categories_list.length > 0) ? (
                            s.categories_list.slice(0, 2).map(cat => (
                              <span key={cat.id} className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-red-50 text-brand-red border border-red-100">
                                {cat.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] font-bold text-gray-400 border border-gray-100 px-1.5 py-0.5 rounded">Unassigned</span>
                          )}
                          {s.is_seasonal_deal && (
                            <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1">
                              <Sparkles size={8} /> {s.deal_note || 'Promotional'}
                            </span>
                          )}
                          {Array.isArray(s.room_types) && s.room_types.length > 0 && (
                            <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-blue-50 text-blue-600 border border-blue-100">
                              {s.room_types.length} RMs
                            </span>
                          )}
                          {Array.isArray(s.room_types) && s.room_types.some(rt => rt.available) && (
                            <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                              Rentable
                            </span>
                          )}
                          {s.service_fee > 0 && (
                            <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-purple-50 text-purple-600 border border-purple-100">
                              Fee: {s.service_fee}%
                            </span>
                          )}
                        </div>
                        <div className={`w-2 h-2 rounded-full ${s.status === 'In Stock' ? 'bg-green-500' : s.status === 'Low Stock' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                      </div>
                      <h3 className="text-sm font-black text-gray-900 leading-snug mb-4 line-clamp-2 h-10">{s.name}</h3>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">Base Rate</p>
                          <p className="text-sm font-black text-gray-900">MUR {Number(s.lowestPrice).toLocaleString()}</p>
                        </div>
                        <button onClick={() => openEdit(s)} className="p-3 text-gray-400 border border-gray-100 rounded-2xl hover:text-brand-red hover:bg-red-50 hover:border-red-100 transition-all"><Edit2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        {/* {processed.length > perPage && ( */}
        {processed.length > 0 && (
          <div className="flex items-center justify-between px-8 py-6 bg-gray-50/50 border-t border-gray-100">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-3 bg-white border border-gray-100 rounded-xl disabled:opacity-30"><ArrowUpDown size={14} className="rotate-90" /></button>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-3 bg-white border border-gray-100 rounded-xl disabled:opacity-30"><ArrowUpDown size={14} className="-rotate-90" /></button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
export default Services;
