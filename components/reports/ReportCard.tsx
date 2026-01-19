
import React, { useState, useMemo, useRef } from 'react';
import { ProcessedStudent, GlobalSettings, ClassStatistics } from '../../types';
import EditableField from '../shared/EditableField';

interface ReportCardProps {
  student: ProcessedStudent;
  stats: ClassStatistics;
  settings: GlobalSettings;
  onSettingChange: (key: keyof GlobalSettings, value: any) => void;
  onStudentUpdate?: (id: number, overallRemark: string) => void;
  classAverageAggregate: number;
  totalEnrolled?: number;
  isFacilitator?: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({ student, stats, settings, onSettingChange, onStudentUpdate, classAverageAggregate, totalEnrolled, isFacilitator }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const dynamicAnalysis = useMemo(() => {
    const strengths = student.subjects.filter(s => s.finalCompositeScore >= (stats.subjectMeans[s.subject] || 50) + 5).map(s => s.subject);
    const weaknesses = student.subjects.filter(s => s.finalCompositeScore < (stats.subjectMeans[s.subject] || 50)).map(s => ({ name: s.subject, mean: Math.round(stats.subjectMeans[s.subject]) }));
    
    const genderTerm = student.gender === 'M' ? 'male' : 'female';
    const regionalLocality = settings.schoolAddress.split(',')[0] || "this locality";

    const strengthText = strengths.length > 0 
        ? `Exhibits strong mastery in ${strengths.slice(0, 2).join(", ")}, performing significantly above the ${genderTerm} benchmark in ${regionalLocality}.` 
        : `Maintains a steady performance profile across core subjects within ${regionalLocality}.`;
    
    const weaknessText = weaknesses.length > 0
        ? `Remedial intervention in ${weaknesses.slice(0, 1).map(w => w.name).join("")} is advised to match the regional cohort average of ${weaknesses[0].mean}%.`
        : `Academic output is highly competitive within the regional perimeter.`;

    return { 
      performance: `${strengthText} ${weaknessText}`, 
      recommendation: student.bestSixAggregate <= 15 ? "Outstanding result. Continue consistent study habits." : "Needs more intensive focus on theoretical applications." 
    };
  }, [student, stats, settings.schoolAddress]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onSettingChange('schoolLogo', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSharePDF = async () => {
    setIsGenerating(true);
    const reportId = `report-${student.id}`;
    const originalElement = document.getElementById(reportId);
    if (!originalElement) return setIsGenerating(false);
    
    // @ts-ignore
    const opt = { 
      margin: 0, 
      filename: `${student.name.replace(/\s+/g, '_')}_Report.pdf`, 
      image: { type: 'jpeg', quality: 0.98 }, 
      html2canvas: { scale: 2 }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };
    try {
        // @ts-ignore
        await window.html2pdf().set(opt).from(originalElement).save();
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  const LogoArea = ({ className = "w-20 h-20" }: { className?: string }) => (
    <div 
      className={`${className} relative group cursor-pointer border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center overflow-hidden bg-gray-50 hover:bg-blue-50 transition-all no-print`}
      onClick={() => logoInputRef.current?.click()}
    >
      {settings.schoolLogo ? (
        <img src={settings.schoolLogo} alt="Logo" className="w-full h-full object-contain" />
      ) : (
        <div className="flex flex-col items-center gap-1">
          <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 0 1 12.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" /></svg>
          <span className="text-[7px] font-black text-gray-300 uppercase">Logo</span>
        </div>
      )}
      <div className="hidden print:block absolute inset-0">
        {settings.schoolLogo && <img src={settings.schoolLogo} alt="Logo" className="w-full h-full object-contain" />}
      </div>
    </div>
  );

  return (
    <div id={`report-${student.id}`} className="bg-white p-10 max-w-[210mm] mx-auto min-h-[296mm] border border-gray-200 shadow-2xl print:shadow-none print:border-none page-break relative flex flex-col box-border font-sans">
       <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
       
       <div data-html2canvas-ignore="true" className="absolute top-4 -right-16 flex flex-col gap-4 no-print z-50">
          <button onClick={handleSharePDF} disabled={isGenerating} className={`${isGenerating ? 'bg-gray-400' : 'bg-blue-900 hover:bg-black'} text-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all transform hover:scale-110`}>
            {isGenerating ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>}
          </button>
       </div>

       {/* Professional Academy Header */}
       <div className="relative border-b-[6px] border-double border-blue-900 pb-4 mb-6 text-center">
          <div className="absolute top-0 left-0"><LogoArea className="w-20 h-20" /></div>
          <h1 className="text-4xl font-black text-blue-950 tracking-tighter uppercase mb-1 leading-none">
            <EditableField value={settings.schoolName} onChange={(v) => onSettingChange('schoolName', v)} className="text-center font-black w-full" />
          </h1>
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">
            <EditableField value={settings.schoolAddress || "ACADEMY ADDRESS, REGION"} onChange={(v) => onSettingChange('schoolAddress', v)} className="text-center w-full" />
          </div>
          <div className="mb-3">
             <span className="text-[9px] font-black text-blue-900 border border-blue-900/20 px-5 py-0.5 rounded-full uppercase tracking-[0.4em] bg-blue-50/50">
               HUB ID: <EditableField value={settings.schoolNumber || "UBA-2025-XXX"} onChange={(v) => onSettingChange('schoolNumber', v)} className="inline-block" />
             </span>
          </div>
          <h2 className="text-xl font-black text-red-700 uppercase leading-tight bg-red-50 py-2 border-y border-red-100 mb-3">
            <EditableField value={settings.examTitle} onChange={(v) => onSettingChange('examTitle', v)} className="text-center w-full" />
          </h2>
          <div className="flex justify-center gap-8 text-[11px] font-black text-gray-800 uppercase tracking-widest">
             <span className="bg-blue-900 text-white px-4 py-0.5 rounded shadow-sm">{settings.termInfo}</span>
             <span className="border-x border-gray-300 px-6 italic">AY: {settings.academicYear}</span>
             <span className="font-mono text-blue-900">DATE: {new Date().toLocaleDateString()}</span>
          </div>
       </div>

       {/* Pupil Particulars */}
       <div className="grid grid-cols-2 gap-6 mb-6 border-2 border-blue-950 p-4 rounded-3xl bg-blue-50/10 text-[12px] font-bold">
          <div className="space-y-2 border-r border-blue-100 pr-4">
            <div className="flex items-center"><span className="text-gray-400 w-28 uppercase text-[10px]">Pupil:</span><span className="flex-1 uppercase font-black text-blue-950 truncate">{student.name}</span></div>
            <div className="flex items-center"><span className="text-gray-400 w-28 uppercase text-[10px]">Index:</span><span className="flex-1 font-mono text-blue-800">{student.id.toString().padStart(6, '0')}</span></div>
            <div className="flex items-center"><span className="text-gray-400 w-28 uppercase text-[10px]">Sex:</span><span className="font-black text-blue-900">{student.gender === 'M' ? 'MALE' : 'FEMALE'}</span></div>
          </div>
          <div className="space-y-2 pl-2">
            <div className="flex items-center justify-between"><span className="text-gray-400 uppercase text-[10px]">Best 6 Aggregate:</span><span className="text-3xl font-black text-blue-950 leading-none">{student.bestSixAggregate}</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-400 uppercase text-[10px]">Position:</span><span className="font-black text-blue-900">{student.rank} OF {totalEnrolled || '---'}</span></div>
          </div>
       </div>

       {/* Performance Matrix */}
       <div className="mb-6 flex-1">
         <table className="w-full text-[11px] border-collapse border-2 border-blue-950">
            <thead className="bg-blue-950 text-white uppercase text-[8px] tracking-[0.2em]">
              <tr>
                <th className="py-3 px-4 text-left">Academic Discipline</th>
                <th className="py-3 px-1 text-center">Obj</th>
                <th className="py-3 px-1 text-center">Thy</th>
                <th className="py-3 px-1 text-center">SBA</th>
                <th className="py-3 px-1 text-center bg-blue-900">Total</th>
                <th className="py-3 px-1 text-center">Grd</th>
                <th className="py-3 px-3 text-left">Facilitator</th>
              </tr>
            </thead>
            <tbody>
               {student.subjects.map(sub => (
                 <tr key={sub.subject} className="even:bg-gray-50/50 border-b border-gray-100 font-bold">
                   <td className="px-4 py-2.5 text-blue-950 uppercase truncate">{sub.subject}</td>
                   <td className="py-2.5 text-center font-mono">{sub.sectionA ?? '-'}</td>
                   <td className="py-2.5 text-center font-mono">{sub.sectionB ?? '-'}</td>
                   <td className="py-2.5 text-center font-mono">{Math.round(sub.sbaScore)}</td>
                   <td className="py-2.5 text-center font-black text-sm bg-blue-50/50 text-blue-900">{Math.round(sub.finalCompositeScore)}</td>
                   <td className={`py-2.5 text-center font-black text-sm ${sub.gradeValue >= 7 ? 'text-red-700' : 'text-blue-950'}`}>{sub.grade}</td>
                   <td className="px-3 py-2.5 text-[9px] font-black text-blue-800 uppercase truncate italic opacity-60">{sub.facilitator}</td>
                 </tr>
               ))}
            </tbody>
         </table>
       </div>

       {/* Regional Remarks Analytics */}
       <div className="grid grid-cols-1 gap-3 mb-6 text-[11px]">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-sm">
             <span className="font-black text-blue-900 uppercase block text-[9px] mb-2 tracking-widest">Regional Locality Analysis:</span>
             <p className="italic text-gray-700 leading-relaxed font-bold">"{dynamicAnalysis.performance}"</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100"><span className="font-black text-blue-900 uppercase block text-[9px] mb-2 tracking-widest">Conduct & Character:</span><p className="font-black text-blue-800 uppercase italic">"{student.conductRemark || 'EXEMPLARY CHARACTER OBSERVED.'}"</p></div>
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100"><span className="font-black text-indigo-900 uppercase block text-[9px] mb-2 tracking-widest">Mastery Guidance:</span><div className="text-indigo-950 font-black italic"><EditableField value={student.overallRemark} onChange={(v) => onStudentUpdate?.(student.id, v)} multiline={true} placeholder={dynamicAnalysis.recommendation} className="w-full border-none" /></div></div>
          </div>
       </div>

       {/* NRT Logic Appendix - VISIBLE TO ALL ROLES */}
       <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="bg-gray-900 text-white p-4 rounded-xl space-y-2">
             <div className="flex justify-between items-center">
                <h5 className="text-[8px] font-black uppercase tracking-[0.2em]">Norm-Referenced Grading Appendix (NRT)</h5>
                <span className="text-[7px] font-bold opacity-40 uppercase">Distribution: {settings.useTDistribution ? 'T-Dist' : 'Normal Z'}</span>
             </div>
             <p className="text-[7px] leading-relaxed opacity-70">
                Grades are calculated relative to the cohort mean (<strong>μ</strong>) and standard deviation (<strong>σ</strong>). 
                An <strong>A1</strong> indicates performance significantly above the class average, while <strong>C-grades</strong> represent the Credit/Proficient zone. 
                BSA (Best Six Aggregate) is calculated using 4 Core + 2 best Electives. Lower aggregate = Higher distinction.
             </p>
          </div>
       </div>

       {/* Signatures & Resumption */}
       <div className="flex justify-between items-end mt-auto pb-6 pt-10 border-t border-gray-100">
         <div className="w-[30%] text-center border-t-2 border-gray-900 pt-2 text-[9px] font-black uppercase text-gray-500 tracking-widest">Academy Director</div>
         <div className="w-[30%] text-center border-t-2 border-gray-900 pt-2">
            <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-1">Resumption Protocol</p>
            <p className="text-[10px] font-black text-red-700 font-mono">{new Date(settings.nextTermBegin).toLocaleDateString(undefined, { dateStyle: 'long' }).toUpperCase()}</p>
         </div>
       </div>
    </div>
  );
};

export default ReportCard;
