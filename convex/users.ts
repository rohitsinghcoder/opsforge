import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  ensureCurrentUser,
  findUserByClerkId,
  getCurrentUser,
  requireAdmin,
  requireCurrentUser,
  requireIdentity,
} from "./lib/auth";

// Get or create a user from Clerk data
export const getOrCreate = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ensureCurrentUser(ctx);
    return user._id;
  },
});

// Get user by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    if (identity.subject !== args.clerkId) {
      const currentUser = await getCurrentUser(ctx);
      if (currentUser?.role !== "admin") {
        throw new Error("Unauthorized");
      }
    }

    return await findUserByClerkId(ctx, args.clerkId);
  },
});

// Get user by ID
export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await requireCurrentUser(ctx);
    if (currentUser._id !== args.userId && currentUser.role !== "admin") {
      throw new Error("Unauthorized");
    }

    return await ctx.db.get(args.userId);
  },
});

// Get all users (admin only)
export const getAll = query({
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("users").order("desc").take(100);
  },
});

// Update user role (admin only)
export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("visitor"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

// Toggle favorite project
export const toggleFavorite = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await ensureCurrentUser(ctx);

    // Check if already favorited
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", user._id).eq("projectId", args.projectId)
      )
      .unique();

    if (existing) {
      // Remove favorite
      await ctx.db.delete(existing._id);
      return { action: "removed" };
    } else {
      // Add favorite
      await ctx.db.insert("favorites", {
        userId: user._id,
        projectId: args.projectId,
        createdAt: Date.now(),
      });
      return { action: "added" };
    }
  },
});

// Get user's favorites
export const getFavorites = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (!user) return [];

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get the actual projects
    const projects = await Promise.all(
      favorites.map((fav) => ctx.db.get(fav.projectId))
    );

    return projects.filter(Boolean);
  },
});

// Check if a project is favorited
export const isFavorite = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) return false;

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", user._id).eq("projectId", args.projectId)
      )
      .unique();

    return !!existing;
  },
});

// Track page view
export const trackPageView = mutation({
  args: {
    path: v.string(),
    projectSlug: v.optional(v.string()),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let userId = undefined;
    let clerkId = undefined;

    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      clerkId = identity.subject;
      const user =
        (await findUserByClerkId(ctx, clerkId)) ?? (await ensureCurrentUser(ctx));
      userId = user?._id;
    }

    const lastView = await ctx.db
      .query("page_views")
      .withIndex("by_session_path", (q) =>
        q.eq("sessionId", args.sessionId).eq("path", args.path)
      )
      .order("desc")
      .first();

    if (lastView && now - lastView.timestamp < 5 * 60 * 1000) {
      return { skipped: true };
    }

    await ctx.db.insert("page_views", {
      userId,
      clerkId,
      path: args.path,
      projectSlug: args.projectSlug,
      timestamp: now,
      sessionId: args.sessionId,
    });

    return { skipped: false };
  },
});

export const getAnalytics = query({
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const recentUsers = await ctx.db.query("users").order("desc").take(10);

    const visitorStat = await ctx.db
      .query("global_stats")
      .withIndex("by_key", (q) => q.eq("key", "total_visitors"))
      .unique();
    const totalUsers = visitorStat?.value ?? recentUsers.length;

    const recentViews = await ctx.db
      .query("page_views")
      .order("desc")
      .take(500);

    const viewsByPath: Record<string, number> = {};
    for (const view of recentViews) {
      viewsByPath[view.path] = (viewsByPath[view.path] || 0) + 1;
    }

    const recentFavorites = await ctx.db
      .query("favorites")
      .order("desc")
      .take(200);

    return {
      totalUsers,
      totalPageViews: recentViews.length,
      totalFavorites: recentFavorites.length,
      viewsByPath,
      recentUsers,
    };
  },
});
