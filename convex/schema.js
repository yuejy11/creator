// 定义数据库结构（表结构 + 索引）

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// defineSchema → 定义整个数据库结构
export default defineSchema({
  // defineTable → 定义单个表
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(), 
    ImageUrl: v.optional(v.string()), 
    username: v.optional(v.string()), 
    createAt: v.number(),
    lastActiveAt: v.number()
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"]) 
    .index("by_username", ["username"]) 
    .searchIndex("search_name", { searchField: "name" }) 
    .searchIndex("search_email", { searchField: "email" })
});