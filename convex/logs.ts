import { query, mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getRateLimitIdentifier } from "./lib/rateLimit";
import { requireAdmin } from "./lib/auth";

const LOG_RATE_LIMIT = { limit: 10, windowMs: 60_000 } as const;

async function consumeLogQuota(
  ctx: MutationCtx,
  args: { type: string; user: string; clientId?: string },
) {
  const now = Date.now();
  const windowStart = now - (now % LOG_RATE_LIMIT.windowMs);
  const identifier = await getRateLimitIdentifier(ctx, args.clientId ?? args.user);
  const scope = `log:${args.type.toLowerCase()}`;

  const existing = await ctx.db
    .query("api_rate_limits")
    .withIndex("by_identifier_scope_window", (q) =>
      q.eq("identifier", identifier).eq("scope", scope).eq("windowStart", windowStart),
    )
    .unique();

  if (existing) {
    if (existing.count >= LOG_RATE_LIMIT.limit) {
      return false;
    }

    await ctx.db.patch(existing._id, { count: existing.count + 1, updatedAt: now });
    return true;
  }

  await ctx.db.insert("api_rate_limits", {
    identifier,
    scope,
    windowStart,
    count: 1,
    updatedAt: now,
  });

  return true;
}

async function incrementBreachCount(ctx: MutationCtx) {
  const stats = await ctx.db
    .query("global_stats")
    .withIndex("by_key", (q) => q.eq("key", "total_breaches"))
    .unique();

  if (stats) {
    await ctx.db.patch(stats._id, { value: stats.value + 1 });
  } else {
    await ctx.db.insert("global_stats", { key: "total_breaches", value: 1 });
  }
}

export const logEvent = mutation({
  args: {
    type: v.string(),
    user: v.string(),
    content: v.string(),
    clientId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const canLog = await consumeLogQuota(ctx, args);
    if (!canLog) {
      return { logged: false, rateLimited: true };
    }

    await ctx.db.insert("system_logs", {
      type: args.type,
      user: args.user,
      content: args.content.trim().slice(0, 500),
      timestamp: Date.now(),
    });

    if (args.type === "BREACH") {
      await incrementBreachCount(ctx);
    }

    return { logged: true, rateLimited: false };
  },
});

export const getRecentLogs = query({
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("system_logs")
      .order("desc")
      .take(15);
  },
});

export const getStats = query({
  handler: async (ctx) => {
    const breaches = await ctx.db
      .query("global_stats")
      .withIndex("by_key", (q) => q.eq("key", "total_breaches"))
      .unique();
    return {
      totalBreaches: breaches?.value || 0,
    };
  },
});
