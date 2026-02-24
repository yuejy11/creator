"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Eye,
  Heart,
  MessageCircle,
  Users,
  TrendingUp,
  Calendar,
  BarChart3,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import DailyViewsChart from "@/components/daily-views-chart";

export default function DashboardPage() {
  // Fetch real data
  const { data: analytics, isLoading: analyticsLoading } = useConvexQuery(
    api.dashboard.getAnalytics,
  );
  const { data: recentPosts, isLoading: postsLoading } = useConvexQuery(
    api.dashboard.getPostsWithAnalytics,
    { limit: 5 },
  );
  const { data: recentActivity, isLoading: activityLoading } = useConvexQuery(
    api.dashboard.getRecentActivity,
    { limit: 8 },
  );
  const { data: dailyViewsData, isLoading: chartLoading } = useConvexQuery(
    api.dashboard.getDailyViews,
  );

  // Format time relative to now
  const formatTime = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: zhCN });
  };

  // Loading states
  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto" />
          <p className="text-slate-400 mt-4">加载中...</p>
        </div>
      </div>
    );
  }

  // Default values if no data
  const stats = analytics || {
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalFollowers: 0,
    viewsGrowth: 0,
    likesGrowth: 0,
    commentsGrowth: 0,
    followersGrowth: 0,
  };

  return (
    <div className="space-y-8 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text-primary">
            控制台
          </h1>
          <p className="text-slate-400 mt-2">
            欢迎回来！一起来看看你的内容表现如何。
          </p>
        </div>

        <Link href="/dashboard/create">
          <Button variant={"primary"}>
            <PlusCircle className="h-4 w-4 mr-2" />
            新建文章
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">
              总阅读量
            </CardTitle>
            <Eye className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalViews.toLocaleString()}
            </div>
            {stats.viewsGrowth > 0 && (
              <div className="flex items-center text-xs text-green-400 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />+{stats.viewsGrowth}%
                较上月
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">
              总点赞数
            </CardTitle>
            <Heart className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalLikes.toLocaleString()}
            </div>
            {stats.likesGrowth > 0 && (
              <div className="flex items-center text-xs text-green-400 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />+{stats.likesGrowth}%
                较上月
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">
              评论数
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalComments.toLocaleString()}
            </div>
            {stats.commentsGrowth > 0 && (
              <div className="flex items-center text-xs text-green-400 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />+{stats.commentsGrowth}%
                较上月
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">
              粉丝数
            </CardTitle>
            <Users className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalFollowers.toLocaleString()}
            </div>
            {stats.followersGrowth > 0 && (
              <div className="flex items-center text-xs text-green-400 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />+{stats.followersGrowth}%
                较上月
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Posts */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">最近文章</CardTitle>
                <Link href="/dashboard/posts">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                  >
                    查看全部
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                </div>
              ) : !recentPosts || recentPosts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-4">还没有文章</p>
                  <Link href="/dashboard/create">
                    <Button variant="outline" size="sm">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      创作你的第一篇
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPosts.map((post) => (
                    <div
                      key={post._id}
                      className="flex items-center justify-between p-4 bg-slate-800/30 hover:bg-slate-700/30 cursor-pointer rounded-lg transition-colors"
                      onClick={() =>
                        window.open(
                          `/dashboard/posts/edit/${post._id}`,
                          "_self",
                        )
                      }
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-white truncate">
                          {post.title || "未命名文章"}
                        </h3>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge
                            variant={
                              post.status === "published"
                                ? "default"
                                : post.status === "scheduled"
                                  ? "secondary"
                                  : "outline"
                            }
                            className={
                              post.status === "published"
                                ? "bg-green-500/20 text-green-300 border-green-500/30"
                                : post.status === "scheduled"
                                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                  : "bg-orange-500/20 text-orange-300 border-orange-500/30"
                            }
                          >
                            {post.status === "published" ? "已发布" : post.status === "scheduled" ? "定时" : "草稿"}
                          </Badge>
                          <span className="text-sm text-slate-400">
                            {post.status === "published" && post.publishedAt
                              ? `发布于 ${formatTime(post.publishedAt)}`
                              : post.status === "draft"
                                ? `更新于 ${formatTime(post.updatedAt)}`
                                : post.scheduledFor
                                  ? `计划于 ${new Date(post.scheduledFor).toLocaleDateString("zh-CN")}`
                                  : `更新于 ${formatTime(post.updatedAt)}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {post.viewCount || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {post.likeCount || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {post.commentCount || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analytics Chart */}
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                数据概览
              </CardTitle>
              <CardDescription>近 30 天阅读量</CardDescription>
            </CardHeader>
            <CardContent>
              <DailyViewsChart data={dailyViewsData} isLoading={chartLoading} />
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <div className="space-y-6">
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="text-white">最近动态</CardTitle>
              <CardDescription>
                读者与你内容的最近互动
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                </div>
              ) : !recentActivity || recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">暂无最近动态</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                          activity.type === "like"
                            ? "bg-red-500/20 text-red-300"
                            : activity.type === "comment"
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-green-500/20 text-green-300"
                        }`}
                      >
                        {activity.type === "like" && (
                          <Heart className="h-3 w-3" />
                        )}
                        {activity.type === "comment" && (
                          <MessageCircle className="h-3 w-3" />
                        )}
                        {activity.type === "follow" && (
                          <Users className="h-3 w-3" />
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-white">
                          <span className="font-medium">{activity.user}</span>
                          {activity.type === "like" &&
                            ` 赞了你的文章「${activity.post}」`}
                          {activity.type === "comment" &&
                            ` 评论了「${activity.post}」`}
                          {activity.type === "follow" &&
                            " 关注了你"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatTime(activity.time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="text-white">快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/create">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  新建文章
                </Button>
              </Link>

              <Link href="/dashboard/posts">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  管理文章
                </Button>
              </Link>

              <Link href="/dashboard/followers">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
                >
                  <Users className="h-4 w-4 mr-2" />
                  查看粉丝
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
