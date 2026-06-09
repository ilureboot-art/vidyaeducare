/**
 * @fileOverview Specialized error classes for Firebase services.
 */

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

/**
 * Custom error class for Firestore permission denials.
 * Designed to provide context for AI-driven debugging.
 */
export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
{
  "path": "${context.path}",
  "method": "${context.operation}",
  "requestResourceData": ${JSON.stringify(context.requestResourceData || {}, null, 2)}
}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
  }
}
