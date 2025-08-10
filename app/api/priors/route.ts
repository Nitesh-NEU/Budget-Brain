/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 [Your Name]. All rights reserved.
 * 
 * This file contains proprietary AI integration and data processing logic.
 * Unauthorized copying, modification, distribution, or commercial use 
 * is strictly prohibited.
 * 
 * See LICENSE file for full terms and conditions.
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ChannelPriorsSchema, PriorsEitherSchema, PriorsResponseSchema } from "@/lib/zod";
import { normalizePriors } from "@/lib/priorAdapter";
import { sanitizeCitations } from "@/lib/sanitizeCitations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get("company") || "generic";

    const prompt = `
    You are an assistant sourcing paid media benchmarks with WEB SEARCH.
    
    Company: "${company}"
    
    CRITICAL REQUIREMENTS:
    - You MUST include data for ALL four channels: Google Ads, Meta Ads, TikTok Ads, and LinkedIn Ads
    - LinkedIn Ads data is MANDATORY - do not skip or omit it
    - If you cannot find recent LinkedIn data, use industry averages but still include the linkedin section
    
    TASK:
    1) Use web search to find RECENT ranges or mean/std_dev for CPM (USD per 1000), CTR, and CVR for Google Ads, Meta Ads, TikTok Ads, LinkedIn Ads.
    2) Prefer data from the last 24 months when possible. Return 2–6 citations with WORKING URLs.
    3) Output STRICT JSON only, matching this EXACT shape (all four channels required):
    {
      "google":  { "cpm": {"mean": number, "std_dev": number}, "ctr": {"mean": number, "std_dev": number}, "cvr": {"mean": number, "std_dev": number} },
      "meta":    { "cpm": {"mean": number, "std_dev": number}, "ctr": {"mean": number, "std_dev": number}, "cvr": {"mean": number, "std_dev": number} },
      "tiktok":  { "cpm": {"mean": number, "std_dev": number}, "ctr": {"mean": number, "std_dev": number}, "cvr": {"mean": number, "std_dev": number} },
      "linkedin":{ "cpm": {"mean": number, "std_dev": number}, "ctr": {"mean": number, "std_dev": number}, "cvr": {"mean": number, "std_dev": number} },
      "citations": [ { "title": string, "url": string, "text": string } ]
    }
    
    NOTES:
    - CTR and CVR are decimals in [0,1], not percentages.
    - Use REALISTIC industry benchmarks:
      * Google Ads: CPM $5-50, CTR 1-4%, CVR 1-5%
      * Meta Ads: CPM $5-20, CTR 0.5-2%, CVR 1-4%  
      * TikTok Ads: CPM $3-15, CTR 1-3%, CVR 1-3%
      * LinkedIn Ads: CPM $8-25, CTR 0.3-1%, CVR 1-5%
    - If only ranges are found, convert to mean and std_dev with a reasonable assumption (e.g., sd ≈ (hi - lo)/4) and cite the source.
    - Do not include commentary. JSON only.
    - ALL FOUR CHANNELS (google, meta, tiktok, linkedin) ARE REQUIRED IN YOUR RESPONSE.
    `;
    

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite", // not using 2.5 its bit slower
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          required: ["google", "meta", "tiktok", "linkedin", "citations"],
          properties: {
            google: {
              type: SchemaType.OBJECT,
              properties: {
                cpm:  { type: SchemaType.OBJECT, properties: { mean: { type: SchemaType.NUMBER }, std_dev: { type: SchemaType.NUMBER } } },
                ctr:  { type: SchemaType.OBJECT, properties: { mean: { type: SchemaType.NUMBER }, std_dev: { type: SchemaType.NUMBER } } },
                cvr:  { type: SchemaType.OBJECT, properties: { mean: { type: SchemaType.NUMBER }, std_dev: { type: SchemaType.NUMBER } } },
              }
            },
            meta: {
              type: SchemaType.OBJECT,
              properties: {
                cpm:  { type: SchemaType.OBJECT, properties: { mean: { type: SchemaType.NUMBER }, std_dev: { type: SchemaType.NUMBER } } },
                ctr:  { type: SchemaType.OBJECT, properties: { mean: { type: SchemaType.NUMBER }, std_dev: { type: SchemaType.NUMBER } } },
                cvr:  { type: SchemaType.OBJECT, properties: { mean: { type: SchemaType.NUMBER }, std_dev: { type: SchemaType.NUMBER } } },
              }
            },
            tiktok: {
              type: SchemaType.OBJECT,
              properties: {
                cpm:  { type: SchemaType.OBJECT, properties: { mean: { type: SchemaType.NUMBER }, std_dev: { type: SchemaType.NUMBER } } },
                ctr:  { type: SchemaType.OBJECT, properties: { mean: { type: SchemaType.NUMBER }, std_dev: { type: SchemaType.NUMBER } } },
                cvr:  { type: SchemaType.OBJECT, properties: { mean: { type: SchemaType.NUMBER }, std_dev: { type: SchemaType.NUMBER } } },
              }
            },
            linkedin: {
              type: SchemaType.OBJECT,
              required: ["cpm", "ctr", "cvr"],
              properties: {
                cpm:  { type: SchemaType.OBJECT, properties: { mean: { type: SchemaType.NUMBER }, std_dev: { type: SchemaType.NUMBER } }, required: ["mean", "std_dev"] },
                ctr:  { type: SchemaType.OBJECT, properties: { mean: { type: SchemaType.NUMBER }, std_dev: { type: SchemaType.NUMBER } }, required: ["mean", "std_dev"] },
                cvr:  { type: SchemaType.OBJECT, properties: { mean: { type: SchemaType.NUMBER }, std_dev: { type: SchemaType.NUMBER } }, required: ["mean", "std_dev"] },
              }
            },
            citations: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING },
                  url:   { type: SchemaType.STRING },
                  text:  { type: SchemaType.STRING },
                  id:    { type: SchemaType.STRING },
                }
              }
            }
          },
        }
      }
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });


    const text = result.response.text();
    
    let parsed;
    try {
      const cleanedText = text
        .replace(/^```json\s*/i, '') 
        .replace(/```\s*$/, '') 
        .trim();
      
      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse LLM response as JSON:", parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      throw new Error(`Invalid JSON response from LLM: ${errorMessage}`);
    }

    const either = PriorsEitherSchema.parse(parsed);
    const priors = ChannelPriorsSchema.parse(normalizePriors(either));
    const citations = sanitizeCitations(parsed.citations);

    const candidate = { priors, citations };
    const safe = PriorsResponseSchema.safeParse(candidate);
    if (!safe.success) {
      return NextResponse.json({ priors, citations: [] });
    }
    return NextResponse.json(safe.data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to fetch priors" }, { status: 400 });
  }
}
