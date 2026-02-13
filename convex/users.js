// 数据库操作逻辑（增删改查 API）

// mutation	改数据，query 查数据
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// 自动创建用户
export const store = mutation({
  args: {},
  handler: async (ctx) => {
    // ctx.auth 获取登录信息
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("调用了storeUser，但未进行身份验证！");
    }
    // ctx.db 操作数据库
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (user !== null) {
      if (user.name !== identity.name) {
        await ctx.db.patch(user._id, { name: identity.name });
      }
      return user._id;
    }
    return await ctx.db.insert("users", {
      name: identity.name ?? "未命名",
      email: identity.email ?? "未输入邮箱",
      tokenIdentifier: identity.tokenIdentifier,
      ImageUrl: identity.pictureUrl ?? undefined,
      createAt: Date.now(),
      lastActiveAt: Date.now(),
    });
  },
});

// 查询当前用户
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("未登录，无法查询！")
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => 
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()
    if (!user) {
      throw new Error("没有找到该用户！")
    }
    return user
  }
})

// 更新用户名
export const updateUsername = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Convex 官方推荐：
    // mutation 里不要再调用 query 查当前用户，直接再查一遍数据库就行
    // mutation 本身就拥有完整的数据库读写权限(ctx.db)
    // 调用 runQuery 相当于在当前的事务里又开了一个子查询逻辑
    // 增加了代码复杂性
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    // const user = await ctx.runQuery(internal.users.getCurrentUser)

    if (!user) {
      throw new Error("User not found");
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(args.username)) {
      throw new Error(
        "Username can only contain letters, numbers, underscores, and hyphens"
      );
    }

    if (args.username.length < 3 || args.username.length > 20) {
      throw new Error("Username must be between 3 and 20 characters");
    }

    if (args.username !== user.username) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .unique();

      if (existingUser) {
        throw new Error("Username is already taken");
      }
    }

    await ctx.db.patch(user._id, {
      username: args.username,
      lastActiveAt: Date.now(),
    });

    return user._id;
  },
});