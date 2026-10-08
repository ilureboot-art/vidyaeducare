import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { initializeApp as initializeAdmin, deleteApp as deleteAdmin } from 'firebase-admin/app';
import { getFirestore as adminFirestore } from 'firebase-admin/firestore';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc, terminate, type Firestore } from 'firebase/firestore';
const enabled = process.env.RUN_PROFILE_RULES_EMULATOR === '1' && process.env.FIRESTORE_EMULATOR_HOST === '127.0.0.1:9081';
describe.skipIf(!enabled)('isolated profile and ReferBolt rules enforcement', () => {
  const clients: { app: FirebaseApp; db: Firestore }[] = [];
  let adminApp: ReturnType<typeof initializeAdmin>;
  let adminDb: ReturnType<typeof adminFirestore>;
  const client = (uid: string, email = `${uid}@test.invalid`, verified = true) => {
    const app = initializeApp({ projectId: 'demo-vidya-profile-rules', apiKey: 'demo-key' }, `${uid}-${clients.length}`);
    const db = getFirestore(app);
    connectFirestoreEmulator(db, '127.0.0.1', 9081, { mockUserToken: { sub: uid, user_id: uid, email, email_verified: verified } });
    clients.push({ app, db }); return db;
  };
  beforeAll(async () => {
    adminApp = initializeAdmin({ projectId: 'demo-vidya-profile-rules' }, 'profile-rules-tests');
    adminDb = adminFirestore(adminApp);
    await adminDb.doc('students/student1').set({ parentId: 'parent1', name: 'Test student', mockTestSubscribed: false });
    await adminDb.doc('users/parent1').set({ name: 'Test parent', purchasedMockTest: false });
    await adminDb.doc('referbolt/parent1').set({ autoRenew: false, isSubscribed: false, totalCommissions: 0 });
    await adminDb.doc('testSets/private').set({ questions: [{ correctAnswer: 'secret' }] });
    await adminDb.doc('testResults/owned').set({ studentId: 'student1', score: 10 });
    await adminDb.doc('admins/academic').set({ role: 'Academic Admin', status: 'Active' });
    await adminDb.doc('admins/finance').set({ role: 'Finance Admin', status: 'Active' });
  }, 20000);
  afterAll(async () => {
    await Promise.all(clients.map(async c => { await terminate(c.db); await deleteApp(c.app); }));
    await adminDb.terminate(); await deleteAdmin(adminApp);
  });
  it('allows parent reads and ordinary edits, denies other parents and ownership changes', async () => {
    const owner = client('parent1'), other = client('parent2');
    expect((await getDoc(doc(owner, 'students/student1'))).exists()).toBe(true);
    await expect(getDoc(doc(other, 'students/student1'))).rejects.toMatchObject({ code: 'permission-denied' });
    await updateDoc(doc(owner, 'students/student1'), { name: 'Updated test student' });
    await expect(updateDoc(doc(other, 'students/student1'), { parentId: 'parent2' })).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(updateDoc(doc(owner, 'students/student1'), { parentId: 'parent2' })).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(updateDoc(doc(owner, 'students/student1'), { mockTestSubscribed: true })).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(updateDoc(doc(owner, 'students/student1'), { mockTestEntitlement: { verifiedPaid: true } })).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(setDoc(doc(owner, 'students/forged'), { parentId: 'parent1', mockTestSubscribed: true })).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(setDoc(doc(owner, 'activationCodes/parent1'), { codes: ['FORGED'] })).rejects.toMatchObject({ code: 'permission-denied' });
  });
  it('allows boolean autoRenew only, denies subscription and commission forgery', async () => {
    const db = client('parent1');
    await updateDoc(doc(db, 'referbolt/parent1'), { autoRenew: true });
    for (const values of [{ isSubscribed: true }, { totalCommissions: 9999 }, { autoRenew: 'yes' }]) {
      await expect(updateDoc(doc(db, 'referbolt/parent1'), values)).rejects.toMatchObject({ code: 'permission-denied' });
    }
  });
  it('denies key leaks, fake scores and student statistics; allows authorized academic reads', async () => {
    const owner = client('parent1'), other = client('parent2');
    await expect(getDoc(doc(owner, 'testSets/private'))).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(getDoc(doc(client('finance'), 'testSets/private'))).rejects.toMatchObject({ code: 'permission-denied' });
    expect((await getDoc(doc(client('academic'), 'testSets/private'))).exists()).toBe(true);
    expect((await getDoc(doc(owner, 'testResults/owned'))).exists()).toBe(true);
    await expect(getDoc(doc(other, 'testResults/owned'))).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(updateDoc(doc(owner, 'students/student1'), { stats: { avgScore: 100 } })).rejects.toMatchObject({ code: 'permission-denied' });
    for (const path of ['testResults/fake', 'leaderboard/fake', 'quizClashResults/fake', 'mockTestAttempts/fake', 'quizClashAttempts/fake']) await expect(setDoc(doc(owner, path), { studentId: 'student1', score: 100 })).rejects.toMatchObject({ code: 'permission-denied' });
  });
  it('denies client user creation and paid/role forgery, preserves profile edits', async () => {
    const db = client('parent1');
    await updateDoc(doc(db, 'users/parent1'), { name: 'New name' });
    for (const values of [{ purchasedMockTest: true }, { mockTestSubscription: { status: 'ACTIVE' } }, { role: 'Head Admin' }]) {
      await expect(updateDoc(doc(db, 'users/parent1'), values)).rejects.toMatchObject({ code: 'permission-denied' });
    }
    await expect(setDoc(doc(db, 'users/forged'), { purchasedMockTest: true })).rejects.toMatchObject({ code: 'permission-denied' });
    const unverified = client('fakeadmin', 'admin@vidyaeducare.com', false);
    await expect(getDoc(doc(unverified, 'students/student1'))).rejects.toMatchObject({ code: 'permission-denied' });
  });
});

