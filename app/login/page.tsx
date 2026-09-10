import { Suspense } from "react";
import { APP_NAME } from "@/lib/config";
import { LoginForm } from "./LoginForm";

export const metadata = { title: `Sign in · ${APP_NAME}` };

export default function LoginPage() {
  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <div className="card w-full max-w-sm p-8">
        <p className="eyebrow">Private kitchen</p>
        <h1 className="brand lowercase mt-2 text-4xl">{APP_NAME}<span className="brand-star" aria-hidden>✳</span></h1>
        <p className="text-muted mt-2 text-sm">Enter the password to open your recipe journal.</p>
        {/* useSearchParams needs a Suspense boundary to prerender. */}
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
