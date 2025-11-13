
'use client';

export type QuizClashTournament = {
    id: string;
    title: string;
    startTime: string;
    entryFee: number;
    questionCount: number;
    testSetId: string;
    registeredPlayers: string[];
    prizePool: number;
    status: 'scheduled' | 'live' | 'completed';
    winners?: { userId: string; rank: number; prize: number }[];
};

export type QuizClashAutoCreateConfig = {
    enabled: boolean;
    startTime: string;
    entryFee: number;
    questionCount: number;
    titlePrefix: string;
};
