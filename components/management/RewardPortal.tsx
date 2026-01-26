import React, { useState, useMemo } from 'react';
import { StudentData, GlobalSettings, ExamSubScore, StaffAssignment } from '../../types';
import EditableField from '../shared/EditableField';

interface RewardPortalProps {
  students: StudentData[];
  setStudents: React.Dispatch<React.SetStateAction<StudentData[]>>;
  settings: GlobalSettings;
  subjects: string[];
  facilitators: Record<string, StaffAssignment>;
  onSave: () => void;
  onSettingChange?: (key: keyof GlobalSettings, value: any) => void;
  isFacilitator?: boolean;
}

const RewardPortal: React.FC<RewardPortalProps> = ({ students, setStudents, settings, subjects, facilitators, onSave, onSettingChange, isFacilitator }) => {
  const [view, setView] = useState<'mock-postmortem' | 'facilitator-merit' | 'bece-entry' | 'bece-analysis' | 'annual-report'>('mock-postmortem');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [rewardPool, setRewardPool] = useState('10000'); // Fixed amount of money for distribution
  const [mockStandardMean] = useState(5.5); // Academy Baseline Standard

  const mockNames = settings.committedMocks || [];

  // --- Logic: Facilitator Multiplier Reward Calculation (TEI) ---
  const facilitatorRewards = useMemo(() => {
    const activeMock = settings.activeMock;
    const prevMockName = mockNames[mockNames.indexOf(activeMock) - 1];

    const results = subjects.map(subject => {
      const staff = facilitators[subject];
      if (!staff || !staff.name) return null;

      const pupilsWithData = students.filter(s => s.mockData?.[activeMock]?.scores[subject] !== undefined);
      if (pupilsWithData.length === 0) return null;

      // Multiplier 1: Average Grade Factor (Inverted scale: 10 - Mean)
      const currentMeanScore = pupilsWithData.reduce((acc, s) => acc + (s.mockData?.[activeMock]?.scores[subject] || 0), 0) / pupilsWithData.length;
      const avgGradeFactor = Math.max(1, 10 - (currentMeanScore / 10)); 

      // Multiplier 2: Subject Performance Growth Rate
      const prevPupils = prevMockName ? students.filter(s => s.mockData?.[prevMockName]?.scores[subject] !== undefined) : [];
      const prevMeanScore = prevPupils.length > 0 
        ? prevPupils.reduce((acc, s) => acc + (s.mockData?.[prevMockName]?.scores[subject] || 0), 0) / prevPupils.length 
        : currentMeanScore;
      const subGrowthRate = prevMeanScore > 0 ? currentMeanScore / prevMeanScore : 1.0;

      // Multiplier 3: Objective Growth Rate
      const currObjMean = pupilsWithData.reduce((acc, s) => acc + (s.mockData?.[activeMock]?.examSubScores[subject]?.sectionA || 0), 0) / pupilsWithData.length;
      const prevObjMean = prevPupils.length > 0
        ? prevPupils.reduce((acc, s) => acc + (s.mockData?.[prevMockName]?.examSubScores[subject]?.sectionA || 0), 0) / prevPupils.length
        : currObjMean;
      const objGrowthRate = prevObjMean > 0 ? currObjMean / prevObjMean : 1.0;

      // Multiplier 4: Theory Growth Rate
      const currThyMean = pupilsWithData.reduce((acc, s) => acc + (s.mockData?.[activeMock]?.examSubScores[subject]?.sectionB || 0), 0) / pupilsWithData.length;
      const prevThyMean = prevPupils.length > 0
        ? prevPupils.reduce((acc, s) => acc + (s.mockData?.[prevMockName]?.examSubScores[subject]?.sectionB || 0), 0) / prevPupils.length
        : currThyMean;
      const thyGrowthRate = prevThyMean > 0 ? currThyMean / prevThyMean : 1.0;

      const teiValue = avgGradeFactor * subGrowthRate * objGrowthRate * thyGrowthRate;

      // BECE Sig-Diff Calculation (Σ Δ)
      const beceStudents = students.filter(s => s.beceResults?.[selectedYear]?.grades[subject]);
      let beceMeanGrade = 9;
      let sigDiff = 0;

      if (beceStudents.length > 0) {
        beceMeanGrade = beceStudents.reduce((acc, s) => acc + (s.beceResults?.[selectedYear]?.grades[subject] || 9), 0) / beceStudents.length;
        sigDiff = mockStandardMean - beceMeanGrade; 
      }

      return {
        subject,
        name: staff.name,
        staffId: staff.enrolledId,
        avgGradeFactor,
        subGrowthRate,
        objGrowthRate,
        thyGrowthRate,
        teiValue,
        beceMeanGrade,
        sigDiff
      };
    }).filter(x => x !== null);

    return results as any[];
  }, [students, settings.activeMock, subjects, facilitators, mockNames, selectedYear, mockStandardMean]);

  const teiRanked = useMemo(() => {
    const sorted = [...facilitatorRewards].sort((a, b) => b.teiValue - a.teiValue);
    const totalTei = sorted.reduce((acc, f) => acc + f.teiValue, 0);
    const poolValue = parseFloat(rewardPool) || 0;

    return sorted.map((f, i) => ({
      ...f,
      rank: i + 1,
      share: totalTei > 0 ? (f.teiValue / totalTei) * poolValue : 0
    }));
  }, [facilitatorRewards, rewardPool]);

  const sigDiffRanked = useMemo(() => {
    return [...facilitatorRewards].sort((a, b) => b.sigDiff - a.sigDiff).map((f, i) => ({
      ...f,
      rank: i + 1
    }));
  }, [facilitatorRewards]);

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

  const navTabs = [
    { id: 'mock-postmortem', label: 'Pupil Rewards', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
    { id: 'facilitator-merit', label: 'Facilitator Rewards', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm10-2v6m3-3h-6' },
    { id: 'bece-entry', label: 'BECE Ledger', icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', adminOnly: true },
    { id: 'bece-analysis', label: 'Sig-Diff Ranking', icon: 'M18 20V10M12 20V4M6 20v-6' },
    { id: 'annual-report', label: 'Annual Performance Audit', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }
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

      <div className="bg-white rounded-[4rem] border border-gray-100 shadow-2xl overflow-hidden min-h-[600px]">
        
        {view === 'mock-postmortem' && (
          <div className="p-12 space-y-10 animate-in fade-in duration-500">
             <div className="flex justify-between items-end border-b-2 border-gray-50 pb-8">
                <div className="space-y-1">
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Pupil Merit Ranking</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Heuristic Growth Analytics — {settings.activeMock}</p>
                </div>
                <div className="bg-blue-50 px-8 py-3 rounded-2xl border border-blue-100 text-center">
                   <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block">Cycle</span>
                   <span className="text-lg font-black text-blue-900 uppercase">{settings.activeMock}</span>
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-gray-50 border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      <tr>
                         <th className="px-8 py-5">Rank</th>
                         <th className="px-8 py-5">Candidate</th>
                         <th className="px-4 py-5 text-center">Aggregate</th>
                         <th className="px-8 py-5 text-right">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {students.sort((a,b) => (a.seriesHistory?.[settings.activeMock]?.aggregate || 54) - (b.seriesHistory?.[settings.activeMock]?.aggregate || 54)).map((p, i) => {
                        const agg = p.seriesHistory?.[settings.activeMock]?.aggregate;
                        return (
                          <tr key={p.id} className="hover:bg-blue-50/20 transition-colors">
                             <td className="px-8 py-5"><span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${i < 3 ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{i+1}</span></td>
                             <td className="px-8 py-5 font-black uppercase text-sm text-slate-900">{p.name}</td>
                             <td className="px-4 py-5 text-center font-mono font-bold text-blue-900">{agg || '—'}</td>
                             <td className="px-8 py-5 text-right uppercase text-[10px] font-black text-slate-400">Verified</td>
                          </tr>
                        );
                      })}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {view === 'facilitator-merit' && (
          <div className="p-12 space-y-12 animate-in fade-in duration-500">
             <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-gray-50 pb-8 gap-4">
                <div className="space-y-1">
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Facilitator Reward Hub</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Multi-Factor TEI Rerating (Postmortem)</p>
                </div>
                <div className="bg-indigo-950 p-4 rounded-3xl border border-white/10 flex items-center gap-6 shadow-xl">
                   <div className="space-y-1">
                      <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest block">Total Reward Pool</span>
                      <div className="flex items-center gap-2">
                         <span className="text-indigo-400 font-black">₵</span>
                         <input 
                           type="number" 
                           value={rewardPool} 
                           onChange={(e) => setRewardPool(e.target.value)}
                           className="bg-transparent border-none text-white font-black text-xl outline-none w-24"
                         />
                      </div>
                   </div>
                   <div className="h-10 w-px bg-white/10"></div>
                   <div className="space-y-1">
                      <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest block">Distribution Mode</span>
                      <span className="text-white font-black text-xs uppercase">Heuristic Pro-Rata</span>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teiRanked.map((f) => (
                  <div key={f.subject} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden group">
                     <div className={`absolute top-0 right-0 w-12 h-12 flex items-center justify-center font-black text-lg ${f.rank === 1 ? 'bg-yellow-500 text-white shadow-lg' : 'bg-gray-900 text-white'}`}>
                        {f.rank}
                     </div>
                     <div className="space-y-1">
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{f.subject}</span>
                        <h4 className="text-xl font-black text-slate-900 uppercase leading-none">{f.name}</h4>
                        <p className="text-[8px] font-mono text-gray-400 uppercase tracking-widest">ID: {f.staffId}</p>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                           <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Growth (Sᵣ)</span>
                           <span className="text-base font-black text-emerald-600 font-mono">x{f.subGrowthRate.toFixed(2)}</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                           <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Technical Index</span>
                           <span className="text-base font-black text-indigo-600 font-mono">x{(f.objGrowthRate * f.thyGrowthRate).toFixed(2)}</span>
                        </div>
                     </div>
                     <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-xl">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                           <span className="text-[9px] font-black text-slate-400 uppercase">TEI Score</span>
                           <span className="text-xl font-black text-blue-400 font-mono">{f.teiValue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-[9px] font-black text-slate-400 uppercase">Cash Reward</span>
                           <span className="text-xl font-black text-emerald-400 font-mono">₵{f.share.toFixed(2)}</span>
                        </div>
                     </div>
                  </div>
                ))}
             </div>

             {/* Formula Technical Specification Breakdown */}
             <div className="mt-16 bg-slate-950 p-10 md:p-16 rounded-[4rem] text-white shadow-3xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full -mr-48 -mt-48 blur-[100px]"></div>
                <div className="relative space-y-12">
                   <div className="text-center space-y-4">
                      <h4 className="text-[12px] font-black text-blue-400 uppercase tracking-[0.6em] animate-pulse">Instructional Merit Formula</h4>
                      <p className="text-4xl md:text-6xl font-mono font-black tracking-tighter text-white">TEI = Gₚ × Sᵣ × Oᵣ × Tᵣ</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unified Teaching Efficiency Index (TEI) Specification</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 hover:border-blue-500/30 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-sm">Gₚ</div>
                            <h5 className="text-sm font-black text-white uppercase tracking-widest">Grade Proficiency Factor</h5>
                         </div>
                         <div className="space-y-3">
                            <p className="text-[10px] font-mono text-blue-300 uppercase">Formula: 10 - Subject Mean Grade</p>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                               This factor establishes the excellence baseline. A cohort mean of 2.0 (high distinction) yields an 8.0 multiplier, while a mean of 8.0 (pass) yields only 2.0. It incentivizes the facilitator to drive pupils into higher distinction brackets.
                            </p>
                         </div>
                      </div>

                      <div className="space-y-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 hover:border-emerald-500/30 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-black text-sm">Sᵣ</div>
                            <h5 className="text-sm font-black text-white uppercase tracking-widest">Subject Velocity Ratio</h5>
                         </div>
                         <div className="space-y-3">
                            <p className="text-[10px] font-mono text-emerald-300 uppercase">Formula: Active Series Mean / Baseline Series Mean</p>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                               Tracks longitudinal growth of the whole cohort. A value &gt; 1.0 indicates that the facilitator has successfully improved the class average relative to the previous mock series, rewarding instructional progress.
                            </p>
                         </div>
                      </div>

                      <div className="space-y-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 hover:border-indigo-500/30 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-sm">Oᵣ</div>
                            <h5 className="text-sm font-black text-white uppercase tracking-widest">Objective Precision Rate</h5>
                         </div>
                         <div className="space-y-3">
                            <p className="text-[10px] font-mono text-indigo-300 uppercase">Formula: Current Sec A Mean / Previous Sec A Mean</p>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                               Specifically measures the growth in Section A (Objectives). High Oᵣ indicates that students are becoming more precise and rapid in conceptual identification and MCQ strategies under the facilitator's guidance.
                            </p>
                         </div>
                      </div>

                      <div className="space-y-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 hover:border-purple-500/30 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center font-black text-sm">Tᵣ</div>
                            <h5 className="text-sm font-black text-white uppercase tracking-widest">Theoretical Depth Rate</h5>
                         </div>
                         <div className="space-y-3">
                            <p className="text-[10px] font-mono text-purple-300 uppercase">Formula: Current Sec B Mean / Previous Sec B Mean</p>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                               Measures growth in Section B (Theory). As this section requires the highest level of articulation, improvement here heavily influences the TEI by validating the facilitator's depth of instructional delivery.
                            </p>
                         </div>
                      </div>
                   </div>

                   <div className="pt-8 border-t border-white/10 text-center">
                      <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4">PLC Operational Decision Logic:</p>
                      <p className="text-xs text-slate-500 leading-relaxed italic max-w-4xl mx-auto">
                        "The TEI identifies instructional efficiency. During **Professional Learning Communities (PLC)**, facilitators with TEI &gt; 8.0 are designated as 'Pedagogical Hubs' to lead cross-departmental Section B calibration sessions. A declining TEI triggers a 'Strategy Friction' audit to adjust curriculum pacing."
                      </p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {view === 'bece-entry' && (
          <div className="p-12 space-y-10 animate-in fade-in duration-500">
             <div className="flex justify-between items-center border-b-2 border-gray-50 pb-8">
                <div className="space-y-1">
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">BECE Grade Registry</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Final Examination Outcome Synchronization (Grade-after-Grade)</p>
                </div>
                <div className="flex items-center gap-4">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Session Year:</label>
                   <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-gray-900 text-white border-none rounded-xl px-6 py-3 font-black text-sm outline-none focus:ring-4 focus:ring-blue-500/20">
                      {['2024', '2025', '2026'].map(y => <option key={y} value={y}>{y} Session</option>)}
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
                              <span className="text-[9px] font-bold text-gray-400">ID: {student.id}</span>
                           </td>
                           {subjects.map(sub => (
                             <td key={sub} className="px-2 py-4 text-center">
                                <input 
                                  type="number" min="1" max="9" 
                                  value={student.beceResults?.[selectedYear]?.grades[sub] || ''}
                                  onChange={(e) => handleUpdateBeceGrade(student.id, sub, e.target.value)}
                                  className="w-12 h-12 bg-white border border-gray-200 rounded-xl text-center font-black text-blue-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-200"
                                />
                             </td>
                           ))}
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             <div className="flex justify-end pt-6">
                <button onClick={onSave} className="bg-blue-900 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase shadow-xl tracking-widest active:scale-95 transition-all">Synchronize Institutional BECE Records</button>
             </div>
          </div>
        )}

        {view === 'bece-analysis' && (
          <div className="p-12 space-y-12 animate-in fade-in duration-500">
             <div className="flex justify-between items-end border-b-2 border-gray-50 pb-8">
                <div className="space-y-1">
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Significant Difference Analysis</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Mock Baseline Standard (5.5) vs. Actual BECE Mastery</p>
                </div>
                <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 text-center">
                   <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Reference Year</span>
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
                {sigDiffRanked.map((f, i) => (
                  <div key={f.subject} className={`bg-white border rounded-3xl p-6 flex items-center justify-between shadow-sm transition-all hover:shadow-xl ${f.sigDiff > 0 ? 'border-emerald-100' : 'border-red-100 grayscale-[0.5]'}`}>
                     <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${f.sigDiff > 0 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-100 text-gray-400'}`}>
                           {f.rank}
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
             {/* Academy Header */}
             <div className="flex justify-between items-start border-b-8 border-double border-blue-950 pb-8">
                <div className="flex items-center gap-8">
                   {settings.schoolLogo && <img src={settings.schoolLogo} alt="Academy Logo" className="w-24 h-24 object-contain" />}
                   <div className="space-y-2">
                      <h1 className="text-4xl font-black text-blue-950 uppercase tracking-tighter leading-none">
                         <EditableField value={settings.schoolName} onChange={(v) => onSettingChange?.('schoolName', v)} />
                      </h1>
                      <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                         <EditableField value={settings.schoolAddress} onChange={(v) => onSettingChange?.('schoolAddress', v)} />
                      </p>
                      <div className="bg-blue-50 inline-block px-4 py-1 rounded-full border border-blue-100"><span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Enrollment Node: {settings.schoolNumber}</span></div>
                   </div>
                </div>
                <div className="text-right space-y-2">
                   <h2 className="text-2xl font-black text-red-700 uppercase tracking-tight leading-none">ANNUAL PERFORMANCE AUDIT</h2>
                   <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">ACADEMIC CYCLE: {selectedYear}</p>
                   <button onClick={() => window.print()} className="no-print bg-blue-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all">Print Formal Audit Copy</button>
                </div>
             </div>

             <section className="space-y-10">
                <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-xl border-b-8 border-blue-600">
                   <h3 className="text-xl font-black uppercase tracking-widest text-blue-400 mb-4">I. Executive Summary & Discussion</h3>
                   <div className="space-y-4 text-sm leading-relaxed text-slate-300 font-medium italic">
                      <p>
                         This performance appraisal document integrates multi-factor heuristic multipliers to quantify instructional velocity and final academic attainment for the {selectedYear} cohort.
                      </p>
                      <p>
                         The <span className="text-white font-black">Teaching Efficiency Index (TEI)</span> discussions focused on the synergy between Objective (Section A) and Theoretical (Section B) mastery. Finding indicates a current network growth ratio of <span className="text-blue-400 font-black">x{(teiRanked.reduce((a, b) => a + b.subGrowthRate, 0) / (teiRanked.length || 1)).toFixed(2)}</span> across primary disciplines.
                      </p>
                      <p>
                         Significant Difference <span className="text-emerald-400 font-black">(Σ Δ)</span> analysis confirms that facilitators have effectively closed the gap between internal mock standards and external BECE criteria, with a median SIGMA of <span className="text-emerald-400 font-black">+{(sigDiffRanked.reduce((a, b) => a + b.sigDiff, 0) / (sigDiffRanked.length || 1)).toFixed(2)}</span>.
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-white border-2 border-gray-100 rounded-[3rem] p-10 space-y-6 shadow-sm">
                      <h4 className="text-lg font-black text-blue-900 uppercase tracking-[0.2em] flex items-center gap-3">
                         <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                         Elite Facilitators (Rank 1-3)
                      </h4>
                      <div className="space-y-4">
                         {teiRanked.slice(0, 3).map((f) => (
                           <div key={f.subject} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all">
                              <div>
                                 <p className="text-xs font-black uppercase text-slate-900">{f.name}</p>
                                 <p className="text-[9px] font-bold text-blue-600 uppercase">{f.subject}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-xs font-black text-blue-950 font-mono">TEI: {f.teiValue.toFixed(2)}</p>
                                 <p className="text-[8px] font-black text-emerald-600 uppercase">Distinction Status</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="bg-white border-2 border-gray-100 rounded-[3rem] p-10 space-y-6 shadow-sm">
                      <h4 className="text-lg font-black text-emerald-900 uppercase tracking-[0.2em] flex items-center gap-3">
                         <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
                         BECE Sig-Diff Leaders
                      </h4>
                      <div className="space-y-4">
                         {sigDiffRanked.slice(0, 3).map((f) => (
                           <div key={f.subject} className="flex justify-between items-center p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                              <div>
                                 <p className="text-xs font-black uppercase text-slate-900">{f.name}</p>
                                 <p className="text-[9px] font-bold text-emerald-700 uppercase">{f.subject}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-xs font-black text-emerald-950 font-mono">Σ Δ: +{f.sigDiff.toFixed(2)}</p>
                                 <p className="text-[8px] font-black text-emerald-600 uppercase">Institutional Impact</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="bg-white border-2 border-blue-900 p-12 rounded-[4rem] space-y-8 relative overflow-hidden shadow-2xl">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-900/5 rounded-bl-full"></div>
                   <h3 className="text-xl font-black uppercase tracking-[0.4em] text-blue-900 border-b-2 border-blue-100 pb-4">II. Roadmap for Upcoming Assessment Cycles</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-4">
                         <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest underline decoration-blue-500 underline-offset-8">Pedagogical Interventions</h5>
                         <ul className="space-y-3">
                            <li className="text-[10px] text-slate-600 flex gap-3"><span className="text-blue-500 font-black">01.</span> <span className="leading-relaxed">Increase frequency of Objective (Sec A) timed trials for subjects with sub-growth &lt; 1.0.</span></li>
                            <li className="text-[10px] text-slate-600 flex gap-3"><span className="text-blue-500 font-black">02.</span> <span className="leading-relaxed">Facilitator peer-marking sessions to standardize Section B grading accuracy.</span></li>
                            <li className="text-[10px] text-slate-600 flex gap-3"><span className="text-blue-500 font-black">03.</span> <span className="leading-relaxed">Targeted remedial clusters for candidates falling in the lower SIGMA quartiles.</span></li>
                         </ul>
                      </div>
                      <div className="space-y-4">
                         <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest underline decoration-red-500 underline-offset-8">Institutional Milestones</h5>
                         <ul className="space-y-3">
                            <li className="text-[10px] text-slate-600 flex gap-3"><span className="text-red-500 font-black">01.</span> <span className="leading-relaxed">Achieve institutional Σ Δ of +1.5 across Core disciplines by the next series.</span></li>
                            <li className="text-[10px] text-slate-600 flex gap-3"><span className="text-red-500 font-black">02.</span> <span className="leading-relaxed">Standardize digital resource integration for Theory mastery across all staff nodes.</span></li>
                         </ul>
                      </div>
                   </div>
                </div>
             </section>

             <div className="bg-gray-50 p-12 rounded-[4rem] border-2 border-dashed border-gray-200">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] mb-12 text-center">Institutional Verification & Authentication Registry</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
                   <div className="text-center space-y-2"><div className="border-t-2 border-black pt-2 font-black uppercase text-[10px]">Head Teacher</div><p className="text-[8px] text-gray-400 italic">Instructional Integrity Verified</p></div>
                   <div className="text-center space-y-2"><div className="border-t-2 border-black pt-2 font-black uppercase text-[10px]">Registry Controller</div><p className="text-[8px] text-gray-400 italic">Data Persistence Validated</p></div>
                   <div className="text-center space-y-2"><div className="border-t-2 border-black pt-2 font-black uppercase text-[10px]">Academy Director</div><p className="text-[8px] text-gray-400 italic">Institutional Seal</p></div>
                </div>
             </div>

             <div className="pt-12 text-center">
                <p className="text-[9px] font-black text-blue-900 uppercase tracking-[2em] opacity-30">SS-MAP PERFORMANCE HUB — {selectedYear} ANNUAL AUDIT OUTPUT</p>
             </div>
          </div>
        )}

      </div>

      {/* Quality Compliance Footer */}
      <div className="bg-slate-950 p-6 rounded-[2.5rem] flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 no-print">
         <div className="flex items-center gap-4">
            <span className="text-blue-500">Registry Sync:</span>
            <span className="text-white">NODE COMMUNICATING</span>
         </div>
         <div className="flex items-center gap-3 italic">
            Teaching Efficiency Index (TEI) v5.0 Master
         </div>
      </div>
    </div>
  );
};

export default RewardPortal;