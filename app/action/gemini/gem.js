"use server";

const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];
const MAX_ATTEMPTS_PER_MODEL = 2;
const DEFAULT_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 30_000;

const getRetryDelay = (response, attempt) => {
  const retryAfter = response.headers.get("retry-after");
  const retryAfterSeconds = Number(retryAfter);

  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return Math.min(retryAfterSeconds * 1_000, MAX_RETRY_DELAY_MS);
  }

  return Math.min(
    DEFAULT_RETRY_DELAY_MS * 2 ** attempt,
    MAX_RETRY_DELAY_MS,
  );
};

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function gemini(image, prompt) {
  try {
    if (image === null) {
      console.log("No image provided");
      return;
    }
    //   convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    // console.log("Prompt:", prompt);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in the environment variables");
    }
    const mimeType = image.type || "image/jpeg";
    let lastError;

    for (const model of MODELS) {
      for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_MODEL; attempt += 1) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType,
                        data: base64Image,
                      },
                    },
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
            }),
          },
        );
        const data = await res.json();

        if (res.ok) {
          const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!textOutput) {
            throw new Error("Gemini API returned no text content");
          }

          const cleanedText = textOutput
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

          return JSON.parse(cleanedText);
        }

        lastError = new Error(
          `Gemini API request failed for ${model}: ${
            data.error?.message || res.statusText
          }`,
        );

        if (res.status !== 429) {
          throw lastError;
        }

        if (attempt < MAX_ATTEMPTS_PER_MODEL - 1) {
          await sleep(getRetryDelay(res, attempt));
        }
      }

      console.warn(`Gemini model ${model} is rate limited; trying the next model`);
    }

    throw lastError || new Error("All Gemini models are unavailable");
  } catch (error) {
    console.error("Error in gemini function:", error);
    throw error;
  }
}
