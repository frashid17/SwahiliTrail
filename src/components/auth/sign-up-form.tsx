"use client";

import { useAuth, useSignUp } from "@clerk/nextjs";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthField,
  AuthShell,
  authInputClass,
  authPrimaryBtnClass,
  authSecondaryBtnClass,
} from "@/components/auth/auth-shell";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M6.6 14.3l-.7.5-2.4 1.9C5.1 19.4 8.3 21.4 12 21.4c2.3 0 4.2-.8 5.6-2.1l-3.1-2.4c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8z"
      />
      <path
        fill="#4A90E2"
        d="M3.5 7.3C2.8 8.7 2.4 10.3 2.4 12s.4 3.3 1.1 4.7l3.1-2.4c-.2-.6-.3-1.2-.3-1.9s.1-1.4.3-2z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.2c1.3 0 2.4.4 3.3 1.3l2.5-2.5C16.2 2.6 14.3 1.8 12 1.8 8.3 1.8 5.1 3.8 3.5 7.3l3.1 2.4C7.6 6.8 9.6 5.2 12 5.2z"
      />
    </svg>
  );
}

export function SignUpForm() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function finalize() {
    await signUp.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) return;
        const url = decorateUrl("/dashboard");
        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      },
    });
  }

  async function handleSubmit(formData: FormData) {
    setFormError(null);
    const firstName = String(formData.get("firstName") ?? "");
    const emailAddress = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const { error } = await signUp.password({
      emailAddress,
      password,
      firstName: firstName || undefined,
    });

    if (error) {
      setFormError(error.message ?? "Unable to create account");
      return;
    }

    await signUp.verifications.sendEmailCode();
  }

  async function handleVerify(formData: FormData) {
    setFormError(null);
    const code = String(formData.get("code") ?? "");
    await signUp.verifications.verifyEmailCode({ code });

    if (signUp.status === "complete") {
      await finalize();
    } else {
      setFormError("Verification incomplete. Check the code and try again.");
    }
  }

  async function handleGoogle() {
    setFormError(null);
    const { error } = await signUp.sso({
      strategy: "oauth_google",
      redirectUrl: "/dashboard",
      redirectCallbackUrl: "/sso-callback",
    });
    if (error) {
      setFormError(error.message ?? "Google sign-up failed");
    }
  }

  if (signUp.status === "complete" || isSignedIn) {
    return null;
  }

  const needsEmailVerify =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  if (needsEmailVerify) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="Enter the verification code we sent to finish creating your Swahili Trail account."
      >
        <form action={handleVerify} className="space-y-4">
          <AuthField id="code" label="Verification code" error={errors.fields.code?.message}>
            <input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              className={authInputClass}
              placeholder="123456"
              required
            />
          </AuthField>
          {formError ? <p className="text-sm text-coral">{formError}</p> : null}
          <button
            type="submit"
            className={authPrimaryBtnClass}
            disabled={fetchStatus === "fetching"}
          >
            {fetchStatus === "fetching" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Verify email
          </button>
        </form>
        <button
          type="button"
          className="mt-4 text-sm text-aqua hover:underline"
          onClick={() => signUp.verifications.sendEmailCode()}
        >
          Resend code
        </button>
        <div id="clerk-captcha" className="mt-4" />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join Swahili Trail - AI trip planning for the Kenyan coast."
    >
      <button
        type="button"
        onClick={handleGoogle}
        className={authSecondaryBtnClass}
        disabled={fetchStatus === "fetching"}
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={handleSubmit} className="space-y-4">
        <AuthField id="firstName" label="First name" error={errors.fields.firstName?.message}>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            className={authInputClass}
            placeholder="Amina"
          />
        </AuthField>

        <AuthField
          id="email"
          label="Email address"
          error={errors.fields.emailAddress?.message}
        >
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={authInputClass}
            placeholder="you@email.com"
            required
          />
        </AuthField>

        <AuthField
          id="password"
          label="Password"
          error={errors.fields.password?.message}
        >
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className={`${authInputClass} pr-16`}
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted hover:text-ocean-deep"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </AuthField>

        {formError ? <p className="text-sm text-coral">{formError}</p> : null}
        {errors.global?.[0]?.message ? (
          <p className="text-sm text-coral">{errors.global[0].message}</p>
        ) : null}

        <button
          type="submit"
          className={authPrimaryBtnClass}
          disabled={fetchStatus === "fetching"}
        >
          {fetchStatus === "fetching" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Create account
        </button>
      </form>

      {/* Required for Clerk bot protection on custom sign-up */}
      <div id="clerk-captcha" className="mt-4" />

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-ocean hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
