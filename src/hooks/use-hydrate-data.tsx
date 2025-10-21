
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { defaultAcademicConfig, getAcademicConfig, setAcademicConfig, type AcademicConfig } from '@/lib/academic-config';
import { defaultAdminData, getAdminData, setAdminData, type AdminData } from '@/lib/admin-data';
import { defaultNotifications, getNotifications, setNotifications, type AppNotification } from '@/lib/notifications';
import { defaultTestSets, getAllTestSets, setAllTestSets, type TestSet } from '@/lib/question-bank';
import { defaultStoreConfig, getStoreConfig, setStoreConfig, type StoreConfig } from '@/lib/store-config';
import { defaultStudentData, getAllStudentData, setAllStudentData, defaultActivationCodes, getActivationCodes, setActivationCodes, type StudentProfile } from '@/lib/student-data';
import { defaultScheduledTests, getScheduledTestData, setScheduledTestData, type ScheduledTest } from '@/lib/test-schedule';
import { defaultWalletData, getWalletData, setWalletData, type WalletData } from '@/lib/user-data';
import { Loader2 } from 'lucide-react';

// Centralized state type
interface AppData {
  academicConfig: AcademicConfig;
  adminData: AdminData;
  notifications: AppNotification[];
  testSets: TestSet[];
  storeConfig: StoreConfig;
  studentData: StudentProfile[];
  activationCodes: string[];
  scheduledTests: ScheduledTest[];
  walletData: WalletData;
}

// Context for the data
const DataContext = createContext<AppData | null>(null);

// Context for setter functions
type DataUpdaters = {
  setAcademicConfig: (updater: (prev: AcademicConfig) => AcademicConfig) => void;
  setAdminData: (updater: (prev: AdminData) => AdminData) => void;
  setNotifications: (updater: (prev: AppNotification[]) => AppNotification[]) => void;
  setTestSets: (updater: (prev: TestSet[]) => TestSet[]) => void;
  setStoreConfig: (updater: (prev: StoreConfig) => StoreConfig) => void;
  setStudentData: (updater: (prev: StudentProfile[]) => StudentProfile[]) => void;
  setActivationCodes: (updater: (prev: string[]) => string[]) => void;
  setScheduledTests: (updater: (prev: ScheduledTest[]) => ScheduledTest[]) => void;
  setWalletData: (updater: (prev: WalletData) => WalletData) => void;
};
const DataUpdateContext = createContext<DataUpdaters | null>(null);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const [data, setData] = useState<AppData | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        // This effect runs only on the client, after the initial render.
        // It's safe to access localStorage here.
        setData({
            academicConfig: getAcademicConfig(),
            adminData: getAdminData(),
            notifications: getNotifications(),
            testSets: getAllTestSets(),
            storeConfig: getStoreConfig(),
            studentData: getAllStudentData(),
            activationCodes: getActivationCodes(),
            scheduledTests: getScheduledTestData(),
            walletData: getWalletData(),
        });
        setIsHydrated(true);
    }, []);

    const createSetter = <T,>(setterFunc: (data: T) => void, key: keyof AppData) =>
        useCallback((updater: (prev: T) => T) => {
            const currentData = (getters[key as keyof typeof getters] as () => T)();
            const newData = updater(currentData);
            setterFunc(newData);
            setData(prev => prev ? { ...prev, [key]: newData } : null);
        }, [key]);

    const getters = {
        academicConfig: getAcademicConfig,
        adminData: getAdminData,
        notifications: getNotifications,
        testSets: getAllTestSets,
        storeConfig: getStoreConfig,
        studentData: getAllStudentData,
        activationCodes: getActivationCodes,
        scheduledTests: getScheduledTestData,
        walletData: getWalletData,
    };
    
    const setters = {
        setAcademicConfig: createSetter(setAcademicConfig, 'academicConfig'),
        setAdminData: createSetter(setAdminData, 'adminData'),
        setNotifications: createSetter(setNotifications, 'notifications'),
        setTestSets: createSetter(setAllTestSets, 'testSets'),
        setStoreConfig: createSetter(setStoreConfig, 'storeConfig'),
        setStudentData: createSetter(setAllStudentData, 'studentData'),
        setActivationCodes: createSetter(setActivationCodes, 'activationCodes'),
        setScheduledTests: createSetter(setScheduledTestData, 'scheduledTests'),
        setWalletData: createSetter(setWalletData, 'walletData'),
    };

    if (!isHydrated || !data) {
        return (
             <div className="flex justify-center items-center h-screen w-screen">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <DataContext.Provider value={data}>
            <DataUpdateContext.Provider value={setters}>
                {children}
            </DataUpdateContext.Provider>
        </DataContext.Provider>
    );
};

// Custom hooks to access the data and setters
export const useAppData = () => {
    const context = useContext(DataContext);
    if (context === null) {
        throw new Error('useAppData must be used within a DataProvider');
    }
    return context;
};

export const useDataUpdaters = () => {
    const context = useContext(DataUpdateContext);
    if (context === null) {
        throw new Error('useDataUpdaters must be used within a DataProvider');
    }
    return context as DataUpdaters;
};
