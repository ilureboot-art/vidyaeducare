import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/firebase/admin-init";

import { adminPermissions, permissionForAdminPath, type AdminPermission } from "./admin-permissions";

export type VerifiedRequester = { uid: string; email: string; isAdmin: boolean; permissions: readonly AdminPermission[] };

export async function verifyRequester(request: NextRequest, requireAdmin = false): Promise<VerifiedRequester> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new RequestAuthError("Authentication is required.", 401);
  try {
    const decoded = await adminAuth.verifyIdToken(header.slice(7));
    const email = (decoded.email ?? "").toLowerCase();
    const isMaster = email === "admin@vidyaeducare.com" || email === "headadmin@vidyaeducare.com";
    const adminDocument = isMaster ? null : await adminDb.collection("admins").doc(decoded.uid).get();
    const data = adminDocument?.data();
    const permissions = adminPermissions(data?.role, data?.status, isMaster);
    const isAdmin = permissions.length > 0;
    if (requireAdmin && !isAdmin) throw new RequestAuthError("Administrator access is required.", 403);
    if (requireAdmin && !permissions.includes(permissionForAdminPath(request.nextUrl.pathname))) throw new RequestAuthError("Your admin role does not permit this action.", 403);
    return { uid: decoded.uid, email, isAdmin, permissions };
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

