import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import WorkspaceShell from "../components/workspace/shell";
export const metadata: Metadata = {
  title: "Workspace | TrustLayer",
  robots: { index: false, follow: false },
};
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Signed-out visitors go to login instead of an empty workspace.
  if (!(await cookies()).has("trustlayer_session")) redirect("/login");
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
