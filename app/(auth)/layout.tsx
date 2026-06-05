import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #FDF4F7 0%, #FDFAF7 40%, #F9E8EF 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #E99DB8 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, #D96B8F 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
