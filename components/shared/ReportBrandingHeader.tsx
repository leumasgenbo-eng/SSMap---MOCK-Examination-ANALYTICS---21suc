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
    <div className={`text-center relative border-b-[6px] border-double border-blue-900 pb-6 mb-8 w-full ${isLandscape ? 'px-4' : 'px-2'}`}>
      {/* Academy Logo */}
      {settings.schoolLogo && (
        <div className="absolute top-0 left-0 w-20 h-20 print:w-16 print:h-16 no-print">
          <img src={settings.schoolLogo} alt="Logo" className="w-full h-full object-contain" />
        </div>
      )}
      
      {/* Sync Status - No Print */}
      <div className="absolute top-0 right-0 no-print flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
        <span className="text-[8px] font-black text-blue-900 uppercase tracking-widest">Hub Node: {settings.schoolNumber}</span>
      </div>

      <div className="space-y-1">
        {/* Editable Academy Name */}
        <h1 className={`${isLandscape ? 'text-4xl' : 'text-3xl'} font-black text-blue-950 tracking-tighter uppercase leading-none`}>
          <EditableField 
            value={settings.schoolName} 
            onChange={(v) => onSettingChange('schoolName', v)} 
            className="text-center font-black w-full"
            placeholder="ACADEMY NAME"
          />
        </h1>

        {/* Editable Address */}
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">
          <EditableField 
            value={settings.schoolAddress} 
            onChange={(v) => onSettingChange('schoolAddress', v)} 
            className="text-center w-full"
            placeholder="LOCALITY / ADDRESS"
          />
        </p>

        {/* Identity & Registry Badge */}
        <div className="pt-2 flex justify-center items-center gap-4">
          <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-5 py-1 rounded-full border border-blue-100 uppercase tracking-[0.3em]">
            INSTITUTIONAL HUB ID: <EditableField value={settings.schoolNumber} onChange={(v) => onSettingChange('schoolNumber', v)} className="inline-block" />
          </span>
        </div>

        {/* Secondary Report Title */}
        <div className="mt-4 bg-red-50 py-2.5 border-y border-red-100 shadow-sm">
          <h2 className="text-xl font-black text-red-700 uppercase tracking-tight">
            <EditableField value={settings.examTitle} onChange={(v) => onSettingChange('examTitle', v)} className="text-center w-full" />
          </h2>
          {subtitle && (
            <p className="text-[9px] font-black text-red-900 tracking-[0.5em] uppercase mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Academic Context Ledger */}
        <div className="flex justify-center gap-8 text-[11px] font-black text-gray-800 uppercase tracking-widest mt-4">
          <div className="flex items-center gap-2">
            <span className="bg-blue-900 text-white px-4 py-0.5 rounded shadow-sm">{settings.termInfo}</span>
          </div>
          <span className="border-x border-gray-200 px-6">SERIES: {settings.activeMock}</span>
          <span className="italic opacity-60">ACADEMIC YEAR: {settings.academicYear}</span>
        </div>
      </div>
    </div>
  );
};

export default ReportBrandingHeader;
