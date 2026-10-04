import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI();

export async function GET() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Say "Gemini setup is working successfully!" if you can read this.',
    });

    return NextResponse.json({ success: true, message: response.text });
  } catch (error: any) {
    console.error('Gemini Test Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}