import { describe, expect, it } from 'vitest';
import { walletReconciliation } from './wallet-reconciliation';
describe('withdrawal reservation report', () => {
  const payment = { type: 'withdrawal', status: 'Pending', reservationApplied: true, amount: -650 };
  it('reconciles pending holds and ignores completed/legacy requests', () => {
    expect(walletReconciliation({ balance: 350, reservedBalance: 650 }, [payment, { ...payment, status: 'Completed' }, { ...payment, reservationApplied: false }], true)).toMatchObject({ status: 'MATCHED', expectedReserved: 650 });
  });
  it('flags mismatch and invalid balances', () => {
    expect(walletReconciliation({ balance: 350, reservedBalance: 0 }, [payment], true).status).toBe('RESERVATION_MISMATCH');
    expect(walletReconciliation({ balance: -1 }, [], true).status).toBe('INVALID_WALLET_OR_REQUEST');
  });
  it('does not imply reconciliation when records are truncated', () => {
    expect(walletReconciliation({ balance: 350, reservedBalance: 650 }, [payment], false)).toMatchObject({ status: 'REVIEW_REQUIRED_SCAN_LIMIT', expectedReserved: null });
  });
});
