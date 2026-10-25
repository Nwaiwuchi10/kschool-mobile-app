import React, { createContext, useContext, useEffect, useState } from 'react';
import { classService, SchoolClass } from '../services/class.service';
import { storageService } from '../services/storage.service';
import { useAuth } from './AuthContext';

export const FALLBACK_CLASSES: SchoolClass[] = [
  { _id: '1', name: 'Primary 1', code: 'primary-1', category: 'Primary', order: 1, isActive: true },
  { _id: '2', name: 'Primary 2', code: 'primary-2', category: 'Primary', order: 2, isActive: true },
  { _id: '3', name: 'Primary 3', code: 'primary-3', category: 'Primary', order: 3, isActive: true },
  { _id: '4', name: 'Primary 4', code: 'primary-4', category: 'Primary', order: 4, isActive: true },
  { _id: '5', name: 'Primary 5', code: 'primary-5', category: 'Primary', order: 5, isActive: true },
  { _id: '6', name: 'Primary 6', code: 'primary-6', category: 'Primary', order: 6, isActive: true },
  { _id: '7', name: 'JSS 1', code: 'jss-1', category: 'Junior Secondary', order: 7, isActive: true },
  { _id: '8', name: 'JSS 2', code: 'jss-2', category: 'Junior Secondary', order: 8, isActive: true },
  { _id: '9', name: 'JSS 3', code: 'jss-3', category: 'Junior Secondary', order: 9, isActive: true },
  { _id: '10', name: 'SS 1', code: 'ss-1', category: 'Senior Secondary', order: 10, isActive: true },
  { _id: '11', name: 'SS 2', code: 'ss-2', category: 'Senior Secondary', order: 11, isActive: true },
  { _id: '12', name: 'SS 3', code: 'ss-3', category: 'Senior Secondary', order: 12, isActive: true },
];

interface ClassContextType {
  classes: SchoolClass[];
  selectedClass: string;
  paidClass: string | null;
  isClassLocked: boolean;
  isLoadingClasses: boolean;
  selectClass: (className: string) => Promise<void>;
  refreshClasses: () => Promise<void>;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const ClassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, updateUserData } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[]>(FALLBACK_CLASSES);
  const [selectedClass, setSelectedClassState] = useState<string>('JSS 1');
  const [paidClass, setPaidClass] = useState<string | null>(null);
  const [isClassLocked, setIsClassLocked] = useState<boolean>(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState<boolean>(true);

  // Fetch classes from backend on mount
  const refreshClasses = async () => {
    try {
      setIsLoadingClasses(true);
      const data = await classService.getClasses();
      if (Array.isArray(data) && data.length > 0) {
        setClasses(data);
      }
    } catch (err) {
      console.warn('Could not load classes from backend, using fallback:', err);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  useEffect(() => {
    refreshClasses();
  }, []);

  // Restore selected class & check lock status when auth state changes
  useEffect(() => {
    const syncClassState = async () => {
      // 1. If user has class on profile, use it
      if (user?.class) {
        setSelectedClassState(user.class);
      } else {
        // Otherwise check local storage
        const saved = await storageService.getSelectedClass();
        if (saved) {
          setSelectedClassState(saved);
        }
      }

      // 2. If authenticated, fetch subscription class lock status
      if (token) {
        try {
          const status = await classService.getMyClassStatus();
          if (status.selectedClass) {
            setSelectedClassState(status.selectedClass);
          }
          setPaidClass(status.paidClass || null);
          setIsClassLocked(status.isClassLocked);
          if (status.paidClass && status.isClassLocked) {
            setSelectedClassState(status.paidClass);
          }
        } catch (err) {
          console.warn('Failed to fetch class lock status:', err);
        }
      } else {
        setPaidClass(null);
        setIsClassLocked(false);
      }
    };

    syncClassState();
  }, [user?.class, token]);

  const selectClass = async (className: string) => {
    const trimmed = className.trim();

    // Check lock
    if (isClassLocked && paidClass && paidClass.toLowerCase() !== trimmed.toLowerCase()) {
      throw new Error(
        `You have an active subscription for ${paidClass}. In accordance with your academic enrollment, you must remain in this class.`
      );
    }

    // Update local state and storage
    setSelectedClassState(trimmed);
    await storageService.setSelectedClass(trimmed);

    // If authenticated, sync with backend
    if (token) {
      try {
        await classService.selectClass(trimmed);
        updateUserData({ class: trimmed });
      } catch (err: any) {
        // If conflict error from backend, re-throw so UI modal can display it
        throw err;
      }
    }
  };

  return (
    <ClassContext.Provider
      value={{
        classes,
        selectedClass,
        paidClass,
        isClassLocked,
        isLoadingClasses,
        selectClass,
        refreshClasses,
      }}
    >
      {children}
    </ClassContext.Provider>
  );
};

export const useClass = () => {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error('useClass must be used within a ClassProvider');
  }
  return context;
};
