"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, Sparkles, Wand2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { generateBlogContent, improveContent } from "@/app/actions/deepseek";
import { BarLoader } from "react-spinners";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

if (typeof window !== "undefined") {
  import("react-quill-new/dist/quill.snow.css");
}

const quillConfig = {
  // 控制工具栏和插件
  modules: {
    toolbar: {
      // 按钮布局
      container: [
        [{ header: [1, 2, 3, false] }],
        [{ size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ["link", "blockquote", "code-block"],
        [
          { list: "ordered" },
          { list: "bullet" },
          { indent: "-1" },
          { indent: "+1" },
        ],
        ["image", "video"],
      ],
      // 自定义按钮行为
      handlers: { image: function () {} },
    },
  },
  // 编辑器输出HTML时，哪些格式允许保留
  formats: [
    "header",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "align",
    "link",
    "blockquote",
    "code-block",
    "list",
    "indent",
    "image",
    "video",
  ],
};

export default function PostEditorContent({
  form,
  setQuillRef,
  onImageUpload,
}) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedValues = watch();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);

  // 动态生成 modules 配置
  const getQuillModules = () => ({
    ...quillConfig.modules,
    toolbar: {
      ...quillConfig.modules.toolbar,
      handlers: { image: () => onImageUpload("content") },
    },
  });

  const handleAI = async (type, improvementType = null) => {
    const { title, content, category, tags } = watchedValues;

    // generate
    if (type === "generate") {
      if (!title?.trim())
        return toast.error("请先填写标题再生成内容");
      if (
        content &&
        content !== "<p></p>" &&
        !window.confirm("将替换当前内容，确定继续？")
      )
        return;
      setIsGenerating(true);
    }
    // improve 
    else {
      if (!content || content === "<p></p>")
        return toast.error("请先输入一些内容再优化");
      setIsImproving(true);
    }

    try {
      const result =
        type === "generate"
          ? await generateBlogContent(title, category, tags || [])
          : await improveContent(content, improvementType);

      if (result.success) {
        setValue("content", result.content);
        toast.success(
          type === "generate" ? "内容生成成功！" : "内容优化完成！"
        );
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("操作失败，请稍后重试");
    } finally {
      type === "generate" ? setIsGenerating(false) : setIsImproving(false);
    }
  };

  const hasTitle = watchedValues.title?.trim();
  // 富文本编辑器在清空内容后，可能会留下不同的残留标签
  // 所以这种处理方式适应的情况太少
  // const hasContent =
  //   watchedValues.content && watchedValues.content !== "<p><br></p>";
  const isEditorEmpty = (html) => {
    // console.log("富文本内容：", html)
    if (!html) return true;
    // 剔除所有html标签同时去掉空格
    const text = html.replace(/<(.|\n)*?>/g, "").trim();
    return text.length === 0;
  };
  const hasContent = !isEditorEmpty(watchedValues.content);

  return (
    <>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-5">
          {/* 上传图片区域 */}
          {watchedValues.featuredImage ? (
            <div className="relative group">
              <img
                src={watchedValues.featuredImage}
                alt="文章封面"
                className="w-full h-80 object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center space-x-3">
                <Button
                  onClick={() => onImageUpload("featured")}
                  variant="secondary"
                  size="sm"
                >
                  更换图片
                </Button>
                <Button
                  onClick={() => setValue("featuredImage", "")}
                  variant="destructive"
                  size="sm"
                >
                  移除
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onImageUpload("featured")}
              className="w-full h-36 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center space-y-4 hover:border-slate-500 transition-colors group"
            >
              <ImageIcon className="h-12 w-12 text-slate-400 group-hover:text-slate-300" />
              <div className="text-center">
                <p className="text-slate-300 text-lg font-medium">
                  添加封面图
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  上传后用 AI 智能处理
                </p>
              </div>
            </button>
          )}

          {/* 标题输入区域 */}
          <div>
            <Input
              {...register("title")}
              placeholder="文章标题..."
              className="border-0 text-4xl font-bold bg-transparent placeholder:text-slate-500 text-white p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ fontSize: "2.5rem", lineHeight: "1.2" }}
            />
            {/* <Input {...register("title")} /> */}
            {/* 相当于 */}
            {/* <Input
              value={state.title}
              onChange={(e)=>setState(e.target.value)}
            /> */}
            {errors.title && (
              <p className="text-red-400 mt-2">{errors.title.message}</p>
            )}
          </div>

          {/* AI工具 */}
          <div>
            {!hasContent ? (
              <Button
                onClick={() => handleAI("generate")}
                disabled={!hasTitle || isGenerating || isImproving}
                variant="outline"
                size="sm"
                className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white disabled:opacity-50 w-full"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                用 AI 生成内容
              </Button>
            ) : (
              <div className="grid grid-cols-3 w-full gap-2">
                {[
                  { type: "enhance", icon: Sparkles, color: "green" },
                  { type: "expand", icon: Plus, color: "blue" },
                  { type: "simplify", icon: Minus, color: "orange" },
                ].map(({ type, icon: Icon, color }) => (
                  <Button
                    key={type}
                    onClick={() => handleAI("improve", type)}
                    disabled={isGenerating || isImproving}
                    variant="outline"
                    size="sm"
                    className={`border-${color}-500 text-${color}-400 hover:bg-${color}-500 hover:text-white disabled:opacity-50`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    AI {type === "enhance" ? "润色" : type === "expand" ? "扩写" : "精简"}
                  </Button>
                ))}
              </div>
            )}
            {!hasTitle && (
              <p className="text-xs text-slate-400 w-full pt-2">
                先填写标题才能使用 AI 生成
              </p>
            )}
          </div>

          {/* 加载UI优化 */}
          {(isGenerating || isImproving) && (
            <BarLoader width={"95%"} color="#D8B4FE" />
          )}

          {/* 文档编辑区域 */}
          <div className="prose prose-lg max-w-none">
            <ReactQuill
              ref={setQuillRef}
              theme="snow"
              value={watchedValues.content}
              onChange={(content) => setValue("content", content)}
              // 工具栏
              modules={getQuillModules()}
              // 允许输出格式
              formats={quillConfig.formats}
              placeholder="开始讲述你的故事吧... 或交给 AI 来生成！"
              style={{
                minHeight: "400px",
                fontSize: "1.125rem",
                lineHeight: "1.7",
              }}
            />
            {errors.content && (
              <p className="text-red-400 mt-2">{errors.content.message}</p>
            )}
          </div>
        </div>
      </main>

      {/* 覆盖第三方组件默认样式 */}
      <style jsx global>{`
        .ql-editor {
          color: white !important;
          font-size: 1.125rem !important;
          line-height: 1.7 !important;
          padding: 0 !important;
          min-height: 400px !important;
        }
        .ql-editor::before {
          color: rgb(100, 116, 139) !important;
        }
        .ql-toolbar {
          border: none !important;
          padding: 0 0 1rem 0 !important;
          position: sticky !important;
          top: 80px !important;
          background: rgb(15, 23, 42) !important;
          z-index: 30 !important;
          border-radius: 8px !important;
          margin-bottom: 1rem !important;
        }
        .ql-container {
          border: none !important;
        }
        .ql-snow .ql-tooltip {
          background: rgb(30, 41, 59) !important;
          border: 1px solid rgb(71, 85, 105) !important;
          color: white !important;
        }
        .ql-snow .ql-picker {
          color: white !important;
        }
        .ql-snow .ql-picker-options {
          background: rgb(30, 41, 59) !important;
          border: 1px solid rgb(71, 85, 105) !important;
        }
        .ql-snow .ql-fill,
        .ql-snow .ql-stroke.ql-fill {
          fill: white !important;
        }
        .ql-snow .ql-stroke {
          stroke: white !important;
        }
        .ql-editor h2 {
          font-size: 2rem !important;
          font-weight: 600 !important;
          color: white !important;
        }
        .ql-editor h3 {
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          color: white !important;
        }
        .ql-editor blockquote {
          border-left: 4px solid rgb(147, 51, 234) !important;
          color: rgb(203, 213, 225) !important;
          padding-left: 1rem !important;
          font-style: italic !important;
        }
        .ql-editor a {
          color: rgb(147, 51, 234) !important;
        }
        .ql-editor code {
          background: rgb(51, 65, 85) !important;
          color: rgb(248, 113, 113) !important;
          padding: 0.125rem 0.25rem !important;
          border-radius: 0.25rem !important;
        }
      `}</style>
    </>
  );
}
