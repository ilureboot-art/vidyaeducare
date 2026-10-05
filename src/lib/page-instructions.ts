export type PageInstruction = { title: string; details: string; imageUrl: string; imageAlt: string };
export type PageInstructions = { registration: PageInstruction; wallet: PageInstruction };
export const defaultPageInstructions: PageInstructions = {
 registration: { title: 'विद्यार्थी नोंदणी सूचना', details: '१. पालकाचे खाते तयार करा किंवा Sign In करा.\n२. Profile मध्ये Add Student निवडा. आवश्यक product activation code टाका.\n३. विद्यार्थ्याचे नाव, जन्मतारीख, इयत्ता, बोर्ड, माध्यम आणि विषय अचूक भरा.\n४. माहिती तपासून student profile जतन करा.', imageUrl: '', imageAlt: '' },
 wallet: { title: 'Fund Wallet मध्ये पैसे कसे जमा करायचे?', details: '१. Add Funds निवडा आणि जमा करायची रक्कम भरा.\n२. पानावर दाखवलेल्या अधिकृत bank / UPI / QR details वापरून payment करा.\n३. Payment receipt मधील UTR / Transaction ID अचूक भरा आणि receipt जोडा.\n४. Deposit request submit करा. Payment पडताळणी व admin approval नंतर wallet balance वाढेल.\n५. Transactions मध्ये request status तपासा. एकाच payment चा UTR पुन्हा वापरू नका. Wallet मध्ये पैसे जमा करणे म्हणजे product subscription खरेदी करणे नाही; Store मधून product वेगळा खरेदी करा.', imageUrl: '', imageAlt: '' }
};
