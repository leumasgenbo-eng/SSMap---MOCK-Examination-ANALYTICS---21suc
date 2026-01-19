
import React, { useRef } from 'react';
import { GlobalSettings } from '../../types';

interface AcademyIdentityPortalProps {
  settings: GlobalSettings;
  onSettingChange: (key: keyof GlobalSettings, value: any) => void;
  onSave: () => void;
}

const AcademyIdentityPortal: React.FC<AcademyIdentityPortalProps> = ({ settings, onSettingChange, onSave }) => {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onSettingChange('schoolLogo', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const fields = [
    { label: 'Academy Name', key: 'schoolName', val: settings.schoolName },
    { label: 'Report Header Title', key: 'examTitle', val: settings.examTitle },
    { label: 'Telephone Contact', key: 'schoolContact', val: settings.schoolContact },
    { label: 'Email Address', key: 'schoolEmail', val: settings.schoolEmail },
    { label: 'Academic Year', key: 'academicYear', val: settings.academicYear },
    { label: 'Term/Mock Info', key: 'termInfo', val: settings.termInfo },
    { label: 'Head Teacher Name', key: 'headTeacherName', val: settings.headTeacherName },
    { label: 'Next Term Resumption', key: 'nextTermBegin', val: settings.nextTermBegin }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-inner">
        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Academy Branding
        </h4>
        <div className="flex flex-col items-center gap-6">
          <div className="w-32 h-32 bg-white rounded-2xl border border-gray-200 flex items-center justify-center overflow-hidden shadow-xl p-3 relative group">
            {settings.schoolLogo ? (
              <>
                <img src={settings.schoolLogo} alt="Logo" className="w-full h-full object-contain" />
                <button onClick={() => onSettingChange('schoolLogo', '')} className="absolute inset-0 bg-black/50 text-white font-black text-[8px] uppercase opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
              </>
            ) : <span className="text-[8px] font-black text-gray-300 uppercase">No Logo</span>}
          </div>
          <button onClick={() => logoInputRef.current?.click()} className="bg-blue-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all">Upload New Logo</button>
          <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 bg-white p-5 sm:p-8 rounded-2xl border border-gray-100 shadow-xl">
        {fields.map(field => (
          <div key={field.key} className="flex flex-col space-y-1 border-b border-gray-50 pb-2">
            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{field.label}</label>
            <input 
              type="text" 
              value={field.val as string} 
              onChange={(e) => onSettingChange(field.key as any, e.target.value.toUpperCase())} 
              className="focus:border-blue-600 outline-none text-sm font-black text-blue-900 py-1 transition-all uppercase bg-transparent" 
            />
          </div>
        ))}
      </section>

      <div className="pt-4 flex justify-center">
        <button onClick={onSave} className="w-full sm:w-auto bg-yellow-500 text-blue-900 px-12 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-yellow-600 active:scale-95 transition-all">Save Institutional Profile</button>
      </div>
    </div>
  );
};

export default AcademyIdentityPortal;
