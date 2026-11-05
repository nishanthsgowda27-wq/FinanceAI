import DashboardLayout from "@/components/layout/dashboard-layout";
import FinanceChat from "@/components/ai/finance-chat";

export default function AIAssistantPage() {
  return (
    <DashboardLayout>
      <FinanceChat />
    </DashboardLayout>
  );
}
