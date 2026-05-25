import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { showAlert } from '../utils/swal';
import { supabase } from '../lib/supabase';
import { Loader2, Save, Image as ImageIcon, Ruler, Mail } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import RichTextEditor from '../components/RichTextEditor';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    siteTitle: '',
    logoUrl: '',
    logoHeight: '40',
    logoWidth: 'auto',
    popupAdsActive: false,
    contactEmail: '',
    contactPhone: '',
    whatsappNumber1: '',
    whatsappNumber2: '',
    office1Title: '',
    office1Address: '',
    office1MapUrl: '',
    office2Title: '',
    office2Address: '',
    office2MapUrl: '',
    workingHours: '',
    facebookUrl: '',
    instagramUrl: '',
    linkedinUrl: '',
    tiktokUrl: '',
    showFooterWeb: true,
    showFooterMobile: true,
    showSearchBar: true,
    showSearchBarGlobal: true,
    experienceSectionImage: '/assets/placeholders/hero-hotel.png',
    timezone: '',
    currency: '',
    dateFormat: '',
    timeFormat: '',
    seo: {
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      ogImage: ''
    },
    mobile: {
      supportPhone: '',
      supportEmail: '',
      appVersion: '1.0.0',
      primaryColor: '#DC2626'
    },
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    email: {
      mailServerUrl: 'smtp.royaltravel.mu',
      mailServerPort: '465',
      mailServerLogin: 'noreply@royaltravel.mu',
      mailServerPass: 'Cr@nberry@280426',
      mailFromEmail: 'noreply@royaltravel.mu',
      mailFromName: 'Royal Travel Agency'
    },
    security: {
      twoFactorAuth: false,
      passwordExpiry: 90,
      sessionTimeout: 60
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;

      if (data) {
        const newFormData = { ...formData };
        data.forEach(item => {
          if (item.key === 'general_config') {
            Object.assign(newFormData, item.value);
          } else if (item.key === 'seo_config') {
            newFormData.seo = item.value;
          } else if (item.key === 'mobile_config') {
            newFormData.mobile = item.value;
          } else if (item.key === 'security_config') {
            newFormData.security = item.value;
          } else if (item.key === 'notifications_config') {
            newFormData.notifications = item.value;
          } else if (item.key === 'email_config') {
            newFormData.email = item.value;
          }
        });
        setFormData(newFormData);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      showAlert('Error', 'Failed to synchronize settings from database.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Deep trim utility for strings in configuration objects
    const deepTrim = (obj) => {
      if (typeof obj === 'string') return obj.trim();
      if (typeof obj !== 'object' || obj === null) return obj;
      
      const newObj = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        newObj[key] = deepTrim(obj[key]);
      }
      return newObj;
    };

    try {
      let key, value, category;

      if (activeTab === 'general') {
        key = 'general_config';
        category = 'general';
        value = {
          siteTitle: formData.siteTitle,
          logoUrl: formData.logoUrl,
          logoHeight: formData.logoHeight,
          logoWidth: formData.logoWidth,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail,
          whatsappNumber1: formData.whatsappNumber1,
          whatsappNumber2: formData.whatsappNumber2,
          office1Title: formData.office1Title,
          office1Address: formData.office1Address,
          office1MapUrl: formData.office1MapUrl,
          office2Title: formData.office2Title,
          office2Address: formData.office2Address,
          office2MapUrl: formData.office2MapUrl,
          workingHours: formData.workingHours,
          facebookUrl: formData.facebookUrl,
          instagramUrl: formData.instagramUrl,
          linkedinUrl: formData.linkedinUrl,
          tiktokUrl: formData.tiktokUrl,
          showFooterWeb: formData.showFooterWeb,
          showFooterMobile: formData.showFooterMobile,
          showSearchBar: formData.showSearchBar,
          showSearchBarGlobal: formData.showSearchBarGlobal,
          experienceSectionImage: formData.experienceSectionImage,
          timezone: formData.timezone,
          currency: formData.currency,
          dateFormat: formData.dateFormat,
          timeFormat: formData.timeFormat,
          popupAdsActive: formData.popupAdsActive
        };
      } else if (activeTab === 'seo') {
        key = 'seo_config';
        category = 'seo';
        value = formData.seo;
      } else if (activeTab === 'mobile') {
        key = 'mobile_config';
        category = 'mobile';
        value = formData.mobile;
      } else if (activeTab === 'security') {
        key = 'security_config';
        category = 'security';
        value = formData.security;
      } else if (activeTab === 'notifications') {
        key = 'notifications_config';
        category = 'notifications';
        value = formData.notifications;
      } else if (activeTab === 'email') {
        key = 'email_config';
        category = 'email';
        value = formData.email;
      }

      // Apply deep trim to all configuration values
      const trimmedValue = deepTrim(value);

      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key,
          value: trimmedValue,
          category,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;

      showAlert('Settings Updated', `${category.charAt(0).toUpperCase() + category.slice(1)} settings have been successfully saved.`, 'success');
    } catch (err) {
      console.error('Error saving settings:', err);
      showAlert('Save Failed', 'Could not save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="animate-spin text-brand-red mb-4" size={40} />
        <p className="text-gray-500 font-bold">Loading System Configurations...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Platform Settings</h1>
        <p className="text-sm text-gray-400 font-medium">Global configurations for Royal Travel Agency infrastructure</p>
      </div>

      <div className="flex space-x-2 border-b border-gray-100 mb-8 overflow-x-auto pb-px scrollbar-hide">
        {['general', 'seo', 'mobile', 'security', 'notifications', 'email'].map((tab) => (
          <button
            key={tab}
            className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
              ? 'border-b-2 border-brand-red text-brand-red'
              : 'text-gray-400 hover:text-gray-600'
              }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card className="border border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-8 py-6">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center justify-between">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-brand-red rounded-full mr-3"></span>
              {activeTab} Parameters
            </div>
            {saving && <Loader2 className="animate-spin text-brand-red" size={16} />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {activeTab === 'general' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Site Title</label>
                    <input
                      type="text"
                      name="siteTitle"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.siteTitle}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="md:col-span-2 p-6 bg-slate-50/50 rounded-3xl border border-slate-200 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                      <div className="p-2 bg-red-50 text-brand-red rounded-lg">
                        <ImageIcon size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Site Branding</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Configure the main identity for Web & Mobile platforms</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <ImageUpload
                        label="Platform Logo"
                        value={formData.logoUrl}
                        onChange={(url) => setFormData(prev => ({ ...prev, logoUrl: url }))}
                        folder="branding"
                        aspectRatio="aspect-auto min-h-[100px]"
                        placeholder="Upload logo (transparent PNG recommended)"
                      />

                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-brand-red mb-2">
                          <Ruler size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Logo Display Constraints</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Height (px)</label>
                            <input
                              type="text"
                              name="logoHeight"
                              placeholder="40"
                              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                              value={formData.logoHeight}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Width (px)</label>
                            <input
                              type="text"
                              name="logoWidth"
                              placeholder="auto"
                              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                              value={formData.logoWidth}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-400 font-medium leading-relaxed italic">
                          Recommended height: 35px - 50px. Use &quot;auto&quot; for width to maintain aspect ratio perfectly.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Contact Email</label>
                    <input
                      type="email"
                      name="contactEmail"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Contact Phone</label>
                    <input
                      type="text"
                      name="contactPhone"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.contactPhone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">WhatsApp 1</label>
                    <input
                      type="text"
                      name="whatsappNumber1"
                      placeholder="+230 5940 7711"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.whatsappNumber1}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">WhatsApp 2</label>
                    <input
                      type="text"
                      name="whatsappNumber2"
                      placeholder="+230 5940 7701"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.whatsappNumber2}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Working Hours</label>
                    <input
                      type="text"
                      name="workingHours"
                      placeholder="Mon - Fri: 08:30 - 17:00"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.workingHours}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-gray-900 text-sm italic uppercase tracking-widest">Popup Advertisements</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Enable or disable floating promotional popups</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="popupAdsActive"
                        className="sr-only peer"
                        checked={formData.popupAdsActive}
                        onChange={handleChange}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                    </label>
                  </div>
                </div>

                <div className="p-6 bg-red-50/30 rounded-2xl border border-red-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-gray-900 text-sm italic uppercase tracking-widest">Web Footer Visibility</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Hide or Show the footer on the main website</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="showFooterWeb"
                        className="sr-only peer"
                        checked={formData.showFooterWeb}
                        onChange={handleChange}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-red-100/50">
                    <div>
                      <h4 className="font-black text-gray-900 text-sm italic uppercase tracking-widest">Mobile Footer Visibility</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Hide or Show the footer on the iOS/Android app</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="showFooterMobile"
                        className="sr-only peer"
                        checked={formData.showFooterMobile}
                        onChange={handleChange}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-red-100/50">
                    <div>
                      <h4 className="font-black text-gray-900 text-sm italic uppercase tracking-widest">Main Search Bar Visibility</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Hide or Show the search bar on the homepage hero</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="showSearchBar"
                        className="sr-only peer"
                        checked={formData.showSearchBar}
                        onChange={handleChange}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-red-100/50">
                    <div>
                      <h4 className="font-black text-gray-900 text-sm italic uppercase tracking-widest">Global Search Bar Visibility</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Hide or Show the search bar on all other listing pages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="showSearchBarGlobal"
                        className="sr-only peer"
                        checked={formData.showSearchBarGlobal}
                        onChange={handleChange}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                    </label>
                  </div>

                  <div className="pt-6 border-t border-red-100/50">
                    <h4 className="font-black text-gray-900 text-sm italic uppercase tracking-widest text-brand-red">Experience Section Image</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 mb-4">Background image for the homepage inspiration section</p>
                    <input
                      type="text"
                      name="experienceSectionImage"
                      className="mt-2 block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-red focus:border-brand-red font-mono"
                      value={formData.experienceSectionImage}
                      onChange={handleChange}
                      placeholder="/assets/placeholders/hero-hotel.png"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Office 1 Title</label>
                    <input
                      type="text"
                      name="office1Title"
                      placeholder="Port Louis Office"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.office1Title}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Office 2 Title</label>
                    <input
                      type="text"
                      name="office2Title"
                      placeholder="Ebene Office"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.office2Title}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Office 1 Address</label>
                    <RichTextEditor
                      value={formData.office1Address}
                      onChange={(content) => setFormData(prev => ({ ...prev, office1Address: content }))}
                      placeholder="Enter office 1 address..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Office 1 Map Embed URL</label>
                    <input
                      type="text"
                      name="office1MapUrl"
                      placeholder="https://www.google.com/maps/embed?pb=..."
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.office1MapUrl}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Office 2 Address</label>
                    <RichTextEditor
                      value={formData.office2Address}
                      onChange={(content) => setFormData(prev => ({ ...prev, office2Address: content }))}
                      placeholder="Enter office 2 address..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Office 2 Map Embed URL</label>
                    <input
                      type="text"
                      name="office2MapUrl"
                      placeholder="https://www.google.com/maps/embed?pb=..."
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.office2MapUrl}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-4 border-t border-gray-50">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Facebook URL</label>
                    <input
                      type="text"
                      name="facebookUrl"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.facebookUrl}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Instagram URL</label>
                    <input
                      type="text"
                      name="instagramUrl"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.instagramUrl}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">LinkedIn URL</label>
                    <input
                      type="text"
                      name="linkedinUrl"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.linkedinUrl}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">TikTok URL</label>
                    <input
                      type="text"
                      name="tiktokUrl"
                      placeholder="https://www.tiktok.com/@..."
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.tiktokUrl}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-50">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Timezone</label>
                    <select
                      name="timezone"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900 appearance-none"
                      value={formData.timezone}
                      onChange={handleChange}
                    >
                      <option value="GMT-12:00">(GMT-12:00) International Date Line West</option>
                      <option value="GMT-11:00">(GMT-11:00) Midway Island, Samoa</option>
                      <option value="GMT-10:00">(GMT-10:00) Hawaii</option>
                      <option value="GMT-09:00">(GMT-09:00) Alaska</option>
                      <option value="GMT-08:00">(GMT-08:00) Pacific Time (US & Canada)</option>
                      <option value="GMT-07:00">(GMT-07:00) Arizona</option>
                      <option value="GMT-06:00">(GMT-06:00) Central America</option>
                      <option value="GMT-05:00">(GMT-05:00) Eastern Time (US & Canada)</option>
                      <option value="GMT+04:00">(GMT+04:00) Indian/Mauritius</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Local Currency</label>
                    <select
                      name="currency"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900 appearance-none"
                      value={formData.currency}
                      onChange={handleChange}
                    >
                      <option value="MUR">Mauritius Rupee (MUR)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Meta Title Tag</label>
                  <input
                    type="text"
                    name="seo.metaTitle"
                    placeholder="Royal Travel Agency - Your Premiere Holiday Provider"
                    className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                    value={formData.seo.metaTitle}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Meta Description</label>
                  <RichTextEditor
                    value={formData.seo.metaDescription}
                    onChange={(content) => setFormData(prev => ({
                      ...prev,
                      seo: { ...prev.seo, metaDescription: content }
                    }))}
                    placeholder="Brief description of your site for search engines..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Keywords (Comma separated)</label>
                  <input
                    type="text"
                    name="seo.metaKeywords"
                    placeholder="travel, mauritius, holidays, packages, tours"
                    className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                    value={formData.seo.metaKeywords}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">OG Image URL (Social Sharing)</label>
                  <input
                    type="text"
                    name="seo.ogImage"
                    placeholder="https://example.com/social-share.jpg"
                    className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                    value={formData.seo.ogImage}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {activeTab === 'mobile' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Support Phone</label>
                    <input
                      type="text"
                      name="mobile.supportPhone"
                      placeholder="+230 5940 7701"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.mobile.supportPhone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Support Email</label>
                    <input
                      type="email"
                      name="mobile.supportEmail"
                      placeholder="support@royaltravel.mu"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.mobile.supportEmail}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">App Version</label>
                    <input
                      type="text"
                      name="mobile.appVersion"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.mobile.appVersion}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Primary Brand Color</label>
                    <div className="flex gap-4">
                      <input
                        type="color"
                        name="mobile.primaryColor"
                        className="h-12 w-20 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 p-1 cursor-pointer"
                        value={formData.mobile.primaryColor}
                        onChange={handleChange}
                      />
                      <input
                        type="text"
                        name="mobile.primaryColor"
                        className="flex-grow px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                        value={formData.mobile.primaryColor}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div>
                    <h4 className="font-bold text-gray-900">Two-Factor Authentication</h4>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Add an extra layer of security to your account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="security.twoFactorAuth"
                      className="sr-only peer"
                      checked={formData.security.twoFactorAuth}
                      onChange={handleChange}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Password Expiry (days)</label>
                    <input
                      type="number"
                      name="security.passwordExpiry"
                      min="1"
                      max="365"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.security.passwordExpiry}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Session Timeout (min)</label>
                    <input
                      type="number"
                      name="security.sessionTimeout"
                      min="1"
                      max="480"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-brand-red transition-all font-bold text-gray-900"
                      value={formData.security.sessionTimeout}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                {[
                  { key: 'email', label: 'Email Notifications', desc: 'Receive system alerts via email' },
                  { key: 'sms', label: 'SMS Notifications', desc: 'Receive security alerts via SMS' },
                  { key: 'push', label: 'Push Notifications', desc: 'Receive browser notifications' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <div>
                      <h4 className="font-bold text-gray-900">{item.label}</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name={`notifications.${item.key}`}
                        className="sr-only peer"
                        checked={formData.notifications[item.key]}
                        onChange={handleChange}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                    </label>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-8">
                <div className="p-6 bg-blue-50/30 rounded-2xl border border-blue-100 space-y-6">
                  <div className="flex items-center gap-3 border-b border-blue-100 pb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Mail size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">SMTP Configuration</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Configure the outbound mail server for transactional emails</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">SMTP Host</label>
                      <input
                        type="text"
                        name="email.mailServerUrl"
                        placeholder="e.g. smtp.example.com"
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-gray-900"
                        value={formData.email.mailServerUrl}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">SMTP Port</label>
                      <input
                        type="text"
                        name="email.mailServerPort"
                        placeholder="465 or 587"
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-gray-900"
                        value={formData.email.mailServerPort}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">SMTP Username</label>
                      <input
                        type="text"
                        name="email.mailServerLogin"
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-gray-900"
                        value={formData.email.mailServerLogin}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">SMTP Password</label>
                      <input
                        type="password"
                        name="email.mailServerPass"
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-gray-900 font-mono"
                        value={formData.email.mailServerPass}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200 space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sender Identity</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">From Email</label>
                      <input
                        type="email"
                        name="email.mailFromEmail"
                        placeholder="noreply@royaltravel.mu"
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-gray-900"
                        value={formData.email.mailFromEmail}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">From Name</label>
                      <input
                        type="text"
                        name="email.mailFromName"
                        placeholder="Royal Travel Agency"
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-gray-900"
                        value={formData.email.mailFromName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium italic">
                    Note: These settings will override environment variables in the production mail system.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-6 flex justify-end items-center">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mr-6">Auto-syncing enabled</span>
              <Button
                type="submit"
                disabled={saving}
                className={`bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-gray-200 transition-all flex items-center ${saving ? 'opacity-70 pointer-events-none' : ''}`}
              >
                <Save size={16} className="mr-2" />
                {saving ? 'Saving...' : `Save ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}` }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
