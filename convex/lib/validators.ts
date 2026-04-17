import { v } from "convex/values";

export const visibilityValidator = v.union(
  v.literal("public"),
  v.literal("unlisted"),
  v.literal("private")
);
