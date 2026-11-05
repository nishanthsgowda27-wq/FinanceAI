import Link from "next/link";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        <Link href="/dashboard" className="text-blue-600">
          ← Dashboard
        </Link>

        <h1 className="mt-6 text-3xl font-bold">
          Settings
        </h1>

        <div className="mt-8 space-y-5">
          <Setting
            title="Email Notifications"
            description="Receive financial updates by email."
          />

          <Setting
            title="Budget Alerts"
            description="Get notified when you approach your budget."
          />

          <Setting
            title="AI Recommendations"
            description="Receive personalized financial suggestions."
          />
        </div>
      </div>
    </main>
  );
}

function Setting({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between border-b pb-5">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      <input type="checkbox" className="h-5 w-5" />
    </div>
  );
}