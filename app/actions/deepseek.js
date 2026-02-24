"use server";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

async function callDeepSeek(prompt) {
  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "DeepSeek request failed");
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function generateBlogContent(title, category = "", tags = []) {
  try {
    if (!title || title.trim().length === 0) {
      throw new Error("请先填写标题");
    }

    const prompt = `
      请根据以下标题撰写一篇完整的博客文章：「${title}」

      ${category ? `分类：${category}` : ""}
      ${tags.length > 0 ? `标签：${tags.join("、")}` : ""}

      要求：
      - 内容需与标题相符，兼具吸引力与信息量
      - 使用规范的 HTML 格式：标题（h2、h3）、段落、列表、加粗/斜体
      - 包含 3-5 个主章节，并配有清晰的小标题
      - 语气亲切自然但保持专业
      - 字数约 800-1200 字
      - 在适当处加入实用见解、案例或可操作的建议
      - 主章节用 <h2>，子章节用 <h3>
      - 段落用 <p> 包裹
      - 列表用 <ul> 和 <li>
      - 强调用 <strong> 和 <em>
      - 确保内容原创、对读者有价值

      不要包含标题，标题会单独显示。直接从引言段落开始写。
    `;

    const content = await callDeepSeek(prompt);

    if (!content || content.trim().length < 100) {
      throw new Error("生成内容过短或为空");
    }

    return {
      success: true,
      content: content.trim(),
    };
  } catch (error) {
    console.error("DeepSeek 错误:", error);

    return {
      success: false,
      error:
        error?.message || "生成失败，请重试",
    };
  }
}

export async function improveContent(
  currentContent,
  improvementType = "enhance"
) {
  try {
    if (!currentContent || currentContent.trim().length === 0) {
      throw new Error("请先输入内容");
    }

    let prompt = "";

    switch (improvementType) {
      case "expand":
        prompt = `
          请对以下博客内容进行扩写，增加更多细节、案例和见解：

          ${currentContent}

          要求：
          - 保留原有结构和主要论点
          - 在每个章节中增加深度和细节
          - 加入实用的案例和见解
          - 保持原文的语气和风格
          - 以相同 HTML 格式输出改进后的内容
        `;
      break;

      case "simplify":
        prompt = `
          请将以下博客内容精简，使其更简洁易读：

          ${currentContent}

          要求：
          - 保留所有要点，但表达更清晰
          - 删去不必要的复杂表述
          - 在可行处使用更简单的表述
          - 保持 HTML 格式
          - 保留核心信息
        `;
      break;

      default:
        prompt = `
          请优化以下博客内容，使其更生动、结构更清晰：

          ${currentContent}

          要求：
          - 提升逻辑连贯性与可读性
          - 在章节间加入自然的过渡
          - 用更恰当的案例或解释加以完善
          - 保持原有 HTML 结构
          - 篇幅大致不变
          - 使内容更具吸引力
        `;
    }

    const improvedContent = await callDeepSeek(prompt);

    return {
      success: true,
      content: improvedContent.trim(),
    };
  } catch (error) {
    console.error("内容优化出错:", error);

    return {
      success: false,
      error:
        error?.message || "优化失败，请重试",
    };
  }
}
