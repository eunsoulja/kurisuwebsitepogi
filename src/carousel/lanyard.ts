import type { DevConfig } from "../config";

export interface LanyardUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
}
export interface LanyardActivity { type?: number; name?: string; details?: string }
export interface LanyardData {
  discord_user: LanyardUser;
  discord_status: string;
  activities?: LanyardActivity[];
  kv?: Record<string, string>;
}
export interface LanyardResp { success: boolean; data: LanyardData }

export type StatusKey = "online" | "idle" | "dnd" | "offline";

export const SC: Record<StatusKey, [string, string]> = {
  online: ["#3ba55d", "Online"],
  idle: ["#faa81a", "Idle"],
  dnd: ["#ed4245", "Do not disturb"],
  offline: ["#747f8d", "Offline"],
};

export const getDevView = (d: DevConfig, s: LanyardData | null, k: number) => {
  const u = s && s.discord_user;
  const act = s && (s.activities || []).find((a) => a.type !== 4);
  const raw = s && (SC as Record<string, [string, string]>)[s.discord_status] ? s.discord_status : "offline";
  const status = raw as StatusKey;
  const avatar = u && u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith("a_") ? "gif" : "webp"}?size=256` : "";
  return {
    name: d.name || (u && (u.global_name || u.username)) || `Developer ${String(k + 1).padStart(2, "0")}`,
    role: d.role || "Developer",
    status,
    avatar,
    banner: d.banner || "",
    accent: d.accent || "#6f86ff",
    tags: d.tags || [],
    activity: act ? (act.name || "") + (act.details ? " · " + act.details : "") : "",
    tagline: d.tagline || "",
  };
};

export async function pollLanyard(devs: DevConfig[], states: (LanyardData | null)[]): Promise<number> {
  let ok = 0;
  await Promise.all(devs.map(async (d, k) => {
    if (!/^\d{17,20}$/.test(d.id)) return;
    try {
      const res = await fetch("https://api.lanyard.rest/v1/users/" + encodeURIComponent(d.id), { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!res.ok) throw new Error("Lanyard HTTP " + res.status);
      const j = await res.json() as LanyardResp;
      if (!j || j.success !== true || !j.data || !j.data.discord_user) throw new Error("User unavailable");
      states[k] = j.data; ok++;
    } catch (err) { console.warn("[Kurisu/Lanyard] Developer " + d.id, err); }
  }));
  return ok;
}
