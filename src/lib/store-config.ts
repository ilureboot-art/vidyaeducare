
export type TicketPackage = {
  tickets: number;
  price: number;
  bestValue: boolean;
  games: number;
};

export const initialPackages: TicketPackage[] = [
  { tickets: 5, price: 10, bestValue: false, games: 10 },
  { tickets: 15, price: 25, bestValue: true, games: 30 },
  { tickets: 30, price: 45, bestValue: false, games: 60 },
];

export const initialReferboltSubscription = {
    name: "ReferBolt",
    price: 100,
    description: "Activate to earn commissions and get 4 bonus tickets (8 games).",
};

export const initialReferralBonus = 5;
