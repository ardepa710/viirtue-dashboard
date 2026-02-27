import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  // Redirect authenticated users to dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Viirtue Dashboard
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-4">
            MSP Dashboard for NetSapiens VoIP Infrastructure
          </p>
          <p className="text-lg text-slate-400">
            Real-time monitoring • Call management • Queue analytics • CDR reports
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              title: "Real-time Monitoring",
              description: "Track active calls, queues, and agent status in real-time",
            },
            {
              title: "Call Analytics",
              description: "Comprehensive CDR reports with advanced filtering",
            },
            {
              title: "Audit Logging",
              description: "Complete audit trail of all system activities",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div>
          <Link
            href="/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors shadow-xl hover:shadow-2xl"
          >
            Sign In to Dashboard
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-16 text-slate-400 text-sm">
          <p>Powered by NetSapiens API • Next.js 14 • Prisma</p>
        </div>
      </div>
    </div>
  );
}
