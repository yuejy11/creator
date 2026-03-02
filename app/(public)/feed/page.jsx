"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import { TrendingUp, UserPlus, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import PostCard from "@/components/post-card";

export default function FeedPage() {
  const { user: currentUser } = useUser();
  const [activeTab, setActiveTab] = useState("feed"); // "feed" or "trending"

  // Infinite scroll detection
  const { ref: loadMoreRef } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  // Data queries
  const { data: feedData, isLoading: feedLoading } = useConvexQuery(
    api.feed.getFeed,
    { limit: 15 },
  );

  const { data: suggestedUsers, isLoading: suggestionsLoading } =
    useConvexQuery(api.feed.getSuggestedUsers, { limit: 6 });

  const { data: trendingPosts, isLoading: trendingLoading } = useConvexQuery(
    api.feed.getTrendingPosts,
    { limit: 15 },
  );

  // Mutations
  const toggleFollow = useConvexMutation(api.follows.toggleFollow);

  // Handle follow/unfollow
  const handleFollowToggle = async (userId) => {
    if (!currentUser) {
      toast.error("请先登录才能关注");
      return;
    }

    try {
      await toggleFollow.mutate({ followingId: userId });
      toast.success("关注状态已更新");
    } catch (error) {
      toast.error(error.message || "操作失败");
    }
  };

  // Get current posts based on active tab
  const getCurrentPosts = () => {
    switch (activeTab) {
      case "trending":
        return trendingPosts || [];
      default:
        return feedData?.posts || [];
    }
  };

  const isLoading =
    feedLoading || (activeTab === "trending" && trendingLoading);
  const currentPosts = getCurrentPosts();

  return (
    <div className="min-h-screen bg-slate-900 text-white pt-32 pb-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Feed Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold gradient-text-primary pb-2">
            发现精彩内容
          </h1>
          <p className="text-slate-400">紧跟你关注的创作者，不错过每篇好文</p>
        </div>

        {/* Main Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
          <div className="lg:col-span-4 space-y-6">
            {/* Feed Tabs */}
            <div className="flex space-x-2">
              <Button
                onClick={() => setActiveTab("feed")}
                variant={activeTab === "feed" ? "primary" : "ghost"}
                className="flex-1"
              >
                推荐
              </Button>
              <Button
                onClick={() => setActiveTab("trending")}
                variant={activeTab === "trending" ? "primary" : "ghost"}
                className="flex-1"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                热门
              </Button>
            </div>

            {/* Create Post Prompt */}
            {currentUser && (
              <Link
                href="/dashboard/create"
                className="flex items-center space-x-3 cursor-pointer"
              >
                <div className="relative w-10 h-10">
                  {currentUser.imageUrl ? (
                    <Image
                      src={currentUser.imageUrl}
                      alt={currentUser.firstName || "User"}
                      fill
                      className="rounded-full object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-sm font-bold">
                      {(currentUser.firstName || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-slate-800 border border-slate-600 rounded-full px-4 py-3 text-slate-400 hover:border-slate-500 transition-colors">
                    有什么想说的？分享你的想法...
                  </div>
                </div>
              </Link>
            )}

            {/* Posts Feed */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
                  <p className="text-slate-400">加载中...</p>
                </div>
              </div>
            ) : currentPosts.length === 0 ? (
              <Card className="card-glass">
                <CardContent className="text-center py-12">
                  <div className="space-y-4">
                    <div className="text-6xl">📝</div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {activeTab === "trending" ? "暂无热门内容" : "暂无内容"}
                      </h3>
                      <p className="text-slate-400 mb-6">
                        {activeTab === "trending"
                          ? "稍后再来看看有没有热门内容"
                          : "关注一些创作者，他们的文章会出现在这里"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Posts Grid */}
                <div className="space-y-6">
                  {currentPosts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      showActions={false}
                      showAuthor={true}
                      className="max-w-none"
                    />
                  ))}
                </div>

                {/* Load More Indicator */}
                {activeTab === "feed" && feedData?.hasMore && (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* 左侧侧边栏-推荐关注 */}
          <div className="lg:col-span-2 space-y-6 mt-14">
            {/* Suggested Users */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  推荐关注
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suggestionsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                  </div>
                ) : !suggestedUsers || suggestedUsers.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-slate-400 text-sm">暂无推荐</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestedUsers.map((user) => (
                      <div key={user._id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Link href={`/${user.username}`}>
                            <div className="flex items-center space-x-3 cursor-pointer">
                              <div className="relative w-10 h-10">
                                {user.imageUrl ? (
                                  <Image
                                    src={user.imageUrl}
                                    alt={user.name}
                                    fill
                                    className="rounded-full object-cover"
                                    sizes="40px"
                                  />
                                ) : (
                                  <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-sm font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">
                                  {user.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  @{user.username}
                                </p>
                              </div>
                            </div>
                          </Link>
                          <Button
                            onClick={() => handleFollowToggle(user._id)}
                            variant="outline"
                            size="sm"
                            className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            关注
                          </Button>
                        </div>
                        <div className="text-xs text-slate-500 pl-13">
                          {user.followerCount} 粉丝 • {user.postCount} 篇文章
                        </div>
                        {user.recentPosts && user.recentPosts.length > 0 && (
                          <div className="text-xs text-slate-400 pl-13">
                            最近："
                            {user.recentPosts[0].title.substring(0, 30)}..."
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
