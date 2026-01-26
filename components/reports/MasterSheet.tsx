import React, { useState } from 'react';
import { ProcessedStudent, ClassStatistics, GlobalSettings, StaffAssignment } from '../../types';
import EditableField from '../shared/EditableField';
import CompositeSheet from './CompositeSheet';
import SupplementarySheet from './SupplementarySheet';
import InstitutionalAnalytics from './InstitutionalAnalytics';

interface MasterSheetProps {
  students: ProcessedStudent[];
  stats: ClassStatistics;
  settings: GlobalSettings;
  onSettingChange: (key: keyof GlobalSettings, value: any) => void;
  facilitators: Record<string, StaffAssignment>;
  isFacilitator?: boolean;
}

const MOCK_SERIES = Array.from({ length: 10 }, (_, i) => `MOCK ${i + 1}`);

const MasterSheet: React.FC<MasterSheetProps> = ({ students, stats, settings, onSettingChange, facilitators, isFacilitator }) => {
  const [sheetView, setSheetView] = useState<'composite' | 'sectionA' | 'sectionB' | 'analytics'>('composite');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    const element = document.getElementById('broadsheet-export-container');
    if (!element) return setIsGenerating(false);

    const opt = {
      margin: 5,
      filename: `${settings.schoolName.replace(/\s+/g, '_')}_${settings.activeMock}_BroadSheet.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' }
    };

    try {
      // @ts-ignore
      await window.html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error("PDF Generation Error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareStats = () => {
    const topStudent = students[0];
    const classMean = (Object.values(stats.subjectMeans) as number[]).reduce((a, b) => a + b, 0) / (Object.keys(stats.subjectMeans).length || 1);
    
    const message = `*${settings.schoolName} - OFFICIAL BROAD SHEET SUMMARY*\n` +
                    `*Assessment:* ${settings.activeMock}\n` +
                    `----------------------------------\n` +
                    `• *Cohort Size:* ${students.length} Pupils\n` +
                    `• *Cohort Mean:* ${classMean.toFixed(1)}%\n` +
                    `• *Top Performing Pupil:* ${topStudent?.name || 'N/A'} (Agg: ${topStudent?.bestSixAggregate || 'N/A'})\n` +
                    `----------------------------------\n` +
                    `_Full Broad Sheet available in Academy Hub_`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="bg-white p-4 print:p-0 min-h-screen max-w-[420mm] mx-auto overflow-hidden print:overflow-visible print:max-w-none">
      
      {/* Navigation & Controls */}
      <div className="no-print mb-8 space-y-4">
        <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 border-r pr-4 border-gray-200">
              Broad Sheet Controller
            </h3>
            <div className="flex gap-2">
               <button onClick={() => setSheetView('composite')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sheetView === 'composite' ? 'bg-blue-900 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>NRT Composite</button>
               <button onClick={() => setSheetView('sectionA')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sheetView === 'sectionA' ? 'bg-indigo-900 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>Section A (Obj)</button>
               <button onClick={() => setSheetView('sectionB')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sheetView === 'sectionB' ? 'bg-purple-900 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>Section B (Theory)</button>
               <button onClick={() => setSheetView('analytics')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sheetView === 'analytics' ? 'bg-emerald-700 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>Institutional Analytics</button>
            </div>
          </div>
          
          <div className="flex gap-3">
             <button 
               onClick={handleShareStats}
               className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2 transition-all active:scale-95"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L21 3.5Z"></path></svg>
               Share Summary
             </button>
             <button 
               onClick={handleDownloadPDF}
               disabled={isGenerating}
               className={`${isGenerating ? 'bg-gray-400' : 'bg-red-700 hover:bg-black'} text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2 transition-all active:scale-95`}
             >
               {isGenerating ? (
                 <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
               ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
               )}
               {isGenerating ? 'Processing...' : 'Download PDF'}
             </button>
             <button 
               onClick={() => window.print()}
               className="bg-blue-950 hover:bg-black text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2 transition-all active:scale-95"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
               Print
             </button>
          </div>
        </div>

        <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200">
           {MOCK_SERIES.map(mock => (
             <button key={mock} onClick={() => onSettingChange('activeMock', mock)} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${settings.activeMock === mock ? 'bg-blue-900 text-white shadow-md' : 'bg-white text-blue-900 hover:bg-blue-50'}`}>
               {mock.split(' ')[1]}
             </button>
           ))}
        </div>
      </div>

      <div id="broadsheet-export-container">
        {/* Global Academy Header - EDITABLE PARTICULARS */}
        <div className="text-center mb-10 relative">
          <h1 className="text-4xl font-black uppercase text-blue-950 tracking-tighter">
            <EditableField value={settings.schoolName} onChange={(v) => onSettingChange('schoolName', v)} className="text-center w-full" />
          </h1>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            <EditableField value={settings.schoolAddress || "UNITED BAYLOR ACADEMY ADDRESS"} onChange={(v) => onSettingChange('schoolAddress', v)} className="text-center w-full" />
          </p>
          <div className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 inline-block mb-3 uppercase tracking-widest">
             INSTITUTIONAL HUB ID: <EditableField value={settings.schoolNumber || "UBA-2025-XXX"} onChange={(v) => onSettingChange('schoolNumber', v)} className="inline-block" />
          </div>
          <h2 className="text-lg font-black uppercase text-red-700 tracking-tight bg-red-50 py-1 border-y border-red-100 mb-4">
             <EditableField value={settings.examTitle} onChange={(v) => onSettingChange('examTitle', v)} className="text-center w-full" />
          </h2>
          <div className="flex items-center justify-center gap-4 text-[11px] font-black text-gray-800 uppercase tracking-widest">
             <span className="bg-blue-900 text-white px-4 py-0.5 rounded shadow-sm">{settings.activeMock}</span>
             <span>Assessment Period: {settings.academicYear}</span>
             <span className="italic opacity-40 lowercase print:hidden">| format: landscape optimized</span>
          </div>
        </div>

        {/* Dynamic Content Rendering */}
        <div className="min-h-[400px]">
          {sheetView === 'composite' && (
            <CompositeSheet 
              students={students} 
              stats={stats} 
              settings={settings} 
              facilitators={facilitators} 
              isFacilitator={isFacilitator}
            />
          )}
          {sheetView === 'sectionA' && (
            <SupplementarySheet 
              students={students} 
              stats={stats} 
              settings={settings} 
              section="sectionA" 
            />
          )}
          {sheetView === 'sectionB' && (
            <SupplementarySheet 
              students={students} 
              stats={stats} 
              settings={settings} 
              section="sectionB" 
            />
          )}
          {sheetView === 'analytics' && (
            <InstitutionalAnalytics 
              students={students} 
              stats={stats} 
              settings={settings} 
              facilitators={facilitators} 
              onSettingChange={onSettingChange}
            />
          )}
        </div>

        {/* Validation Footer */}
        <div className="flex justify-between items-end pt-12 pb-4 border-t-2 border-blue-900 mt-12 page-break-inside-avoid">
           <div className="flex flex-col items-center">
              <div className="w-48 border-t-2 border-gray-900 text-center font-black uppercase text-[10px] pt-2">Examination Registry</div>
              <p className="text-[8px] text-gray-400 mt-1 uppercase italic">Verified Data Snapshot</p>
           </div>
           <div className="flex flex-col items-center">
              <div className="w-48 border-t-2 border-gray-900 text-center font-black uppercase text-[10px] pt-2">
                 <EditableField value={settings.headTeacherName} onChange={(v) => onSettingChange('headTeacherName', v)} className="text-center" />
              </div>
              <p className="text-[8px] text-gray-400 mt-1 uppercase italic">Academy Director's Seal</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MasterSheet;