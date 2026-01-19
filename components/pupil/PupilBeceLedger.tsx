

import React, { useState } from 'react';
import { ProcessedStudent } from '../../types';

interface PupilBeceLedgerProps {
  student: ProcessedStudent;
}

const PupilBeceLedger: React.FC<PupilBeceLedgerProps> = ({ student }) => {
  const years = Object.keys(student.beceResults || {}).sort((a,b) => Number(b) - Number(a));
  const [selectedYear, setSelectedYear] = useState(years[0] || new Date().getFullYear().toString());

  const currentResult = student.beceResults?.[selectedYear];

  return (
    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-10 animate-in slide-in-from-right-8 duration-500">
      <div className="flex justify-between items-center border-b-2 border-gray-50 pb-8">
        <div className="space-y-2">
           <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Official BECE Ledger</h3>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em]">Verified Academic Outcomes Registry</p>
        </div>
        {years.length > 0 && (
           <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-gray-900 text-white font-black py-3 px-6 rounded-2xl text-xs uppercase outline-none focus:ring-4 focus:ring-blue-500/20"
           >
             {years.map(y => <option key={y} value={y}>{y} Session</option>)}
           </select>
        )}
      </div>

      {currentResult ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {Object.entries(currentResult.grades).map(([subject, grade]) => {
             // Fix: Explicitly cast grade to number to resolve 'unknown' comparison error in JSX attribute
             const numericGrade = grade as number;
             return (
               <div key={subject} className="bg-gray-50 border border-gray-100 p-6 rounded-3xl flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest max-w-[120px]">{subject}</span>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${numericGrade <= 3 ? 'bg-emerald-600 text-white' : numericGrade <= 6 ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'}`}>
                     {numericGrade}
                  </div>
               </div>
             );
           })}
        </div>
      ) : (
        <div className="py-32 text-center opacity-20 flex flex-col items-center gap-6">
           <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
           <p className="font-black uppercase text-sm tracking-[0.5em]">No BECE results found in the registry</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 p-8 rounded-[2.5rem] flex items-center gap-4">
         <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
         </div>
         <p className="text-[10px] text-blue-900 font-bold uppercase tracking-widest leading-relaxed">
            Grades shown are the final verified outcomes synchronised with the institutional terminal. Contact Academy Hub if discrepancies are detected.
         </p>
      </div>
    </div>
  );
};

export default PupilBeceLedger;