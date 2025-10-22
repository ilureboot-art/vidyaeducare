
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

import { defaultAcademicConfig, type AcademicConfig } from '@/lib/academic-config';
import { defaultAdminData, type AdminData } from '@/lib/admin-data';
import { defaultNotifications, type AppNotification } from '@/lib/notifications';
import { defaultTestSets, type TestSet } from '@/lib/question-bank';
import { defaultStoreConfig, type StoreConfig } from '@/lib/store-config';
import { defaultStudentData, defaultActivationCodes, type StudentProfile } from '@/lib/student-data';
import { defaultScheduledTests, type ScheduledTest } from '@/lib/test-schedule';
import { defaultWalletData, type WalletData } from '@/lib/user-data';

// Helper function to get item from localStorage
const getItem = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage for key "${key}":`, error);
        return defaultValue;
    }
};

// Helper function to set item in localStorage
const setItem = <T,>(key: string, value: T) => {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage for key "${key}":`, error);
    }
};


interface AppData {
  academicConfig: AcademicConfig | null;
  adminData: AdminData | null;
  notifications: AppNotification[] | null;
  testSets: TestSet[] | null;
  storeConfig: StoreConfig | null;
  studentData: StudentProfile[] | null;
  activationCodes: string[] | null;
  scheduledTests: ScheduledTest[] | null;
  walletData: WalletData | null;
}

type DataUpdaters = {
    setAcademicConfig: (updater: React.SetStateAction<AcademicConfig>) => void;
    setAdminData: (updater: React.SetStateAction<AdminData>) => void;
    setNotifications: (updater: React.SetStateAction<AppNotification[]>) => void;
    setTestSets: (updater: React.SetStateAction<TestSet[]>) => void;
    setStoreConfig: (updater: React.SetStateAction<StoreConfig>) => void;
    setStudentData: (updater: React.SetStateAction<StudentProfile[]>) => void;
    setActivationCodes: (updater: React.SetStateAction<string[]>) => void;
    setScheduledTests: (updater: React.SetStateAction<ScheduledTest[]>) => void;
    setWalletData: (updater: React.SetStateAction<WalletData>) => void;
};

const DataContext = createContext<AppData | null>(null);
const DataUpdateContext = createContext<DataUpdaters | null>(null);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const [isHydrated, setIsHydrated] = useState(false);

    const [academicConfig, setAcademicConfig] = useState<AcademicConfig>(defaultAcademicConfig);
    const [adminData, setAdminData] = useState<AdminData>(defaultAdminData);
    const [notifications, setNotifications] = useState<AppNotification[]>(defaultNotifications);
    const [testSets, setTestSets] = useState<TestSet[]>(defaultTestSets);
    const [storeConfig, setStoreConfig] = useState<StoreConfig>(defaultStoreConfig);
    const [studentData, setStudentData] = useState<StudentProfile[]>(defaultStudentData);
    const [activationCodes, setActivationCodes] = useState<string[]>(defaultActivationCodes);
    const [scheduledTests, setScheduledTests] = useState<ScheduledTest[]>(defaultScheduledTests);
    const [walletData, setWalletData] = useState<WalletData>(defaultWalletData);

    useEffect(() => {
        setAcademicConfig(getItem('academicConfig', defaultAcademicConfig));
        setAdminData(getItem('adminData', defaultAdminData));
        setNotifications(getItem('notifications', defaultNotifications));
        setTestSets(getItem('testSets', defaultTestSets));
        setStoreConfig(getItem('storeConfig', defaultStoreConfig));
        setStudentData(getItem('studentData', defaultStudentData));
        setActivationCodes(getItem('activationCodes', defaultActivationCodes));
        setScheduledTests(getItem('scheduledTests', defaultScheduledTests));
        setWalletData(getItem('walletData', defaultWalletData));
        setIsHydrated(true);
    }, []);

    const createSetter = <T,>(stateSetter: React.Dispatch<React.SetStateAction<T>>, key: string) => 
        (updater: React.SetStateAction<T>) => {
            stateSetter(prevState => {
                const newState = typeof updater === 'function' ? (updater as (prevState: T) => T)(prevState) : updater;
                setItem(key, newState);
                return newState;
            });
        };

    const updaters: DataUpdaters = {
        setAcademicConfig: createSetter(setAcademicConfig, 'academicConfig'),
        setAdminData: createSetter(setAdminData, 'adminData'),
        setNotifications: createSetter(setNotifications, 'notifications'),
        setTestSets: createSetter(setTestSets, 'testSets'),
        setStoreConfig: createSetter(setStoreConfig, 'storeConfig'),
        setStudentData: createSetter(setStudentData, 'studentData'),
        setActivationCodes: createSetter(setActivationCodes, 'activationCodes'),
        setScheduledTests: createSetter(setScheduledTests, 'scheduledTests'),
        setWalletData: createSetter(setWalletData, 'walletData'),
    };
    
    if (!isHydrated) {
        return (
            <div className="flex justify-center items-center h-screen w-screen">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }
    
    const data: AppData = {
        academicConfig,
        adminData,
        notifications,
        testSets,
        storeConfig,
        studentData,
        activationCodes,
        scheduledTests,
        walletData,
    };

    return (
        <DataContext.Provider value={data}>
            <DataUpdateContext.Provider value={updaters}>
                {children}
            </DataUpdateContext.Provider>
        </DataContext.Provider>
    );
};

export const useAppData = (): AppData => {
    const context = useContext(DataContext);
    if (context === null) {
        throw new Error('useAppData must be used within a DataProvider');
    }
    return context;
};

export const useDataUpdaters = (): DataUpdaters => {
    const context = useContext(DataUpdateContext);
    if (context === null) {
        throw new Error('useDataUpdaters must be used within a DataProvider');
    }
    return context;
};
