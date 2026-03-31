import { useState } from "react";
import { analyzeImage } from "./api";

export default function App() {
  const [image, setImage] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasChecked, setHasChecked] = useState(false)

  const handleSubmit = async () => {
    if (!image) return

    try {
      setLoading(true)
      setError(null)
      setHasChecked(true)

      const data = await analyzeImage(image)
      setResult(data)
    } catch (err) {
      console.log(err)
      setError("Something went wrong")
      setResult(null)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-[#212121] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-[#2f2f2f] rounded-2xl shadow-lg p-6 space-y-6">
        <h1 className="text-2xl text-center font-semibold">Analyser Tool</h1>

        {/* Upload */}
        <label className="block w-full bg-[#1a1a1a] border border-[#3f3f3f] rounded-lg p-3 cursor-pointer text-sm text-gray-300">
          {image ? image.name : "Upload Image"}
          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            className="hidden"
          />
        </label>

        <button
          onClick={handleSubmit}
          disabled={loading || !image}
          className={`w-full py-2 rounded-lg font-medium transition
            bg-white text-black hover:bg-gray-200
            disabled:bg-gray-600 disabled:text-gray-300
            disabled:cursor-not-allowed disabled:opacity-70
            `}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>

        {/* Spinner */}
        {loading && (
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Result */}
        {hasChecked && !loading && (
          <div>
            <h2 className="text-lg mb-2">Result:</h2>

            {error ? (
              <p className="text-red-400">{error}</p>
            ) : result ? (
              // 👇 ALL YOUR LOGIC GOES HERE
              !result.valid ? (
                <p className="text-yellow-400">{result.reason}</p>
              ) : result.cleanliness?.status === "clean" ? (
                <p className="text-green-400 font-semibold">Clean</p>
              ) : (
                <div>
                  <p className="text-red-400 font-semibold">Dirty</p>

                  <p className="text-sm text-gray-400">
                    Confidence: {result.cleanliness.confidence}%
                  </p>

                  <ul className="mt-2 space-y-2">
                    {result.cleanliness.issues.map((issue, i) => (
                      <li
                        key={i}
                        className="bg-[#1a1a1a] border border-[#3f3f3f] rounded-lg px-3 py-2"
                      >
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ) : (
              <p>No result</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
