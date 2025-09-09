import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { supabase } from "../../lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Loader2, AlertCircle, Download, FileDown } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

interface Question {
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

interface QuizData {
  topic: string
  questions: Question[]
}

export default function QuizGenerator() {
  const { user } = useAuth()
  const [topic, setTopic] = useState("")
  const [numQuestions, setNumQuestions] = useState(5)
  const [difficulty, setDifficulty] = useState("medium")
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizData | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [additionalInstructions, setAdditionalInstructions] = useState("")
  const [includeHeader, setIncludeHeader] = useState(true)
  const [includeFooter, setIncludeFooter] = useState(true)

  // Check API key on component mount
  useEffect(() => {
    checkApiKey()
  }, [])

  const checkApiKey = async () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY

    if (!apiKey) {
      setApiError("OpenAI API key not found. Please check your environment variables.")
      return false
    }

    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        setApiError(error.error?.message || "Failed to validate API key")
        return false
      }

      setApiError(null)
      return true
    } catch (error) {
      setApiError("Failed to connect to OpenAI API. Please check your internet connection.")
      return false
    }
  }

  const generateQuizMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated")

      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      if (!apiKey) {
        throw new Error("OpenAI API key not found")
      }

      const isValid = await checkApiKey()
      if (!isValid) {
        throw new Error("Invalid API key or API key not properly set up")
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an experienced teacher creating educational quiz questions.",
            },
            {
              role: "user",
              content: `Generate ${numQuestions} multiple-choice questions about "${topic}" at ${difficulty} difficulty level. 
              ${additionalInstructions ? `Additional instructions: ${additionalInstructions}` : ""}
              Format the response as a JSON array with each question object having: question, options (array of 4 choices), correctAnswer (matching one of the options exactly), and explanation. 
              Make sure the questions are challenging, educational, and appropriate for classroom use.`,
            },
          ],
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("OpenAI API Error:", errorData)

        if (errorData.error?.code === "insufficient_quota") {
          throw new Error(
            "Your OpenAI API key needs to be set up with valid billing information. Please visit https://platform.openai.com/account/billing to add a payment method.",
          )
        }

        throw new Error(errorData.error?.message || "Failed to generate quiz")
      }

      const data = await response.json()
      let quizContent
      try {
        const cleanContent = data.choices[0].message.content
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim()
        quizContent = JSON.parse(cleanContent)

        if (!Array.isArray(quizContent)) {
          throw new Error("Invalid quiz format: expected an array of questions")
        }

        quizContent.forEach((question, index) => {
          if (
            !question.question ||
            !Array.isArray(question.options) ||
            !question.correctAnswer ||
            !question.explanation
          ) {
            throw new Error(`Invalid question format at index ${index}`)
          }
        })
      } catch (error) {
        console.error("Failed to parse quiz content:", data.choices[0].message.content)
        throw new Error("Failed to generate valid quiz questions. Please try again.")
      }

      const { error } = await supabase.from("quizzes").insert([
        {
          user_id: user.id,
          topic,
          questions: quizContent,
        },
      ])

      if (error) throw error

      return {
        topic,
        questions: quizContent,
      }
    },
    onSuccess: (data) => {
      setGeneratedQuiz(data)
      toast.success("Quiz generated successfully!")
    },
    onError: (error: Error) => {
      console.error("Quiz generation error:", error)
      setApiError(error.message)
      toast.error(
        error.message.includes("Invalid")
          ? "Failed to generate quiz. Please try again with a different topic or wording."
          : error.message,
      )
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) {
      toast.error("Please enter a topic")
      return
    }
    generateQuizMutation.mutate()
  }

  const generateQuizDocument = (includeAnswers = true) => {
    if (!generatedQuiz) return ""

    const lines: string[] = []

    if (includeHeader) {
      lines.push("═".repeat(50))
      lines.push(`${" ".repeat(20)}QUIZ`)
      lines.push("═".repeat(50))
      lines.push(`Topic: ${generatedQuiz.topic}`)
      lines.push(`Difficulty Level: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`)
      lines.push(`Total Questions: ${generatedQuiz.questions.length}`)
      lines.push("═".repeat(50))
      lines.push("")
    }

    generatedQuiz.questions.forEach((q, idx) => {
      lines.push(`Question ${idx + 1}:`)
      lines.push(q.question)
      lines.push("")
      q.options.forEach((opt, optIdx) => {
        const optionLabel = String.fromCharCode(65 + optIdx) // Convert 0,1,2,3 to A,B,C,D
        lines.push(`  ${optionLabel}. ${opt}`)
      })

      if (includeAnswers) {
        lines.push("")
        lines.push("─".repeat(40))
        lines.push(`Correct Answer: ${q.correctAnswer}`)
        lines.push("")
        lines.push("Explanation:")
        lines.push(q.explanation)
        lines.push("─".repeat(40))
      }

      lines.push("\n")
    })

    if (includeFooter) {
      lines.push("═".repeat(50))
      if (!includeAnswers) {
        lines.push("Good luck!")
      } else {
        lines.push("End of Answer Key")
      }
      lines.push("═".repeat(50))
    }

    return lines.join("\n")
  }

  const downloadQuiz = (type: "questions" | "answers") => {
    if (!generatedQuiz) return

    const content = generateQuizDocument(type === "answers")
    const filename = `${generatedQuiz.topic.replace(/\s+/g, "_")}_${type}.txt`

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (apiError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {apiError}
          {apiError.includes("billing") && (
            <div className="mt-2">
              <p>Common solutions:</p>
              <ol className="list-decimal ml-4 mt-2">
                <li>Visit the OpenAI dashboard and add a payment method</li>
                <li>Ensure your billing information is valid</li>
                <li>Check if you've exceeded your usage limits</li>
              </ol>
              <Button
                className="mt-4"
                onClick={() => window.open("https://platform.openai.com/account/billing", "_blank")}
              >
                Go to OpenAI Billing
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (generateQuizMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center p-8" role="status" aria-label="Generating quiz">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="mt-2 text-gray-600">Generating your quiz...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="topic">Quiz Topic</Label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., World War II, Photosynthesis, Algebra"
            required
            aria-describedby="topic-description"
          />
          <p id="topic-description" className="text-sm text-gray-500 mt-1">
            Enter the subject you want to create a quiz about
          </p>
        </div>

        <div>
          <Label htmlFor="numQuestions">Number of Questions</Label>
          <select
            id="numQuestions"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            aria-describedby="questions-description"
          >
            <option value={5}>5 Questions</option>
            <option value={10}>10 Questions</option>
            <option value={15}>15 Questions</option>
            <option value={20}>20 Questions</option>
          </select>
          <p id="questions-description" className="text-sm text-gray-500 mt-1">
            Select how many questions you want in the quiz
          </p>
        </div>

        <div>
          <Label htmlFor="difficulty">Difficulty Level</Label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            aria-describedby="difficulty-description"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <p id="difficulty-description" className="text-sm text-gray-500 mt-1">
            Choose the difficulty level of the questions
          </p>
        </div>

        <div>
          <Label htmlFor="additionalInstructions">Additional Instructions (Optional)</Label>
          <Textarea
            id="additionalInstructions"
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            placeholder="e.g., Focus on specific subtopics, include certain types of questions, or add special formatting requirements"
            className="mt-1"
            rows={3}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="includeHeader">Include Header Information</Label>
            <Switch id="includeHeader" checked={includeHeader} onCheckedChange={setIncludeHeader} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="includeFooter">Include Footer Text</Label>
            <Switch id="includeFooter" checked={includeFooter} onCheckedChange={setIncludeFooter} />
          </div>
        </div>

        <Button type="submit" className="w-full">
          Generate Quiz
        </Button>
      </form>

      {generatedQuiz && (
        <div className="mt-8">
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="questions">Student Version</TabsTrigger>
              <TabsTrigger value="answers">Answer Key</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-4">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Quiz Preview</h2>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => downloadQuiz("questions")}>
                      <FileDown className="h-4 w-4 mr-2" />
                      Download Questions
                    </Button>
                    <Button variant="outline" onClick={() => downloadQuiz("answers")}>
                      <FileDown className="h-4 w-4 mr-2" />
                      Download Answer Key
                    </Button>
                  </div>
                </div>
                <div className="max-h-[600px] overflow-y-auto rounded-lg border bg-muted/50">
                  <div className="p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                    {generateQuizDocument(true)}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="questions" className="mt-4">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Student Version</h2>
                  <Button onClick={() => downloadQuiz("questions")}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="max-h-[600px] overflow-y-auto rounded-lg border bg-muted/50">
                  <div className="p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                    {generateQuizDocument(false)}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="answers" className="mt-4">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Answer Key</h2>
                  <Button onClick={() => downloadQuiz("answers")}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="max-h-[600px] overflow-y-auto rounded-lg border bg-muted/50">
                  <div className="p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                    {generateQuizDocument(true)}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}

