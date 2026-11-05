import FinancialProfileForm from "@/components/onboarding/financial-profile-form";
import AuthGuard from "@/components/auth/auth-guard";

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <FinancialProfileForm />
      </main>
    </AuthGuard>
  );
}