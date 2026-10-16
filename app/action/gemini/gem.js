"use server";

// Function that return a promise that resolves to the response from the Gemini API for time tabel from image
export async function gemini(image, batches, faculty, subjects) {
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
    console.log("Batch Details:", batches);
    console.log("Faculty Details:", faculty);
    console.log("Subject Details:", subjects);
    //   return;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in the environment variables");
    }
    const mimeType = image.type || "image/jpeg";
    const model = "gemini-3.1-flash-lite";
    // const model = "gemini-3.8-flash";
    const batchReferenceData = JSON.stringify(
      (Array.isArray(batches) ? batches : []).map(
        ({ id, batch_code, ...batch }) => ({
          id,
          batch_code,
          ...batch,
        }),
      ),
    );
    const facultyReferenceData = JSON.stringify(
      (Array.isArray(faculty) ? faculty : []).map(
        ({ id, name, ...facultyMember }) => ({
          id,
          name,
          ...facultyMember,
        }),
      ),
    );
    const subjectReferenceData = JSON.stringify(
      (Array.isArray(subjects) ? subjects : []).map(
        ({ id, subject_code, subject_name, ...subject }) => ({
          id,
          subject_code,
          subject_name,
          ...subject,
        }),
      ),
    );

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
                  text: `
                  You are an expert data extraction assistant. Your task is to extract a class timetable from the provided image and format the output strictly as valid JSON according to the schema specified below.

### Input Data
- **Batch Details (JSON):** ${batchReferenceData}
- **Faculty Details (JSON):** ${facultyReferenceData}
- **Subject Details (JSON):** ${subjectReferenceData}

### Extraction Rules
1. The input lists above are the complete lookup tables. Each object has a database "id" and identifying code/name fields.
2. Never use the row number, serial number, array index, batch code, subject code, subject name, faculty name, or any other value as an ID.
3. "batch_id" must be the exact database "id" from the Batch Details object whose "batch_code" matches the batch shown in the image. Do not return the batch_code itself.
4. "subject_id" must be the exact database "id" from the Subject Details object whose "subject_code" or "subject_name" matches the subject shown in the image. Do not return the subject code or array position.
5. "faculty_id" must be the exact database "id" from the Faculty Details object whose "name" matches the faculty shown in the image. Do not return the faculty name or array position.
6. If a timetable entry cannot be matched confidently to an object in the relevant lookup table, do not guess an ID; omit that entry or return null for the unmatched ID.
7. "day_of_week" : Integer representing the day of the week (e.g., 1 for Monday, 2 for Tuesday, etc.).
8. "period_number": Integer representing the schedule period/slot number.
9. "room_no": String or integer indicating the assigned classroom/lab number.
10. "batch_group": Options are:
   - "null" (for all/entire batch)
   - "G1" (for Group 1)
   - "G2" (for Group 2)

### Output Format
Return ONLY a valid JSON array of objects following this structure. Do not include any text, notes, or markdown formatting outside the JSON block.

[
  {
    "batch_id": 1,
    "subject_id": 101,
    "faculty_id": 501,
    "day_of_week": 1,
    "period_number": 1,
    "room_no": "301",
    "batch_group": null
  }
]
  `,
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
