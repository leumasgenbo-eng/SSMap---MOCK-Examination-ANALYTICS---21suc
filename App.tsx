import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { calculateClassStatistics, processStudentData, generateFullDemoSuite } from './utils';
import { GlobalSettings, StudentData, StaffAssignment, SchoolRegistryEntry, ProcessedStudent } from './types';
import { supabase } from './supabaseClient';

// Organized Imports by Portal
import MasterSheet from './components/reports/MasterSheet';
import ReportCard from './components/reports/ReportCard';
import SeriesBroadSheet from './components/reports/SeriesBroadSheet';
import ManagementDesk from './components/management/ManagementDesk';
import SuperAdminPortal from './components/hq/SuperAdminPortal';
import LoginPortal from './components/auth/LoginPortal';
import SchoolRegistrationPortal from './components/auth/SchoolRegistrationPortal';
import PupilDashboard from './components/pupil/PupilDashboard';

import { RAW_STUDENTS, FACILITATORS, SUBJECT_LIST, DEFAULT_THRESHOLDS, DEFAULT_NORMALIZATION, DEFAULT_CATEGORY_THRESHOLDS } from './constants';

const MOCK_SERIES = Array.from({ length: 10 }, (_, i) => `MOCK ${i + 1}`);

const DEFAULT_SETTINGS: GlobalSettings = {
  schoolName: "UNITED BAYLOR ACADEMY",
  schoolAddress: "ACCRA DIGITAL CENTRE, GHANA",
  schoolNumber: "", 
  schoolLogo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AMXDA0YOT8bkgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmhuAAAAsklEQVR42u3XQQqAMAxE0X9P7n8pLhRBaS3idGbgvYVAKX0mSZI0SZIU47X2vPcZay1rrfV+S6XUt9ba9621pLXWfP9PkiRJkiRpqgB7/X/f53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le578HAAB//6B+n9VvAAAAAElFTkSuQmCC", 
  examTitle: "2ND MOCK 2025 BROAD SHEET EXAMINATION",
  termInfo: "TERM 2",
  academicYear: "2024/2025",
  nextTermBegin: "2025-05-12",
  attendanceTotal: "60",
  startDate: "10-02-2025",
  endDate: "15-02-2025",
  headTeacherName: "ACADEMY DIRECTOR",
  reportDate: new Date().toLocaleDateString(),
  schoolContact: "+233 24 350 4091",
  schoolEmail: "leumasgenbo@gmail.com",
  registrantName: "",
  registrantEmail: "",
  accessCode: "", 
  gradingThresholds: DEFAULT_THRESHOLDS,
  categoryThresholds: DEFAULT_CATEGORY_THRESHOLDS,
  normalizationConfig: DEFAULT_NORMALIZATION,
  sbaConfig: { enabled: true, isLocked: false, sbaWeight: 30, examWeight: 70 },
  isConductLocked: false,
  scoreEntryMetadata: { mockSeries: "MOCK 2", entryDate: new Date().toISOString().split('T')[0] },
  committedMocks: MOCK_SERIES,
  activeMock: "MOCK 3",
  resourcePortal: {},
  maxSectionA: 40,
  maxSectionB: 60,
  sortOrder: 'aggregate-asc',
  useTDistribution: true,
  reportTemplate: 'standard'
};

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'master' | 'reports' | 'management' | 'series' | 'pupil_hub'>('master');
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  
  // Auth & Reg State
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isFacilitator, setIsFacilitator] = useState(false);
  const [isPupil, setIsPupil] = useState(false);
  const [activeFacilitator, setActiveFacilitator] = useState<{ name: string; subject: string } | null>(null);
  const [activePupil, setActivePupil] = useState<ProcessedStudent | null>(null);
  const [isRemoteViewing, setIsRemoteViewing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Data State
  const [globalRegistry, setGlobalRegistry] = useState<SchoolRegistryEntry[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [students, setStudents] = useState<StudentData[]>(RAW_STUDENTS);
  const [facilitators, setFacilitators] = useState<Record<string, StaffAssignment>>({});

  // SUPABASE PRE-FLIGHT GATE: Mandatory data retrieval before starting
  const bootstrapData = useCallback(async () => {
    setIsInitializing(true);
    setSyncError(null);
    try {
      // 1. Handshake with Cloud Hub
      const { data, error } = await supabase.from('uba_persistence').select('id, payload');
      
      if (error) {
        throw new Error(error.message);
      }

      // 2. Map remote shards to state variables
      const remoteData: Record<string, any> = {};
      data?.forEach(row => { remoteData[row.id] = row.payload; });

      // 3. Update records with cloud truth
      if (remoteData['registry']) setGlobalRegistry(remoteData['registry']);
      if (remoteData['settings']) setSettings(remoteData['settings']);
      if (remoteData['students']) setStudents(remoteData['students']);
      if (remoteData['facilitators']) setFacilitators(remoteData['facilitators']);
      else {
           // Fallback to initial staff scaffold if not yet in cloud
           const initial: Record<string, StaffAssignment> = {};
           Object.keys(FACILITATORS).forEach((key, idx) => {
             initial[key] = {
               name: FACILITATORS[key], 
               role: 'FACILITATOR', 
               enrolledId: `FAC-${(idx + 1).toString().padStart(3, '0')}`,
               taughtSubject: key,
               invigilations: Array.from({ length: 9 }, () => ({ dutyDate: '', timeSlot: '', subject: '' })),
               marking: { dateTaken: '', dateReturned: '', inProgress: false }
             };
           });
           setFacilitators(initial);
      }
    } catch (err: any) {
      console.warn("Supabase Sync Failed:", err.message);
      setSyncError("Cloud Hub Unavailable. Running in Restricted Local Mode.");
    } finally {
      // Small visual delay for the "Establishing Secure Node" branding
      setTimeout(() => setIsInitializing(false), 1200);
    }
  }, []);

  useEffect(() => {
    bootstrapData();
  }, [bootstrapData]);

  const handleSettingChange = (key: keyof GlobalSettings, value: any) => { setSettings(prev => ({ ...prev, [key]: value })); };
  const bulkUpdateSettings = useCallback((updates: Partial<GlobalSettings>) => { setSettings(prev => ({ ...prev, ...updates })); }, []);

  const { stats, processedStudents, classAvgAggregate } = useMemo(() => {
    const s = calculateClassStatistics(students, settings);
    const staffNames: Record<string, string> = {};
    Object.keys(facilitators).forEach(k => { staffNames[k] = facilitators[k].name; });
    const processed = processStudentData(s, students, staffNames, settings);
    const avgAgg = processed.length > 0 ? processed.reduce((sum, st) => sum + st.bestSixAggregate, 0) / processed.length : 0;
    return { stats: s, processedStudents: processed, classAvgAggregate: avgAgg };
  }, [students, facilitators, settings]);

  const handleStudentOverallRemarkUpdate = useCallback((studentId: number, remark: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const mockSet = s.mockData?.[settings.activeMock] || {
        scores: {}, sbaScores: {}, examSubScores: {}, facilitatorRemarks: {},
        observations: { facilitator: "", invigilator: "", examiner: "" },
        attendance: 0, conductRemark: ""
      };
      const newFacRemarks = { ...(mockSet.facilitatorRemarks || {}), overall: remark };
      return {
        ...s,
        mockData: { ...(s.mockData || {}), [settings.activeMock]: { ...mockSet, facilitatorRemarks: newFacRemarks } }
      };
    }));
  }, [settings.activeMock]);

  // Universal Cloud Save Protocol
  const handleSave = useCallback(async () => {
    if (isRemoteViewing) return;
    
    const timestamp = new Date().toISOString();
    const payload = [
      { id: 'settings', payload: settings, last_updated: timestamp },
      { id: 'students', payload: students, last_updated: timestamp },
      { id: 'facilitators', payload: facilitators, last_updated: timestamp }
    ];

    try {
      const { error } = await supabase.from('uba_persistence').upsert(payload, { onConflict: 'id' });
      if (error) throw error;

      if (settings.schoolNumber) {
        const nextRegistry = [...globalRegistry];
        const entryIdx = nextRegistry.findIndex(r => r.id === settings.schoolNumber);
        if (entryIdx > -1) {
          nextRegistry[entryIdx].fullData = { settings, students, facilitators };
          nextRegistry[entryIdx].studentCount = students.length;
          nextRegistry[entryIdx].lastActivity = timestamp;
          
          await supabase.from('uba_persistence').upsert({ 
            id: 'registry', 
            payload: nextRegistry, 
            last_updated: timestamp 
          });
          setGlobalRegistry(nextRegistry);
        }
      }
      alert("Cloud Sync Successful: Institutional Records Secured.");
    } catch (err: any) {
      alert("Cloud Save Restricted: Local Session Preservation Active.");
    }
  }, [settings, students, facilitators, globalRegistry, isRemoteViewing]);

  const initializeDemo = async () => {
    if (window.confirm("Initialize UNITED BAYLOR ACADEMY cloud demo suite?")) {
      const { students: demoStudents, resourcePortal, mockSnapshots, registryEntry } = generateFullDemoSuite();
      setStudents(demoStudents);
      const nextSettings = { 
        ...settings, 
        schoolName: "UNITED BAYLOR ACADEMY", 
        schoolNumber: "UBA-2025-001",
        accessCode: "SSMAP-HQ-SECURE",
        resourcePortal,
        mockSnapshots,
        activeMock: "MOCK 3" 
      };
      setSettings(nextSettings);

      const filteredRegistry = globalRegistry.filter(r => r.id !== registryEntry.id);
      filteredRegistry.push({
          ...registryEntry,
          name: "UNITED BAYLOR ACADEMY",
          fullData: { settings: nextSettings, students: demoStudents, facilitators }
      });
      
      setGlobalRegistry(filteredRegistry);
      setTimeout(() => handleSave(), 200);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-10 animate-in fade-in duration-500 p-8">
        <div className="relative">
           <div className="w-32 h-32 border-4 border-blue-900/20 rounded-[3rem] animate-pulse"></div>
           <div className="absolute inset-0 w-32 h-32 border-4 border-blue-500 border-t-transparent rounded-[3rem] animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
              <img src={DEFAULT_SETTINGS.schoolLogo} alt="Shield" className="w-16 h-16 object-contain" />
           </div>
        </div>
        <div className="text-center space-y-4">
           <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Establishing Secure Node</h2>
           <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] animate-pulse">
             {syncError ? syncError : "Retrieving Cloud Records..."}
           </p>
           {syncError && (
             <button onClick={bootstrapData} className="mt-4 bg-white/10 hover:bg-white text-white hover:text-slate-900 px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all">
               Retry Handshake
             </button>
           )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-black">
        {isRegistering ? (
          <SchoolRegistrationPortal 
            settings={settings} onBulkUpdate={bulkUpdateSettings} onSave={handleSave}
            onComplete={() => setIsRegistering(false)} onSwitchToLogin={() => setIsRegistering(false)}
          />
        ) : (
          <LoginPortal 
            settings={settings} facilitators={facilitators} processedStudents={processedStudents}
            onLoginSuccess={() => setIsAuthenticated(true)} onSuperAdminLogin={() => setIsSuperAdmin(true)} 
            onFacilitatorLogin={(name, subject) => { setIsFacilitator(true); setActiveFacilitator({ name, subject }); setIsAuthenticated(true); setViewMode('master'); }}
            onPupilLogin={(id) => { const s = processedStudents.find(p => p.id === id); if(s){ setActivePupil(s); setIsPupil(true); setIsAuthenticated(true); setViewMode('pupil_hub'); } }}
            onSwitchToRegister={() => setIsRegistering(true)}
          />
        )}
      </div>
    );
  }

  if (isSuperAdmin) return <SuperAdminPortal onExit={() => setIsSuperAdmin(false)} onRemoteView={(id) => {
    const school = globalRegistry.find(r => r.id === id);
    if (school && school.fullData) {
      setSettings(school.fullData.settings); setStudents(school.fullData.students); setFacilitators(school.fullData.facilitators);
      setIsRemoteViewing(true); setIsSuperAdmin(false); setIsAuthenticated(true); setViewMode('master');
    }
  }} />;

  return (
    <div className={`min-h-screen bg-gray-100 font-sans flex flex-col ${viewMode === 'master' || viewMode === 'series' ? 'print-landscape' : 'print-portrait'}`}>
      <div className="no-print bg-blue-900 text-white p-4 sticky top-0 z-50 shadow-md flex justify-between items-center flex-wrap gap-2">
        <div className="flex bg-blue-800 rounded p-1 text-[10px] md:text-sm">
          {!isPupil ? (
            <>
              <button onClick={() => setViewMode('master')} className={`px-3 py-1 rounded transition ${viewMode === 'master' ? 'bg-white text-blue-900 font-bold' : 'text-blue-200 hover:text-white'}`}>Broad Sheets</button>
              <button onClick={() => setViewMode('series')} className={`px-3 py-1 rounded transition ${viewMode === 'series' ? 'bg-white text-blue-900 font-bold' : 'text-blue-200 hover:text-white'}`}>Series Tracker</button>
              <button onClick={() => setViewMode('reports')} className={`px-3 py-1 rounded transition ${viewMode === 'reports' ? 'bg-white text-blue-900 font-bold' : 'text-blue-200 hover:text-white'}`}>Pupil Reports</button>
              <button onClick={() => setViewMode('management')} className={`px-3 py-1 rounded transition ${viewMode === 'management' ? 'bg-white text-blue-900 font-bold' : 'text-blue-200 hover:text-white'}`}>Mgmt Desk</button>
            </>
          ) : (
            <button onClick={() => setViewMode('pupil_hub')} className={`px-3 py-1 rounded transition ${viewMode === 'pupil_hub' ? 'bg-white text-blue-900 font-bold' : 'text-blue-200 hover:text-white'}`}>My Dashboard</button>
          )}
        </div>
        <div className="flex gap-2">
           {!isRemoteViewing && !isPupil && <button onClick={handleSave} className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 px-4 py-2 rounded font-black shadow transition text-xs uppercase">Cloud Sync</button>}
           <button onClick={() => window.print()} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-black shadow transition text-xs uppercase">Print</button>
           <button onClick={() => { setIsAuthenticated(false); setIsSuperAdmin(false); setIsFacilitator(false); setIsPupil(false); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-black text-xs uppercase ml-2">Logout</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-100 p-4 md:p-8">
        {viewMode === 'master' && !isPupil && <MasterSheet students={processedStudents} stats={stats} settings={settings} onSettingChange={handleSettingChange} facilitators={facilitators} isFacilitator={isFacilitator} />}
        {viewMode === 'series' && !isPupil && <SeriesBroadSheet students={students} settings={settings} onSettingChange={handleSettingChange} currentProcessed={processedStudents.map(p => ({ id: p.id, aggregate: p.bestSixAggregate, rank: p.rank, totalScore: p.totalScore, category: p.category }))} />}
        {viewMode === 'reports' && !isPupil && (
          <div className="space-y-8">
            <div className="no-print mb-4"><input type="text" placeholder="Search pupils..." value={reportSearchTerm} onChange={(e) => setReportSearchTerm(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:ring-4 focus:ring-blue-500/10" /></div>
            {processedStudents.filter(s => s.name.toLowerCase().includes(reportSearchTerm.toLowerCase())).map(student => (
              <ReportCard key={student.id} student={student} stats={stats} settings={settings} onSettingChange={handleSettingChange} onStudentUpdate={handleStudentOverallRemarkUpdate} classAverageAggregate={classAvgAggregate} totalEnrolled={processedStudents.length} isFacilitator={isFacilitator} />
            ))}
          </div>
        )}
        {viewMode === 'management' && !isPupil && (
          <ManagementDesk 
            students={students} setStudents={setStudents} facilitators={facilitators} setFacilitators={setFacilitators} 
            subjects={SUBJECT_LIST} settings={settings} onSettingChange={handleSettingChange} 
            onBulkUpdate={bulkUpdateSettings} onSave={handleSave} processedSnapshot={processedStudents} 
            onLoadDummyData={initializeDemo} onClearData={() => {}} isFacilitator={isFacilitator} activeFacilitator={activeFacilitator}
          />
        )}
        {viewMode === 'pupil_hub' && isPupil && activePupil && (
          <PupilDashboard 
            student={activePupil} stats={stats} settings={settings} classAverageAggregate={classAvgAggregate} 
            totalEnrolled={processedStudents.length} onSettingChange={handleSettingChange} globalRegistry={globalRegistry}
          />
        )}
      </div>
    </div>
  );
};

export default App;
