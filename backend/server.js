import express from "express"
import dotenv from "dotenv"
import multer from "multer"
import cors from "cors"
import {GoogleGenAI} from "@google/genai"

dotenv.config()
const app = express()
const upload = multer()
app.use(cors())

const ai = new GoogleGenAI({apiKey : process.env.API_KEY})

app.get("/", (req, res) => {
    res.json({message : "Root url hit"})
})

app.post("/analyze-cleanliness", upload.single("image"), async(req, res) => {
    try {
        const file = req.file
        if(!file) return res.status(400).json({error : "No image uploaded"})

        const prompt = `
        You are an AI that analyzes an image for cleanliness inspection.
        STEP 1 : Identify scene type :
        - "room"
        - "washroom"
        - "other"

        STEP 2 : Check image quality :
        - Is the image too zoomed in?
        - Is it blurry?
        - Is it too dark?

        STEP 3 :
        - If scene is NOT "room" or "washroom", do NOT analyze cleanliness
        - If image is too zoomed or unclear, do NOT analyze cleanliness

        STEP 4 :
        - If valid -> evaluate cleanliness

        Return ONLY JSON:

        {
          "scene" : "room" | "washroom" | "other",
          "valid" : true | false,
          "reason" : "",
        

          "quality" : {
          "zoomed" : true | false,
          "blurry" : true | false,
          "dark" : true | false
          },

          "cleanliness" : {
          "status" : "clean" | "dirty" | "unknown",
          "confidence" : 0-100,
          "issues" : []
          }
        }
        `

        const response = await ai.models.generateContent({
            model : "gemini-2.5-flash",
            contents : [
                         prompt,
                         {
                            inlineData : {
                                mimeType : file.mimetype,
                                data : file.buffer.toString("base64")
                            }
                         }
                       ]
        })

        const text = response.text

        let parsed = {
            scene : "other",
            valid : false,
            reason : "Parsing failed",
            quality : {},
            cleanliness : {status : "unknown", confidence : 0, issues : []}
        }

        try {
            let cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim()

            const match = cleanText.match(/\{[\s\S]*\}/)
            if (match) {
                try {
                    parsed = JSON.parse(match[0])
                } catch {
                    parsed.reason = "Invalidate JSON format from AI"
                }
            } else parsed.reason = "No JSON found in AI response"

            if(!parsed.scene) parsed.reason = "Invalid AI response format"
            parsed.cleanliness = parsed.cleanliness || {
                status : "unknown",
                confidence : 0,
                issues : []
            }

            parsed.quality = parsed.quality || {}
        } catch (e) {
            console.log("Parsing failed :", e)
            console.log("RAW AI RESPONSE :\n", text)
        }

        res.json(parsed)
        console.log("RAW AI RESPONSE :\n", text)
    } catch (err) {
        console.log(err)
        res.status(500).json({
            error : "Request failed. Possible reason : Api key expired / quota exceeded"
        })
    }
})

app.listen(process.env.PORT, () => {
    console.log("Server started at PORT :", process.env.PORT)
})