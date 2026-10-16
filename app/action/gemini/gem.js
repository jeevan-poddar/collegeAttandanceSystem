"use server";

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
    console.log("Base64 Image:", base64Image);
    console.log("Prompt:", prompt);
    //   return;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in the environment variables");
    }
    const mimeType = image.type || "image/jpeg";
    const model = "gemini-3.1-flash-lite";
    // const model = "gemini-3.8-flash";
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
                    mimeType: mimeType,
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
    if (!res.ok) {
      throw new Error(
        "Failed to fetch from Gemini API: " +
          (data.error?.message || res.statusText),
      );
    }
    console.log("Response: ", data);
    // response format
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textOutput) {
      const cleanedText = textOutput
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const estimated = JSON.parse(cleanedText);

      return estimated;
    }
  } catch (error) {
    console.error("Error in gemini function:", error);
  }
}
 