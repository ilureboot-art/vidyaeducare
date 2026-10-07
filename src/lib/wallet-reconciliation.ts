export function walletReconciliation(wallet: Record<string, unknown>, payments: Record<string, unknown>[], complete: boolean) {
  const available = Number(wallet.balance ?? 0);
  const reserved = Number(wallet.reservedBalance ?? 0);
  const pending = payments.filter(p => p.type === 'withdrawal' && p.status === 'Pending' && p.reservationApplied === true);
  const invalid = !Number.isFinite(available) || available < 0 || !Number.isFinite(reserved) || reserved < 0 || pending.some(p => !Number.isFinite(Number(p.amount)) || Number(p.amount) >= 0);
  const expected = Math.round(pending.reduce((sum, p) => sum + Math.abs(Number(p.amount)), 0) * 100) / 100;
  return {
    available: Number.isFinite(available) ? available : null,
    reserved: Number.isFinite(reserved) ? reserved : null,
    expectedReserved: complete && !invalid ? expected : null,
    pendingReservations: pending.length,
    status: invalid ? 'INVALID_WALLET_OR_REQUEST' : !complete ? 'REVIEW_REQUIRED_SCAN_LIMIT' : Math.round(reserved * 100) === Math.round(expected * 100) ? 'MATCHED' : 'RESERVATION_MISMATCH',
  };
}
