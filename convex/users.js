// 数据库操作逻辑（增删改查 API）

// mutation	改数据，query 查数据
import { mutation, query } from "./_generated/server";

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