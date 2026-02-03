import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all projects
export const get = query({
  handler: async (ctx) => {
    return await ctx.db.query("projects").collect();
  },
});

// Get a single project by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

// Seed data from local file
export const seed = mutation({
  args: {
    projects: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("projects").collect();
    if (existing.length > 0) return "Database already seeded";

    for (const project of args.projects) {
      await ctx.db.insert("projects", {
        ...project,
        is_hidden: false,
      });
    }
    return "Seeding complete";
  },
});
