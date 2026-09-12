import { Suspense } from "react";
import { APP_NAME } from "@/lib/config";
import { GoogleButton } from "./GoogleButton";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <div className="card w-full max-w-sm p-8">
        <p className="eyebrow">Private kitchen</p>
        <h1 className="brand lowercase mt-2 text-4xl">{APP_NAME}<span className="brand-star" aria-hidden>✳</span></h1>
        <p className="text-muted mt-2 text-sm">Sign in with an approved Google account to open your recipe journal.</p>
        <Suspense fallback={null}>
          <GoogleButton />
        </Suspense>
      </div>
    </main>
  );
}
