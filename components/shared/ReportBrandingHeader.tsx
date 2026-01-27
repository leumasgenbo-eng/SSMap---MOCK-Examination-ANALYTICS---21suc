import React from 'react';
import { GlobalSettings } from '../../types';
import EditableField from './EditableField';

interface ReportBrandingHeaderProps {
  settings: GlobalSettings;
  onSettingChange: (key: keyof GlobalSettings, value: any) => void;
  reportTitle: string;
  subtitle?: string;
  isLandscape?: boolean;
}

const ReportBrandingHeader: React.FC<ReportBrandingHeaderProps> = ({ settings, onSettingChange, reportTitle, subtitle, isLandscape = false }) => {
  return (
    <div className={`text-center relative border-b-[8px] border-double border-blue-900 pb-8 mb-8 w-full ${isLandscape ? 'px-6' : 'px-4'}`}>
      {/* Academy Logo */}
      {settings.schoolLogo && (
        <div className="absolute top-0 left-0 w-24 h-24 print:w-20 print:h-20 flex items-center justify-center">
          <img src={settings.schoolLogo} alt="Academy Logo" className="max-w-full max-h-full object-contain" />
        </div>
      )}
      
      {/* Sync Status - No Print */}
      <div className="absolute top-0 right-0 no-print flex items-center gap-3 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100 shadow-sm">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">NETWORK HUB: {settings.schoolNumber || "LOCAL_MODE"}</span>
      </div>

      <div className="space-y-2">
        {/* Editable Academy Name */}
        <h1 className={`${isLandscape ? 'text-5xl' : 'text-4xl'} font-black text-blue-950 tracking-tighter uppercase leading-tight`}>
          <EditableField 
            value={settings.schoolName} 
            onChange={(v) => onSettingChange('schoolName', v)} 
            className="text-center font-black w-full"
            placeholder="OFFICIAL ACADEMY NAME"
          />
        </h1>

        {/* Editable Address */}
        <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em] leading-relaxed">
          <EditableField 
            value={settings.schoolAddress} 
            onChange={(v) => onSettingChange('schoolAddress', v)} 
            className="text-center w-full"
            placeholder="LOCALITY / POSTAL ADDRESS"
          />
        </p>

        {/* Contact Particulars - All Editable */}
        <div className="flex justify-center items-center gap-6 text-[10px] font-black text-blue-800 uppercase tracking-widest mt-1">
          <div className="flex items-center gap-1.5">
            <span>TEL:</span>
            <EditableField value={settings.schoolContact} onChange={(v) => onSettingChange('schoolContact', v)} placeholder="PHONE CONTACT..." />
          </div>
          <div className="w-1.5 h-1.5 bg-blue-100 rounded-full"></div>
          <div className="flex items-center gap-1.5">
            <span>EMAIL:</span>
            <EditableField value={settings.schoolEmail} onChange={(v) => onSettingChange('schoolEmail', v)} placeholder="OFFICIAL EMAIL..." className="lowercase" />
          </div>
        </div>

        {/* Secondary Report Title - Editable (e.g. 2ND MOCK 2025) */}
        <div className="mt-6 bg-red-50 py-3.5 border-y border-red-100 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-y-0 left-0 w-1 bg-red-600"></div>
          <div className="absolute inset-y-0 right-0 w-1 bg-red-600"></div>
          <h2 className="text-2xl font-black text-red-700 uppercase tracking-tight">
            <EditableField value={settings.examTitle} onChange={(v) => onSettingChange('examTitle', v)} className="text-center w-full" />
          </h2>
          {subtitle && (
            <p className="text-[10px] font-black text-red-900 tracking-[0.5em] uppercase mt-2 opacity-80">
              {subtitle}
            </p>
          )}
        </div>

        {/* Academic Context Ledger */}
        <div className="flex justify-center items-center gap-10 text-[12px] font-black text-gray-800 uppercase tracking-widest mt-6">
          <div className="flex items-center gap-3">
            <span className="bg-blue-900 text-white px-5 py-1 rounded shadow-lg">{settings.termInfo}</span>
          </div>
          <div className="flex items-center gap-2 border-x border-gray-200 px-8">
             <span className="text-[9px] text-gray-400 uppercase">Series ID:</span>
             <span>{settings.activeMock}</span>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-[9px] text-gray-400 uppercase">Year:</span>
             <span className="italic">{settings.academicYear}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBrandingHeader;