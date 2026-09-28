import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rules = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');

describe('MockArena paid-only ranking safeguards', () => {
  it('requires a paid student for leaderboard creation', () => {
    expect(rules).toContain('function isPaidStudent(studentId)');
    expect(rules).toContain('isPaidStudent(request.resource.data.studentId)');
  });

  it('requires immutable eligibility markers for leaderboard creation', () => {
    expect(rules).toContain("request.resource.data.accessType == 'PAID_SUBSCRIPTION'");
    expect(rules).toContain("request.resource.data.testWindowStatus == 'LIVE'");
    expect(rules).toContain('request.resource.data.rankingEligible == true');
    expect(rules).toContain('request.resource.data.perTestCashPrizeEligible == true');
    expect(rules).toContain('request.resource.data.monthlyCashPrizeEligible == true');
  });
});

