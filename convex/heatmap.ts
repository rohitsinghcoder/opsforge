import { query, mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

const MAX_BATCH_SIZE = 50;
const MAX_INTERACTIONS_PER_SESSION = 500;

async function getSessionInteractionCount(ctx: MutationCtx, sessionId: string) {
  const entries = await ctx.db
    .query("interactions")
    .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
    .take(MAX_INTERACTIONS_PER_SESSION + 1);

  return entries.length;
}

export const storeBatch = mutation({
  args: {
    interactions: v.array(
      v.object({
        sessionId: v.string(),
        path: v.string(),
        type: v.string(),
        x: v.number(),
        y: v.number(),
        timestamp: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (args.interactions.length > MAX_BATCH_SIZE) {
      throw new Error(`Batch size exceeds maximum of ${MAX_BATCH_SIZE}`);
    }

    const sessionId = args.interactions[0]?.sessionId;
    if (!sessionId) {
      return { stored: 0 };
    }

    const sessionCount = await getSessionInteractionCount(ctx, sessionId);
    const remainingSlots = Math.max(MAX_INTERACTIONS_PER_SESSION - sessionCount, 0);

    if (remainingSlots === 0) {
      return { stored: 0, reason: "session_limit_reached" };
    }

    const interactionsToStore = args.interactions.slice(0, remainingSlots);

    for (const interaction of interactionsToStore) {
      await ctx.db.insert("interactions", interaction);
    }
    return {
      stored: interactionsToStore.length,
      reason:
        interactionsToStore.length < args.interactions.length
          ? "session_limit_reached"
          : undefined,
    };
  },
});

export const storeClick = mutation({
  args: {
    sessionId: v.string(),
    path: v.string(),
    x: v.number(),
    y: v.number(),
  },
  handler: async (ctx, args) => {
    const sessionCount = await getSessionInteractionCount(ctx, args.sessionId);
    if (sessionCount >= MAX_INTERACTIONS_PER_SESSION) {
      return { stored: false, reason: "session_limit_reached" };
    }

    await ctx.db.insert("interactions", {
      ...args,
      type: "click",
      timestamp: Date.now(),
    });

    return { stored: true };
  },
});

export const getByPath = query({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interactions")
      .withIndex("by_path", (q) => q.eq("path", args.path))
      .take(500);
  },
});

export const getHeatmapData = query({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_path", (q) => q.eq("path", args.path))
      .order("desc")
      .take(500);

    const gridSize = 10;
    const grid: number[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(0));

    const clicks: { x: number; y: number }[] = [];
    let totalClicks = 0;
    let totalMoves = 0;

    for (const interaction of interactions) {
      const gridX = Math.min(Math.floor(interaction.x / gridSize), gridSize - 1);
      const gridY = Math.min(Math.floor(interaction.y / gridSize), gridSize - 1);

      if (interaction.type === "click") {
        grid[gridY][gridX] += 10;
        clicks.push({ x: interaction.x, y: interaction.y });
        totalClicks++;
      } else {
        grid[gridY][gridX] += 1;
        totalMoves++;
      }
    }

    const maxValue = Math.max(...grid.flat(), 1);

    return {
      grid,
      maxValue,
      clicks: clicks.slice(0, 50),
      totalInteractions: interactions.length,
      totalClicks,
      totalMoves,
    };
  },
});

export const getStats = query({
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const clicks = await ctx.db
      .query("interactions")
      .withIndex("by_type", (q) => q.eq("type", "click"))
      .collect();

    const moves = await ctx.db
      .query("interactions")
      .withIndex("by_type", (q) => q.eq("type", "move"))
      .collect();

    const allPaths = new Set<string>();
    for (const c of clicks) allPaths.add(c.path);
    for (const m of moves) allPaths.add(m.path);

    return {
      totalInteractions: clicks.length + moves.length,
      totalClicks: clicks.length,
      totalMoves: moves.length,
      trackedPages: allPaths.size,
      paths: [...allPaths],
    };
  },
});

export const cleanup = mutation({
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const oldInteractions = await ctx.db
      .query("interactions")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
      .take(500);

    for (const interaction of oldInteractions) {
      await ctx.db.delete(interaction._id);
    }

    return { deleted: oldInteractions.length };
  },
});
