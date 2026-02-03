import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get or create a user from Clerk data
export const getOrCreate = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      // Update last seen
      await ctx.db.patch(existingUser._id, {
        lastSeenAt: Date.now(),
        name: args.name,
        imageUrl: args.imageUrl,
      });
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      role: "visitor",
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
    });

    // Update total visitors stat
    const stats = await ctx.db
      .query("global_stats")
      .withIndex("by_key", (q) => q.eq("key", "total_visitors"))
      .unique();

    if (stats) {
      await ctx.db.patch(stats._id, { value: stats.value + 1 });
    } else {
      await ctx.db.insert("global_stats", { key: "total_visitors", value: 1 });
    }

    return userId;
  },
});

// Get user by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// Get user by ID
export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get all users (admin only)
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").order("desc").take(100);
  },
});

// Update user role (admin only)
export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

// Toggle favorite project
export const toggleFavorite = mutation({
  args: {
    clerkId: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

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
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

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
    clerkId: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

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
    clerkId: v.optional(v.string()),
    path: v.string(),
    projectSlug: v.optional(v.string()),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    let userId = undefined;

    if (args.clerkId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId!))
        .unique();
      userId = user?._id;
    }

    await ctx.db.insert("page_views", {
      userId,
      clerkId: args.clerkId,
      path: args.path,
      projectSlug: args.projectSlug,
      timestamp: Date.now(),
      sessionId: args.sessionId,
    });
  },
});

// Get analytics data (admin only)
export const getAnalytics = query({
  handler: async (ctx) => {
    const totalUsers = await ctx.db.query("users").collect();
    const totalViews = await ctx.db.query("page_views").collect();
    const totalFavorites = await ctx.db.query("favorites").collect();

    // Get views by path
    const viewsByPath: Record<string, number> = {};
    totalViews.forEach((view) => {
      viewsByPath[view.path] = (viewsByPath[view.path] || 0) + 1;
    });

    // Get most favorited projects
    const favoritesByProject: Record<string, number> = {};
    for (const fav of totalFavorites) {
      const key = fav.projectId.toString();
      favoritesByProject[key] = (favoritesByProject[key] || 0) + 1;
    }

    return {
      totalUsers: totalUsers.length,
      totalPageViews: totalViews.length,
      totalFavorites: totalFavorites.length,
      viewsByPath,
      recentUsers: totalUsers.slice(0, 10),
    };
  },
});
