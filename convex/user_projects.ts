import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureCurrentUser, requireIdentity } from "./lib/auth";
import { visibilityValidator } from "./lib/validators";

const FIELD_LIMITS = {
  title: 120,
  subtitle: 160,
  category: 80,
  description: 4000,
  year: 12,
  clientName: 120,
  role: 120,
  stackSize: 12,
  stackItem: 40,
} as const;

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

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

function normalizeRequiredString(value: string, fieldName: string, maxLength: number): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }
  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer`);
  }
  return normalized;
}

function normalizeOptionalString(
  value: string | undefined,
  fieldName: string,
  maxLength: number,
): string | undefined {
  if (value === undefined) return undefined;

  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer`);
  }

  return normalized;
}

function normalizeRequiredUrl(url: string, fieldName: string): string {
  const normalized = normalizeRequiredString(url, fieldName, 2048);
  validateOptionalUrl(normalized, fieldName);
  return normalized;
}

function normalizeOptionalUrl(url: string | undefined, fieldName: string): string | undefined {
  const normalized = normalizeOptionalString(url, fieldName, 2048);
  validateOptionalUrl(normalized, fieldName);
  return normalized;
}

function normalizeAccentColor(color: string | undefined): string | undefined {
  if (color === undefined) return undefined;

  const normalized = color.trim();
  if (!normalized) return undefined;
  if (!HEX_COLOR_REGEX.test(normalized)) {
    throw new Error("accentColor must be a valid hex color");
  }

  return normalized.toUpperCase();
}

function normalizeStack(stack: string[]): string[] {
  const normalized = stack
    .map((item) => item.trim())
    .filter(Boolean);

  if (normalized.length > FIELD_LIMITS.stackSize) {
    throw new Error(`stack can contain at most ${FIELD_LIMITS.stackSize} items`);
  }

  for (const item of normalized) {
    if (item.length > FIELD_LIMITS.stackItem) {
      throw new Error(`stack items must be ${FIELD_LIMITS.stackItem} characters or fewer`);
    }
  }

  return Array.from(new Set(normalized));
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
    const user = await ensureCurrentUser(ctx);
    const title = normalizeRequiredString(args.title, "title", FIELD_LIMITS.title);
    const subtitle = normalizeOptionalString(args.subtitle, "subtitle", FIELD_LIMITS.subtitle);
    const category = normalizeRequiredString(args.category, "category", FIELD_LIMITS.category);
    const description = normalizeRequiredString(args.description, "description", FIELD_LIMITS.description);
    const imageUrl = normalizeRequiredUrl(args.imageUrl, "imageUrl");
    const accentColor = normalizeAccentColor(args.accentColor);
    const stack = normalizeStack(args.stack);
    const year = normalizeRequiredString(args.year, "year", FIELD_LIMITS.year);
    const clientName = normalizeOptionalString(args.clientName, "clientName", FIELD_LIMITS.clientName);
    const role = normalizeOptionalString(args.role, "role", FIELD_LIMITS.role);
    const liveUrl = normalizeOptionalUrl(args.liveUrl, "liveUrl");
    const githubUrl = normalizeOptionalUrl(args.githubUrl, "githubUrl");

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
      title,
      subtitle,
      category,
      description,
      imageUrl,
      accentColor,
      stack,
      year,
      clientName,
      role,
      liveUrl,
      githubUrl,
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
    const project = await ctx.db.get(args.projectId);
    
    if (!project) {
      throw new Error("Project not found");
    }

    const identity = await requireIdentity(ctx);
    if (project.clerkId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    
    if (args.title !== undefined) updates.title = normalizeRequiredString(args.title, "title", FIELD_LIMITS.title);
    if (args.subtitle !== undefined) updates.subtitle = normalizeOptionalString(args.subtitle, "subtitle", FIELD_LIMITS.subtitle);
    if (args.category !== undefined) updates.category = normalizeRequiredString(args.category, "category", FIELD_LIMITS.category);
    if (args.description !== undefined) {
      updates.description = normalizeRequiredString(args.description, "description", FIELD_LIMITS.description);
    }
    if (args.imageUrl !== undefined) updates.imageUrl = normalizeRequiredUrl(args.imageUrl, "imageUrl");
    if (args.accentColor !== undefined) updates.accentColor = normalizeAccentColor(args.accentColor);
    if (args.stack !== undefined) updates.stack = normalizeStack(args.stack);
    if (args.year !== undefined) updates.year = normalizeRequiredString(args.year, "year", FIELD_LIMITS.year);
    if (args.clientName !== undefined) {
      updates.clientName = normalizeOptionalString(args.clientName, "clientName", FIELD_LIMITS.clientName);
    }
    if (args.role !== undefined) updates.role = normalizeOptionalString(args.role, "role", FIELD_LIMITS.role);
    if (args.liveUrl !== undefined) updates.liveUrl = normalizeOptionalUrl(args.liveUrl, "liveUrl");
    if (args.githubUrl !== undefined) updates.githubUrl = normalizeOptionalUrl(args.githubUrl, "githubUrl");
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
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("user_projects")
      .withIndex("by_slug", (q) => q.eq("shareSlug", args.slug))
      .first();

    if (!project || project.visibility === "private") {
      return { counted: false };
    }

    const existingView = await ctx.db
      .query("project_view_events")
      .withIndex("by_slug_session", (q) =>
        q.eq("shareSlug", args.slug).eq("sessionId", args.sessionId)
      )
      .unique();

    if (existingView) {
      return { counted: false };
    }

    await ctx.db.insert("project_view_events", {
      shareSlug: args.slug,
      sessionId: args.sessionId,
      viewedAt: Date.now(),
    });

    await ctx.db.patch(project._id, {
      viewCount: project.viewCount + 1,
    });

    return { counted: true };
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
