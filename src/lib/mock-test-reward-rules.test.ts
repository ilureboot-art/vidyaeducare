import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
const rules = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
describe('server scoring rule deployment contract', () => {
  it('keeps test keys and attempt state private to the server and academic source editor', () => {
    expect(rules).toContain('match /mockTestAttempts/{id} { allow read, write: if false; }');
    expect(rules).toContain('match /quizClashAttempts/{id} { allow read, write: if false; }');
    expect(rules).toMatch(/match \/testSets\/\{id\}[\s\S]*?allow read, list: if academicAdmin\(\);/);
  });
  it('has no client result or leaderboard creation path', () => {
    expect(rules).toMatch(/match \/testResults\/\{id\}[\s\S]*?allow write: if false;/);
    expect(rules).toMatch(/match \/quizClashResults\/\{id\}[\s\S]*?allow write: if false;/);
    expect(rules).toMatch(/match \/leaderboard\/\{id\}[\s\S]*?allow create: if false;/);
  });
});
