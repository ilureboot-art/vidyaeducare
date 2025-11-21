
"use client";

// This layout is now handled by the root layout.tsx to ensure the
// FirebaseClientProvider wraps all admin pages correctly.
// This file can be removed in the future, but is kept to avoid breaking
// any potential dependencies, although its content is just the children.

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
