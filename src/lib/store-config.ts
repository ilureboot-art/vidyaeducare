
export type TicketPackage = {
  tickets: number;
  price: number;
  bestValue: boolean;
  games: number;
};

export const initialPackages: TicketPackage[] = [
  { tickets: 1, price: 25, bestValue: false, games: 2 },
  { tickets: 5, price: 120, bestValue: false, games: 10 },
  { tickets: 10, price: 225, bestValue: true, games: 20 },
];

export const initialReferboltSubscription = {
    name: "ReferBolt",
    price: 100,
    description: "Activate to earn commissions and get a bonus of 4 tickets (worth 8 games).",
};

export const initialReferralBonus = 5;
