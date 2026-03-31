import axios from "axios"

export const analyzeImage = async (image) => {
  const formData = new FormData()
  formData.append("image", image)

  const res = await axios.post(
    "http://localhost:8000/analyze-cleanliness",
    formData
  )

  return res.data;
}