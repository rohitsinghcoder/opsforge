import type { UserIdentity } from "convex/server";
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const RATE_LIMITS = {
  askEcho: { scope: "ask_echo", limit: 25, windowMs: 15 * 60 * 1000 },
  generateIdea: { scope: "generate_project_idea", limit: 10, windowMs: 60 * 60 * 1000 },
  analyzeRepo: { scope: "analyze_repo", limit: 15, windowMs: 60 * 60 * 1000 },
  playground: { scope: "generate_playground_code", limit: 20, windowMs: 15 * 60 * 1000 },
  synthesizeSpeech: { scope: "synthesize_speech", limit: 30, windowMs: 15 * 60 * 1000 },
  trackPageView: { scope: "track_page_view", limit: 60, windowMs: 60 * 60 * 1000 },
  toggleFavorite: { scope: "toggle_favorite", limit: 30, windowMs: 60 * 60 * 1000 },
  incrementViews: { scope: "increment_project_views", limit: 20, windowMs: 60 * 60 * 1000 },
} as const;

type IdentityContext = {
  auth: { getUserIdentity(): Promise<UserIdentity | null> };
};

function normalizeIdentifierPart(value: string) {
  const normalized = value.trim().replace(/[^a-zA-Z0-9:_-]/g, "").slice(0, 120);
  return normalized || "unknown";
}

export async function getRateLimitIdentifier(ctx: IdentityContext, clientId: string) {
  const identity = await ctx.auth.getUserIdentity();
  return identity
    ? `user:${normalizeIdentifierPart(identity.subject)}`
    : `anon:${normalizeIdentifierPart(clientId)}`;
}

export const consumeRateLimit = internalMutation({
  args: {
    identifier: v.string(),
    scope: v.string(),
    limit: v.number(),
    windowMs: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = now - (now % args.windowMs);

    const existing = await ctx.db
      .query("api_rate_limits")
      .withIndex("by_identifier_scope_window", (q) =>
        q.eq("identifier", args.identifier).eq("scope", args.scope).eq("windowStart", windowStart),
      )
      .unique();

    if (existing) {
      if (existing.count >= args.limit) {
        throw new Error("Request limit exceeded for this time window.");
      }
      await ctx.db.patch(existing._id, { count: existing.count + 1, updatedAt: now });
      return;
    }

    await ctx.db.insert("api_rate_limits", {
      identifier: args.identifier,
      scope: args.scope,
      windowStart,
      count: 1,
      updatedAt: now,
    });
  },
});
