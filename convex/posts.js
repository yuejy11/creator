import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 获取用户的草稿(应该只有一个)
export const getUserDraft = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // .filter() 里要写 q.field("name")，而 .withIndex() 直接写 "name"。
    // 在 withIndex 中,因为你已经通过 "by_token" 指定了索引，Convex 已经知道这个索引涉及哪些字段了，所以你直接传字符串作为列名即可
    // 在 filter 中,这是一种通用的表达式引擎，它需要 q.field() 来明确区分这是一个数据库字段还是这是一个普通的字符串常量
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      return null;
    }

    const draft = await ctx.db
      .query("posts")
      .filter((q) =>
        q.and(
          q.eq(q.field("authorId"), user._id),
          q.eq(q.field("status"), "draft"),
        ),
      )
      .unique();

    return draft;
  },
});

// 创建一个新的帖子
export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("请先登录");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("用户不存在");
    }

    const existingDraft = await ctx.db
      .query("posts")
      .filter((q) =>
        q.and(
          q.eq(q.field("authorId"), user._id),
          q.eq(q.field("status"), "draft"),
        ),
      )
      .unique();

    const now = Date.now();

    // 如果准备要发布并且我们有草稿，将帖子状态更新为已发布
    if (args.status === "published" && existingDraft) {
      // patch：只修改提供的字段，其它的保持原封不动
      await ctx.db.patch(existingDraft._id, {
        title: args.title,
        content: args.content,
        status: "published",
        tags: args.tags || [],
        category: args.category,
        featuredImage: args.featuredImage,
        updatedAt: now,
        publishedAt: now,
        scheduledFor: args.scheduledFor,
      });
      return existingDraft._id;
    }

    // 如果准备创建草稿并且我们已经有草稿，更新原来的草稿
    if (args.status === "draft" && existingDraft) {
      await ctx.db.patch(existingDraft._id, {
        title: args.title,
        content: args.content,
        tags: args.tags || [],
        category: args.category,
        featuredImage: args.featuredImage,
        updatedAt: now,
        scheduledFor: args.scheduledFor,
      });
      return existingDraft._id;
    }

    // 创建新的帖子
    const postId = await ctx.db.insert("posts", {
      title: args.title,
      content: args.content,
      status: args.status,
      authorId: user._id,
      tags: args.tags || [],
      category: args.category,
      featuredImage: args.featuredImage,
      createAt: now,
      updatedAt: now,
      publishedAt: args.status === "published" ? now : undefined,
      scheduledFor: args.scheduledFor,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
    });

    return postId;
  },
});

// 更新现有帖子
export const update = mutation({
  args: {
    id: v.id("posts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("请先登录");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("用户不存在");
    }

    // 从数据库拿到准备更新的帖子
    // 在 Convex 中，每一个文档中的 _id 内部包含了数据所在的表，数据的唯一标识符
    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error("文章不存在");
    }

    // 检查是不是作者自己的帖子
    if (post.authorId !== user._id) {
      throw new Error("无权编辑此文");
    }

    const now = Date.now();
    const updateData = {
      updatedAt: now,
    };

    // 将提供的字段进行更新
    if (args.title !== undefined) updateData.title = args.title;
    if (args.content !== undefined) updateData.content = args.content;
    if (args.tags !== undefined) updateData.tags = args.tags;
    if (args.category !== undefined) updateData.category = args.category;
    if (args.featuredImage !== undefined)
      updateData.featuredImage = args.featuredImage;
    if (args.scheduledFor !== undefined)
      updateData.scheduledFor = args.scheduledFor;
    if (args.status !== undefined) {
      updateData.status = args.status;
      // 如果是第一次出版
      if (args.status === "published" && post.status === "draft") {
        updateData.publishedAt = now;
      }
    }

    await ctx.db.patch(args.id, updateData);
    return args.id;
  },
});

// Get user's posts
export const getUserPosts = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      return [];
    }

    let query = ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("authorId"), user._id));

    // Filter by status if provided
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const posts = await query.order("desc").collect();

    // Add username to each post
    return posts.map((post) => ({
      ...post,
      username: user.username,
    }));
  },
});

// Get a single post by ID
export const getById = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Delete a post
export const deletePost = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("请先登录");
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("用户不存在");
    }

    // Get the post
    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error("文章不存在");
    }

    // Check if user owns the post
    if (post.authorId !== user._id) {
      throw new Error("无权删除此文");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
