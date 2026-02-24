"use client";

import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  Image as ImageIcon,
  Crop,
  Type,
  Wand2,
  Loader2,
  RefreshCw,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { buildTransformationUrl, uploadToImageKit } from "@/lib/imagekit";

// Form validation schema
const transformationSchema = z.object({
  aspectRatio: z.string().default("original"),
  customWidth: z.number().min(100).max(2000).default(800),
  customHeight: z.number().min(100).max(2000).default(600),
  smartCropFocus: z.string().default("auto"),
  textOverlay: z.string().optional(),
  textFontSize: z.number().min(12).max(200).default(50),
  textColor: z.string().default("#ffffff"),
  textPosition: z.string().default("center"),
  backgroundRemoved: z.boolean().default(false),
  dropShadow: z.boolean().default(false),
});

const ASPECT_RATIOS = [
  { label: "原始", value: "original" },
  { label: "正方形 (1:1)", value: "1:1", width: 400, height: 400 },
  { label: "横版 (16:9)", value: "16:9", width: 800, height: 450 },
  { label: "竖版 (4:5)", value: "4:5", width: 400, height: 500 },
  { label: "故事 (9:16)", value: "9:16", width: 450, height: 800 },
  { label: "自定义", value: "custom" },
];

const SMART_CROP_OPTIONS = [
  { label: "自动", value: "auto" },
  { label: "人脸", value: "face" },
  { label: "居中", value: "center" },
  { label: "顶部", value: "top" },
  { label: "底部", value: "bottom" },
];

const TEXT_POSITIONS = [
  { label: "居中", value: "center" },
  { label: "左上", value: "north_west" },
  { label: "右上", value: "north_east" },
  { label: "左下", value: "south_west" },
  { label: "右下", value: "south_east" },
  { label: "顶部", value: "north" },
  { label: "底部", value: "south" },
  { label: "左侧", value: "west" },
  { label: "右侧", value: "east" },
];

export default function ImageUploadModal({
  isOpen,
  onClose,
  onImageSelect,
  title = "上传并处理图片",
}) {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [transformedImage, setTransformedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");

  // console.log("在这里：", transformedImage)

  const form = useForm({
    resolver: zodResolver(transformationSchema),
    defaultValues: {
      aspectRatio: "original",
      customWidth: 800,
      customHeight: 600,
      smartCropFocus: "auto",
      textOverlay: "",
      textFontSize: 50,
      textColor: "#ffffff",
      textPosition: "center",
      backgroundRemoved: false,
      dropShadow: false,
    },
  });

  const { watch, setValue, reset } = form;
  const watchedValues = watch();

  // 处理图片上传逻辑
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    // 验证文件大小(最大10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("文件大小需小于 10MB");
      return;
    }

    setIsUploading(true);

    try {
      const fileName = `post-image-${Date.now()}-${file.name}`;
      const result = await uploadToImageKit(file, fileName);

      if (result.success) {
        setUploadedImage(result.data);
        setTransformedImage(result.data.url);
        setActiveTab("transform");
        toast.success("图片上传成功！");
      } else {
        toast.error(result.error || "上传失败");
      }
    } catch (error) {
      console.error("上传失败:", error);
      toast.error("上传失败，请重试");
    } finally {
      setIsUploading(false);
    }
  }, []);
  // 文件拖拽
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
    },
    multiple: false,
  });

  // 使用更改逻辑
  const applyTransformations = async () => {
    // 判断原始上传图片是否存在
    if (!uploadedImage) return;

    setIsTransforming(true);

    try {
      let transformationChain = [];

      // 纵横比和大小
      if (watchedValues.aspectRatio !== "original") {
        const ratio = ASPECT_RATIOS.find(
          (r) => r.value === watchedValues.aspectRatio
        );
        if (ratio && ratio.width && ratio.height) {
          transformationChain.push({
            width: ratio.width,
            height: ratio.height,
            focus: watchedValues.smartCropFocus,
          });
        } else if (watchedValues.aspectRatio === "custom") {
          transformationChain.push({
            width: watchedValues.customWidth,
            height: watchedValues.customHeight,
            focus: watchedValues.smartCropFocus,
          });
        }
      }

      // 移除背景
      if (watchedValues.backgroundRemoved) {
        transformationChain.push({ effect: "removedotbg" });
      }

      // 添加阴影
      if (watchedValues.dropShadow && watchedValues.backgroundRemoved) {
        transformationChain.push({ effect: "dropshadow" });
      }

      // 文本覆盖
      if (watchedValues.textOverlay?.trim()) {
        transformationChain.push({
          overlayText: watchedValues.textOverlay,
          overlayTextFontSize: watchedValues.textFontSize,
          overlayTextColor: watchedValues.textColor.replace("#", ""),
          gravity: watchedValues.textPosition,
          overlayTextPadding: 10,
        });
      }

      // 使用更改
      const transformedUrl = buildTransformationUrl(
        uploadedImage.url,
        transformationChain
      );

      // Add a small delay to show loading state and allow ImageKit to process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setTransformedImage(transformedUrl);
      toast.success("处理完成！");
    } catch (error) {
      console.error("图片处理出错:", error);
      toast.error("处理失败");
    } finally {
      setIsTransforming(false);
    }
  };

  // 重置图片规格
  const resetTransformations = () => {
    reset();
    setTransformedImage(uploadedImage?.url);
  };

  // 处理上传的图片
  const handleSelectImage = () => {
    if (transformedImage) {
      onImageSelect({
        url: transformedImage,
        originalUrl: uploadedImage?.url,
        fileId: uploadedImage?.fileId,
        name: uploadedImage?.name,
        width: uploadedImage?.width,
        height: uploadedImage?.height,
      });
      onClose();
      resetForm();
    }
  };

  // Reset form
  const resetForm = () => {
    setUploadedImage(null);
    setTransformedImage(null);
    setActiveTab("upload");
    reset();
  };

  // Handle modal close
  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!max-w-6xl !h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          <DialogDescription>
            上传图片，并用 AI 进行智能处理
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">上传</TabsTrigger>
            <TabsTrigger value="transform" disabled={!uploadedImage}>
              处理
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-purple-400 bg-purple-400/10"
                  : "border-slate-600 hover:border-slate-500"
              }`}
            >
              <input {...getInputProps()} />

              {/* 加载UI优化 */}
              {isUploading ? (
                <div className="space-y-4">
                  <Loader2 className="h-12 w-12 mx-auto animate-spin text-purple-400" />
                  <p className="text-slate-300">上传中...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-slate-400" />
                  <div>
                    <p className="text-lg text-white">
                      {isDragActive
                        ? "松开即可上传"
                        : "拖拽图片到此处"}
                    </p>
                    <p className="text-sm text-slate-400 mt-2">
                      或点击选择文件（JPG、PNG、WebP、GIF，最大 10MB）
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 上传成功后 Upload 页面提示 */}
            {uploadedImage && (
              <div className="text-center space-y-4">
                <Badge
                  variant="secondary"
                  className="bg-green-500/20 text-green-300 border-green-500/30"
                >
                  <Check className="h-3 w-3 mr-1" />
                  上传成功！
                </Badge>
                <div className="text-sm text-slate-400">
                  {uploadedImage.width} × {uploadedImage.height} •{" "}
                  {Math.round(uploadedImage.size / 1024)}KB
                </div>
                <Button
                  onClick={() => setActiveTab("transform")}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  开始处理
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="transform" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
              {/* 转换控制 */}
              <div className="space-y-6">
                {/* AI工具 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Wand2 className="h-5 w-5 mr-2" />
                    AI 图片处理
                  </h3>

                  {/* 去除背景 */}
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-white font-medium">
                        去除背景
                      </Label>
                      <Button
                        type="button"
                        variant={
                          watchedValues.backgroundRemoved
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setValue(
                            "backgroundRemoved",
                            !watchedValues.backgroundRemoved
                          )
                        }
                      >
                        {watchedValues.backgroundRemoved ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-slate-400">
                      AI 智能抠图，一键去除背景
                    </p>
                  </div>

                  {/* 添加阴影 */}
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-white font-medium">
                        添加阴影
                      </Label>
                      <Button
                        type="button"
                        variant={
                          watchedValues.dropShadow ? "default" : "outline"
                        }
                        size="sm"
                        disabled={!watchedValues.backgroundRemoved}
                        onClick={() =>
                          setValue("dropShadow", !watchedValues.dropShadow)
                        }
                      >
                        {watchedValues.dropShadow ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-slate-400">
                      {watchedValues.backgroundRemoved
                        ? "添加真实感阴影"
                        : "需先去除背景"}
                    </p>
                  </div>
                </div>

                {/* 长宽比和裁剪 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Crop className="h-5 w-5 mr-2" />
                    缩放与裁剪
                  </h3>

                  <div className="space-y-3">
                    <Label className="text-white">纵横比</Label>
                    <Select
                      value={watchedValues.aspectRatio}
                      onValueChange={(value) => setValue("aspectRatio", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASPECT_RATIOS.map((ratio) => (
                          <SelectItem key={ratio.value} value={ratio.value}>
                            {ratio.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {watchedValues.aspectRatio === "custom" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-white">宽度</Label>
                        <Input
                          type="number"
                          value={watchedValues.customWidth}
                          onChange={(e) =>
                            setValue(
                              "customWidth",
                              parseInt(e.target.value) || 800
                            )
                          }
                          min="100"
                          max="2000"
                        />
                      </div>
                      <div>
                        <Label className="text-white">高度</Label>
                        <Input
                          type="number"
                          value={watchedValues.customHeight}
                          onChange={(e) =>
                            setValue(
                              "customHeight",
                              parseInt(e.target.value) || 600
                            )
                          }
                          min="100"
                          max="2000"
                        />
                      </div>
                    </div>
                  )}

                  {watchedValues.aspectRatio !== "original" && (
                    <div className="space-y-3">
                      <Label className="text-white">智能裁剪焦点</Label>
                      <Select
                        value={watchedValues.smartCropFocus}
                        onValueChange={(value) =>
                          setValue("smartCropFocus", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SMART_CROP_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* 文本覆盖 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Type className="h-5 w-5 mr-2" />
                    文字叠加
                  </h3>

                  <div className="space-y-3">
                    <Label className="text-white">文字</Label>
                    <Textarea
                      value={watchedValues.textOverlay}
                      onChange={(e) => setValue("textOverlay", e.target.value)}
                      placeholder="输入要叠加的文字..."
                      rows={3}
                    />
                  </div>

                  {watchedValues.textOverlay && (
                    <>
                      <div className="space-y-3">
                        <Label className="text-white">
                          字号：{watchedValues.textFontSize}px
                        </Label>
                        <Slider
                          value={[watchedValues.textFontSize]}
                          onValueChange={(value) =>
                            setValue("textFontSize", value[0])
                          }
                          max={200}
                          min={12}
                          step={2}
                          className="w-full"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-white">文字颜色</Label>
                          <Input
                            type="color"
                            value={watchedValues.textColor}
                            onChange={(e) =>
                              setValue("textColor", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">位置</Label>
                          <Select
                            value={watchedValues.textPosition}
                            onValueChange={(value) =>
                              setValue("textPosition", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TEXT_POSITIONS.map((position) => (
                                <SelectItem
                                  key={position.value}
                                  value={position.value}
                                >
                                  {position.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3">
                  <Button
                    onClick={applyTransformations}
                    disabled={isTransforming}
                    variant={"primary"}
                  >
                    {isTransforming ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-2" />
                    )}
                    应用处理
                  </Button>

                  <Button onClick={resetTransformations} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    重置
                  </Button>
                </div>
              </div>

              {/* 图像预览 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <ImageIcon className="h-5 w-5 mr-2" />
                  预览
                </h3>

                {transformedImage && (
                  <div className="relative">
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <img
                        src={transformedImage}
                        alt="处理后预览"
                        className="w-full h-auto max-h-96 object-contain rounded-lg mx-auto"
                        onError={() => {
                          toast.error("加载处理后的图片失败");
                          setTransformedImage(uploadedImage?.url);
                        }}
                      />
                    </div>

                    {isTransforming && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <div className="bg-slate-800 rounded-lg p-4 flex items-center space-x-3">
                          <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                          <span className="text-white">
                            正在处理中...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {uploadedImage && transformedImage && (
                  <div className="text-center space-y-4">
                    <div className="text-sm text-slate-400">
                      当前图片已就绪，可直接使用
                    </div>

                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={handleSelectImage}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        使用此图片
                      </Button>

                      <Button
                        onClick={handleClose}
                        variant="outline"
                        className="border-slate-600 hover:bg-slate-700"
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
