/**
 * Budget Brain - AI-Powered Advertising Budget Optimizer
 * Copyright (c) 2025 Nitesh More. All rights reserved.
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

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT = 30000; // 30 seconds

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get("company") || "generic";
    
    // Check cache first
    const cacheKey = `priors_${company}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("Returning cached data for", company);
      return NextResponse.json(cached.data);
    }

    const prompt = `
    You are an assistant providing paid media benchmarks for advertising channels.
    
    Company: "${company}"
    
    CRITICAL REQUIREMENTS:
    - You MUST include data for ALL four channels: Google Ads, Meta Ads, TikTok Ads, and LinkedIn Ads
    - Provide realistic industry benchmarks based on common knowledge
    - Keep response concise and under 1000 characters total
    
    TASK:
    Provide realistic benchmark ranges for CPM (USD per 1000), CTR, and CVR for each channel.
    Output STRICT JSON only, matching this EXACT shape:
    {
      "google":  { "cpm": {"mean": number, "std_dev": number}, "ctr": {"mean": number, "std_dev": number}, "cvr": {"mean": number, "std_dev": number} },
      "meta":    { "cpm": {"mean": number, "std_dev": number}, "ctr": {"mean": number, "std_dev": number}, "cvr": {"mean": number, "std_dev": number} },
      "tiktok":  { "cpm": {"mean": number, "std_dev": number}, "ctr": {"mean": number, "std_dev": number}, "cvr": {"mean": number, "std_dev": number} },
      "linkedin":{ "cpm": {"mean": number, "std_dev": number}, "ctr": {"mean": number, "std_dev": number}, "cvr": {"mean": number, "std_dev": number} },
      "citations": [ { "title": "Industry Benchmarks", "url": "https://example.com", "text": "Standard industry data" } ]
    }
    
    BENCHMARKS TO USE:
    - Google Ads: CPM $15±5, CTR 2.5±1%, CVR 3±1.5%
    - Meta Ads: CPM $12±4, CTR 1.5±0.8%, CVR 2.5±1.2%  
    - TikTok Ads: CPM $8±3, CTR 2±0.9%, CVR 2±1%
    - LinkedIn Ads: CPM $16±6, CTR 0.8±0.4%, CVR 3±1.5%
    
    NOTES:
    - CTR and CVR are decimals in [0,1], not percentages
    - No commentary, JSON only
    - Keep citations minimal
    `;
    

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // Use faster model
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 1000, // Limit response size
        temperature: 0.1, // Lower temperature for more consistent output
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
                }
              }
            }
          },
        }
      }
    });

    // Add timeout to the API call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT);
    });

    const result = await Promise.race([
      model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      }),
      timeoutPromise
    ]) as any;

    // Check if the response is valid
    if (!result.response) {
      throw new Error("No response received from Gemini API");
    }

    const text = result.response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error("Empty response received from Gemini API");
    }
    
    let parsed;
    try {
      const cleanedText = text
        .replace(/^```json\s*/i, '') 
        .replace(/```\s*$/, '') 
        .trim();
      
      console.log("Raw LLM response length:", text.length);
      console.log("Cleaned text preview:", cleanedText.substring(0, 500));
      
      // Try multiple parsing strategies
      try {
        parsed = JSON.parse(cleanedText);
      } catch (firstParseError) {
        console.log("First parse failed, trying with string sanitization...");
        
        // More aggressive cleaning for malformed JSON
        let sanitizedText = cleanedText;
        
        // Fix common JSON issues
        sanitizedText = sanitizedText
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes around unquoted keys
          .replace(/:\s*([^",\[\]{}\s]+)(\s*[,}])/g, ':"$1"$2') // Quote unquoted string values
          .replace(/:\s*"(\d+\.?\d*)"(\s*[,}])/g, ':$1$2') // Unquote numbers
          .replace(/:\s*"(true|false|null)"(\s*[,}])/g, ':$1$2') // Unquote booleans and null
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .replace(/\n|\r|\t/g, ' ') // Replace newlines and tabs with spaces
          .replace(/\s+/g, ' ') // Collapse multiple spaces
          .trim();
        
        try {
          parsed = JSON.parse(sanitizedText);
        } catch (secondParseError) {
          console.log("Second parse failed, trying to extract and repair JSON from response...");
          
          // Try to extract JSON from the response using regex and repair it
          const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            let jsonString = jsonMatch[0];
            
            // Check if the JSON is truncated and try to repair it
            const openBraces = (jsonString.match(/\{/g) || []).length;
            const closeBraces = (jsonString.match(/\}/g) || []).length;
            const openBrackets = (jsonString.match(/\[/g) || []).length;
            const closeBrackets = (jsonString.match(/\]/g) || []).length;
            
            // If JSON appears truncated, try to close it properly
            if (openBraces > closeBraces || openBrackets > closeBrackets) {
              console.log("JSON appears truncated, attempting to repair...");
              
              // Find the last complete object/array and truncate there
              let lastValidIndex = jsonString.length;
              let depth = 0;
              let inString = false;
              let escaped = false;
              
              for (let i = jsonString.length - 1; i >= 0; i--) {
                const char = jsonString[i];
                
                if (escaped) {
                  escaped = false;
                  continue;
                }
                
                if (char === '\\') {
                  escaped = true;
                  continue;
                }
                
                if (char === '"' && !escaped) {
                  inString = !inString;
                  continue;
                }
                
                if (!inString) {
                  if (char === '}' || char === ']') {
                    depth++;
                  } else if (char === '{' || char === '[') {
                    depth--;
                  }
                  
                  // If we've found a balanced point, truncate here
                  if (depth === 0 && (char === '}' || char === ']')) {
                    lastValidIndex = i + 1;
                    break;
                  }
                }
              }
              
              if (lastValidIndex < jsonString.length) {
                jsonString = jsonString.substring(0, lastValidIndex);
                console.log(`Truncated JSON to ${jsonString.length} characters to find valid JSON`);
              }
              
              // Add missing closing braces/brackets if needed
              let finalDepth = 0;
              inString = false;
              escaped = false;
              
              for (let i = 0; i < jsonString.length; i++) {
                const char = jsonString[i];
                
                if (escaped) {
                  escaped = false;
                  continue;
                }
                
                if (char === '\\') {
                  escaped = true;
                  continue;
                }
                
                if (char === '"' && !escaped) {
                  inString = !inString;
                  continue;
                }
                
                if (!inString) {
                  if (char === '{' || char === '[') {
                    finalDepth++;
                  } else if (char === '}' || char === ']') {
                    finalDepth--;
                  }
                }
              }
              
              // Add missing closing braces
              while (finalDepth > 0) {
                jsonString += '}';
                finalDepth--;
              }
            }
            
            try {
              parsed = JSON.parse(jsonString);
              console.log("Successfully parsed repaired JSON");
            } catch (thirdParseError) {
              const thirdErrorMsg = thirdParseError instanceof Error ? thirdParseError.message : 'Unknown error';
              throw new Error(`All JSON parsing strategies failed. Last error: ${thirdErrorMsg}`);
            }
          } else {
            throw new Error("No valid JSON found in response");
          }
        }
      }
    } catch (parseError) {
      console.error("Failed to parse LLM response as JSON:", parseError);
      console.error("Raw response:", text.substring(0, 1000) + "...");
      
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      
      // Try to provide a fallback response with default values
      const fallbackResponse = {
        google: {
          cpm: { mean: 15, std_dev: 5 },
          ctr: { mean: 0.025, std_dev: 0.01 },
          cvr: { mean: 0.03, std_dev: 0.015 }
        },
        meta: {
          cpm: { mean: 12, std_dev: 4 },
          ctr: { mean: 0.015, std_dev: 0.008 },
          cvr: { mean: 0.025, std_dev: 0.012 }
        },
        tiktok: {
          cpm: { mean: 8, std_dev: 3 },
          ctr: { mean: 0.02, std_dev: 0.009 },
          cvr: { mean: 0.02, std_dev: 0.01 }
        },
        linkedin: {
          cpm: { mean: 16, std_dev: 6 },
          ctr: { mean: 0.008, std_dev: 0.004 },
          cvr: { mean: 0.03, std_dev: 0.015 }
        },
        citations: [
          {
            title: "Industry Benchmarks - Default Values",
            url: "https://example.com",
            text: "Default fallback values due to parsing error"
          }
        ]
      };
      
      console.log("Using fallback response due to parsing error");
      parsed = fallbackResponse;
    }

    // Ensure the parsed response has all required fields
    if (parsed && typeof parsed === 'object') {
      const defaultChannels = {
        google: {
          cpm: { mean: 15, std_dev: 5 },
          ctr: { mean: 0.025, std_dev: 0.01 },
          cvr: { mean: 0.03, std_dev: 0.015 }
        },
        meta: {
          cpm: { mean: 12, std_dev: 4 },
          ctr: { mean: 0.015, std_dev: 0.008 },
          cvr: { mean: 0.025, std_dev: 0.012 }
        },
        tiktok: {
          cpm: { mean: 8, std_dev: 3 },
          ctr: { mean: 0.02, std_dev: 0.009 },
          cvr: { mean: 0.02, std_dev: 0.01 }
        },
        linkedin: {
          cpm: { mean: 16, std_dev: 6 },
          ctr: { mean: 0.008, std_dev: 0.004 },
          cvr: { mean: 0.03, std_dev: 0.015 }
        }
      };

      // Fill in missing channels with defaults
      for (const [channel, defaultData] of Object.entries(defaultChannels)) {
        if (!parsed[channel]) {
          console.log(`Missing ${channel} data, using defaults`);
          parsed[channel] = defaultData;
        }
      }

      // Ensure citations exist
      if (!parsed.citations || !Array.isArray(parsed.citations)) {
        parsed.citations = [
          {
            title: "Industry Benchmarks - Supplemented with defaults",
            url: "https://example.com",
            text: "Some data supplemented with default values due to incomplete response"
          }
        ];
      }
    }

    const either = PriorsEitherSchema.parse(parsed);
    const priors = ChannelPriorsSchema.parse(normalizePriors(either));
    const citations = sanitizeCitations(parsed.citations);

    const candidate = { priors, citations };
    const safe = PriorsResponseSchema.safeParse(candidate);
    if (!safe.success) {
      const result = { priors, citations: [] };
      // Cache the result
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return NextResponse.json(result);
    }
    
    // Cache the successful result
    cache.set(cacheKey, { data: safe.data, timestamp: Date.now() });
    return NextResponse.json(safe.data);
  } catch (e: any) {
    console.error("Error in priors API:", e.message);
    
    // If there's an error, try to return cached data if available
    const { searchParams } = new URL(req.url);
    const cacheKey = `priors_${searchParams?.get("company") || "generic"}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log("Returning stale cached data due to error");
      return NextResponse.json(cached.data);
    }
    
    // Otherwise return a quick fallback
    const fallback = {
      priors: {
        google: {
          cpm: { mean: 15, std_dev: 5 },
          ctr: { mean: 0.025, std_dev: 0.01 },
          cvr: { mean: 0.03, std_dev: 0.015 }
        },
        meta: {
          cpm: { mean: 12, std_dev: 4 },
          ctr: { mean: 0.015, std_dev: 0.008 },
          cvr: { mean: 0.025, std_dev: 0.012 }
        },
        tiktok: {
          cpm: { mean: 8, std_dev: 3 },
          ctr: { mean: 0.02, std_dev: 0.009 },
          cvr: { mean: 0.02, std_dev: 0.01 }
        },
        linkedin: {
          cpm: { mean: 16, std_dev: 6 },
          ctr: { mean: 0.008, std_dev: 0.004 },
          cvr: { mean: 0.03, std_dev: 0.015 }
        }
      },
      citations: []
    };
    
    return NextResponse.json(fallback);
  }
}
