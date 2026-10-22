"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, RefreshCw, Shield, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type PaymentRow = {
  id: string;
  reference: string;
  userId: string;
  amountFormatted: string;
  status: string;
  description: string;
  at: string;
};

type SubscriberRow = {
  userId: string;
  email: string | null;
  status: string;
  periodEnd: string | null;
  updatedAt: string;
};

type AiRow = {
  userId: string;
  count: number;
  lastSource: string | null;
  updatedAt: string;
};

type EventRow = { event_type: string; created_at: string };

function shortId(id: string) {
  if (id.length <= 14) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-KE", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusTone(status: string) {
  if (status === "success" || status === "active")
    return "bg-[color-mix(in_oklab,var(--aqua)_14%,transparent)] text-ocean";
  if (status === "pending" || status === "past_due")
    return "bg-[color-mix(in_oklab,var(--gold)_18%,transparent)] text-ocean-deep";
  return "bg-[color-mix(in_oklab,var(--coral)_14%,transparent)] text-coral";
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { error?: string; message?: string };
  if (!res.ok) throw new Error(json.error || "Action failed");
  return json;
}

function ActionButton({
  label,
  onClick,
  tone = "default",
  busy,
}: {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger" | "accent";
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2 py-1 text-[11px] font-semibold transition disabled:opacity-50",
        tone === "danger" &&
          "border-coral/30 text-coral hover:bg-coral/10",
        tone === "accent" &&
          "border-aqua/30 text-ocean hover:bg-aqua/10",
        tone === "default" &&
          "border-border text-ocean-deep hover:bg-foam",
      )}
    >
      {busy ? <Loader2 className="inline h-3 w-3 animate-spin" /> : label}
    </button>
  );
}

export function PaymentControlList({
  payments,
  onDone,
}: {
  payments: PaymentRow[];
  onDone: () => void;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return payments;
    return payments.filter((p) => p.status === filter);
  }, [payments, filter]);

  async function run(reference: string, action: string) {
    setBusyKey(`${reference}:${action}`);
    setNote(null);
    try {
      const json = await postJson("/api/admin/payments", { reference, action });
      setNote(json.message || "Updated");
      onDone();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyKey(null);
    }
  }

  async function copyRef(reference: string) {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(reference);
      window.setTimeout(() => setCopied(null), 1200);
    } catch {
      /* ignore */
    }
  }

  return (
    <Card className="border-border/80 bg-surface/95">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle className="font-display text-lg">Payment controls</CardTitle>
          <p className="text-xs text-muted">
            Reconcile with Paystack or correct ledger status
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {["all", "pending", "success", "failed", "refunded"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                filter === f
                  ? "bg-ocean text-on-brand"
                  : "bg-foam text-muted hover:text-ocean-deep",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {note ? (
          <p className="mb-3 rounded-xl bg-foam px-3 py-2 text-xs text-ocean-deep">
            {note}
          </p>
        ) : null}
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No payments</p>
        ) : (
          <ul>
            {filtered.map((p, i) => (
              <li key={p.id}>
                {i > 0 ? <Separator /> : null}
                <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ocean-deep">
                      {p.description}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {shortId(p.reference)} · {shortId(p.userId)} ·{" "}
                      {formatWhen(p.at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Badge className={cn("capitalize", statusTone(p.status))}>
                      {p.status}
                    </Badge>
                    <span className="text-sm font-semibold text-ocean-deep">
                      {p.amountFormatted}
                    </span>
                    <ActionButton
                      label={copied === p.reference ? "Copied" : "Copy"}
                      onClick={() => void copyRef(p.reference)}
                    />
                    {p.status === "pending" ? (
                      <ActionButton
                        label="Reconcile"
                        tone="accent"
                        busy={busyKey === `${p.reference}:reconcile`}
                        onClick={() => void run(p.reference, "reconcile")}
                      />
                    ) : null}
                    {p.status === "pending" ? (
                      <ActionButton
                        label="Fail"
                        tone="danger"
                        busy={busyKey === `${p.reference}:mark_failed`}
                        onClick={() => void run(p.reference, "mark_failed")}
                      />
                    ) : null}
                    {p.status === "success" ? (
                      <ActionButton
                        label="Refunded"
                        tone="danger"
                        busy={busyKey === `${p.reference}:mark_refunded`}
                        onClick={() => void run(p.reference, "mark_refunded")}
                      />
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function SubscriberControlList({
  subscribers,
  onDone,
}: {
  subscribers: SubscriberRow[];
  onDone: () => void;
}) {
  const [query, setQuery] = useState("");
  const [grantUserId, setGrantUserId] = useState("");
  const [grantEmail, setGrantEmail] = useState("");
  const [grantDays, setGrantDays] = useState(30);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter(
      (s) =>
        s.userId.toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q),
    );
  }, [subscribers, query]);

  async function run(body: Record<string, unknown>, key: string) {
    setBusyKey(key);
    setNote(null);
    try {
      const json = await postJson("/api/admin/subscriptions", body);
      setNote(json.message || "Updated");
      onDone();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/80 bg-surface/95">
        <CardHeader>
          <CardTitle className="font-display text-lg">Grant Trail Plus</CardTitle>
          <p className="text-xs text-muted">
            Manual comps for partners, press, or support recoveries
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <input
            value={grantUserId}
            onChange={(e) => setGrantUserId(e.target.value)}
            placeholder="Clerk user id"
            className="rounded-xl border border-border bg-foam px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            value={grantEmail}
            onChange={(e) => setGrantEmail(e.target.value)}
            placeholder="Email (optional)"
            className="rounded-xl border border-border bg-foam px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={1}
            max={365}
            value={grantDays}
            onChange={(e) => setGrantDays(Number(e.target.value) || 30)}
            className="rounded-xl border border-border bg-foam px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={!grantUserId.trim() || busyKey === "grant"}
            onClick={() =>
              void run(
                {
                  action: "grant",
                  userId: grantUserId.trim(),
                  email: grantEmail.trim() || null,
                  days: grantDays,
                },
                "grant",
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-coral px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-4"
          >
            {busyKey === "grant" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Grant {grantDays} days
          </button>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-surface/95">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="font-display text-lg">Subscriber desk</CardTitle>
            <p className="text-xs text-muted">Extend, revoke, or set status</p>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search user / email / status"
            className="w-full max-w-xs rounded-xl border border-border bg-foam px-3 py-2 text-sm"
          />
        </CardHeader>
        <CardContent>
          {note ? (
            <p className="mb-3 rounded-xl bg-foam px-3 py-2 text-xs text-ocean-deep">
              {note}
            </p>
          ) : null}
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No subscribers</p>
          ) : (
            <ul>
              {filtered.map((s, i) => (
                <li key={s.userId}>
                  {i > 0 ? <Separator /> : null}
                  <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ocean-deep">
                        {s.email || shortId(s.userId)}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {shortId(s.userId)}
                        {s.periodEnd
                          ? ` · ends ${formatWhen(s.periodEnd)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className={cn("capitalize", statusTone(s.status))}>
                        {s.status}
                      </Badge>
                      <ActionButton
                        label="+30d"
                        tone="accent"
                        busy={busyKey === `${s.userId}:extend`}
                        onClick={() =>
                          void run(
                            {
                              action: "extend",
                              userId: s.userId,
                              email: s.email,
                              days: 30,
                            },
                            `${s.userId}:extend`,
                          )
                        }
                      />
                      <ActionButton
                        label="Activate"
                        busy={busyKey === `${s.userId}:active`}
                        onClick={() =>
                          void run(
                            {
                              action: "set_status",
                              userId: s.userId,
                              status: "active",
                              email: s.email,
                            },
                            `${s.userId}:active`,
                          )
                        }
                      />
                      <ActionButton
                        label="Revoke"
                        tone="danger"
                        busy={busyKey === `${s.userId}:revoke`}
                        onClick={() =>
                          void run(
                            { action: "revoke", userId: s.userId },
                            `${s.userId}:revoke`,
                          )
                        }
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AiControlList({
  users,
  period,
  onDone,
}: {
  users: AiRow[];
  period: string;
  onDone: () => void;
}) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function reset(userId: string) {
    setBusyKey(userId);
    setNote(null);
    try {
      const json = await postJson("/api/admin/ai-usage", {
        action: "reset",
        userId,
        period,
      });
      setNote(json.message || "Reset");
      onDone();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <Card className="border-border/80 bg-surface/95">
      <CardHeader>
        <CardTitle className="font-display text-lg">AI quota desk</CardTitle>
        <p className="text-xs text-muted">
          Reset monthly counters for support recoveries · {period}
        </p>
      </CardHeader>
      <CardContent>
        {note ? (
          <p className="mb-3 rounded-xl bg-foam px-3 py-2 text-xs text-ocean-deep">
            {note}
          </p>
        ) : null}
        {users.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No AI usage yet</p>
        ) : (
          <ul>
            {users.map((u, i) => (
              <li key={u.userId}>
                {i > 0 ? <Separator /> : null}
                <div className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ocean-deep">
                      {shortId(u.userId)}
                    </p>
                    <p className="text-xs text-muted">
                      {u.lastSource ?? "guide"} · {formatWhen(u.updatedAt)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-ocean-deep">
                    {u.count} calls
                  </p>
                  <ActionButton
                    label="Reset"
                    tone="danger"
                    busy={busyKey === u.userId}
                    onClick={() => void reset(u.userId)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function PulseControls({
  events,
  onDone,
}: {
  events: EventRow[];
  onDone: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function run(action: string, days?: number) {
    setBusy(action);
    setNote(null);
    try {
      const json = await postJson("/api/admin/events", { action, days });
      setNote(json.message || "Done");
      onDone();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="border-border/80 bg-surface/95">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle className="font-display text-lg">Event controls</CardTitle>
          <p className="text-xs text-muted">
            {events.length} recent events in the console sample
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <ActionButton
            label="Purge >30d"
            tone="danger"
            busy={busy === "purge_older_than_days"}
            onClick={() => void run("purge_older_than_days", 30)}
          />
          <ActionButton
            label="Clear sample"
            tone="danger"
            busy={busy === "purge_all_sampled"}
            onClick={() => void run("purge_all_sampled")}
          />
        </div>
      </CardHeader>
      <CardContent>
        {note ? (
          <p className="mb-3 rounded-xl bg-foam px-3 py-2 text-xs text-ocean-deep">
            {note}
          </p>
        ) : null}
        {events.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No events</p>
        ) : (
          <ul className="max-h-80 space-y-0 overflow-auto">
            {events.map((e, i) => (
              <li key={`${e.created_at}-${i}`}>
                {i > 0 ? <Separator /> : null}
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <p className="text-sm font-medium text-ocean-deep">
                    {e.event_type}
                  </p>
                  <p className="text-xs text-muted">{formatWhen(e.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [trailPlusSalesEnabled, setTrailPlusSalesEnabled] = useState(true);
  const [freeAiMonthlyCap, setFreeAiMonthlyCap] = useState<string>("");
  const [opsNote, setOpsNote] = useState("");
  const [runtime, setRuntime] = useState<{
    adminEmailCount: number;
    supabaseConfigured: boolean;
    paystackConfigured: boolean;
    appUrl: string | null;
  } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load settings");
      setMaintenanceMode(Boolean(json.settings.maintenanceMode));
      setTrailPlusSalesEnabled(Boolean(json.settings.trailPlusSalesEnabled));
      setFreeAiMonthlyCap(
        json.settings.freeAiMonthlyCap == null
          ? ""
          : String(json.settings.freeAiMonthlyCap),
      );
      setOpsNote(json.settings.opsNote ?? "");
      setRuntime(json.runtime);
      setNote(null);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    setSaving(true);
    setNote(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maintenanceMode,
          trailPlusSalesEnabled,
          freeAiMonthlyCap:
            freeAiMonthlyCap.trim() === ""
              ? null
              : Number(freeAiMonthlyCap),
          opsNote,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setNote("Settings saved");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card className="border-border/80 bg-surface/95">
        <CardContent className="flex items-center gap-2 py-10 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading settings…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/80 bg-surface/95">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="font-display text-lg">Platform toggles</CardTitle>
            <p className="text-xs text-muted">
              Ops knobs stored in Supabase · apply migration if save fails
            </p>
          </div>
          <Shield className="h-4 w-4 text-gold" />
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-foam/60 px-4 py-3">
            <span>
              <span className="block text-sm font-medium text-ocean-deep">
                Maintenance mode
              </span>
              <span className="text-xs text-muted">
                Flag for banner / freeze messaging (wire into public UI next)
              </span>
            </span>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="h-4 w-4 accent-coral"
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-foam/60 px-4 py-3">
            <span>
              <span className="block text-sm font-medium text-ocean-deep">
                Trail Plus sales
              </span>
              <span className="text-xs text-muted">
                Disable new upgrades while keeping existing Plus access
              </span>
            </span>
            <input
              type="checkbox"
              checked={trailPlusSalesEnabled}
              onChange={(e) => setTrailPlusSalesEnabled(e.target.checked)}
              className="h-4 w-4 accent-coral"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ocean-deep">
              Free AI monthly cap override
            </span>
            <input
              type="number"
              min={0}
              value={freeAiMonthlyCap}
              onChange={(e) => setFreeAiMonthlyCap(e.target.value)}
              placeholder="Leave blank for code default"
              className="mt-1 w-full rounded-xl border border-border bg-foam px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ocean-deep">Ops note</span>
            <textarea
              value={opsNote}
              onChange={(e) => setOpsNote(e.target.value)}
              rows={4}
              placeholder="Internal note for the ops team…"
              className="mt-1 w-full resize-y rounded-xl border border-border bg-foam px-3 py-2 text-sm"
            />
          </label>
          {note ? (
            <p className="rounded-xl bg-foam px-3 py-2 text-xs text-ocean-deep">
              {note}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Save settings
            </button>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ocean-deep"
            >
              <RefreshCw className="h-4 w-4" />
              Reload
            </button>
          </div>
        </CardContent>
      </Card>

      {runtime ? (
        <Card className="border-border/80 bg-surface/95">
          <CardHeader>
            <CardTitle className="font-display text-lg">Runtime health</CardTitle>
            <p className="text-xs text-muted">Read-only environment checks</p>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["Admin emails configured", String(runtime.adminEmailCount)],
                ["Supabase", runtime.supabaseConfigured ? "Ready" : "Missing"],
                ["Paystack", runtime.paystackConfigured ? "Ready" : "Missing"],
                ["App URL", runtime.appUrl || "Not set"],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-foam/50 px-3 py-2"
              >
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-0.5 text-sm font-semibold text-ocean-deep">
                  {value}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
