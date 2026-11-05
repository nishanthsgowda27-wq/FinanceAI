import Sidebar from "./sidebar";
import AuthGuard from "@/components/auth/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f6f8fc]">
        <Sidebar />

        <main className="min-h-screen lg:pl-[260px]">
          <div className="mx-auto max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}