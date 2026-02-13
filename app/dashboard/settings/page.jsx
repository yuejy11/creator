"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import { toast } from "sonner";

// 表单校验逻辑(zod)
// 优势：声明式、可以和TS类型共享、自动报错信息
const usernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),
});

const SettingsPage = () => {
  // 控制提交按钮状态
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 从数据库请求数据
  const { data: currentUser, isLoading } = useConvexQuery(
    api.users.getCurrentUser
  );
  // 修改数据库数据
  const updateUsername = useConvexMutation(api.users.updateUsername);

  // react-hook-form 表单状态管理
  // 作用：
  // 1. 创建表单状态中心
  // 类似：const formState = { values:{}, errors:{} }
  const form = useForm({
    // 2. 绑定校验器：提交时自动用 zod 校验
    resolver: zodResolver(usernameSchema),
    // 3. 设置默认值，否则 input 的初始值是 undefined
    defaultValues: {
      username: "",
    },
  });

  const {
    register, // 绑定 input
    handleSubmit, // 提交处理器
    formState: { errors }, // 错误对象
    reset, // 重置表单
  } = form;

  // useEffect 自动填充用户数据
  // useEffect：监听变量变化后执行的函数
  useEffect(() => {
    if (currentUser) {
      // input 绑定的表单里面的 username
      // 页面刷新的时候需要与数据库同步
      reset({
        username: currentUser.username || "",
      });
    }
    // 为什么 reset 也要写进依赖？
    // React 官方规则：
    // 所有在 useEffect 内使用的外部变量，都必须写进依赖数组
  }, [currentUser, reset]);

  // 提交表单
  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      await updateUsername.mutate({
        username: data.username,
      });

      toast.success("Username updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to update username");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto" />
          <p className="text-slate-400 mt-4">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text-primary">Settings</h1>
        <p className="text-slate-400 mt-2">
          Manage your profile and account preferences
        </p>
      </div>

      {/* 设置用户名 */}
      <Card className="card-glass max-w-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <User className="h-5 w-5 mr-2" />
            Username Settings
          </CardTitle>
          <CardDescription>
            Set your unique username for your public profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* handleSubmit 一个包装器函数 */}
          {/* 阻止默认提交 + 表单校验 + 调用你的函数 onSubmit */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">
                Username
              </Label>
              <Input
                id="username"
                {...register("username")}
                placeholder="Enter your username"
                className="bg-slate-800 border-slate-600 text-white"
              />
              {/* <Input {...register("username")} /> */}
              {/* 等价于 */}
              {/* <Input
                value={state.username}
                onChange={(e)=>setState(e.target.value)}
              /> */}

              {/* 当前的名字 */}
              {currentUser?.username && (
                <div className="text-sm text-slate-400">
                  Current username:{" "}
                  <span className="text-white">@{currentUser.username}</span>
                </div>
              )}

              {/* 设置用户名的要求 */}
              <div className="text-xs text-slate-500">
                3-20 characters, letters, numbers, underscores, and hyphens only
              </div>

              {errors.username && (
                <p className="text-red-400 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="primary"
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Username"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage