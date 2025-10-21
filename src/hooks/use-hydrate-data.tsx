
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAcademicConfig, setAcademicConfig, type AcademicConfig } from '@/lib/academic-config';
import { getAdminData, setAdminData, type AdminData } from '@/lib/admin-data';
import { getNotifications, setNotifications, type AppNotification } from '@/lib/notifications';
import { getAllTestSets, setAllTestSets, type TestSet } from '@/lib/question-bank';
import { getStoreConfig, setStoreConfig, type StoreConfig } from '@/lib/store-config';
import { getAllStudentData, setAllStudentData, getActivationCodes, setActivationCodes, type StudentProfile } from '@/lib/student-data';
import { getScheduledTestData, setScheduledTestData, type ScheduledTest } from '@/lib/test-schedule';
import { getWalletData, setWalletData, type WalletData } from '@/lib/user-data';
import { Loader2 } from 'lucide-react';

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

type DataUpdaters = {
    setAcademicConfig: (data: AcademicConfig) => void;
    setAdminData: (data: AdminData) => void;
    setNotifications: (data: AppNotification[]) => void;
    setTestSets: (data: TestSet[]) => void;
    setStoreConfig: (data: StoreConfig) => void;
    setStudentData: (data: StudentProfile[]) => void;
    setActivationCodes: (data: string[]) => void;
    setScheduledTests: (data: ScheduledTest[]) => void;
    setWalletData: (data: WalletData) => void;
};

const DataContext = createContext<AppData | null>(null);
const DataUpdateContext = createContext<DataUpdaters | null>(null);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const [data, setData] = useState<AppData | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
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
        useCallback((newData: T) => {
            setterFunc(newData);
            setData(prev => prev ? { ...prev, [key]: newData } : null);
        }, [key]);
    
    const setters: DataUpdaters = {
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
