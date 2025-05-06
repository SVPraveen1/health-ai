import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const formatHealthResponse = (text: string) => {
  const sections = text.split('\n\n');
  return sections.map(section => {
    if (section.startsWith('•')) {
      return `${section}`; // Keep bullet points
    }
    if (section.toLowerCase().includes('warning') || section.toLowerCase().includes('caution')) {
      return `> ⚠️ ${section}`; // Format warnings
    }
    if (section.match(/^\d+\./)) {
      return `\n${section}`; // Format numbered lists
    }
    return section;
  }).join('\n\n');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, type } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    let systemPrompt = '';
    
    // Set system prompt based on request type
    switch (type) {
      case 'symptom-check':
        systemPrompt = 'You are a helpful medical assistant. Analyze the following symptoms and provide possible conditions, their likelihood, and recommendations. Always include a disclaimer that this is not medical advice and serious symptoms require professional medical attention.';
        break;
      case 'disease-prediction':
        systemPrompt = 'You are a health prediction assistant. Based on the following health parameters, provide an assessment of potential health risks. Include percentages for common conditions like diabetes, heart disease, etc. Always include a disclaimer that this is not medical advice and professional evaluation is needed for diagnosis.';
        break;
      case 'health-recommendation':
        systemPrompt = 'You are a health recommendation assistant. Based on the following personal health data, provide helpful lifestyle, diet, and exercise recommendations. Tailor your suggestions to the individual\'s specific situation. Always include a disclaimer that this is not medical advice.';
        break;
      case 'chat':
      default:
        systemPrompt = 'You are a helpful healthcare chatbot. Provide concise and accurate health information. Always include a disclaimer that this is not medical advice and serious concerns require professional medical attention.';
    }

    const formattedPrompt = `
Format the response using markdown with:
- Clear section headings using ###
- Bullet points for lists
- **Bold** for important terms
- > Blockquotes for warnings or important notes
- Tables where relevant
- Simple, clear language

Question: ${systemPrompt}\n\n${prompt}
`;

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: formattedPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    const data = await response.json();
    
    // Extract response text
    let result = "";
    try {
      result = data.candidates[0].content.parts[0].text;
    } catch (e) {
      console.error("Error parsing Gemini API response:", e);
      console.error("Raw response:", JSON.stringify(data));
      throw new Error("Failed to parse Gemini API response");
    }

    const formattedResponse = formatHealthResponse(result);

    return new Response(
      JSON.stringify({ result: formattedResponse }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );
  } catch (error) {
    console.error('Error in gemini-ai function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );
  }
});
