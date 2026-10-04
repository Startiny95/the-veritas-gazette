import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI();

export async function POST(request: Request) {
  try {
    const { type, text, url } = await request.json();

    let prompt = text;
    if (type === 'link') {
      prompt = `Investigate and fact-check this URL/link: ${url}`;
    } else if (type === 'screenshot') {
      prompt = `Fact-check the claim/text in this uploaded image context: ${text}`;
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash', 
      contents: `You are a strict fact-checking news desk ("The Veritas Gazette"). Analyze the following claim: "${prompt}".
      You MUST respond using EXACTLY this format using these emojis as prefixes:
      📰 VERDICT: [Choose strictly from: REAL, FAKE, MISLEADING, or UNVERIFIED]
      🎯 CONFIDENCE: [A number between 0 to 100]
      📌 CLAIM CHECKED: [Summary of the claim]
      🔍 WHY: [Detailed reasoning paragraph]
      🚩 RED FLAGS: [List any red flags or discrepancies]
      🔗 SOURCES: [Provide plausible sources or context links]
      ✍️ EDITOR'S NOTE: [A concluding remark]`,
    });

    return NextResponse.json({ reply: response.text }, { status: 200 });
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    
    // Check if it's a 503 high demand error
    if (error.status === 503 || (error.message && error.message.includes('high demand'))) {
      return NextResponse.json(
        { error: 'The AI model is experiencing high temporary demand. Please click submit/retry again in a few seconds.' },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}