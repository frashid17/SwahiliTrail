"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import {
  CreditCard,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Map,
  Shield,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AccountBilling } from "@/components/auth/account-billing";
import { CoastalOrbs } from "@/components/coastal-accents";
import { FadeIn } from "@/components/fade-in";
import { cn } from "@/lib/utils";

type Tab = "profile" | "security" | "billing";

const TABS: Tab[] = ["profile", "security", "billing"];

function tabFromSearch(value: string | null): Tab {
  if (value && TABS.includes(value as Tab)) return value as Tab;
  return "profile";
}

export function AccountManager() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() =>
    tabFromSearch(searchParams.get("tab")),
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileNote, setProfileNote] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordNote, setPasswordNote] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    setTab(tabFromSearch(searchParams.get("tab")));
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setUsername(user.username ?? "");
  }, [user]);

  function selectTab(next: Tab) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState({}, "", url.toString());
  }

  const displayName = useMemo(() => {
    if (!user) return "Traveler";
    return (
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      "Traveler"
    );
  }, [user]);

  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted">
        Loading your account…
      </div>
    );
  }

  const primaryEmail = user.primaryEmailAddress?.emailAddress;
  const emails = user.emailAddresses ?? [];
  const connected = (user.externalAccounts ?? []).filter(
    (a) => a.verification?.status === "verified" || a.provider,
  );
  const hasPassword = user.passwordEnabled;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setProfileError(null);
    setProfileNote(null);
    try {
      const trimmedUsername = username.trim();
      const updates: {
        firstName: string | null;
        lastName: string | null;
        username?: string;
      } = {
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
      };
      if (trimmedUsername && trimmedUsername !== (user.username ?? "")) {
        updates.username = trimmedUsername;
      }
      await user.update(updates);
      setProfileNote("Profile updated.");
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Unable to update profile",
      );
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setPasswordError(null);
    setPasswordNote(null);
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      await user.updatePassword({
        currentPassword: currentPassword || undefined,
        newPassword,
        signOutOfOtherSessions: true,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordNote("Password updated. Other sessions were signed out.");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Unable to update password",
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="coastal-grid min-h-[calc(100dvh-4rem)]">
      <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <FadeIn>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-aqua">
            Swahili Trail
          </p>
          <h1 className="mt-2 font-display text-3xl text-ocean-deep sm:text-4xl">
            Account settings
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">
            Profile, security, plan, payments, and receipts for Swahili Trail.
          </p>
        </FadeIn>

        <div className="mt-8 grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-6">
          <aside className="relative overflow-hidden rounded-2xl border border-border bg-surface/90 p-3 shadow-sm sm:rounded-3xl sm:p-4">
            <CoastalOrbs className="opacity-50" />
            <div className="relative z-[1] space-y-1">
              <p className="px-2 pb-2 text-sm font-semibold text-ocean-deep">
                Account
              </p>
              <p className="px-2 pb-3 text-xs text-muted">
                Manage your Swahili Trail info
              </p>
              <NavButton
                active={tab === "profile"}
                icon={UserRound}
                label="Profile"
                onClick={() => selectTab("profile")}
              />
              <NavButton
                active={tab === "security"}
                icon={Shield}
                label="Security"
                onClick={() => selectTab("security")}
              />
              <NavButton
                active={tab === "billing"}
                icon={CreditCard}
                label="Plan & billing"
                onClick={() => selectTab("billing")}
              />
              <div className="my-3 border-t border-border" />
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ocean-deep transition hover:bg-foam"
              >
                <LayoutDashboard className="h-4 w-4 text-aqua" />
                Dashboard
              </Link>
              <Link
                href="/trips"
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ocean-deep transition hover:bg-foam"
              >
                <Map className="h-4 w-4 text-aqua" />
                My Trips
              </Link>
              <Link
                href="/pricing"
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ocean-deep transition hover:bg-foam"
              >
                <CreditCard className="h-4 w-4 text-aqua" />
                Pricing
              </Link>
              <button
                type="button"
                onClick={() => void signOut({ redirectUrl: "/" })}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-coral transition hover:bg-foam"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </aside>

          <section className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm sm:rounded-3xl">
            <CoastalOrbs className="opacity-40" />
            <div className="relative z-[1] border-b border-border px-5 py-4 sm:px-6">
              <h2 className="font-display text-2xl text-ocean-deep">
                {tab === "profile"
                  ? "Profile details"
                  : tab === "security"
                    ? "Security"
                    : "Plan & billing"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {tab === "profile"
                  ? "How you appear across Swahili Trail."
                  : tab === "security"
                    ? "Password and sign-in options."
                    : "Your plan, invoices, payment history, and receipts."}
              </p>
            </div>

            <div className="relative z-[1] space-y-6 p-5 sm:p-6">
              {tab === "billing" ? (
                <AccountBilling
                  highlightSuccess={
                    searchParams.get("billing") === "success"
                  }
                />
              ) : null}

              {tab === "profile" ? (
                <>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-aqua/30">
                        {user.imageUrl ? (
                          <Image
                            src={user.imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center bg-ocean text-xl font-semibold text-on-brand">
                            {displayName.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-ocean-deep">
                          {displayName}
                        </p>
                        <p className="text-sm text-muted">
                          {primaryEmail ?? "No email on file"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={saveProfile} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="First name" htmlFor="firstName">
                        <input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className={fieldClass}
                          autoComplete="given-name"
                        />
                      </Field>
                      <Field label="Last name" htmlFor="lastName">
                        <input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className={fieldClass}
                          autoComplete="family-name"
                        />
                      </Field>
                    </div>
                    <Field label="Username" htmlFor="username">
                      <input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={fieldClass}
                        autoComplete="username"
                        placeholder="Optional display username"
                      />
                    </Field>
                    <Field label="Primary email" htmlFor="emailReadonly">
                      <input
                        id="emailReadonly"
                        value={primaryEmail ?? ""}
                        readOnly
                        className={cn(fieldClass, "opacity-80")}
                      />
                      <p className="mt-1 text-xs text-muted">
                        Email is managed through your sign-in provider. Contact
                        support to change a verified address.
                      </p>
                    </Field>
                    {profileError ? (
                      <p className="text-sm text-coral">{profileError}</p>
                    ) : null}
                    {profileNote ? (
                      <p className="text-sm text-aqua">{profileNote}</p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-ocean px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:bg-brand-deep disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Save profile
                    </button>
                  </form>

                  <div className="rounded-2xl border border-border bg-foam/60 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ocean-deep">
                      <Mail className="h-4 w-4 text-aqua" />
                      Email addresses
                    </p>
                    <ul className="mt-3 space-y-2">
                      {emails.map((addr) => (
                        <li
                          key={addr.id}
                          className="flex flex-wrap items-center gap-2 text-sm text-ocean-deep"
                        >
                          <span>{addr.emailAddress}</span>
                          {addr.id === user.primaryEmailAddressId ? (
                            <span className="rounded-full bg-ocean/15 px-2 py-0.5 text-[11px] font-semibold text-ocean">
                              Primary
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-border bg-foam/60 p-4">
                    <p className="text-sm font-semibold text-ocean-deep">
                      Connected accounts
                    </p>
                    {connected.length === 0 ? (
                      <p className="mt-2 text-sm text-muted">
                        No social accounts connected.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {connected.map((account) => (
                          <li
                            key={account.id}
                            className="flex items-center gap-2 text-sm text-ocean-deep"
                          >
                            <span className="rounded-lg bg-surface px-2 py-1 text-xs font-semibold uppercase tracking-wide text-aqua">
                              {account.provider}
                            </span>
                            <span className="truncate text-muted">
                              {account.emailAddress ||
                                account.username ||
                                "Connected"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              ) : tab === "security" ? (
                <>
                  <div className="rounded-2xl border border-border bg-foam/60 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ocean-deep">
                      <KeyRound className="h-4 w-4 text-aqua" />
                      Password
                    </p>
                    {hasPassword ? (
                      <form
                        onSubmit={savePassword}
                        className="mt-4 space-y-3"
                      >
                        <Field label="Current password" htmlFor="currentPassword">
                          <input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className={fieldClass}
                            autoComplete="current-password"
                          />
                        </Field>
                        <Field label="New password" htmlFor="newPassword">
                          <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={fieldClass}
                            autoComplete="new-password"
                          />
                        </Field>
                        <Field
                          label="Confirm new password"
                          htmlFor="confirmPassword"
                        >
                          <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={fieldClass}
                            autoComplete="new-password"
                          />
                        </Field>
                        {passwordError ? (
                          <p className="text-sm text-coral">{passwordError}</p>
                        ) : null}
                        {passwordNote ? (
                          <p className="text-sm text-aqua">{passwordNote}</p>
                        ) : null}
                        <button
                          type="submit"
                          disabled={passwordSaving}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                        >
                          {passwordSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : null}
                          Update password
                        </button>
                      </form>
                    ) : (
                      <p className="mt-2 text-sm text-muted">
                        You sign in with a connected account (for example
                        Google), so there is no password on this Swahili Trail
                        profile.
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-border bg-foam/60 p-4">
                    <p className="text-sm font-semibold text-ocean-deep">
                      Sessions
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      Sign out of Swahili Trail on this device whenever you are
                      done planning.
                    </p>
                    <button
                      type="button"
                      onClick={() => void signOut({ redirectUrl: "/" })}
                      className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-ocean-deep transition hover:border-coral/40 hover:text-coral"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function NavButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof UserRound;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
        active
          ? "bg-ocean text-on-brand"
          : "text-ocean-deep hover:bg-foam",
      )}
    >
      <Icon className={cn("h-4 w-4", active ? "text-aqua" : "text-aqua")} />
      {label}
    </button>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm">
      <span className="font-medium text-ocean-deep">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const fieldClass =
  "w-full rounded-xl border border-border bg-foam px-3.5 py-2.5 text-sm text-ocean-deep outline-none transition placeholder:text-muted/70 focus:border-aqua focus:ring-2 focus:ring-aqua/20";
