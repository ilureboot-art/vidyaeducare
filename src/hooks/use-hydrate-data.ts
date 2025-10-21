
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { defaultAcademicConfig, type AcademicConfig } from '@/lib/academic-config';
import { defaultAdminData, type Admin, type AdminData } from '@/lib/admin-data';
import { defaultNotifications, type AppNotification } from '@/lib/notifications';
import { defaultTestSets, type TestSet } from '@/lib/question-bank';
import { defaultStoreConfig, type StoreConfig } from '@/lib/store-config';
import { defaultStudentData, defaultActivationCodes, type StudentProfile } from '@/lib/student-data';
import { defaultScheduledTests, type ScheduledTest } from '@/lib/test-schedule';
import { defaultWalletData, type WalletData, type Transaction } from '@/lib/user-data';
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
const DataUpdateContext = createContext<any>(null);


const getInitialState = (key: string, defaultValue: any) => {
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
        return defaultValue;
    }
};

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const [data, setData] = useState<AppData | null>(null);

    useEffect(() => {
        const initialState: AppData = {
            academicConfig: getInitialState('academicConfig', defaultAcademicConfig),
            adminData: getInitialState('adminData', defaultAdminData),
            notifications: getInitialState('notifications', defaultNotifications),
            testSets: getInitialState('allTestSets', defaultTestSets),
            storeConfig: getInitialState('storeConfig', defaultStoreConfig),
            studentData: getInitialState('studentData', defaultStudentData),
            activationCodes: getInitialState('activationCodes', defaultActivationCodes),
            scheduledTests: getInitialState('scheduledTests', defaultScheduledTests),
            walletData: getInitialState('walletData', defaultWalletData),
        };
        setData(initialState);
    }, []);

    useEffect(() => {
        if (data) {
            try {
                window.localStorage.setItem('academicConfig', JSON.stringify(data.academicConfig));
                window.localStorage.setItem('adminData', JSON.stringify(data.adminData));
                window.localStorage.setItem('notifications', JSON.stringify(data.notifications));
                window.localStorage.setItem('allTestSets', JSON.stringify(data.testSets));
                window.localStorage.setItem('storeConfig', JSON.stringify(data.storeConfig));
                window.localStorage.setItem('studentData', JSON.stringify(data.studentData));
                window.localStorage.setItem('activationCodes', JSON.stringify(data.activationCodes));
                window.localStorage.setItem('scheduledTests', JSON.stringify(data.scheduledTests));
                window.localStorage.setItem('walletData', JSON.stringify(data.walletData));
            } catch (error) {
                console.error("Failed to save data to localStorage", error);
            }
        }
    }, [data]);
    
    // All setter functions are memoized to prevent unnecessary re-renders
    const setters = {
        setAcademicConfig: useCallback((config: AcademicConfig) => setData(prev => prev ? { ...prev, academicConfig: config } : null), []),
        setAdminData: useCallback((adminData: AdminData) => setData(prev => prev ? { ...prev, adminData } : null), []),
        setNotifications: useCallback((notifications: AppNotification[] | ((prev: AppNotification[]) => AppNotification[])) => setData(prev => prev ? { ...prev, notifications: typeof notifications === 'function' ? notifications(prev.notifications) : notifications } : null), []),
        setTestSets: useCallback((testSets: TestSet[]) => setData(prev => prev ? { ...prev, testSets } : null), []),
        setStoreConfig: useCallback((storeConfig: StoreConfig) => setData(prev => prev ? { ...prev, storeConfig } : null), []),
        setStudentData: useCallback((studentData: StudentProfile[]) => setData(prev => prev ? { ...prev, studentData } : null), []),
        setActivationCodes: useCallback((codes: string[]) => setData(prev => prev ? { ...prev, activationCodes: codes } : null), []),
        setScheduledTests: useCallback((tests: ScheduledTest[]) => setData(prev => prev ? { ...prev, scheduledTests: tests } : null), []),
        setWalletData: useCallback((walletData: WalletData) => setData(prev => prev ? { ...prev, walletData } : null), []),
    };

    if (!data) {
        return (
             <div className="flex justify-center items-center h-screen w-screen">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <>
            <DataContext.Provider value={data}>
                <DataUpdateContext.Provider value={setters}>
                    {children}
                </DataUpdateContext.Provider>
            </DataContext.Provider>
        </>
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
    return context;
};
