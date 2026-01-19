import React, { useState, useMemo } from 'react';
import { StudentData, GlobalSettings, MockSeriesRecord, ExamSubScore, StaffAssignment } from '../../types';
import EditableField from '../shared/EditableField';

interface RewardPortalProps {
  students: StudentData[];
  setStudents: React.Dispatch<React.SetStateAction<StudentData[]>>;
  settings: GlobalSettings;
  subjects: string[];
  facilitators: Record<string, StaffAssignment>;
  onSave: () => void;
  isFacilitator?: boolean;
}

const RewardPortal: React.FC<RewardPortalProps> = ({ students, setStudents, settings, subjects, facilitators, onSave, isFacilitator }) => {
  const [view, setView] = useState<'mock-postmortem' | 'bece-entry' | 'bece-analysis' | 'facilitator-merit' | 'annual-report'>('mock-postmortem');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isPrinting, setIsPrinting] = useState(false);

  const mockNames = settings.committedMocks || [];

  // --- Logic: Facilitator Multiplier Reward Calculation ---
  const facilitatorRewards = useMemo(() => {
    return subjects.map(subject => {
      const staff = facilitators[subject];
      if (!staff || !staff.name) return null;

      const pupilsWithData = students.filter(s => s.mockData?.[settings.activeMock]?.scores[subject] !== undefined);
      if (pupilsWithData.length === 0) return null;

      const prevMockName = mockNames[mockNames.indexOf(settings.activeMock) - 1];
      const prevPupils = prevMockName ? students.filter(s => s.mockData?.[prevMockName]?.scores[subject] !== undefined) : [];

      const currentMeanScore = pupilsWithData.reduce((acc, s) => acc + (s.mockData?.[settings.activeMock]?.scores[subject] || 0), 0) / pupilsWithData.length;
      const avgGradeFactor = Math.max(1, 10 - (currentMeanScore / 10)); 

      const prevMeanScore = prevPupils.length > 0 
        ? prevPupils.reduce((acc, s) => acc + (s.mockData?.[prevMockName]?.scores[subject] || 0), 0) / prevPupils.length 
        : currentMeanScore;
      const subGrowthRate = prevMeanScore > 0 ? currentMeanScore / prevMeanScore : 1.0;

      const currObjMean = pupilsWithData.reduce((acc, s) => acc + (s.mockData?.[settings.activeMock]?.examSubScores[subject]?.sectionA || 0), 0) / pupilsWithData.length;
      const prevObjMean = prevPupils.length > 0
        ? prevPupils.reduce((acc, s) => acc + (s.mockData?.[prevMockName]?.examSubScores[subject]?.sectionA || 0), 0) / prevPupils.length
        : currObjMean;
      const objGrowthRate = prevObjMean > 0 ? currObjMean / prevObjMean : 1.0;

      const currThyMean = pupilsWithData.reduce((acc, s) => acc + (s.mockData?.[settings.activeMock]?.examSubScores[subject]?.sectionB || 0), 0) / pupilsWithData.length;
      const prevThyMean = prevPupils.length > 0
        ? prevPupils.reduce((acc, s) => acc + (s.mockData?.[prevMockName]?.examSubScores[subject]?.sectionB || 0), 0) / prevPupils.length
        : currThyMean;
      const thyGrowthRate = prevThyMean > 0 ? currThyMean / prevThyMean : 1.0;

      const rewardValue = avgGradeFactor * subGrowthRate * objGrowthRate * thyGrowthRate;

      const beceResults = students.filter(s => s.beceResults?.[selectedYear]?.grades[subject]);
      let beceMeanGrade = 9;
      let mockStandardMeanGrade = 5.5; 
      let sigDiff = 0;

      if (beceResults.length > 0) {
        beceMeanGrade = beceResults.reduce((acc, s) => acc + (s.beceResults?.[selectedYear]?.grades[subject] || 9), 0) / beceResults.length;
        sigDiff = mockStandardMeanGrade - beceMeanGrade; 
      }

      return {
        subject,
        name: staff.name,
        staffId: staff.enrolledId,
        avgGradeFactor,
        subGrowth: subGrowthRate,
        objGrowth: objGrowthRate,
        thyGrowth: thyGrowthRate,
        rewardValue,
        beceMeanGrade,
        sigDiff
      };
    }).filter(x => x !== null).sort((a, b) => (b?.rewardValue || 0) - (a?.rewardValue || 0));
  }, [students, settings.activeMock, subjects, facilitators, mockNames, selectedYear]);

  const subjectSignificanceRanking = useMemo(() => {
    return [...facilitatorRewards].sort((a, b) => (b?.sigDiff || 0) - (a?.sigDiff || 0));
  }, [facilitatorRewards]);

  const mockRewardRanking = useMemo(() => {
    return students.map(student => {
      const history = student.seriesHistory || {};
      const currentMock = history[settings.activeMock];
      const prevMockName = mockNames[mockNames.indexOf(settings.activeMock) - 1];
      const prevMock = prevMockName ? history[prevMockName] : null;

      let growthRate = 1.0;
      let objGrowth = 1.0;
      let thyGrowth = 1.0;
      const avgGrade = currentMock ? currentMock.aggregate / 10 : 9;

      if (currentMock && prevMock && currentMock.subScores && prevMock.subScores) {
        const currSubScores = Object.values(currentMock.subScores) as ExamSubScore[];
        const prevSubScores = Object.values(prevMock.subScores) as ExamSubScore[];
        const currTotal = currSubScores.reduce((a, b) => a + (b.sectionA + b.sectionB), 0);
        const prevTotal = prevSubScores.reduce((a, b) => a + (b.sectionA + b.sectionB), 0);
        growthRate = prevTotal > 0 ? currTotal / prevTotal : 1.0;
        const currObjTotal = currSubScores.reduce((a, b) => a + b.sectionA, 0);
        const prevObjTotal = prevSubScores.reduce((a, b) => a + b.sectionA, 0);
        objGrowth = prevObjTotal > 0 ? currObjTotal / prevObjTotal : 1.0;
        const currThyTotal = currSubScores.reduce((a, b) => a + b.sectionB, 0);
        const prevThyTotal = prevSubScores.reduce((a, b) => a + b.sectionB, 0);
        thyGrowth = prevThyTotal > 0 ? currThyTotal / prevThyTotal : 1.0;
      }

      const rewardIndex = (avgGrade > 0 ? (10 / avgGrade) : 1) * growthRate * objGrowth * thyGrowth;

      return { id: student.id, name: student.name, avgGrade, growthRate, objGrowth, thyGrowth, rewardIndex };
    }).sort((a, b) => b.rewardIndex - a.rewardIndex);
  }, [students, settings.activeMock, mockNames]);

  const handleUpdateBeceGrade = (studentId: number, subject: string, grade: string) => {
    const val = parseInt(grade) || 0;
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const results = s.beceResults || {};
      const currentYearData = results[selectedYear] || { grades: {}, year: selectedYear };
      return {
        ...s,
        beceResults: {
          ...results,
          [selectedYear]: { ...currentYearData, grades: { ...currentYearData.grades, [subject]: val } }
        }
      };
    }));
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const sessions = Array.from({ length: 10 }, (_, i) => (2024 + i).toString());

  const navTabs = [
    { id: 'mock-postmortem', label: 'Pupil Rewards', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
    { id: 'facilitator-merit', label: 'TEI Facilitator', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm10 11h2m-1-1v2m-1-10 1.5 1.5L22 7' },
    { id: 'bece-entry', label: 'BECE Ledger', icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', adminOnly: true },
    { id: 'bece-analysis', label: 'Sig-Diff Analytics', icon: 'M18 20V10M12 20V4M6 20v-6' },
    { id: 'annual-report', label: 'Master Audit', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }
  ].filter(t => !isFacilitator || !t.adminOnly);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      
      {/* Navigation Tabs */}
      <div className="flex bg-slate-900 p-2 rounded-[2.5rem] max-w-5xl mx-auto shadow-2xl border border-white/5 no-print overflow-x-auto no-scrollbar">
        {navTabs.map((t) => (
          <button 
            key={t.id}
            onClick={() => setView(t.id as any)}
            className={`flex-1 min-w-[140px] py-4 rounded-[2rem] flex flex-col items-center gap-2 transition-all ${view === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d={t.icon}/></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Main Viewport */}
      <div className="bg-white rounded-[4rem] border border-gray-100 shadow-2xl overflow-hidden min-h-[600px]">
        
        {view === 'mock-postmortem' && (
          <div className="p-12 space-y-10 animate-in fade-in duration-500">
             <div className="flex justify-between items-end border-b-2 border-gray-50 pb-8">
                <div className="space-y-1">
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Pupil Postmortem Merit</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Calculated Heuristic Multiplier Indexing — {settings.activeMock}</p>
                </div>
                <div className="bg-blue-50 px-8 py-3 rounded-2xl border border-blue-100 text-center">
                   <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block">Series</span>
                   <span className="text-lg font-black text-blue-900 uppercase">{settings.activeMock}</span>
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-gray-50 border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      <tr>
                         <th className="px-8 py-5">Rank</th>
                         <th className="px-8 py-5">Candidate</th>
                         <th className="px-4 py-5 text-center">Avg Grade</th>
                         <th className="px-4 py-5 text-center">Growth Factor</th>
                         <th className="px-8 py-5 text-right">Merit Index</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {mockRewardRanking.map((p, i) => (
                        <tr key={p.id} className="hover:bg-blue-50/20 transition-colors">
                           <td className="px-8 py-5"><span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${i < 3 ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{i+1}</span></td>
                           <td className="px-8 py-5 font-black uppercase text-sm text-slate-900">{p.name}</td>
                           <td className="px-4 py-5 text-center font-mono font-bold text-blue-900">{p.avgGrade.toFixed(2)}</td>
                           <td className="px-4 py-5 text-center font-mono font-bold text-emerald-600">x{p.growthRate.toFixed(2)}</td>
                           <td className="px-8 py-5 text-right font-mono font-black text-lg text-blue-950">{p.rewardIndex.toFixed(2)}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {view === 'facilitator-merit' && (
          <div className="p-12 space-y-10 animate-in fade-in duration-500">
             <div className="flex justify-between items-end border-b-2 border-gray-50 pb-8">
                <div className="space-y-1">
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Teaching Efficiency Index (TEI)</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Multi-Factor Instructional Rerating</p>
                </div>
                <div className="bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100 text-center">
                   <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Reference Cycle</span>
                   <span className="text-lg font-black text-indigo-900 uppercase">{selectedYear} Academic Year</span>
                </div>
             </div>

             <div className="bg-slate-950 p-10 rounded-[3rem] border border-slate-800 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative space-y-6">
                   <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      TECHNICAL FORMULA: INSTRUCTIONAL EFFICIENCY (TEI)
                   </h4>
                   <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 flex flex-col md:flex-row items-center justify-center gap-8">
                      <div className="text-center">
                        <p className="text-3xl font-mono font-black text-white">TEI = Gₚ × Sᵣ × Oᵣ × Tᵣ</p>
                        <p className="text-[10px] text-slate-500 uppercase mt-2 tracking-widest font-black">Instructional Merit Value</p>
                      </div>
                      <div className="hidden md:block h-12 w-px bg-white/10"></div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-[10px] font-black uppercase text-slate-400">
                         <div className="flex items-center gap-2"><span className="text-blue-400">Gₚ:</span> Grade Factor (10 - Mean Grade)</div>
                         <div className="flex items-center gap-2"><span className="text-emerald-400">Sᵣ:</span> Subject Growth Ratio</div>
                         <div className="flex items-center gap-2"><span className="text-indigo-400">Oᵣ:</span> Objective Growth Rate</div>
                         <div className="flex items-center gap-2"><span className="text-purple-400">Tᵣ:</span> Theoretical Growth Rate</div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {facilitatorRewards.map((fr, idx) => (
                  <div key={fr?.subject} className={`bg-white border rounded-[2.5rem] p-8 space-y-6 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden group ${idx === 0 ? 'ring-4 ring-yellow-500/20 border-yellow-500' : 'border-gray-100'}`}>
                     <div className="space-y-1">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{fr?.subject} Specialist</span>
                        <h4 className="text-xl font-black text-slate-900 uppercase leading-none">{fr?.name}</h4>
                        <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Node ID: {fr?.staffId}</p>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                           <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Obj Growth</span>
                           <span className="text-lg font-black text-indigo-600 font-mono">x{fr?.objGrowth.toFixed(2)}</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                           <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Thy Growth</span>
                           <span className="text-lg font-black text-purple-600 font-mono">x{fr?.thyGrowth.toFixed(2)}</span>
                        </div>
                        <div className="bg-blue-900 text-white p-4 col-span-2 rounded-2xl flex justify-between items-center px-6 shadow-xl">
                           <span className="text-[8px] font-black text-blue-300 uppercase">TEI INDEX:</span>
                           <span className="text-xl font-black font-mono">{(fr?.rewardValue ?? 0).toFixed(2)}</span>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {view === 'bece-entry' && !isFacilitator && (
          <div className="p-12 space-y-10 animate-in fade-in duration-500">
             <div className="flex justify-between items-center border-b-2 border-gray-50 pb-8">
                <div className="space-y-1">
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">BECE Academic Registry</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Final Examination Grade Synchronization</p>
                </div>
                <div className="flex items-center gap-4">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Examination Cycle:</label>
                   <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-gray-900 text-white border-none rounded-xl px-6 py-3 font-black text-sm outline-none focus:ring-4 focus:ring-blue-500/20">
                      {sessions.map(y => <option key={y} value={y}>{y} Session</option>)}
                   </select>
                </div>
             </div>

             <div className="overflow-x-auto border border-gray-100 rounded-[2.5rem] shadow-sm">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                         <th className="px-8 py-5 min-w-[240px]">Candidate profile</th>
                         {subjects.map(sub => (
                           <th key={sub} className="px-2 py-5 text-center min-w-[80px]">{sub.substring(0, 12)}</th>
                         ))}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {students.map(student => (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                           <td className="px-8 py-4">
                              <span className="font-black text-slate-900 uppercase text-sm block">{student.name}</span>
                              <span className="text-[9px] font-bold text-gray-400">INDEX: {student.id}</span>
                           </td>
                           {subjects.map(sub => (
                             <td key={sub} className="px-2 py-4 text-center">
                                <input 
                                  type="number" min="1" max="9" 
                                  value={student.beceResults?.[selectedYear]?.grades[sub] || ''}
                                  onChange={(e) => handleUpdateBeceGrade(student.id, sub, e.target.value)}
                                  className="w-12 h-12 bg-white border border-gray-200 rounded-xl text-center font-black text-blue-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-200"
                                  placeholder="-"
                                />
                             </td>
                           ))}
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             <div className="flex justify-end pt-6"><button onClick={onSave} className="bg-blue-900 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase shadow-xl tracking-widest active:scale-95 transition-all">Synchronize Institutional BECE Records</button></div>
          </div>
        )}

        {view === 'bece-analysis' && (
          <div className="p-12 space-y-12 animate-in fade-in duration-500">
             <div className="flex justify-between items-end border-b-2 border-gray-50 pb-8">
                <div className="space-y-1">
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Significant Difference Analysis</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Mock Baseline Standard vs. Actual BECE Outcomes</p>
                </div>
                <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 text-center">
                   <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Reference Session</span>
                   <span className="text-lg font-black text-emerald-900 uppercase">{selectedYear}</span>
                </div>
             </div>

             <div className="bg-emerald-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden mb-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative space-y-6">
                   <h4 className="text-[11px] font-black text-emerald-300 uppercase tracking-[0.4em] flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      SIG-DIFF FORMULA (Σ Δ)
                   </h4>
                   <div className="bg-white/10 p-8 rounded-[2rem] border border-white/10 text-center">
                      <p className="text-3xl font-mono font-black">Σ Δ = Mock Standard (5.5) - BECE Mean</p>
                      <p className="text-[10px] text-emerald-300 uppercase mt-3 tracking-widest font-black">Success Metric: Σ Δ &gt; 0 indicates institutional growth over standard</p>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {subjectSignificanceRanking.map((f, i) => (
                  <div key={f.subject} className={`bg-white border rounded-3xl p-6 flex items-center justify-between shadow-sm transition-all hover:shadow-xl ${f.sigDiff > 0 ? 'border-emerald-100' : 'border-red-100 grayscale-[0.5]'}`}>
                     <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${f.sigDiff > 0 ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                           {i + 1}
                        </div>
                        <div className="space-y-1">
                           <h5 className="text-sm font-black text-slate-900 uppercase">{f.subject}</h5>
                           <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{f.name}</span>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">SIGMA DIFF (Σ Δ)</span>
                        <span className={`text-xl font-black font-mono ${f.sigDiff > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                           {f.sigDiff > 0 ? `+${f.sigDiff.toFixed(2)}` : f.sigDiff.toFixed(2)}
                        </span>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {view === 'annual-report' && (
          <div className="p-12 space-y-12 animate-in slide-in-from-bottom-8 duration-700" id="reward-audit-report">
             <div className="flex justify-between items-start border-b-8 border-double border-blue-950 pb-8">
                <div className="flex items-center gap-8">
                   {settings.schoolLogo && <img src={settings.schoolLogo} alt="Academy Logo" className="w-24 h-24 object-contain" />}
                   <div className="space-y-2">
                      <h1 className="text-4xl font-black text-blue-950 uppercase tracking-tighter leading-none">
                         <EditableField value={settings.schoolName} onChange={(v) => onSave()} />
                      </h1>
                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
                         <EditableField value={settings.schoolAddress} onChange={(v) => onSave()} />
                      </p>
                      <div className="bg-blue-50 inline-block px-4 py-1 rounded-full border border-blue-100"><span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Enrollment Node: {settings.schoolNumber}</span></div>
                   </div>
                </div>
                <div className="text-right space-y-2">
                   <h2 className="text-2xl font-black text-red-700 uppercase tracking-tight">ANNUAL PERFORMANCE AUDIT</h2>
                   <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">ACADEMIC CYCLE: {selectedYear}</p>
                   <button onClick={handlePrint} className="no-print bg-blue-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all">Print Formal Audit</button>
                </div>
             </div>

             <section className="space-y-8">
                <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-xl border-b-8 border-blue-600">
                   <h3 className="text-xl font-black uppercase tracking-widest text-blue-400 mb-2">Executive Summary</h3>
                   <p className="text-sm font-medium leading-relaxed italic text-slate-300">
                     This unified certificate identifies instructional excellence based on multi-factor heuristic multipliers (Growth, Sectional Mastery, and Grade Average) and final BECE significant difference achievement for the {selectedYear} cohort.
                   </p>
                </div>

                <div className="grid grid-cols-1 gap-8">
                   <div className="bg-white border-2 border-gray-100 rounded-[3rem] p-10 space-y-8 shadow-sm">
                      <h4 className="text-lg font-black text-blue-900 uppercase tracking-[0.3em] flex items-center gap-3">
                         <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                         Facilitator Hall of Fame (Elite TEI Output)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         {facilitatorRewards.slice(0, 3).map((f, i) => (
                           <div key={f?.subject} className="bg-gray-50 border border-gray-100 p-8 rounded-[2.5rem] text-center space-y-4 shadow-sm">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto font-black text-lg ${i === 0 ? 'bg-yellow-500 text-white shadow-lg' : 'bg-blue-900 text-white'}`}>{i + 1}</div>
                              <div className="space-y-1">
                                 <p className="text-base font-black text-gray-900 uppercase leading-none">{f?.name}</p>
                                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{f?.subject}</p>
                              </div>
                              <div className="bg-white px-5 py-2 rounded-full border border-gray-100 inline-block">
                                 <span className="text-[10px] font-mono font-black text-slate-500">TEI: {f?.rewardValue.toFixed(2)}</span>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-white border-2 border-gray-100 rounded-[3rem] p-8 space-y-6">
                         <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest">Top Pupil Progression Index</h4>
                         <div className="space-y-3">
                            {mockRewardRanking.slice(0, 5).map((p, i) => (
                               <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                                  <span className="text-xs font-black uppercase text-slate-900">#{i+1} {p.name}</span>
                                  <span className="text-[10px] font-mono font-black text-blue-600">{p.rewardIndex.toFixed(2)}</span>
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="bg-white border-2 border-gray-100 rounded-[3rem] p-8 space-y-6">
                         <h4 className="text-sm font-black text-emerald-700 uppercase tracking-widest">Subject Significance (Σ Δ)</h4>
                         <div className="space-y-3">
                            {subjectSignificanceRanking.slice(0, 5).map((f, i) => (
                               <div key={i} className="flex justify-between items-center p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/30">
                                  <span className="text-xs font-black uppercase text-slate-900">Σ+{f.sigDiff.toFixed(2)} {f.subject}</span>
                                  <span className="text-[10px] font-mono font-black text-emerald-900">Mean {f.beceMeanGrade.toFixed(2)}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
             </section>

             <div className="bg-gray-50 p-12 rounded-[4rem] border-2 border-dashed border-gray-200">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.5em] mb-12 text-center">Institutional Verification</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
                   <div className="text-center space-y-2"><div className="border-t-2 border-black pt-2 font-black uppercase text-[10px]">Head Teacher</div><p className="text-[8px] text-gray-400 italic">Pedagogical Integrity Verified</p></div>
                   <div className="text-center space-y-2"><div className="border-t-2 border-black pt-2 font-black uppercase text-[10px]">Registry Hub</div><p className="text-[8px] text-gray-400 italic">Data Persistence Validated</p></div>
                   <div className="text-center space-y-2"><div className="border-t-2 border-black pt-2 font-black uppercase text-[10px]">Academy Director</div><p className="text-[8px] text-gray-400 italic">Institutional Seal</p></div>
                </div>
             </div>

             <div className="pt-12 text-center">
                <p className="text-[9px] font-black text-blue-900 uppercase tracking-[2em] opacity-30">SS-MAP PERFORMANCE HUB — {selectedYear} ANNUAL AUDIT</p>
             </div>
          </div>
        )}

      </div>

      <div className="bg-slate-950 p-6 rounded-[2.5rem] flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 no-print">
         <div className="flex items-center gap-4">
            <span className="text-blue-500">Registry Sync:</span>
            <span className="text-white">NODE COMMUNICATING</span>
         </div>
         <div className="flex items-center gap-3 italic">
            Teaching Efficiency Index (TEI) v4.2 Unified
         </div>
      </div>
    </div>
  );
};

export default RewardPortal;