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
import { Button } from "@/components/ui/button";
import { FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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
          <AuthField
            id="code"
            label="Verification code*"
            error={errors.fields.code?.message}
          >
            <Input
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
          <Button
            type="submit"
            size="lg"
            className={authPrimaryBtnClass}
            disabled={fetchStatus === "fetching"}
          >
            {fetchStatus === "fetching" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Verify email
          </Button>
        </form>
        <Button
          type="button"
          variant="link"
          className="mt-4 h-auto px-0 text-sm text-aqua"
          onClick={() => signUp.verifications.sendEmailCode()}
        >
          Resend code
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Save trips, guide chats, and stay matches across Kenya."
    >
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogle}
        className={authSecondaryBtnClass}
        disabled={fetchStatus === "fetching"}
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <FieldSeparator className="my-6 *:data-[slot=field-separator-content]:bg-card text-sm text-muted-foreground">
        <span className="px-4">or sign up with email</span>
      </FieldSeparator>

      <form action={handleSubmit} className="space-y-4">
        <AuthField
          id="firstName"
          label="First name"
          error={errors.fields.firstName?.message}
        >
          <Input
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
          label="Email*"
          error={errors.fields.emailAddress?.message}
        >
          <Input
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
          label="Password*"
          error={errors.fields.password?.message}
        >
          <div className="relative">
            <Input
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-foreground"
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

        <Button
          type="submit"
          size="lg"
          className={authPrimaryBtnClass}
          disabled={fetchStatus === "fetching"}
        >
          {fetchStatus === "fetching" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-card-foreground hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
