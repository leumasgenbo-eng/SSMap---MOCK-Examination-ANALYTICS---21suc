
import React, { useState, useRef } from 'react';
import { StudentData, GlobalSettings, MockScoreSet } from '../../types';

interface PupilSBAPortalProps {
  students: StudentData[];
  setStudents: React.Dispatch<React.SetStateAction<StudentData[]>>;
  settings: GlobalSettings;
  subjects: string[];
}

const PupilSBAPortal: React.FC<PupilSBAPortalProps> = ({ students, setStudents, settings, subjects }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState('M');
  const [newParentName, setNewParentName] = useState('');
  const [newParentContact, setNewParentContact] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newStudent: StudentData = {
      id: students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1,
      name: newName.toUpperCase(),
      gender: newGender,
      parentName: newParentName.toUpperCase(),
      parentContact: newParentContact,
      parentEmail: newParentEmail.toLowerCase(),
      attendance: 0,
      scores: {},
      sbaScores: {},
      examSubScores: {},
      mockData: {}
    };
    setStudents([...students, newStudent]);
    setNewName('');
    setNewParentName('');
    setNewParentContact('');
    setNewParentEmail('');
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this pupil permanently from the academy records?")) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const handleUpdateStudentField = (id: number, field: keyof StudentData, value: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleUpdateSbaScore = (studentId: number, subject: string, score: string) => {
    const numericScore = parseInt(score) || 0;
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      
      // Fixed: Fallback object now includes facilitatorRemarks and observations to match MockScoreSet interface
      const activeData: MockScoreSet = s.mockData?.[settings.activeMock] || { 
        scores: {}, 
        sbaScores: {}, 
        examSubScores: {}, 
        facilitatorRemarks: {},
        observations: {
          facilitator: "",
          invigilator: "",
          examiner: ""
        },
        attendance: 0, 
        conductRemark: "" 
      };
      
      const newSba = { ...(activeData.sbaScores || {}), [subject]: Math.max(0, numericScore) };
      return { ...s, mockData: { ...(s.mockData || {}), [settings.activeMock]: { ...activeData, sbaScores: newSba } } };
    }));
  };

  const handleDownloadCSV = () => {
    const headers = ["ID", "Name", "Gender", "Parent Name", "Parent Contact", "Parent Email"];
    const rows = students.map(s => [
      s.id,
      s.name,
      s.gender,
      s.parentName || "",
      s.parentContact || "",
      s.parentEmail || ""
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `UBA_Master_Pupil_List.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      
      const newStudentsList = [...students];
      
      lines.slice(1).forEach(line => {
        if (!line.trim()) return;
        const columns = line.split(",");
        const id = parseInt(columns[0]);
        const name = columns[1]?.toUpperCase();
        const gender = columns[2]?.toUpperCase();
        const parentName = columns[3]?.toUpperCase();
        const parentContact = columns[4];
        const parentEmail = columns[5]?.toLowerCase();

        const existingIdx = newStudentsList.findIndex(s => (id && s.id === id) || (name && s.name === name));
        if (existingIdx > -1) {
          newStudentsList[existingIdx] = {
            ...newStudentsList[existingIdx],
            parentName: parentName || newStudentsList[existingIdx].parentName,
            parentContact: parentContact || newStudentsList[existingIdx].parentContact,
            parentEmail: parentEmail || newStudentsList[existingIdx].parentEmail,
            gender: gender || newStudentsList[existingIdx].gender
          };
        } else if (name) {
          newStudentsList.push({
            id: id || (newStudentsList.length > 0 ? Math.max(...newStudentsList.map(s => s.id)) + 1 : 1),
            name,
            gender: gender || 'M',
            parentName: parentName || "",
            parentContact: parentContact || "",
            parentEmail: parentEmail || "",
            attendance: 0,
            scores: {},
            sbaScores: {},
            examSubScores: {},
            mockData: {}
          });
        }
      });
      
      setStudents(newStudentsList);
      alert("CSV Data Sync Completed. " + (lines.length - 1) + " records processed.");
    };
    reader.readAsText(file);
  };

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* CSV Sync Command Center */}
      <div className="bg-gray-900 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="relative space-y-1 text-center md:text-left">
          <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Institutional Data Sync</h4>
          <p className="text-2xl font-black text-white uppercase tracking-tight">Bulk Academy Records</p>
        </div>
        <div className="relative flex flex-wrap justify-center gap-4">
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center gap-3 bg-blue-800 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Pupil CSV
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Import Records
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleUploadCSV} />
        </div>
      </div>

      {/* Modern Pupil Enrollment Form */}
      <form onSubmit={handleAddStudent} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl grid grid-cols-1 md:grid-cols-6 gap-6 items-end">
        <div className="md:col-span-2 space-y-2">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Full Pupil Name</label>
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="SURNAME FIRST..." className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Gender</label>
          <select value={newGender} onChange={(e) => setNewGender(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10">
            <option value="M">MALE</option>
            <option value="F">FEMALE</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Guardian Name</label>
          <input type="text" value={newParentName} onChange={(e) => setNewParentName(e.target.value)} placeholder="FULL NAME..." className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold uppercase outline-none focus:ring-4 focus:ring-blue-500/10" />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Contact</label>
          <input type="text" value={newParentContact} onChange={(e) => setNewParentContact(e.target.value)} placeholder="PHONE..." className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10" />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Guardian Email</label>
          <input type="email" value={newParentEmail} onChange={(e) => setNewParentEmail(e.target.value)} placeholder="EMAIL@DOMAIN.COM" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10" />
        </div>
        <button type="submit" className="md:col-span-6 bg-blue-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase shadow-2xl hover:bg-black transition-all active:scale-95 tracking-widest">Enroll Pupil into Academy</button>
      </form>

      {/* Pupil Search Filter */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-blue-900/30">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, ID, or index..." className="w-full pl-14 pr-6 py-5 border border-gray-100 rounded-3xl text-sm font-bold bg-white shadow-sm outline-none focus:ring-8 focus:ring-blue-500/5 transition-all" />
      </div>

      {/* List of Registered Pupils */}
      <div className="grid grid-cols-1 gap-6">
        {filtered.map(student => (
          <div key={student.id} className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm hover:shadow-2xl transition-all duration-500 group/item">
            <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-8">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-blue-50 text-blue-900 flex items-center justify-center rounded-3xl font-black text-lg shadow-inner group-hover/item:bg-blue-900 group-hover/item:text-white transition-colors duration-500">
                   {student.id.toString().slice(-2)}
                 </div>
                 <div className="space-y-1.5">
                    <span className="font-black text-gray-900 uppercase text-lg block tracking-tight leading-none">{student.name}</span>
                    <div className="flex flex-wrap gap-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      <span className="bg-gray-100 px-3 py-1 rounded-full">INDEX: {student.id.toString().padStart(6, '0')}</span>
                      <span className="bg-gray-100 px-3 py-1 rounded-full">{student.gender === 'M' ? 'MALE' : 'FEMALE'}</span>
                    </div>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 max-w-4xl">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Parent Name</label>
                    <input 
                      type="text" 
                      value={student.parentName || ""} 
                      onChange={(e) => handleUpdateStudentField(student.id, 'parentName', e.target.value.toUpperCase())}
                      className="w-full border-b-2 border-transparent focus:border-blue-500 bg-transparent text-[11px] font-black text-blue-900 outline-none uppercase py-1" 
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Contact Phone</label>
                    <input 
                      type="text" 
                      value={student.parentContact || ""} 
                      onChange={(e) => handleUpdateStudentField(student.id, 'parentContact', e.target.value)}
                      className="w-full border-b-2 border-transparent focus:border-blue-500 bg-transparent text-[11px] font-black text-gray-700 outline-none py-1" 
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Email Address</label>
                    <input 
                      type="email" 
                      value={student.parentEmail || ""} 
                      onChange={(e) => handleUpdateStudentField(student.id, 'parentEmail', e.target.value.toLowerCase())}
                      className="w-full border-b-2 border-transparent focus:border-blue-500 bg-transparent text-[11px] font-black text-gray-700 outline-none py-1" 
                    />
                 </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setEditingId(editingId === student.id ? null : student.id)} className={`text-[10px] font-black uppercase px-6 py-3 rounded-2xl border transition-all ${editingId === student.id ? 'bg-blue-900 text-white border-blue-900 shadow-xl' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                  {editingId === student.id ? 'Close SBA' : 'Open SBA'}
                </button>
                <button onClick={() => handleDelete(student.id)} className="text-[10px] font-black text-red-600 uppercase bg-red-50 px-6 py-3 rounded-2xl border border-red-100 hover:bg-red-600 hover:text-white transition-all">
                  Delete
                </button>
              </div>
            </div>
            
            {editingId === student.id && (
              <div className="mt-10 pt-8 border-t border-gray-100 animate-in slide-in-from-top-4">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-3 h-3 bg-blue-600 rounded-full shadow-lg shadow-blue-200"></div>
                   <h5 className="text-[11px] font-black text-blue-900 uppercase tracking-[0.3em]">Continuous Assessment Records — {settings.activeMock}</h5>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-6">
                  {subjects.map(sub => {
                    const sba = student.mockData?.[settings.activeMock]?.sbaScores?.[sub] || 0;
                    return (
                      <div key={sub} className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 space-y-2.5 transition-all hover:bg-white hover:shadow-2xl hover:border-blue-100 group/sba">
                        <label className="text-[8px] font-black text-gray-400 uppercase truncate block group-hover/sba:text-blue-900 transition-colors" title={sub}>{sub}</label>
                        <input 
                          type="number" 
                          value={sba} 
                          onChange={(e) => handleUpdateSbaScore(student.id, sub, e.target.value)} 
                          className="w-full bg-white border border-gray-100 rounded-xl py-3 text-sm font-black text-center focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {filtered.length === 0 && (
         <div className="py-32 text-center opacity-30 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <p className="font-black uppercase text-sm tracking-[0.4em] text-gray-500">Zero matches found in database</p>
         </div>
      )}
    </div>
  );
};

export default PupilSBAPortal;
