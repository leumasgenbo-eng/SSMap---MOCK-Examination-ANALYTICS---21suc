
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { calculateClassStatistics, processStudentData, generateFullDemoSuite } from './utils';
import { GlobalSettings, StudentData, StaffAssignment, SchoolRegistryEntry, ProcessedStudent } from './types';

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
  schoolName: "CULBURY ACADEMY",
  schoolAddress: "ACCRA DIGITAL CENTRE, GHANA",
  schoolNumber: "", 
  schoolLogo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AMXDA0YOT8bkgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmhuAAAAsklEQVR42u3XQQqAMAxE0X9P7n8pLhRBaS3idGbgvYVAKX0mSZI0SZIU47X2vPcZay1rrfV+S6XUt9ba9621pLXWfP9PkiRJkiRpqgB7/X/f53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le578HAAB//6B+n9VvAAAAAElFTkSuQmCC", 
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
  
  // Fix: Added missing globalRegistry state and its setter to satisfy references in initializeDemo, handleSave, and PupilDashboard
  const [globalRegistry, setGlobalRegistry] = useState<SchoolRegistryEntry[]>(() => {
    const saved = localStorage.getItem('uba_global_registry');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<GlobalSettings>(() => {
    const saved = localStorage.getItem('uba_app_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [students, setStudents] = useState<StudentData[]>(() => {
    const saved = localStorage.getItem('uba_students');
    return saved ? JSON.parse(saved) : RAW_STUDENTS;
  });

  const getDefaultFacilitators = useCallback(() => {
    const initial: Record<string, StaffAssignment> = {};
    Object.keys(FACILITATORS).forEach((key, idx) => {
      initial[key] = {
        name: '', // Empty for real entry
        role: 'FACILITATOR', 
        enrolledId: `FAC-${(idx + 1).toString().padStart(3, '0')}`,
        taughtSubject: key,
        invigilations: Array.from({ length: 9 }, () => ({ dutyDate: '', timeSlot: '', subject: '' })),
        marking: { dateTaken: '', dateReturned: '', inProgress: false }
      };
    });
    return initial;
  }, []);

  const [facilitators, setFacilitators] = useState<Record<string, StaffAssignment>>(() => {
    const saved = localStorage.getItem('uba_facilitators');
    if (saved) return JSON.parse(saved);
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
    return initial;
  });

  useEffect(() => { if (!isRemoteViewing) localStorage.setItem('uba_app_settings', JSON.stringify(settings)); }, [settings, isRemoteViewing]);
  useEffect(() => { if (!isRemoteViewing) localStorage.setItem('uba_students', JSON.stringify(students)); }, [students, isRemoteViewing]);
  useEffect(() => { if (!isRemoteViewing) localStorage.setItem('uba_facilitators', JSON.stringify(facilitators)); }, [facilitators, isRemoteViewing]);

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
        mockData: {
          ...(s.mockData || {}),
          [settings.activeMock]: { ...mockSet, facilitatorRemarks: newFacRemarks }
        }
      };
    }));
  }, [settings.activeMock]);

  const initializeDemo = () => {
    if (window.confirm("Initialize CULBURY ACADEMY demo suite?")) {
      const { students: demoStudents, resourcePortal, mockSnapshots, registryEntry } = generateFullDemoSuite();
      setStudents(demoStudents);
      setSettings(prev => ({ 
        ...prev, 
        schoolName: "CULBURY ACADEMY", 
        schoolNumber: "CBA-2025-001",
        accessCode: "SSMAP-HQ-SECURE",
        resourcePortal,
        mockSnapshots,
        activeMock: "MOCK 3" 
      }));

      const existingRegistry: SchoolRegistryEntry[] = JSON.parse(localStorage.getItem('uba_global_registry') || '[]');
      const filteredRegistry = existingRegistry.filter(r => r.id !== registryEntry.id);
      filteredRegistry.push({
          ...registryEntry,
          fullData: { settings: { ...DEFAULT_SETTINGS, resourcePortal, mockSnapshots, schoolName: "CULBURY ACADEMY", schoolNumber: "CBA-2025-001", accessCode: "SSMAP-HQ-SECURE" }, students: demoStudents, facilitators }
      });
      localStorage.setItem('uba_global_registry', JSON.stringify(filteredRegistry));
      // Fix: Used newly defined setGlobalRegistry setter
      setGlobalRegistry(filteredRegistry);

      alert("Demo Data Synchronized.");
    }
  };

  const handleClearData = () => {
    if (window.confirm("SWITCH TO REAL MODE: This will wipe all pupil names, scores, and staff identity to allow for fresh institutional data entry. Institutional credentials will remain. Proceed?")) {
      setStudents([]); // Completely clear pupils
      setFacilitators(getDefaultFacilitators()); // Reset staff names to empty
      setSettings(prev => ({
        ...prev,
        resourcePortal: {},
        mockSnapshots: {}
      }));
      alert("Demo data deactivated. Institutional areas are now ready for real data entry.");
    }
  };

  const handleSave = useCallback(() => {
    if (isRemoteViewing) return;
    localStorage.setItem('uba_app_settings', JSON.stringify(settings));
    localStorage.setItem('uba_students', JSON.stringify(students));
    localStorage.setItem('uba_facilitators', JSON.stringify(facilitators));
    // Also sync to registry if possible for ranking accuracy
    if (settings.schoolNumber) {
      const registry: SchoolRegistryEntry[] = JSON.parse(localStorage.getItem('uba_global_registry') || '[]');
      const entryIdx = registry.findIndex(r => r.id === settings.schoolNumber);
      if (entryIdx > -1) {
        registry[entryIdx].fullData = { settings, students, facilitators };
        registry[entryIdx].studentCount = students.length;
        registry[entryIdx].lastActivity = new Date().toISOString();
        localStorage.setItem('uba_global_registry', JSON.stringify(registry));
        // Fix: Used newly defined setGlobalRegistry setter
        setGlobalRegistry(registry);
      }
    }
  }, [settings, students, facilitators, isRemoteViewing]);

  const handleRemoteView = (schoolId: string) => {
    const registry: SchoolRegistryEntry[] = JSON.parse(localStorage.getItem('uba_global_registry') || '[]');
    const school = registry.find(r => r.id === schoolId);
    if (school && school.fullData) {
      setSettings(school.fullData.settings); setStudents(school.fullData.students); setFacilitators(school.fullData.facilitators);
      setIsRemoteViewing(true); setIsSuperAdmin(false); setIsAuthenticated(true); setViewMode('master');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsSuperAdmin(false);
    setIsFacilitator(false);
    setIsPupil(false);
    setActiveFacilitator(null);
    setActivePupil(null);
    setIsRemoteViewing(false);
  };

  const handleFacilitatorLogin = (name: string, subject: string) => {
    setIsFacilitator(true);
    setActiveFacilitator({ name, subject });
    setIsAuthenticated(true);
    setViewMode('master');
  };

  const handlePupilLogin = (studentId: number) => {
    const student = processedStudents.find(s => s.id === studentId);
    if (student) {
      setActivePupil(student);
      setIsPupil(true);
      setIsAuthenticated(true);
      setViewMode('pupil_hub');
    }
  };

  if (!isAuthenticated && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-black">
        {isRegistering ? (
          <SchoolRegistrationPortal 
            settings={settings}
            onBulkUpdate={bulkUpdateSettings}
            onSave={handleSave}
            onComplete={() => { setIsRegistering(false); }}
            onSwitchToLogin={() => setIsRegistering(false)}
          />
        ) : (
          <LoginPortal 
            settings={settings} 
            facilitators={facilitators}
            processedStudents={processedStudents}
            onLoginSuccess={() => setIsAuthenticated(true)} 
            onSuperAdminLogin={() => setIsSuperAdmin(true)} 
            onFacilitatorLogin={handleFacilitatorLogin}
            onPupilLogin={handlePupilLogin}
            onSwitchToRegister={() => setIsRegistering(true)}
          />
        )}
      </div>
    );
  }

  if (isSuperAdmin) return <SuperAdminPortal onExit={() => setIsSuperAdmin(false)} onRemoteView={handleRemoteView} />;

  const isLandscapeView = viewMode === 'master' || viewMode === 'series';

  return (
    <div className={`min-h-screen bg-gray-100 font-sans flex flex-col ${isLandscapeView ? 'print-landscape' : 'print-portrait'}`}>
      {isRemoteViewing && (
        <div className="no-print bg-red-600 text-white px-4 py-2 flex justify-between items-center text-[10px] font-black uppercase tracking-widest animate-pulse z-[60]">
          <div>HQ REMOTE COMMAND: {settings.schoolName}</div>
          <button onClick={() => setIsRemoteViewing(false)} className="bg-white text-red-600 px-4 py-1.5 rounded-lg font-black uppercase text-[8px]">Exit Command</button>
        </div>
      )}

      {isFacilitator && (
        <div className="no-print bg-indigo-700 text-white px-4 py-1.5 flex justify-center items-center text-[9px] font-black uppercase tracking-[0.3em] z-[60]">
          Facilitator Command: {activeFacilitator?.name} ({activeFacilitator?.subject})
        </div>
      )}

      {isPupil && (
        <div className="no-print bg-emerald-700 text-white px-4 py-1.5 flex justify-center items-center text-[9px] font-black uppercase tracking-[0.3em] z-[60]">
          Candidate Session: {activePupil?.name} (ID: {activePupil?.id})
        </div>
      )}

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
           {!isRemoteViewing && !isPupil && <button onClick={() => { handleSave(); alert("Records Synchronized."); }} className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 px-4 py-2 rounded font-black shadow transition text-xs uppercase">Save All</button>}
           <button onClick={() => window.print()} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-black shadow transition text-xs uppercase">Print View</button>
           <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-black text-xs uppercase ml-2">Logout</button>
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
            onLoadDummyData={initializeDemo} onClearData={handleClearData} isFacilitator={isFacilitator} activeFacilitator={activeFacilitator}
          />
        )}
        {viewMode === 'pupil_hub' && isPupil && activePupil && (
          <PupilDashboard 
            student={activePupil} 
            stats={stats} 
            settings={settings} 
            classAverageAggregate={classAvgAggregate} 
            totalEnrolled={processedStudents.length} 
            onSettingChange={handleSettingChange}
            // Fix: Passed newly defined globalRegistry state
            globalRegistry={globalRegistry}
          />
        )}
      </div>
    </div>
  );
};

export default App;
