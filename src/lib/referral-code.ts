import { adminDb } from '@/firebase/admin-init';
export function normalizeReferralCode(value: unknown): string {
 if (value == null || value === '') return '';
 if (typeof value !== 'string') throw new Error('Invalid Referral / IBA code.');
 const code = value.trim().toUpperCase();
 if (code && !/^[A-Z0-9_-]{3,64}$/.test(code)) throw new Error('Invalid Referral / IBA code.');
 return code;
}
export async function resolveReferralCode(value: unknown, buyerUid?: string) {
 const code = normalizeReferralCode(value); if (!code) return null;
 const wallets = await adminDb.collection('wallets').where('referralCode','==',code).limit(2).get();
 if (wallets.size !== 1) throw new Error(wallets.empty ? 'Invalid Referral / IBA code.' : 'Ambiguous referral code. Contact support.');
 const uid = wallets.docs[0].id;
 if (uid === buyerUid) throw new Error('Self-referral is not allowed.');
 const owner = await adminDb.collection('users').doc(uid).get();
 if (!owner.exists || owner.data()?.status === 'Banned' || owner.data()?.status === 'Inactive') throw new Error('Referral / IBA code is inactive.');
 return { code, uid };
}
