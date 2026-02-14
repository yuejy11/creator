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
      throw new Error("Title is required to generate content");
    }

    const prompt = `
      Write a comprehensive blog post with the title: "${title}"

      ${category ? `Category: ${category}` : ""}
      ${tags.length > 0 ? `Tags: ${tags.join(", ")}` : ""}

      Requirements:
      - Write engaging, informative content that matches the title
      - Use proper HTML formatting with headers (h2, h3), paragraphs, lists, and emphasis
      - Include 3-5 main sections with clear subheadings
      - Write in a conversational yet professional tone
      - Make it approximately 800-1200 words
      - Include practical insights, examples, or actionable advice where relevant
      - Use <h2> for main sections and <h3> for subsections
      - Use <p> tags for paragraphs
      - Use <ul> and <li> for bullet points when appropriate
      - Use <strong> and <em> for emphasis
      - Ensure the content is original and valuable to readers

      Do not include the title in the content as it will be added separately.
      Start directly with the introduction paragraph.
    `;

    const content = await callDeepSeek(prompt);

    if (!content || content.trim().length < 100) {
      throw new Error("Generated content is too short or empty");
    }

    return {
      success: true,
      content: content.trim(),
    };
  } catch (error) {
    console.error("DeepSeek Error:", error);

    return {
      success: false,
      error:
        error?.message || "Failed to generate content. Please try again.",
    };
  }
}

export async function improveContent(
  currentContent,
  improvementType = "enhance"
) {
  try {
    if (!currentContent || currentContent.trim().length === 0) {
      throw new Error("Content is required for improvement");
    }

    let prompt = "";

    switch (improvementType) {
      case "expand":
        prompt = `
          Take this blog content and expand it with more details, examples, and insights:

          ${currentContent}

          Requirements:
          - Keep the existing structure and main points
          - Add more depth and detail to each section
          - Include practical examples and insights
          - Maintain the original tone and style
          - Return the improved content in the same HTML format
          `;
                  break;

                case "simplify":
                  prompt = `
          Take this blog content and make it more concise and easier to read:

          ${currentContent}

          Requirements:
          - Keep all main points but make them clearer
          - Remove unnecessary complexity
          - Use simpler language where possible
          - Maintain the HTML formatting
          - Keep the essential information
        `;
        break;

      default:
        prompt = `
          Improve this blog content by making it more engaging and well-structured:

          ${currentContent}

          Requirements:
          - Improve the flow and readability
          - Add engaging transitions between sections
          - Enhance with better examples or explanations
          - Maintain the original HTML structure
          - Keep the same length approximately
          - Make it more compelling to read
        `;
    }

    const improvedContent = await callDeepSeek(prompt);

    return {
      success: true,
      content: improvedContent.trim(),
    };
  } catch (error) {
    console.error("Content improvement error:", error);

    return {
      success: false,
      error:
        error?.message || "Failed to improve content. Please try again.",
    };
  }
}
