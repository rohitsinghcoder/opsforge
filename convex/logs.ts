import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Log a system event (like a breach or AI query)
export const logEvent = mutation({
  args: {
    type: v.string(),
    user: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("system_logs", {
      type: args.type,
      user: args.user,
      content: args.content,
      timestamp: Date.now(),
    });

    // Update global stats for breaches
    if (args.type === "BREACH") {
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
  },
});

// Get recent logs for the scrolling UI
export const getRecentLogs = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("system_logs")
      .order("desc")
      .take(15);
  },
});

// Get total system stats
export const getStats = query({
  handler: async (ctx) => {
    const breaches = await ctx.db
      .query("global_stats")
      .withIndex("by_key", (q) => q.eq("key", "total_breaches"))
      .unique();
    return {
      totalBreaches: breaches?.value || 0,
      neuralLoad: Math.floor(Math.random() * 20) + 80, // Simulated load
    };
  },
});
