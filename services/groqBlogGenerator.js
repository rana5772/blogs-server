const Groq = require("groq-sdk");
const Blog = require("../models/blogModel");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const categories = [
  "design",
  "marketing",
  "business",
  "technology",
  "ai automation",
  "general",
];

async function getNextCategory() {
  const lastBlog = await Blog.findOne().sort({ createdAt: -1 });
  const nextCategory = categories[(currentIndex + 1) % categories.length];

  console.log(`Previous: ${lastBlog.category} → Next: ${nextCategory}`);

  return nextCategory;
}

async function generateBlog() {
  const category = await getNextCategory();

  console.log(`Selected category: ${category}`);

  const prompt = `
Write a professional blog article.

Category: ${category}

Requirements:
- Generate your own unique topic
- Around 1000 words
- Markdown format
- Do NOT include a main title in the article body
- Do NOT include a heading called "Introduction"
- Start directly with the introductory paragraph
- Use markdown subheadings (##)
- Use bullet points (*) wherever appropriate
- Use numbered lists when appropriate
- Break large paragraphs into smaller readable sections
- End with a conclusion section using:
  ## Conclusion
- Do not include external links
- Avoid generic topics
- Make the article practical and informative
- Write in a human, engaging style
- Do not use excessive emojis
- Ensure proper markdown formatting throughout

Return EXACTLY in this format:

TITLE: Your Blog Title Here

CONTENT:
The markdown article content here
`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.8,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const response = completion.choices[0].message.content.trim();

  console.log("\n========== GROQ RESPONSE ==========\n");
  console.log(response);
  console.log("\n===================================\n");

  const titleMatch = response.match(/TITLE:\s*(.*?)\s*CONTENT:/s);

  if (!titleMatch) {
    throw new Error("Could not extract title from AI response");
  }

  const title = titleMatch[1].trim();

  const contentParts = response.split("CONTENT:");

  if (contentParts.length < 2) {
    throw new Error("Could not extract content from AI response");
  }

  const content = contentParts[1].trim();

  console.log("\n========== PARSED BLOG ==========\n");
  console.log("TITLE:", title);
  console.log("CONTENT PREVIEW:", content.substring(0, 200));
  console.log("\n=================================\n");

  return {
    title,
    content,
    category,
  };
}

module.exports = {
  generateBlog,
};
