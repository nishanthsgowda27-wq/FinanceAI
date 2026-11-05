import Link from "next/link";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        <Link href="/dashboard" className="text-blue-600">
          ← Dashboard
        </Link>

        <h1 className="mt-6 text-3xl font-bold">
          Profile
        </h1>

        <div className="mt-8 space-y-5">
          <Input label="Full Name" value="Your Name" />
          <Input label="Email" value="your@email.com" />
          <Input label="Profession" value="Software Engineer" />
        </div>

        <button className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white">
          Update Profile
        </button>
      </div>
    </main>
  );
}

function Input({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-2 block font-medium">{label}</label>

      <input
        defaultValue={value}
        className="w-full rounded-xl border px-4 py-3"
      />
    </div>
  );
}