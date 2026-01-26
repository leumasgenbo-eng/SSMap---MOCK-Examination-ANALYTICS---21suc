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
  schoolNumber: "UBA-2026-7448", 
  schoolLogo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AMXDA0YOT8bkgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmhuAAAAsklEQVR42u3XQQqAMAxE0X9P7n8pLhRBaS3idGbgvYVAKX0mSZI0SZIU47X2vPcZay1rrV+S6XUt9ba9621pLXWfP9PkiRJkiRpqgB7/X/f53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le578HAAB//6B+n9VvAAAAAElFTkSuQmCC", 
  examTitle: "2ND MOCK 2025 BROAD SHEET EXAMINATION",
  termInfo: "TERM 2",
  academicYear: "2024/2025",
  nextTermBegin: "2025-05-12",
  attendanceTotal: "60",
  startDate: "10-02-2025",
  endDate: "15-02-2025",
  headTeacherName: "SA",
  reportDate: new Date().toLocaleDateString(),
  schoolContact: "+233 24 350 4091",
  schoolEmail: "leumasgenbo@gmail.com",
  registrantName: "SA",
  registrantEmail: "leumasgenbo@gmail.com",
  accessCode: "SEC-C208VC85", 
  gradingThresholds: DEFAULT_THRESHOLDS,
  categoryThresholds: DEFAULT_CATEGORY_THRESHOLDS,
  normalizationConfig: DEFAULT_NORMALIZATION,
  sbaConfig: { enabled: true, isLocked: false, sbaWeight: 30, examWeight: 70 },
  isConductLocked: false,
  scoreEntryMetadata: { mockSeries: "MOCK 2", entryDate: new Date().toISOString().split('T')[0] },
  committedMocks: MOCK_SERIES,
  activeMock: "MOCK 1",
  resourcePortal: {},
  maxSectionA: 40,
  maxSectionB: 60,
  sortOrder: 'aggregate-asc',
  useTDistribution: true,
  reportTemplate: 'standard'
};

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [viewMode, setViewMode] = useState<'master' | 'reports' | 'management' | 'series' | 'pupil_hub'>('master');
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  
  // Auth & Reg State
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isFacilitator, setIsFacilitator] = useState(false);
  const [isPupil, setIsPupil] = useState(false);
  const [activeFacilitator, setActiveFacilitator] = useState<{ name: string; subject: string } | null>(null);
  const [activePupil, setActivePupil] = useState<ProcessedStudent | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [postRegistrationData, setPostRegistrationData] = useState<any>(null);
  
  // Data State
  const [globalRegistry, setGlobalRegistry] = useState<SchoolRegistryEntry[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [students, setStudents] = useState<StudentData[]>(RAW_STUDENTS);
  const [facilitators, setFacilitators] = useState<Record<string, StaffAssignment>>({});

  // 1. BOOTSTRAP: Fetch only the Registry for Login Verification
  const fetchRegistry = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('uba_persistence').select('payload').eq('id', 'registry').single();
      if (data && data.payload) {
         setGlobalRegistry(data.payload as SchoolRegistryEntry[]);
      }
    } catch (err) {
      console.warn("Registry sync unavailable. Using local buffer.");
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // 2. SESSION LOAD: Fetch school-specific data after login
  const loadSchoolSession = async (hubId: string) => {
    setIsInitializing(true);
    try {
      const { data, error } = await supabase.from('uba_persistence').select('id, payload').like('id', `${hubId}_%`);
      if (data && data.length > 0) {
        const remote: any = {};
        data.forEach(row => { remote[row.id] = row.payload; });
        if (remote[`${hubId}_settings`]) setSettings(remote[`${hubId}_settings`]);
        if (remote[`${hubId}_students`]) setStudents(remote[`${hubId}_students`]);
        if (remote[`${hubId}_facilitators`]) setFacilitators(remote[`${hubId}_facilitators`]);
      }
    } catch (err) {
      console.error("School shard load failed.");
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => { fetchRegistry(); }, [fetchRegistry]);

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

  const handleSave = useCallback(async () => {
    const hubId = settings.schoolNumber;
    if (!hubId) {
      alert("Registration incomplete. Cannot sync to cloud.");
      return;
    }
    
    const timestamp = new Date().toISOString();
    const shards = [
      { id: `${hubId}_settings`, payload: settings, last_updated: timestamp },
      { id: `${hubId}_students`, payload: students, last_updated: timestamp },
      { id: `${hubId}_facilitators`, payload: facilitators, last_updated: timestamp }
    ];

    try {
      await supabase.from('uba_persistence').upsert(shards, { onConflict: 'id' });
      
      const nextRegistry = globalRegistry.map(r => r.id === hubId ? { ...r, studentCount: students.length, lastActivity: timestamp } : r);
      await supabase.from('uba_persistence').upsert({ id: 'registry', payload: nextRegistry, last_updated: timestamp });
      setGlobalRegistry(nextRegistry);

      alert("Cloud Sync Successful.");
    } catch (err) {
      alert("Cloud Sync Restricted.");
    }
  }, [settings, students, facilitators, globalRegistry]);

  const handleRegistrationComplete = (data: any) => {
    setPostRegistrationData(data);
    setIsRegistering(false);
    fetchRegistry();
  };

  const onLoadDummyData = () => {
    const { students: s, resourcePortal: rp, mockSnapshots: ms } = generateFullDemoSuite();
    setStudents(s);
    bulkUpdateSettings({ resourcePortal: rp, mockSnapshots: ms });
  };

  const clearData = () => {
    if(window.confirm("Switch to Real Mode? This will clear all current demo session data.")) {
        setStudents(RAW_STUDENTS);
        setFacilitators({});
        handleSave();
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
        <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-[2rem] animate-spin"></div>
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] animate-pulse">Establishing Secure Hub Connection</p>
      </div>
    );
  }

  if (!isAuthenticated && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-black">
        {isRegistering ? (
          <SchoolRegistrationPortal 
            settings={settings} onBulkUpdate={bulkUpdateSettings} onSave={handleSave}
            onComplete={handleRegistrationComplete} 
            onSwitchToLogin={() => setIsRegistering(false)}
          />
        ) : (
          <LoginPortal 
            settings={settings} facilitators={facilitators} processedStudents={processedStudents} globalRegistry={globalRegistry}
            initialCredentials={postRegistrationData}
            onLoginSuccess={(hubId) => { loadSchoolSession(hubId); setIsAuthenticated(true); }} 
            onSuperAdminLogin={() => setIsSuperAdmin(true)} 
            onFacilitatorLogin={(name, subject, hubId) => { 
               loadSchoolSession(hubId).then(() => {
                 setIsFacilitator(true); setActiveFacilitator({ name, subject }); setIsAuthenticated(true); setViewMode('master'); 
               });
            }}
            onPupilLogin={(id, hubId) => { 
               loadSchoolSession(hubId).then(() => {
                  const s = processedStudents.find(p => p.id === id); 
                  if(s){ setActivePupil(s); setIsPupil(true); setIsAuthenticated(true); setViewMode('pupil_hub'); }
               });
            }}
            onSwitchToRegister={() => setIsRegistering(true)}
          />
        )}
      </div>
    );
  }

  if (isSuperAdmin) return <SuperAdminPortal onExit={() => setIsSuperAdmin(false)} onRemoteView={(id) => { loadSchoolSession(id); setIsSuperAdmin(false); setIsAuthenticated(true); setViewMode('master'); }} />;

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
           {!isPupil && <button onClick={handleSave} className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 px-4 py-2 rounded font-black shadow transition text-xs uppercase">Cloud Sync</button>}
           <button onClick={() => window.print()} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-black shadow transition text-xs uppercase">Print</button>
           <button onClick={() => { window.location.reload(); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-black text-xs uppercase ml-2">Logout</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-100 p-4 md:p-8">
        {viewMode === 'master' && !isPupil && <MasterSheet students={processedStudents} stats={stats} settings={settings} onSettingChange={handleSettingChange} facilitators={facilitators} isFacilitator={isFacilitator} />}
        {viewMode === 'series' && !isPupil && <SeriesBroadSheet students={students} settings={settings} onSettingChange={handleSettingChange} currentProcessed={processedStudents.map(p => ({ id: p.id, aggregate: p.bestSixAggregate, rank: p.rank, totalScore: p.totalScore, category: p.category }))} />}
        {viewMode === 'reports' && !isPupil && (
          <div className="space-y-8">
            <div className="no-print mb-4"><input type="text" placeholder="Search pupils..." value={reportSearchTerm} onChange={(e) => setReportSearchTerm(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:ring-4 focus:ring-blue-500/10 font-black" /></div>
            {processedStudents.filter(s => s.name.toLowerCase().includes(reportSearchTerm.toLowerCase())).map(student => (
              <ReportCard key={student.id} student={student} stats={stats} settings={settings} onSettingChange={handleSettingChange} classAverageAggregate={classAvgAggregate} totalEnrolled={processedStudents.length} isFacilitator={isFacilitator} />
            ))}
          </div>
        )}
        {viewMode === 'management' && !isPupil && (
          <ManagementDesk 
            students={students} setStudents={setStudents} facilitators={facilitators} setFacilitators={setFacilitators} 
            subjects={SUBJECT_LIST} settings={settings} onSettingChange={handleSettingChange} 
            onBulkUpdate={bulkUpdateSettings} onSave={handleSave} processedSnapshot={processedStudents} 
            onLoadDummyData={onLoadDummyData} onClearData={clearData} isFacilitator={isFacilitator} activeFacilitator={activeFacilitator}
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