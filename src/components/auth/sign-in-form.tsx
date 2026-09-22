"use client";

import { useSignIn } from "@clerk/nextjs";
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

export function SignInForm() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function finalize() {
    await signIn.finalize({
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
    const emailAddress = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const { error } = await signIn.password({ emailAddress, password });
    if (error) {
      setFormError(error.message ?? "Unable to sign in");
      return;
    }

    if (signIn.status === "complete") {
      await finalize();
      return;
    }

    if (signIn.status === "needs_client_trust") {
      const emailCodeFactor = signIn.supportedSecondFactors?.find(
        (factor) => factor.strategy === "email_code",
      );
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
      }
      return;
    }

    if (signIn.status === "needs_second_factor") {
      setFormError("Additional verification is required for this account.");
    }
  }

  async function handleVerify(formData: FormData) {
    setFormError(null);
    const code = String(formData.get("code") ?? "");
    await signIn.mfa.verifyEmailCode({ code });

    if (signIn.status === "complete") {
      await finalize();
    } else {
      setFormError("Verification incomplete. Please try again.");
    }
  }

  async function handleGoogle() {
    setFormError(null);
    const { error } = await signIn.sso({
      strategy: "oauth_google",
      redirectUrl: "/dashboard",
      redirectCallbackUrl: "/sso-callback",
    });
    if (error) {
      setFormError(error.message ?? "Google sign-in failed");
    }
  }

  if (signIn.status === "needs_client_trust") {
    return (
      <AuthShell
        title="Verify it’s you"
        subtitle="Enter the code we sent to your email to continue."
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
            Verify & continue
          </button>
        </form>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <button
            type="button"
            className="text-aqua hover:underline"
            onClick={() => signIn.mfa.sendEmailCode()}
          >
            Resend code
          </button>
          <button
            type="button"
            className="text-muted hover:text-ocean-deep"
            onClick={() => signIn.reset()}
          >
            Start over
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to Swahili Trail to continue your coastal journey."
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
        <AuthField
          id="email"
          label="Email address"
          error={errors.fields.identifier?.message}
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
          hint={
            <button
              type="button"
              className="text-xs font-medium text-aqua hover:underline"
              onClick={() =>
                setFormError(
                  "Password reset is available from Clerk after email verification is set up.",
                )
              }
            >
              Forgot password?
            </button>
          }
        >
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={`${authInputClass} pr-16`}
              placeholder="••••••••"
              required
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
          Sign in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-semibold text-ocean hover:underline">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
