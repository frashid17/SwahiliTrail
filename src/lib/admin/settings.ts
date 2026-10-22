import { createAdminClient } from "@/lib/supabase/admin";

export type AdminSettings = {
  id: string;
  maintenanceMode: boolean;
  trailPlusSalesEnabled: boolean;
  freeAiMonthlyCap: number | null;
  opsNote: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

const DEFAULTS: AdminSettings = {
  id: "default",
  maintenanceMode: false,
  trailPlusSalesEnabled: true,
  freeAiMonthlyCap: null,
  opsNote: "",
  updatedAt: null,
  updatedBy: null,
};

type Row = {
  id: string;
  maintenance_mode: boolean;
  trail_plus_sales_enabled: boolean;
  free_ai_monthly_cap: number | null;
  ops_note: string | null;
  updated_at: string | null;
  updated_by: string | null;
};

function mapRow(row: Row): AdminSettings {
  return {
    id: row.id,
    maintenanceMode: Boolean(row.maintenance_mode),
    trailPlusSalesEnabled: Boolean(row.trail_plus_sales_enabled),
    freeAiMonthlyCap:
      typeof row.free_ai_monthly_cap === "number"
        ? row.free_ai_monthly_cap
        : null,
    opsNote: row.ops_note ?? "",
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const supabase = createAdminClient();
  if (!supabase) return DEFAULTS;

  const { data, error } = await supabase
    .from("admin_settings")
    .select(
      "id, maintenance_mode, trail_plus_sales_enabled, free_ai_monthly_cap, ops_note, updated_at, updated_by",
    )
    .eq("id", "default")
    .maybeSingle();

  if (error || !data) return DEFAULTS;
  return mapRow(data as Row);
}

export async function updateAdminSettings(
  patch: Partial<
    Pick<
      AdminSettings,
      | "maintenanceMode"
      | "trailPlusSalesEnabled"
      | "freeAiMonthlyCap"
      | "opsNote"
    >
  >,
  updatedBy: string,
): Promise<AdminSettings> {
  const supabase = createAdminClient();
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const payload: Record<string, unknown> = {
    id: "default",
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  };
  if (patch.maintenanceMode !== undefined) {
    payload.maintenance_mode = patch.maintenanceMode;
  }
  if (patch.trailPlusSalesEnabled !== undefined) {
    payload.trail_plus_sales_enabled = patch.trailPlusSalesEnabled;
  }
  if (patch.freeAiMonthlyCap !== undefined) {
    payload.free_ai_monthly_cap = patch.freeAiMonthlyCap;
  }
  if (patch.opsNote !== undefined) {
    payload.ops_note = patch.opsNote;
  }

  const { data, error } = await supabase
    .from("admin_settings")
    .upsert(payload, { onConflict: "id" })
    .select(
      "id, maintenance_mode, trail_plus_sales_enabled, free_ai_monthly_cap, ops_note, updated_at, updated_by",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to save settings");
  }
  return mapRow(data as Row);
}
