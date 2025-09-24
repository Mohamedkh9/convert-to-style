
import { GoogleGenAI, Modality } from "@google/genai";
import type { LineArtStyle, EditType, Resolution } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const resolutionPrompts: Record<Resolution, string> = {
    Low: "The output should be a low-resolution, simplified image with thick, bold lines. Focus on the main shapes and ignore fine details.",
    Medium: "The output should be a standard-resolution image with clear lines and a good balance of detail and simplification. This is the default quality.",
    High: "The output must be a high-resolution, finely detailed image. Capture intricate details, delicate lines, and subtle variations in the subject's contours."
};

const baseLineArtPrompt = `Please convert the user's image into a new piece of art, following the specified style and resolution.

1.  **Desired Style:** "{STYLE_PLACEHOLDER}". Please adapt the image's quality, texture, and detail to match this style.
2.  **Detail Level:** {RESOLUTION_PLACEHOLDER}
3.  **Composition:** Keep the original composition. The entire image, including the background and all subjects, should be converted to the new style.
4.  **Output Requirements:** {FORMAT_PLACEHOLDER}`;

const editPrompts: Record<EditType, string> = {
    background: `Let's change the background of this image. Could you please identify the main subject(s) and try to preserve them? Then, create a new background based on the user's request, and blend it seamlessly with the original subject(s).`,
    color: `Let's explore a new color palette for this image. Please use the user's instructions to guide the new color scheme and mood. The goal is to maintain the original composition and line work, focusing primarily on changing the colors to create a new artistic feel.`,
    design: `Let's reimagine this image in a completely new artistic style. Please use the user's creative direction to guide the transformation. Feel free to reinterpret the entire image to fit the new design.`
};

const callGeminiImageAPI = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    let response;
    try {
        response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
              parts: [
                {
                  inlineData: {
                    data: base64Image,
                    mimeType: mimeType,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
            config: {
              responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
          });
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى لاحقًا.");
    }

    if (!response.candidates || response.candidates.length === 0) {
        const blockReason = response.promptFeedback?.blockReason;
        if (blockReason) {
            console.error("Gemini API request blocked. Reason:", blockReason);
            throw new Error("تم حظر طلبك لأسباب تتعلق بالسلامة. يرجى تعديل الوصف أو الصورة والمحاولة مرة أخرى.");
        }
        throw new Error("لم يتمكن الذكاء الاصطناعي من إنشاء صورة. قد يكون هذا بسبب مرشحات السلامة أو تعقيد الطلب. جرب وصفًا مختلفًا.");
    }
    
    let imageResult: string | null = null;
    let textResult: string | null = null;

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
            const base64ImageData = part.inlineData.data;
            const imageMimeType = part.inlineData.mimeType;
            imageResult = `data:${imageMimeType};base64,${base64ImageData}`;
        } else if (part.text) {
            textResult = part.text;
        }
    }

    if (imageResult) {
        return imageResult;
    }
    
    if (textResult) {
        console.error("Gemini API responded with text:", textResult);
        throw new Error("استجاب الذكاء الاصطناعي بنص بدلاً من صورة. يرجى المحاولة مرة أخرى بوصف أكثر تحديدًا لإنشاء صورة.");
    }
    
    throw new Error("لم يتم العثور على صورة صالحة في استجابة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.");
};


export async function generateLineArt(base64Image: string, mimeType: string, style: LineArtStyle, resolution: Resolution): Promise<string> {
  try {
    const resolutionInstruction = resolutionPrompts[resolution];
    
    const monochromeStyles = new Set(['Line Art', 'Monochrome / Black & White', 'Hand-drawn / Sketch']);
    let formatInstruction = "The final output should be a full-color image with an opaque background that accurately represents the selected style.";
    if (monochromeStyles.has(style)) {
        formatInstruction = "The final output must be a single monochrome image (e.g., black and white) with a solid, opaque background. Do not add any color beyond the monochrome palette.";
    }

    const prompt = baseLineArtPrompt
        .replace('{STYLE_PLACEHOLDER}', style)
        .replace('{RESOLUTION_PLACEHOLDER}', resolutionInstruction)
        .replace('{FORMAT_PLACEHOLDER}', formatInstruction);

    return await callGeminiImageAPI(base64Image, mimeType, prompt);
  } catch (error) {
    console.error("Error generating line art:", error);
    if (error instanceof Error) {
        return Promise.reject(error);
    }
    return Promise.reject(new Error("حدث خطأ غير معروف أثناء إنشاء الصورة."));
  }
}

export async function applyCreativeEdit(base64Image: string, mimeType: string, userPrompt: string, editType: EditType): Promise<string> {
    try {
        const instruction = editPrompts[editType];
        const fullPrompt = `${instruction}\n\nUser's instruction: "${userPrompt}"`;
        return await callGeminiImageAPI(base64Image, mimeType, fullPrompt);
    } catch (error) {
        console.error("Error applying creative edit:", error);
        if (error instanceof Error) {
            return Promise.reject(error);
        }
        return Promise.reject(new Error("حدث خطأ غير معروف أثناء تطبيق التعديل الإبداعي."));
    }
}
