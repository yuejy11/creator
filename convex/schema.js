// 定义数据库结构（表结构 + 索引）

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// defineSchema → 定义整个数据库结构
export default defineSchema({
  // defineTable → 定义单个表
  // 用户表
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
    ImageUrl: v.optional(v.string()),
    username: v.optional(v.string()),
    createAt: v.number(),
    lastActiveAt: v.number(),
  })
    // 精确查找索引
    // 给 tokenIdentifier 建立一个查找目录，目录名字叫 by_token
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    // 全文搜索索引
    // 给 name 字段建立搜索引擎级索引(支持模糊匹配)，目录名字叫 search_name
    .searchIndex("search_name", { searchField: "name" })
    .searchIndex("search_email", { searchField: "email" }),

  // 帖子表
  posts: defineTable({
    title: v.string(),
    content: v.string(),
    // 限制字段只能是这几个固定值
    status: v.union(
      // 限定某个字段的值必须完全等于你指定的那个字符串，不能有任何偏差
      // DRAFT 这种也会报错
      v.literal("draft"),
      v.literal("published"),
    ),
    // 作者关系
    authorId: v.id("users"), // 外键：指向 users 表的 id
    // 内容元数据(content metadata)
    tags: v.array(v.string()),
    category: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    // 时间戳
    createAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
    scheduledFor: v.optional(v.number()), // 预约发布时间(定时发布文章功能)
    // 相关分析数据
    viewCount: v.number(),
    likeCount: v.number(),
    commentCount: v.optional(v.number()),
  })
    .index("by_author", ["authorId"])
    .index("by_status", ["status"])
    // 查询条件是 WHERE A AND B，就应该用复合索引
    // 复合索引顺序(以下面代码为例)：
    // 支持查询 status 和 status+publishedAt
    // 但是不支持单独查 publishedAt
    // 索引结构像：status → publishedAt，所以必须先提供 status
    .index("by_published", ["status", "publishedAt"])
    .index("by_author_status", ["authorId", "status"])
    .searchIndex("search_content", { searchField: "title" }),

  // 评论表
  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.optional(v.id("users")),
    authorName: v.string(),
    authorEmail: v.optional(v.string()),

    content: v.string(),
    status: v.union(
      v.literal("approved"),
      v.literal("pending"),
      v.literal("rejected"),
    ),

    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_post_status", ["postId", "status"])
    .index("by_author", ["authorId"]),

  // 点赞表
  likes: defineTable({
    postId: v.id("posts"),
    userId: v.optional(v.id("users")), // Optional for anonymous likes

    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"])
    .index("by_post_user", ["postId", "userId"]), // Prevent duplicate likes

  // 关注/订阅表
  follows: defineTable({
    followerId: v.id("users"), // User doing the following
    followingId: v.id("users"), // User being followed

    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_relationship", ["followerId", "followingId"]), // Prevent duplicates

  // 每日数据分析表
  dailyStats: defineTable({
    postId: v.id("posts"),
    date: v.string(), // YYYY-MM-DD format for easy querying
    views: v.number(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_date", ["date"])
    .index("by_post_date", ["postId", "date"]), // Unique constraint
});
