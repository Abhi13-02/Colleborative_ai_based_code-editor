import { NextResponse } from "next/server";
const { GoogleGenerativeAI } = require("@google/generative-ai");

export async function POST(request) {
    try {
        const { code, language } = await request.json();
        if (!code) {
            return NextResponse.json({ error: "Code is required" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `generate clear and concise documentation in the form of comments to be added at the end of the 
        code file for the code: ${code}. use the approapriate comment format for the language of the code.`

        const result = await model.generateContent(prompt);
        let documentation = result.response.text().trim();
        documentation = documentation.replace(/```[\s\S]*?```/g, ""); // Remove triple backticks if any
        documentation = documentation.replace(code, "").trim(); // Remove the code if it appears
        console.log(documentation);
        
        return NextResponse.json({ documentation }, { status: 200 });
    } catch (error) {
        console.error("Gemini API Error:", error.response?.data || error.message);
        return NextResponse.json({ error: "Failed to generate documentation" }, { status: 500 });
    }
}



