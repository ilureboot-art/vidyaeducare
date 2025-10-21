
"use client";

import { useEffect, useState } from 'react';
import { getAcademicConfig, saveAcademicConfig } from '@/lib/academic-config';
import { getAdminData, saveAdminData } from '@/lib/admin-data';
import { getNotifications, saveNotifications } from '@/lib/notifications';
import { getAllTestSets, saveTestSets } from '@/lib/question-bank';
import { getStoreConfig, saveStoreConfig } from '@/lib/store-config';
import { getAllStudentData, getActivationCodes, saveStudentData, saveActivationCodes } from '@/lib/student-data';
import { getScheduledTestData, saveScheduledTests } from '@/lib/test-schedule';
import { getWalletData, saveWalletData } from '@/lib/user-data';

export function useHydrateData() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isHydrated) {
      return;
    }

    const hydrate = () => {
      try {
        // Hydrate all data sources from localStorage or set defaults
        getAcademicConfig();
        getAdminData();
        getNotifications();
        getAllTestSets();
        getStoreConfig();
        getAllStudentData();
        getActivationCodes();
        getScheduledTestData();
        getWalletData();
        
        setIsHydrated(true);

      } catch (error) {
        console.error("Failed to hydrate data from localStorage:", error);
      }
    };

    hydrate();
  }, [isHydrated]);
}
