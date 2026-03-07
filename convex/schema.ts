import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const visibilityValidator = v.union(
  v.literal("public"),
  v.literal("unlisted"),
  v.literal("private")
);

export default defineSchema({
  // Projects table - stores portfolio projects
  projects: defineTable({
    id: v.number(),
    slug: v.string(),
    title: v.string(),
    category: v.string(),
    image: v.string(),
    wireframe: v.string(),
    year: v.string(),
    client: v.string(),
    role: v.string(),
    description: v.string(),
    stack: v.array(v.string()),
    is_hidden: v.boolean(),
  }).index("by_slug", ["slug"]),

  // Users table - linked to Clerk via clerkId
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.string(), // 'visitor', 'admin'
    createdAt: v.number(),
    lastSeenAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  // Favorites - users can favorite projects
  favorites: defineTable({
    userId: v.id("users"),
    projectId: v.id("projects"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_user_project", ["userId", "projectId"]),

  // Page views - track user activity
  page_views: defineTable({
    userId: v.optional(v.id("users")), // optional for anonymous users
    clerkId: v.optional(v.string()),
    path: v.string(),
    projectSlug: v.optional(v.string()),
    timestamp: v.number(),
    sessionId: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_path", ["path"])
    .index("by_project", ["projectSlug"]),

  // System logs - for tracking events like breaches and AI queries
  system_logs: defineTable({
    type: v.string(), // 'BREACH', 'AI_QUERY', 'NAVIGATE'
    user: v.string(),
    content: v.string(),
    timestamp: v.number(),
  }),

  // Global stats - aggregate metrics
  global_stats: defineTable({
    key: v.string(), // 'total_breaches', 'neural_load', 'total_visitors'
    value: v.number(),
  }).index("by_key", ["key"]),

  // Interactions - for heatmap tracking (mouse moves and clicks)
  interactions: defineTable({
    sessionId: v.string(),
    path: v.string(),
    type: v.string(), // 'click' or 'move'
    x: v.number(), // percentage of viewport width (0-100)
    y: v.number(), // percentage of viewport height (0-100)
    timestamp: v.number(),
  })
    .index("by_path", ["path"])
    .index("by_session", ["sessionId"])
    .index("by_type", ["type"]),

  // User-created project cards (Live Project Builder)
  user_projects: defineTable({
    userId: v.id("users"),
    clerkId: v.string(),
    
    // Core project data
    title: v.string(),
    subtitle: v.optional(v.string()),
    category: v.string(),
    description: v.string(),
    
    // Visuals
    imageUrl: v.string(),
    accentColor: v.optional(v.string()),
    
    // Tech stack
    stack: v.array(v.string()),
    
    // Metadata
    year: v.string(),
    clientName: v.optional(v.string()),
    role: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    
    // Visibility & sharing
    visibility: visibilityValidator,
    shareSlug: v.string(),
    
    // Analytics
    viewCount: v.number(),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_clerkId", ["clerkId"])
    .index("by_slug", ["shareSlug"])
    .index("by_visibility", ["visibility"]),

  api_rate_limits: defineTable({
    identifier: v.string(),
    scope: v.string(),
    windowStart: v.number(),
    count: v.number(),
    updatedAt: v.number(),
  }).index("by_identifier_scope_window", ["identifier", "scope", "windowStart"]),
});

