import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate a unique share slug
function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

// Create a new user project
export const create = mutation({
  args: {
    clerkId: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    category: v.string(),
    description: v.string(),
    imageUrl: v.string(),
    accentColor: v.optional(v.string()),
    stack: v.array(v.string()),
    year: v.string(),
    clientName: v.optional(v.string()),
    role: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    visibility: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the user from Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const shareSlug = generateSlug();

    const projectId = await ctx.db.insert("user_projects", {
      userId: user._id,
      clerkId: args.clerkId,
      title: args.title,
      subtitle: args.subtitle,
      category: args.category,
      description: args.description,
      imageUrl: args.imageUrl,
      accentColor: args.accentColor,
      stack: args.stack,
      year: args.year,
      clientName: args.clientName,
      role: args.role,
      liveUrl: args.liveUrl,
      githubUrl: args.githubUrl,
      visibility: args.visibility,
      shareSlug,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return { projectId, shareSlug };
  },
});

// Update an existing user project
export const update = mutation({
  args: {
    projectId: v.id("user_projects"),
    clerkId: v.string(),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    stack: v.optional(v.array(v.string())),
    year: v.optional(v.string()),
    clientName: v.optional(v.string()),
    role: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    visibility: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.clerkId !== args.clerkId) {
      throw new Error("Unauthorized");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    
    if (args.title !== undefined) updates.title = args.title;
    if (args.subtitle !== undefined) updates.subtitle = args.subtitle;
    if (args.category !== undefined) updates.category = args.category;
    if (args.description !== undefined) updates.description = args.description;
    if (args.imageUrl !== undefined) updates.imageUrl = args.imageUrl;
    if (args.accentColor !== undefined) updates.accentColor = args.accentColor;
    if (args.stack !== undefined) updates.stack = args.stack;
    if (args.year !== undefined) updates.year = args.year;
    if (args.clientName !== undefined) updates.clientName = args.clientName;
    if (args.role !== undefined) updates.role = args.role;
    if (args.liveUrl !== undefined) updates.liveUrl = args.liveUrl;
    if (args.githubUrl !== undefined) updates.githubUrl = args.githubUrl;
    if (args.visibility !== undefined) updates.visibility = args.visibility;

    await ctx.db.patch(args.projectId, updates);
    return { success: true };
  },
});

// Delete a user project
export const remove = mutation({
  args: {
    projectId: v.id("user_projects"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.clerkId !== args.clerkId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.projectId);
    return { success: true };
  },
});

// Get all projects for a user
export const getMyProjects = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("user_projects")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .order("desc")
      .collect();
  },
});

// Get a single project by ID (for editing)
export const getById = query({
  args: {
    projectId: v.id("user_projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

// Get a project by share slug (for public viewing)
export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("user_projects")
      .withIndex("by_slug", (q) => q.eq("shareSlug", args.slug))
      .first();
  },
});

// Increment view count
export const incrementViews = mutation({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("user_projects")
      .withIndex("by_slug", (q) => q.eq("shareSlug", args.slug))
      .first();

    if (project) {
      await ctx.db.patch(project._id, {
        viewCount: project.viewCount + 1,
      });
    }
  },
});

// Get public gallery (all public projects)
export const getPublicGallery = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("user_projects")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .order("desc")
      .take(20);
  },
});
