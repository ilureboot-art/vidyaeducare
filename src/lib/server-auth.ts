import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/firebase/admin-init";

export type VerifiedRequester = { uid: string; email: string; isAdmin: boolean };

export async function verifyRequester(request: NextRequest, requireAdmin = false): Promise<VerifiedRequester> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new RequestAuthError("Authentication is required.", 401);
  try {
    const decoded = await adminAuth.verifyIdToken(header.slice(7));
    const email = (decoded.email ?? "").toLowerCase();
    const isMaster = email === "admin@vidyaeducare.com" || email === "headadmin@vidyaeducare.com";
    const adminDocument = isMaster ? null : await adminDb.collection("admins").doc(decoded.uid).get();
    const isAdmin = isMaster || Boolean(adminDocument?.exists);
    if (requireAdmin && !isAdmin) throw new RequestAuthError("Administrator access is required.", 403);
    return { uid: decoded.uid, email, isAdmin };
  } catch (error) {
    if (error instanceof RequestAuthError) throw error;
    throw new RequestAuthError("The authentication token is invalid or expired.", 401);
  }
}

export class RequestAuthError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}
