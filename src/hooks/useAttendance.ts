/**
 * Attendance Hooks
 * Custom hooks for managing attendance data with local storage
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type {
  AttendanceSettings,
  Occasion,
  AttendanceSession,
  AttendanceRecord,
  AttendanceRecordWithMember,
  AttendanceMemberResult,
  CreateOccasionData,
  UpdateOccasionData,
  CreateAttendanceSessionData,
  UpdateAttendanceSessionData,
  MarkAttendanceData,
  BulkAttendanceOperation,
  AttendanceMarkingMode,
  PublicAttendanceLink,
} from '../types/attendance';
import {
  mockAttendanceSettings,
  mockOccasions,
  mockAttendanceSessions,
  mockAttendanceRecords,
  mockAttendanceMembers,
  STORAGE_KEYS,
} from '../data/mock';

// Hook for managing attendance settings
export function useAttendanceSettings(organizationId?: string, reloadTrigger?: boolean) {
  const [settings, setSettings] = useState<AttendanceSettings>(mockAttendanceSettings);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings from localStorage on mount and when reloadTrigger changes
  useEffect(() => {
    if (!organizationId) return;

    const stored = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_SETTINGS);
    if (stored) {
      try {
        const parsedSettings = JSON.parse(stored);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Failed to parse stored attendance settings:', error);
        setSettings(mockAttendanceSettings);
      }
    }
  }, [organizationId, reloadTrigger]);

  const updateSettings = useCallback(async (updates: Partial<AttendanceSettings>) => {
    setIsLoading(true);
    try {
      const updatedSettings = {
        ...settings,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      setSettings(updatedSettings);
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE_SETTINGS, JSON.stringify(updatedSettings));
      
      toast.success('Attendance settings updated successfully');
      return updatedSettings;
    } catch (error) {
      toast.error('Failed to update attendance settings');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [settings]);

  const resetSettings = useCallback(() => {
    setSettings(mockAttendanceSettings);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_SETTINGS, JSON.stringify(mockAttendanceSettings));
    toast.success('Settings reset to defaults');
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
    isLoading,
  };
}

// Hook for managing occasions
export function useOccasions(organizationId?: string) {
  const [occasions, setOccasions] = useState<Occasion[]>(mockOccasions);
  const [isLoading, setIsLoading] = useState(false);

  // Load occasions from localStorage on mount
  useEffect(() => {
    if (!organizationId) return;

    const stored = localStorage.getItem(STORAGE_KEYS.OCCASIONS);
    if (stored) {
      try {
        const parsedOccasions = JSON.parse(stored);
        setOccasions(parsedOccasions);
      } catch (error) {
        console.error('Failed to parse stored occasions:', error);
        setOccasions(mockOccasions);
      }
    }
  }, [organizationId]);

  const saveOccasions = useCallback((newOccasions: Occasion[]) => {
    setOccasions(newOccasions);
    localStorage.setItem(STORAGE_KEYS.OCCASIONS, JSON.stringify(newOccasions));
  }, []);

  const createOccasion = useCallback(async (data: CreateOccasionData) => {
    setIsLoading(true);
    try {
      const newOccasion: Occasion = {
        id: `occasion-${Date.now()}`,
        ...data,
        is_active: data.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedOccasions = [...occasions, newOccasion];
      saveOccasions(updatedOccasions);
      
      toast.success('Occasion created successfully');
      return newOccasion;
    } catch (error) {
      toast.error('Failed to create occasion');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [occasions, saveOccasions]);

  const updateOccasion = useCallback(async (data: UpdateOccasionData) => {
    setIsLoading(true);
    try {
      const updatedOccasions = occasions.map(occasion =>
        occasion.id === data.id
          ? { ...occasion, ...data, updated_at: new Date().toISOString() }
          : occasion
      );

      saveOccasions(updatedOccasions);
      
      toast.success('Occasion updated successfully');
      return updatedOccasions.find(o => o.id === data.id)!;
    } catch (error) {
      toast.error('Failed to update occasion');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [occasions, saveOccasions]);

  const deleteOccasion = useCallback(async (occasionId: string) => {
    setIsLoading(true);
    try {
      const updatedOccasions = occasions.filter(occasion => occasion.id !== occasionId);
      saveOccasions(updatedOccasions);
      
      toast.success('Occasion deleted successfully');
    } catch (error) {
      toast.error('Failed to delete occasion');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [occasions, saveOccasions]);

  const activeOccasions = useMemo(() => 
    occasions.filter(occasion => occasion.is_active), 
    [occasions]
  );

  return {
    occasions,
    activeOccasions,
    createOccasion,
    updateOccasion,
    deleteOccasion,
    isLoading,
  };
}

// Hook for managing attendance sessions
export function useAttendanceSessions(organizationId?: string) {
  const [sessions, setSessions] = useState<AttendanceSession[]>(mockAttendanceSessions);
  const [isLoading, setIsLoading] = useState(false);

  // Load sessions from localStorage on mount
  useEffect(() => {
    if (!organizationId) return;

    const stored = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_SESSIONS);
    if (stored) {
      try {
        const parsedSessions = JSON.parse(stored);
        setSessions(parsedSessions);
      } catch (error) {
        console.error('Failed to parse stored attendance sessions:', error);
        setSessions(mockAttendanceSessions);
      }
    }
  }, [organizationId]);

  const saveSessions = useCallback((newSessions: AttendanceSession[]) => {
    setSessions(newSessions);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_SESSIONS, JSON.stringify(newSessions));
  }, []);

  const createSession = useCallback(async (data: CreateAttendanceSessionData) => {
    setIsLoading(true);
    try {
      const newSession: AttendanceSession = {
        id: `session-${Date.now()}`,
        ...data,
        actual_count: 0,
        is_active: true,
        public_link_active: data.public_link_active || false,
        public_link_token: data.public_link_active ? `token-${Date.now()}` : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedSessions = [...sessions, newSession];
      saveSessions(updatedSessions);
      
      toast.success('Attendance session created successfully');
      return newSession;
    } catch (error) {
      toast.error('Failed to create attendance session');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessions, saveSessions]);

  const updateSession = useCallback(async (data: UpdateAttendanceSessionData) => {
    setIsLoading(true);
    try {
      const updatedSessions = sessions.map(session =>
        session.id === data.id
          ? { ...session, ...data, updated_at: new Date().toISOString() }
          : session
      );

      saveSessions(updatedSessions);
      
      toast.success('Attendance session updated successfully');
      return updatedSessions.find(s => s.id === data.id)!;
    } catch (error) {
      toast.error('Failed to update attendance session');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessions, saveSessions]);

  const activeSessions = useMemo(() => 
    sessions.filter(session => session.is_active), 
    [sessions]
  );

  const getSessionsByDate = useCallback((date: string) => 
    sessions.filter(session => session.session_date === date),
    [sessions]
  );

  const getSessionsByOccasion = useCallback((occasionId: string) => 
    sessions.filter(session => session.occasion_id === occasionId),
    [sessions]
  );

  return {
    sessions,
    activeSessions,
    createSession,
    updateSession,
    getSessionsByDate,
    getSessionsByOccasion,
    isLoading,
  };
}

// Hook for managing attendance records
export function useAttendanceRecords(organizationId?: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [members] = useState<AttendanceMemberResult[]>(mockAttendanceMembers);
  const [isLoading, setIsLoading] = useState(false);

  // Load records from localStorage on mount
  useEffect(() => {
    if (!organizationId) return;

    const stored = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_RECORDS);
    if (stored) {
      try {
        const parsedRecords = JSON.parse(stored);
        setRecords(parsedRecords);
      } catch (error) {
        console.error('Failed to parse stored attendance records:', error);
        setRecords(mockAttendanceRecords);
      }
    }
  }, [organizationId]);

  const saveRecords = useCallback((newRecords: AttendanceRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_RECORDS, JSON.stringify(newRecords));
  }, []);

  const markAttendance = useCallback(async (data: MarkAttendanceData) => {
    setIsLoading(true);
    try {
      // Find the session to get occasion_id and date
      const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE_SESSIONS) || '[]');
      const session = sessions.find((s: AttendanceSession) => s.id === data.session_id);
      
      if (!session) {
        throw new Error('Session not found');
      }

      // Check if record already exists
      const existingRecordIndex = records.findIndex(record =>
        record.member_id === data.member_id &&
        record.occasion_id === session.occasion_id &&
        record.attendance_date === session.session_date
      );

      let updatedRecords: AttendanceRecord[];

      if (existingRecordIndex >= 0) {
        // Update existing record
        updatedRecords = records.map((record, index) =>
          index === existingRecordIndex
            ? {
                ...record,
                is_present: data.is_present,
                marking_method: data.marking_method,
                marked_by: data.marked_by,
                marked_at: new Date().toISOString(),
                notes: data.notes || record.notes,
                updated_at: new Date().toISOString(),
              }
            : record
        );
      } else {
        // Create new record
        const newRecord: AttendanceRecord = {
          id: `record-${Date.now()}`,
          organization_id: data.organization_id,
          member_id: data.member_id,
          occasion_id: session.occasion_id,
          attendance_date: session.session_date,
          marked_at: new Date().toISOString(),
          marked_by: data.marked_by,
          marking_method: data.marking_method,
          notes: data.notes || '',
          is_present: data.is_present,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        updatedRecords = [...records, newRecord];
      }

      saveRecords(updatedRecords);
      
      const member = members.find(m => m.id === data.member_id);
      const action = data.is_present ? 'marked present' : 'marked absent';
      toast.success(`${member?.full_name || 'Member'} ${action}`);
      
      return updatedRecords.find(r => r.member_id === data.member_id)!;
    } catch (error) {
      toast.error('Failed to mark attendance');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [records, members, saveRecords]);

  const bulkMarkAttendance = useCallback(async (data: BulkAttendanceOperation) => {
    setIsLoading(true);
    try {
      const promises = data.member_ids.map(memberId =>
        markAttendance({
          organization_id: 'org-1', // TODO: Get from context
          session_id: data.session_id,
          member_id: memberId,
          is_present: data.is_present,
          marking_method: data.marking_method,
          marked_by: data.marked_by,
          notes: data.notes,
        })
      );

      await Promise.all(promises);
      
      const action = data.is_present ? 'marked present' : 'marked absent';
      toast.success(`${data.member_ids.length} members ${action}`);
    } catch (error) {
      toast.error('Failed to bulk mark attendance');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [markAttendance]);

  const getRecordsForSession = useCallback((sessionId: string): AttendanceRecordWithMember[] => {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE_SESSIONS) || '[]');
    const session = sessions.find((s: AttendanceSession) => s.id === sessionId);
    
    if (!session) return [];

    const sessionRecords = records.filter(record =>
      record.occasion_id === session.occasion_id &&
      record.attendance_date === session.session_date
    );

    return sessionRecords.map(record => ({
      ...record,
      member: members.find(member => member.id === record.member_id)!,
    })).filter(record => record.member);
  }, [records, members]);

  const getMemberAttendanceHistory = useCallback((memberId: string) => {
    return records.filter(record => record.member_id === memberId);
  }, [records]);

  return {
    records,
    markAttendance,
    bulkMarkAttendance,
    getRecordsForSession,
    getMemberAttendanceHistory,
    isLoading,
  };
}

// Hook for member search in attendance context
export function useAttendanceMemberSearch() {
  const [members] = useState<AttendanceMemberResult[]>(mockAttendanceMembers);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<AttendanceMarkingMode>('membershipId');

  const searchMembers = useCallback((term: string, mode: AttendanceMarkingMode) => {
    if (!term.trim()) return [];

    const searchLower = term.toLowerCase();
    
    return members.filter(member => {
      switch (mode) {
        case 'phone':
          return member.phone?.toLowerCase().includes(searchLower);
        case 'email':
          return member.email?.toLowerCase().includes(searchLower);
        case 'membershipId':
          return member.membership_id.toLowerCase().includes(searchLower);
        default:
          return (
            member.full_name.toLowerCase().includes(searchLower) ||
            member.membership_id.toLowerCase().includes(searchLower) ||
            member.email?.toLowerCase().includes(searchLower) ||
            member.phone?.toLowerCase().includes(searchLower)
          );
      }
    });
  }, [members]);

  const filteredMembers = useMemo(() => 
    searchMembers(searchTerm, searchMode), 
    [searchMembers, searchTerm, searchMode]
  );

  return {
    members,
    searchTerm,
    setSearchTerm,
    searchMode,
    setSearchMode,
    filteredMembers,
    searchMembers,
  };
}

// Hook for generating public attendance links
export function usePublicAttendanceLink() {
  const generateLink = useCallback((sessionId: string): PublicAttendanceLink | null => {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE_SESSIONS) || '[]');
    const session = sessions.find((s: AttendanceSession) => s.id === sessionId);
    
    if (!session || !session.public_link_active || !session.public_link_token) {
      return null;
    }

    const occasions = JSON.parse(localStorage.getItem(STORAGE_KEYS.OCCASIONS) || '[]');
    const occasion = occasions.find((o: Occasion) => o.id === session.occasion_id);
    
    if (!occasion) return null;

    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE_SETTINGS) || '{}');
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + (settings.public_link_expiry_hours || 24));

    return {
      token: session.public_link_token,
      session_id: sessionId,
      occasion_name: occasion.name,
      session_date: session.session_date,
      enabled_modes: settings.enabled_marking_modes || ['membershipId'],
      expires_at: expiryDate.toISOString(),
      is_active: session.public_link_active,
    };
  }, []);

  const getPublicLinkUrl = useCallback((token: string) => {
    return `${window.location.origin}/attendance/public/${token}`;
  }, []);

  return {
    generateLink,
    getPublicLinkUrl,
  };
}