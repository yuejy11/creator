// 构建imageKit转换URL的helper
export const buildTransformationUrl = (src, transformations = []) => {
  if (!transformations.length) return src;

  // Convert transformation objects to URL parameters
  const transformParams = transformations
    .map((transform) => {
      const params = [];

      // 处理尺寸转换
      if (transform.width) params.push(`w-${transform.width}`);
      if (transform.height) params.push(`h-${transform.height}`);
      if (transform.focus) params.push(`fo-${transform.focus}`);
      if (transform.cropMode) params.push(`cm-${transform.cropMode}`);

      // 处理阴影等效果
      if (transform.effect) params.push(`e-${transform.effect}`);

      // 处理背景
      if (transform.background) params.push(`bg-${transform.background}`);

      // 使用图层语法处理文本叠加
      if (transform.overlayText) {
        const layerParams = [
          `l-text`,
          `i-${encodeURIComponent(transform.overlayText)}`,
          `tg-bold`,
          `lx-20,ly-20`,
        ];

        if (transform.overlayTextFontSize)
          layerParams.push(`fs-${transform.overlayTextFontSize}`);
        if (transform.overlayTextColor)
          layerParams.push(`co-${transform.overlayTextColor}`);
        if (transform.gravity) {
          // 将常见的定位值映射到 ImageKit 定位
          const gravityMap = {
            center: "center",
            north_west: "top_left",
            north_east: "top_right",
            south_west: "bottom_left",
            south_east: "bottom_right",
            north: "top",
            south: "bottom",
            west: "left",
            east: "right",
          };
          const mappedGravity =
            gravityMap[transform.gravity] || transform.gravity;
          layerParams.push(`lfo-${mappedGravity}`);
        }
        if (transform.overlayTextPadding)
          layerParams.push(`pa-${transform.overlayTextPadding}`);
        if (transform.overlayBackground)
          layerParams.push(`bg-${transform.overlayBackground}`);

        layerParams.push("l-end");
        return layerParams.join(",");
      }

      return params.join(",");
    })
    .filter((param) => param.length > 0)
    .join(":");

  // Insert transformation parameters into URL
  if (src.includes("/tr:")) {
    // Already has transformations, append to existing
    return src.replace("/tr:", `/tr:${transformParams}:`);
  } else {
    // Add new transformations
    const urlParts = src.split("/");
    const fileIndex = urlParts.length - 1;
    urlParts.splice(fileIndex, 0, `tr:${transformParams}`);
    return urlParts.join("/");
  }
};

// 使用服务器端API将文件上传到ImageKit
export const uploadToImageKit = async (file, fileName) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", fileName);

    const response = await fetch("/api/imagekit/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Upload failed");
    }

    const result = await response.json();

    return {
      success: true,
      data: {
        fileId: result.fileId,
        name: result.name,
        url: result.url,
        width: result.width,
        height: result.height,
        size: result.size,
      },
    };
  } catch (error) {
    console.error("ImageKit upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
