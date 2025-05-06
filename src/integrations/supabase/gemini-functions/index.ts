import { OpenAI } from '@google/generative-ai';

export async function formatResponse(content: string) {
  // Format the response with markdown
  const formattedContent = `
### Answer:

${content.replace(/\* /g, '• ')}

---
*Note: This information is for educational purposes only. Please consult a healthcare professional for medical advice.*
`;

  return formattedContent;
}

export async function processHealthQuery(prompt: string) {
  // Format the user's prompt to get more structured responses
  const enhancedPrompt = `
Please provide a well-structured response with the following format:
- Use bullet points for lists
- Include relevant sections with ### headings where appropriate
- Keep medical terms simple and explain them when used
- Format important points in **bold**
- Use tables when comparing items (using markdown syntax)

Question: ${prompt}
`;

  // ... rest of your Gemini API call code ...
  
  // Format the response before returning
  const response = await // ... your existing Gemini API call ...
  return await formatResponse(response);
}