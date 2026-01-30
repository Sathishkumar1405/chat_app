import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export const generateResponse = async (prompt: string): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('❌ Error generating Gemini response:', error);
        throw error;
    }
};
