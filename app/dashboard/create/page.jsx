"use client";

import React from "react";
import { ArrowRight, Loader2, User } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import PostEditor from "@/components/post-editor";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CreatePostPage() {
  const { data: existingDraft, isLoading: isDraftLoading } = useConvexQuery(
    api.posts.getUserDraft
  );

  const { data: currentUser, isLoading: userLoading } = useConvexQuery(
    api.users.getCurrentUser
  );

  if (isDraftLoading || userLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          <span className="text-slate-300">加载中...</span>
        </div>
      </div>
    );
  }

  if (!currentUser?.username) {
    return (
      <div className="h-80 bg-slate-900 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full text-center space-y-6">
          <h1 className="text-3xl font-bold text-white">请先设置用户名</h1>
          <p className="text-slate-400 text-lg">
            设置用户名后才能创作和分享文章
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard/settings">
              <Button variant="primary">
                去设置
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <PostEditor initialData={existingDraft} mode="create" />;
}
