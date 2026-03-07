import type { UserIdentity } from "convex/server";
import type { DatabaseReader, DatabaseWriter } from "../_generated/server";

type AuthContext = {
  auth: {
    getUserIdentity(): Promise<UserIdentity | null>;
  };
};

type ReaderContext = AuthContext & {
  db: DatabaseReader;
};

type WriterContext = AuthContext & {
  db: DatabaseWriter;
};

function getIdentityName(identity: UserIdentity): string {
  return (
    identity.name ??
    identity.preferredUsername ??
    identity.nickname ??
    identity.email ??
    "Anonymous"
  );
}

export async function requireIdentity(ctx: AuthContext): Promise<UserIdentity> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

export async function findUserByClerkId(
  ctx: { db: DatabaseReader },
  clerkId: string,
) {
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .unique();
}

export async function getCurrentUser(ctx: ReaderContext) {
  const identity = await requireIdentity(ctx);
  return await findUserByClerkId(ctx, identity.subject);
}

export async function requireCurrentUser(ctx: ReaderContext) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

export async function requireAdmin(ctx: ReaderContext) {
  const user = await requireCurrentUser(ctx);
  if (user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function ensureCurrentUser(ctx: WriterContext) {
  const identity = await requireIdentity(ctx);
  const clerkId = identity.subject;
  const existingUser = await findUserByClerkId(ctx, clerkId);
  const now = Date.now();

  if (existingUser) {
    const nextName = getIdentityName(identity);
    const nextEmail = identity.email ?? existingUser.email;
    const nextImageUrl = identity.pictureUrl ?? existingUser.imageUrl;

    await ctx.db.patch(existingUser._id, {
      lastSeenAt: now,
      name: nextName,
      email: nextEmail,
      imageUrl: nextImageUrl,
    });

    return {
      ...existingUser,
      lastSeenAt: now,
      name: nextName,
      email: nextEmail,
      imageUrl: nextImageUrl,
    };
  }

  const userId = await ctx.db.insert("users", {
    clerkId,
    email: identity.email ?? "",
    name: getIdentityName(identity),
    imageUrl: identity.pictureUrl,
    role: "visitor",
    createdAt: now,
    lastSeenAt: now,
  });

  const stats = await ctx.db
    .query("global_stats")
    .withIndex("by_key", (q) => q.eq("key", "total_visitors"))
    .unique();

  if (stats) {
    await ctx.db.patch(stats._id, { value: stats.value + 1 });
  } else {
    await ctx.db.insert("global_stats", { key: "total_visitors", value: 1 });
  }

  return {
    _id: userId,
    _creationTime: now,
    clerkId,
    email: identity.email ?? "",
    name: getIdentityName(identity),
    imageUrl: identity.pictureUrl,
    role: "visitor",
    createdAt: now,
    lastSeenAt: now,
  };
}
