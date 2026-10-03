export function paymentAmount(value: unknown): number {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') throw new Error('A valid amount is required.');
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001) throw new Error('Amount must be positive with at most two decimal places.');
  return Math.round(amount * 100) / 100;
}
export function normalizeUtr(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Transaction ID / UTR is required.');
  const normalized = value.trim().toUpperCase().replace(/\s+/g, '');
  if (!/^[A-Z0-9-]{6,64}$/.test(normalized)) throw new Error('UTR must contain 6–64 letters, digits or hyphens.');
  return normalized;
}
export function walletAfterDecision(balance: number, amount: number, type: string): number {
  if (!Number.isFinite(balance) || balance < 0) throw new Error('Invalid wallet balance; review the wallet first.');
  const value = paymentAmount(Math.abs(amount));
  if (type !== 'deposit' && type !== 'withdrawal') throw new Error('Only deposits and withdrawals can be decided here.');
  if (type === 'deposit' && amount <= 0 || type === 'withdrawal' && amount >= 0) throw new Error('Invalid transaction amount direction.');
  const next = Math.round((balance + (type === 'deposit' ? value : -value)) * 100) / 100;
  if (type === 'withdrawal' && (value < 650 || next < 200)) throw new Error('Withdrawal requires ₹650 minimum and ₹200 retained balance.');
  return next;
}
