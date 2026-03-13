
import React from 'react';
import { BusinessProfile } from '../types';

interface SettingsProps {
  profile: BusinessProfile;
  settings: {
    showFab: boolean;
    soundEnabled: boolean;
  };
  onUpdateProfile: (profile: BusinessProfile) => void;
  onUpdateSettings: (settings: any) => void;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({
  profile,
  settings,
  onUpdateProfile,
  onUpdateSettings,
  onLogout
}) => {
  return (
    <div className="p-6 space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tighter">Settings</h2>
        <button onClick={onLogout} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-black uppercase border border-red-100 hover:bg-red-100 transition-colors">
          Logout
        </button>
      </div>

      {/* Business Profile Section */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <i className="fa-solid fa-store"></i>
          </div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Profile</h3>
        </div>

        <SettingField label="Business Name" value={profile.name} onChange={v => onUpdateProfile({ ...profile, name: v })} />
        <SettingField label="Phone Number" value={profile.phone} onChange={v => onUpdateProfile({ ...profile, phone: v })} />
        <SettingField label="Email Address" value={profile.email} onChange={v => onUpdateProfile({ ...profile, email: v })} />

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Currency</label>
          <select
            value={profile.currency}
            onChange={e => onUpdateProfile({ ...profile, currency: e.target.value })}
            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm outline-none font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="NGN">NGN (₦)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
      </div>

      <div className="text-center space-y-2 pt-4 opacity-50">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Bookly Mobile v2.1</p>
      </div>
    </div>
  );
};

const SettingField = ({ label, value, onChange, type = "text" }: { label: string, value: string, onChange: (v: string) => void, type?: string }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm outline-none font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" />
  </div>
);

const ToggleField = ({ label, desc, active, onToggle }: { label: string, desc: string, active: boolean, onToggle: () => void }) => (
  <div className="flex justify-between items-center py-1">
    <div>
      <p className="text-sm font-bold text-slate-900">{label}</p>
      <p className="text-[10px] text-slate-400 font-medium">{desc}</p>
    </div>
    <button
      onClick={onToggle}
      className={`w-12 h-7 rounded-full transition-colors relative ${active ? 'bg-indigo-600' : 'bg-slate-200'}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${active ? 'left-6' : 'left-1'}`}></div>
    </button>
  </div>
);

export default Settings;
