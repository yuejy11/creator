import {
  Users,
  BarChart3,
  Mail,
  PenTool,
  Eye,
  Calendar,
  Shield,
  Target,
  TrendingUp,
  Settings,
  Search,
  ImageIcon,
} from "lucide-react";

export const features = [
  {
    icon: PenTool,
    title: "AI 写作助手",
    desc: "智能推荐标题、正文与 SEO 优化，让每篇文章都出彩",
    color: "from-purple-500 to-blue-500",
  },
  {
    icon: Users,
    title: "社群运营",
    desc: "粉丝互动、评论管理，助你打造有温度的内容社群",
    color: "from-green-500 to-yellow-500",
  },
  {
    icon: BarChart3,
    title: "数据分析洞察",
    desc: "阅读量、互动数据一目了然，用数据指导创作方向",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: Calendar,
    title: "定时发布",
    desc: "提前规划内容，一键排期，实时更新发布进度",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: ImageIcon,
    title: "AI 图片处理",
    desc: "智能抠图、裁剪、文字叠加，让配图更吸睛",
    color: "from-red-500 to-purple-500",
  },
  {
    icon: Search,
    title: "内容发现",
    desc: "探索热门内容，发现优质创作者，灵感源源不断",
    color: "from-emerald-500 to-green-500",
  },
];

export const socialProofStats = [
  { metric: "50万+", label: "活跃创作者", icon: Users },
  { metric: "200万+", label: "已发布文章", icon: PenTool },
  { metric: "1000万+", label: "月均读者", icon: Eye },
  { metric: "99.9%", label: "稳定运行", icon: Shield },
];

export const testimonials = [
  {
    name: "陈晓雨",
    role: "科技博主",
    company: "@科技洞察",
    imageId: "1580489944761-15a19d654956",
    content: "创作效率翻倍！AI 写作助手每周帮我省下好几小时，专注打磨内容本身。",
    rating: 5,
  },
  {
    name: "张明轩",
    role: "Newsletter 主理人",
    company: "@营销周报",
    imageId: "1507003211169-0a1dd7228f2d",
    content: "邮件订阅功能太赞了，三个月内订阅量涨了 300%，读者反馈也超级好。",
    rating: 5,
  },
  {
    name: "李思琪",
    role: "内容策略师",
    company: "@创意空间",
    imageId: "1544005313-94ddf0286df2",
    content: "数据看板让我清楚知道读者喜欢什么，这是做内容以来最明智的一笔投资。",
    rating: 5,
  },
];

export const platformTabs = [
  {
    title: "内容创作",
    icon: PenTool,
    description: "AI 加持的写作工具，让你比以往更快产出高质量内容。",
    features: [
      "智能标题建议",
      "内容优化润色",
      "SEO 优化建议",
      "原创度检测",
    ],
  },
  {
    title: "受众增长",
    icon: TrendingUp,
    description: "用强大的粉丝管理工具，打造专属社群、提升互动黏性。",
    features: [
      "粉丝画像分析",
      "互动数据追踪",
      "社群洞察报告",
      "增长策略推荐",
    ],
  },
  {
    title: "内容管理",
    icon: Settings,
    description: "完善的管理与数据分析工具，让你的内容井井有条。",
    features: [
      "草稿箱系统",
      "定时发布",
      "内容数据统计",
      "素材库管理",
    ],
  },
];
