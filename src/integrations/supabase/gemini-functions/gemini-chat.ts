import { formatHealthResponse } from './utils';

interface GeminiRequestOptions {
    prompt: string;
    type: 'symptom-check' | 'disease-prediction' | 'health-recommendation' | 'chat';
}

export const getGeminiResponse = async ({ prompt, type }: GeminiRequestOptions) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    let systemPrompt = '';
    // Set system prompt based on request type
    switch (type) {
        case 'symptom-check':
            systemPrompt = `
            You are a certified virtual medical assistant. 
            - Review the user's symptoms and provide a concise bullet-point summary.
            - List the top 3 possible medical conditions, prioritizing common and relevant ones.
            - Suggest immediate actions or when to seek professional help.
            - Keep the response under 200 words.
            - End with: "Disclaimer: This is not a diagnosis. Consult a licensed healthcare provider for medical advice."
            `;
            break;
        case 'disease-prediction':
            systemPrompt = `
            You are an AI health risk predictor with access to symptom patterns and common risk factors. 
            - Analyze the user's input and provide a brief risk summary.
            - List the top 3 possible health conditions or concerns based on the data.
            - Use bullet points for clarity, and suggest follow-up actions or screenings if relevant.
            - Keep the response under 200 words.
            - End with: "Disclaimer: This prediction is informational. Always consult a healthcare professional for a proper evaluation."
            `;
            break;
        case 'health-recommendation':
            systemPrompt = `
            You are a digital health advisor. 
            - Based on the user's input, provide 3 to 5 personalized and actionable health recommendations in bullet points.
            - Focus on lifestyle, nutrition, activity, or sleep advice where appropriate.
            - Be concise, friendly, and practical.
            - Keep the response under 200 words.
            - End with: "Disclaimer: These are general health tips. Please consult a healthcare provider for advice tailored to your condition."
            `;
            break;
        case 'chat':
        default:
            systemPrompt = `
            You are a friendly and knowledgeable AI health assistant.
            - Answer health-related queries in a clear, empathetic, and concise manner.
            - Use bullet points for structured answers where appropriate.
            - Avoid jargon; aim for an informative tone under 200 words.
            - End with: "Disclaimer: For serious concerns, please contact a licensed medical professional."
            `;

    }

const formattedPrompt = `
    You are an expert healthcare assistant. Format your response in **markdown** with the following structure:

    - Use ### for clear section headings (e.g., "### Possible Conditions", "### Recommendations")
    - Use bullet points ( - ) for lists
    - Use **bold** for key medical terms and action items
    - Use > blockquotes for important notes, risks, or disclaimers
    - Use tables if comparing items (e.g., symptoms vs. conditions)
    - Use clear, simple, professional language suitable for a general audience
    - Keep the response under 200 words
    - Always include a short disclaimer at the end

    User Input:
    ${systemPrompt}

    Question:
    ${prompt}
    `;


    try {
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
                    maxOutputTokens: 300, // Reduced token limit for more concise responses
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
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'Failed to get response from Gemini AI');
        }

        const result = data.candidates[0].content.parts[0].text;
        return { result: formatHealthResponse(result) };
    } catch (error) {
        console.error('Error calling Gemini AI:', error);
        throw error;
    }
};
