"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useConvexMutation } from "@/hooks/use-convex-query";
import PostEditorHeader from "./post-editor-header";
import PostEditorContent from "./post-editor-content";
import PostEditorSettings from "./post-editor-settings";
import ImageUploadModal from "./image-upload-modal";

const postSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200, "标题过长"),
  content: z.string().min(1, "正文不能为空"),
  category: z.string().optional(),
  tags: z.array(z.string()).max(10, "最多添加 10 个标签"),
  featuredImage: z.string().optional(),
  scheduledFor: z.string().optional(),
});

export default function PostEditor({
  initialData = null,
  mode = "create", // "create" or "edit"
}) {
  const router = useRouter();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalType, setImageModalType] = useState("featured");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [quillRef, setQuillRef] = useState(null);

  // Mutations with built-in loading states
  const { mutate: createPost, isLoading: isCreateLoading } = useConvexMutation(
    api.posts.create
  );
  const { mutate: updatePost, isLoading: isUpdating } = useConvexMutation(
    api.posts.update
  );

  // 表单设置
  const form = useForm({
    // 设置校验规则
    resolver: zodResolver(postSchema),
    // 设置默认值
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      category: initialData?.category || "",
      tags: initialData?.tags || [],
      featuredImage: initialData?.featuredImage || "",
      scheduledFor: initialData?.scheduledFor
        ? new Date(initialData.scheduledFor).toISOString().slice(0, 16)
        : "",
    },
  });

  const { handleSubmit, watch, setValue } = form;
  // watchedValues就是表单的一个实时镜像
  // 表单中每一个字段在输入框内发生变化，这个实时镜像的值就会更新
  const watchedValues = watch();

  // // 自动保存草稿(轮询自动保存)
  // useEffect(() => {
  //   if (!watchedValues.title && !watchedValues.content) return;

  //   const autoSave = setInterval(() => {
  //     if (watchedValues.title || watchedValues.content) {
  //       if (mode === "create") handleSave(true); // Silent save
  //     }
  //   }, 30000);
  //   下一次effect重新执行或组件卸载时清理
  //   return () => clearInterval(autoSave);
  // }, [watchedValues.title, watchedValues.content]);

  // 自动保存草稿(输入停止后防抖保存)
  useEffect(() => {
    if (!watchedValues.title && !watchedValues.content) return;

    const timer = setTimeout(() => {
      handleSave(true); // 静默保存草稿
    }, 2500); // 2.5s：用户停止输入2.5秒后保存
  // 下一次effect重新执行或组件卸载时清理
    return () => clearTimeout(timer);
  }, [watchedValues.title, watchedValues.content]);

  // 处理上传的图片
  const handleImageSelect = (imageData) => {
    // 用于文章封面
    if (imageModalType === "featured") {
      setValue("featuredImage", imageData.url);
      toast.success("封面图已添加！");
    } 
    // 用于正文内容
    else if (imageModalType === "content" && quillRef) {
      // 获取 Quill 实例
      const quill = quillRef.getEditor();
      // 获取当前光标位置
      const range = quill.getSelection();
      // 决定插入位置
      const index = range ? range.index : quill.getLength();

      // 在 index 位置插入 <img src="imageData.url">
      quill.insertEmbed(index, "image", imageData.url);
      // 移动光标
      // 插入图片后，把光标移动到图片后面
      quill.setSelection(index + 1);
      toast.success("图片已插入！");
    }
    setIsImageModalOpen(false);
  };

  // 提交表单
  const onSubmit = async (data, action, silent = false) => {
    try {
      const postData = {
        title: data.title,
        content: data.content,
        category: data.category || undefined,
        tags: data.tags,
        featuredImage: data.featuredImage || undefined,
        status: action === "publish" ? "published" : "draft",
        scheduledFor: data.scheduledFor
          ? new Date(data.scheduledFor).getTime()
          : undefined,
      };

      let resultId;

      // 编辑模式：mode === "edit"且有草稿id，调用 updatePost，修改现有文章
      if (mode === "edit" && initialData?._id) {
        resultId = await updatePost({
          id: initialData._id,
          ...postData,
        });
      } 
      // 草稿续写：虽非编辑模式，但已有草稿id，同样调用 updatePost，防止重复创建
      else if (initialData?._id && action === "draft") {
        resultId = await updatePost({
          id: initialData._id,
          ...postData,
        });
      } 
      // 全新发布：以上皆不满足调用 createPost 新建一篇文章
      else {
        resultId = await createPost(postData);
      }

      if (!silent) {
        const message =
          action === "publish" ? "文章已发布！" : "草稿已保存！";
        toast.success(message);
        if (action === "publish") router.push("/dashboard/posts");
      }

      return resultId;
    } catch (error) {
      if (!silent) toast.error(error.message || "保存失败，请重试");
      throw error;
    }
  };

  const handleSave = (silent = false) => {
    if (silent && typeof silent.preventDefault === 'function') silent = false;
    handleSubmit((data) => onSubmit(data, "draft", silent))();
  };

  // // 测试
  // const handleSave = (silent = false) => {
  //   // silent = SyntheticBaseEvent{}
  //   // React 的事件对象有 preventDefault
  //   // if (silent && typeof silent.preventDefault === 'function') silent = false;
  //   console.log('handleSave被调用, silent=', silent);
  //   handleSubmit(
  //     (data) => onSubmit(data, "draft", silent),
  //     (errors) => {
  //       console.log('验证失败:', errors);
  //     }
  //   )();
  // };

  const handlePublish = () => {
    handleSubmit((data) => onSubmit(data, "publish"))();
  };

  const handleSchedule = () => {
    if (!watchedValues.scheduledFor) {
      toast.error("请选择发布时间");
      return;
    }
    handleSubmit((data) => onSubmit(data, "schedule"))();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <PostEditorHeader
        mode={mode}
        initialData={initialData}
        isPublishing={isCreateLoading || isUpdating}
        onSave={handleSave}
        onPublish={handlePublish}
        onSchedule={handleSchedule}
        onSettingsOpen={() => setIsSettingsOpen(true)}
        onBack={() => router.push("/dashboard")}
      />

      <PostEditorContent
        form={form}
        setQuillRef={setQuillRef}
        onImageUpload={(type) => {
          setImageModalType(type);
          setIsImageModalOpen(true);
        }}
      />

      <PostEditorSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        form={form}
        mode={mode}
      />

      <ImageUploadModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onImageSelect={handleImageSelect}
        title={
          imageModalType === "featured"
            ? "上传封面图"
            : "插入图片"
        }
      />
    </div>
  );
}
