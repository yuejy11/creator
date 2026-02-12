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
    // 精确查找索引
    // 给 tokenIdentifier 建立一个查找目录，目录名字叫 by_token
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"]) 
    .index("by_username", ["username"]) 
    // 全文搜索索引
    // 给 name 字段建立搜索引擎级索引(支持模糊匹配)，目录名字叫 search_name
    .searchIndex("search_name", { searchField: "name" }) 
    .searchIndex("search_email", { searchField: "email" })
});