"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";

const CATEGORIES = [
  "科技",
  "设计",
  "营销",
  "商业",
  "生活",
  "教育",
  "健康",
  "旅行",
  "美食",
  "娱乐",
];

export default function PostEditorSettings({ isOpen, onClose, form, mode }) {
  const [tagInput, setTagInput] = useState("");
  const { watch, setValue } = form;
  const watchedValues = watch();

  const handleTagInput = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (
      tag &&
      !watchedValues.tags.includes(tag) &&
      watchedValues.tags.length < 10
    ) {
      setValue("tags", [...watchedValues.tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setValue(
      "tags",
      watchedValues.tags.filter((tag) => tag !== tagToRemove)
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">文章设置</DialogTitle>
          <DialogDescription>配置文章的分类、标签与发布时间</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">分类</label>
            <Select
              value={watchedValues.category}
              onValueChange={(value) => setValue("category", value)}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600">
                <SelectValue placeholder="选择分类..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <label className="text-white text-sm font-medium">标签</label>
            <div className="flex space-x-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInput}
                placeholder="添加标签..."
                className="bg-slate-800 border-slate-600"
              />
              <Button
                type="button"
                onClick={addTag}
                variant="outline"
                size="sm"
                className="border-slate-600"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {watchedValues.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {watchedValues.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-purple-500/20 text-purple-300 border-purple-500/30"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-400">
              已添加 {watchedValues.tags.length}/10 个标签 • 按回车或逗号添加
            </p>
          </div>

          {/* Scheduling */}
          {mode === "create" && (
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">
                定时发布
              </label>
              <Input
                value={watchedValues.scheduledFor}
                onChange={(e) => setValue("scheduledFor", e.target.value)}
                type="datetime-local"
                className="bg-slate-800 border-slate-600"
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-slate-400">
                留空则立即发布
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
