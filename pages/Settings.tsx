
import React from 'react';
import { BusinessProfile } from '../types';

interface SettingsProps {
  profile: BusinessProfile;
  settings: {
    showFab: boolean;
    soundEnabled: boolean;
    hoverBotApps?: {
      whatsapp: boolean;
      instagram: boolean;
      facebook: boolean;
      tiktok: boolean;
    }
  };
  onUpdateProfile: (profile: BusinessProfile) => void;
  onUpdateSettings: (settings: any) => void;
  onRequestOverlayPermission: () => void;
  onRequestAccessibilityPermission: () => void;
  permissionStatus: { overlay: boolean; accessibility: boolean };
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({
  profile,
  settings,
  onUpdateProfile,
  onUpdateSettings,
  onRequestOverlayPermission,
  onRequestAccessibilityPermission,
  permissionStatus,
  onLogout
}) => {
  const updateHoverApp = (app: string, value: boolean) => {
    onUpdateSettings({
      ...settings,
      hoverBotApps: {
        ...(settings.hoverBotApps || { whatsapp: true, instagram: true, facebook: true, tiktok: true }),
        [app]: value
      }
    });
  };

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

      {/* HoverBot Integration Section */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
          <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">HoverBot (AI Overlay)</h3>
        </div>

        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          The AI bubble allows you to capture orders from other apps. Both permissions are required for it to function correctly:
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${permissionStatus.overlay ? 'bg-teal-100 text-teal-600' : 'bg-amber-100 text-amber-600'}`}>
                <i className={`fa-solid ${permissionStatus.overlay ? 'fa-check' : 'fa-lock'}`}></i>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Overlay Permission</p>
                <p className="text-[10px] text-slate-400 font-medium">Allows bubble to float over apps</p>
              </div>
            </div>
            {!permissionStatus.overlay && (
              <button
                onClick={onRequestOverlayPermission}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors"
              >
                Grant
              </button>
            )}
            {permissionStatus.overlay && (
              <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Active</span>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${permissionStatus.accessibility ? 'bg-teal-100 text-teal-600' : 'bg-amber-100 text-amber-600'}`}>
                <i className={`fa-solid ${permissionStatus.accessibility ? 'fa-check' : 'fa-magnifying-glass'}`}></i>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Screen Reading</p>
                <p className="text-[10px] text-slate-400 font-medium">Extracts text from active screens</p>
              </div>
            </div>
            {!permissionStatus.accessibility && (
              <button
                onClick={onRequestAccessibilityPermission}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors"
              >
                Enable
              </button>
            )}
            {permissionStatus.accessibility && (
              <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Active</span>
            )}
          </div>
        </div>

        <div className="pt-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Trigger Apps</label>
          <div className="grid grid-cols-2 gap-3">
            <AppToggle
              name="WhatsApp"
              icon="fa-whatsapp"
              active={settings.hoverBotApps?.whatsapp ?? true}
              onToggle={(v) => updateHoverApp('whatsapp', v)}
            />
            <AppToggle
              name="Instagram"
              icon="fa-instagram"
              active={settings.hoverBotApps?.instagram ?? true}
              onToggle={(v) => updateHoverApp('instagram', v)}
            />
            <AppToggle
              name="Facebook"
              icon="fa-facebook"
              active={settings.hoverBotApps?.facebook ?? true}
              onToggle={(v) => updateHoverApp('facebook', v)}
            />
            <AppToggle
              name="TikTok"
              icon="fa-tiktok"
              active={settings.hoverBotApps?.tiktok ?? true}
              onToggle={(v) => updateHoverApp('tiktok', v)}
            />
          </div>
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

const AppToggle = ({ name, icon, active, onToggle }: { name: string, icon: string, active: boolean, onToggle: (v: boolean) => void }) => (
  <button
    onClick={() => onToggle(!active)}
    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${active ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm shadow-teal-100' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'}`}
  >
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${active ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
      <i className={`fa-brands ${icon}`}></i>
    </div>
    <div className="text-left">
      <p className="text-[11px] font-black uppercase tracking-tight">{name}</p>
      <p className="text-[8px] font-bold opacity-70 uppercase tracking-widest">{active ? 'On' : 'Off'}</p>
    </div>
  </button>
);

export default Settings;
