import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Store a batch of interactions (for efficiency)
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
    for (const interaction of args.interactions) {
      await ctx.db.insert("interactions", interaction);
    }
    return { stored: args.interactions.length };
  },
});

// Store a single interaction (for clicks)
export const storeClick = mutation({
  args: {
    sessionId: v.string(),
    path: v.string(),
    x: v.number(),
    y: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("interactions", {
      ...args,
      type: "click",
      timestamp: Date.now(),
    });
  },
});

// Get all interactions for a specific path (for heatmap)
export const getByPath = query({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interactions")
      .withIndex("by_path", (q) => q.eq("path", args.path))
      .collect();
  },
});

// Get aggregated heatmap data for a path (OPTIMIZED)
export const getHeatmapData = query({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    // Only get last 500 interactions for performance
    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_path", (q) => q.eq("path", args.path))
      .order("desc")
      .take(500);

    // Aggregate into grid cells (10x10 grid = 100 cells)
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
        grid[gridY][gridX] += 10; // Clicks count more
        clicks.push({ x: interaction.x, y: interaction.y });
        totalClicks++;
      } else {
        grid[gridY][gridX] += 1;
        totalMoves++;
      }
    }

    // Find max value for normalization
    const maxValue = Math.max(...grid.flat(), 1);

    return {
      grid,
      maxValue,
      clicks: clicks.slice(0, 50), // Only return last 50 clicks for rendering
      totalInteractions: interactions.length,
      totalClicks,
      totalMoves,
    };
  },
});

// Get global heatmap stats
export const getStats = query({
  handler: async (ctx) => {
    const allInteractions = await ctx.db.query("interactions").collect();
    const clicks = allInteractions.filter((i) => i.type === "click");
    const moves = allInteractions.filter((i) => i.type === "move");

    // Get unique paths
    const paths = [...new Set(allInteractions.map((i) => i.path))];

    return {
      totalInteractions: allInteractions.length,
      totalClicks: clicks.length,
      totalMoves: moves.length,
      trackedPages: paths.length,
      paths,
    };
  },
});

// Clear old interactions (cleanup - keep last 24 hours)
export const cleanup = mutation({
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    const oldInteractions = await ctx.db
      .query("interactions")
      .filter((q) => q.lt(q.field("timestamp"), cutoff))
      .collect();

    for (const interaction of oldInteractions) {
      await ctx.db.delete(interaction._id);
    }

    return { deleted: oldInteractions.length };
  },
});
