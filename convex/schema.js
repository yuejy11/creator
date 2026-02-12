import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(), // Clerk user ID for auth
    ImageUrl: v.optional(v.string()), // Profile picture
    username: v.optional(v.string()), // Unique username for public profiles
    // Activity timestamps
    createAt: v.number(),
    lastActiveAt: v.number()
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"]) // Email lookups
    .index("by_username", ["username"]) // Username lookup for public profiles
    .searchIndex("search_name", { searchField: "name" }) // User search 
    .searchIndex("search_email", { searchField: "email" })
});