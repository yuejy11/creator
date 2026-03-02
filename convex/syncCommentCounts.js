import { mutation } from "./_generated/server";

export const syncCommentCounts = mutation({
  handler: async (ctx) => {
    // 1️⃣ 取出所有帖子
    const posts = await ctx.db.query("posts").collect();

    for (const post of posts) {
      // 2️⃣ 查询该帖子的评论数量（只统计已通过的）
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect();

      const count = comments.length;

      // 3️⃣ 更新帖子 commentCount
      await ctx.db.patch(post._id, {
        commentCount: count,
      });
    }

    return {
      success: true,
      message: `已同步 ${posts.length} 篇帖子的评论数`,
    };
  },
});
