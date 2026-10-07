import { describe, expect, it } from 'vitest';
import { legacyAccessReview } from './legacy-access-review';
describe('legacy access review', () => {
  it('never treats editable paid flags and codes as verified payment', () => {
    const report = legacyAccessReview({purchasedMockTest:true},{codes:['secret-code']},[{mockTestSubscribed:true}],true);
    expect(report.verifiedPaid).toBe(false);
    expect(report.status).toBe('REVIEW_REQUIRED');
    expect(report.reasons).toHaveLength(3);
    expect(JSON.stringify(report)).not.toContain('secret-code');
  });
  it('flags incomplete scans instead of reporting no paid claims', () => {
    expect(legacyAccessReview({}, {}, [], false)).toMatchObject({status:'REVIEW_REQUIRED',complete:false,reasons:['STUDENT_SCAN_LIMIT']});
  });
  it('reports absence of claims without granting free or paid entitlement', () => {
    expect(legacyAccessReview({}, {codes:'invalid'}, [{mockTestSubscribed:false}], true)).toMatchObject({status:'NO_PAID_CLAIM_FOUND',verifiedPaid:false,unusedCodeCount:0});
  });
});
