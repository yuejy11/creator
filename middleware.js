// middleware.js/proxy.js = 请求进入页面/接口之前执行的一段拦截逻辑
// 浏览器请求 → Middleware → 路由/页面/API → 返回响应

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// 匹配所有 /dashboard 开头路径(本质上是正则表达式)
// 返回值：(req) => boolean
const isProductedRoute = createRouteMatcher(["/dashboard(.*)"])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  // 未登录 且 访问dashboard，触发跳转
  if (!userId && isProductedRoute(req)) {
    // Clerk内置方法，自动生成 302 跳转到登录页
    // 并自动带callback，登录后跳回原页面
    const { redirectToSignIn } = await auth()
    return redirectToSignIn()
  }
  // 不拦截，继续访问页面
  return NextResponse.next()
});

export const config = {
  // 默认情况下所有请求都会触发拦截
  // 告诉Next.js，到底哪些 URL 路径需要经过这段中间件处理
  // 哪些可以直接跳过
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};