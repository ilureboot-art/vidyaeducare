
'use client';

export type StudentProfile = {
  id: string;
  parentId: string;
  name: string;
  dob: string;
  avatarUrl: string;
  academic: {
      standard: string;
      board: "CBSE" | "ICSE" | "SSC";
      stream: string;
      language: string;
      academicYear: string;
      subjects: string[];
  },
  stats: {
    totalEarnings: number;
    testsTaken: number;
    avgScore: number;
    performance: { name: string; score: number }[];
    recentActivity: { name: string; score: number }[];
  },
  badges: ('Platinum' | 'Gold' | 'Silver' | 'Bronze')[];
  createdAt?: string;
  mockTestSubscribed?: boolean;
  archived?: boolean;
  mockTestEntitlement?: {
    version: number;
    status: string;
    accessType: 'PAID_SUBSCRIPTION' | 'ADMIN_COMPLIMENTARY';
    verifiedPaid: boolean;
    startsAt: string;
    expiresAt: string;
    purchaseTransactionId: string;
    productId: string;
  };
  studyGoals?: {
    targetAccuracy: number;
    weeklyTests: number;
    focusSubject: string;
    updatedAt?: string;
  };
};
