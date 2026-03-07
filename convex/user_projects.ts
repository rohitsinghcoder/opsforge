import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureCurrentUser, requireIdentity } from "./lib/auth";

const visibilityValidator = v.union(
  v.literal("public"),
  v.literal("unlisted"),
  v.literal("private")
);

// Generate a unique share slug
function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

function validateOptionalUrl(url: string | undefined, fieldName: string): void {
  if (!url) return;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${fieldName} must be a valid URL`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${fieldName} must use http or https`);
  }
}

// Create a new user project
export const create = mutation({
  args: {
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
    visibility: visibilityValidator,
  },
  handler: async (ctx, args) => {
    validateOptionalUrl(args.liveUrl, "liveUrl");
    validateOptionalUrl(args.githubUrl, "githubUrl");
    const user = await ensureCurrentUser(ctx);

    const now = Date.now();

    // Generate a unique slug with collision check
    let shareSlug = generateSlug();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await ctx.db
        .query("user_projects")
        .withIndex("by_slug", (q) => q.eq("shareSlug", shareSlug))
        .first();
      if (!existing) break;
      shareSlug = generateSlug();
      attempts++;
    }
    if (attempts >= 10) {
      throw new Error("Failed to generate unique slug after 10 attempts");
    }

    const projectId = await ctx.db.insert("user_projects", {
      userId: user._id,
      clerkId: user.clerkId,
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
    visibility: v.optional(visibilityValidator),
  },
  handler: async (ctx, args) => {
    if (args.liveUrl !== undefined) {
      validateOptionalUrl(args.liveUrl, "liveUrl");
    }
    if (args.githubUrl !== undefined) {
      validateOptionalUrl(args.githubUrl, "githubUrl");
    }

    const project = await ctx.db.get(args.projectId);
    
    if (!project) {
      throw new Error("Project not found");
    }

    const identity = await requireIdentity(ctx);
    if (project.clerkId !== identity.subject) {
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
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    
    if (!project) {
      throw new Error("Project not found");
    }

    const identity = await requireIdentity(ctx);
    if (project.clerkId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.projectId);
    return { success: true };
  },
});

// Get all projects for a user
export const getMyProjects = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    return await ctx.db
      .query("user_projects")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
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
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const identity = await requireIdentity(ctx);
    if (project.clerkId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    return project;
  },
});

// Get a project by share slug (for public viewing)
export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("user_projects")
      .withIndex("by_slug", (q) => q.eq("shareSlug", args.slug))
      .first();

    if (!project) return null;
    if (project.visibility === "private") return null;

    return project;
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

    if (project && project.visibility !== "private") {
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
