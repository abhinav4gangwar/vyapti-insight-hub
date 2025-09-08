"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, Loader2 } from "lucide-react"

interface LoadingStep {
  name: string
  displayName: string
  baseDuration: number // base duration in milliseconds
}

const PROCESSING_STEPS: LoadingStep[] = [
  { name: "SearchQueryExpander", displayName: "Expanding search query", baseDuration: 2000 },
  { name: "EmbeddingComponent", displayName: "Generating embeddings", baseDuration: 2500 },
  { name: "BM25Retriever", displayName: "Searching with BM25", baseDuration: 2500 },
  { name: "SemanticRetriever", displayName: "Semantic search", baseDuration: 2200 },
  { name: "ResultMerger", displayName: "Merging results", baseDuration: 2800 },
  { name: "ContextBuilder", displayName: "Building context", baseDuration: 1000 },
  { name: "AnswerLLM", displayName: "Generating answer", baseDuration: 2000 },
]

// Function to randomize duration by ±20%
const randomizeDuration = (baseDuration: number) => {
  const variation = 0.2 // ±20%
  const randomFactor = 1 + (Math.random() - 0.5) * 2 * variation
  return Math.round(baseDuration * randomFactor)
}

interface LoadingStepsProps {
  isVisible: boolean;
  onStepChange?: (step: number) => void;
}

export function LoadingSteps({ isVisible, onStepChange }: LoadingStepsProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [randomizedSteps, setRandomizedSteps] = useState<(LoadingStep & { duration: number })[]>([])
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!isVisible) {
      setCurrentStepIndex(0)
      setIsRunning(false)
      onStepChange?.(0)
      return
    }

    if (isRunning) return // Prevent multiple runs

    // Randomize durations for this run
    const stepsWithRandomDurations = PROCESSING_STEPS.map(step => ({
      ...step,
      duration: randomizeDuration(step.baseDuration)
    }))
    setRandomizedSteps(stepsWithRandomDurations)
    setCurrentStepIndex(0)
    setIsRunning(true)

    console.log('Starting loading steps with durations:', stepsWithRandomDurations.map(s => `${s.displayName}: ${s.duration}ms`))

    const runSteps = () => {
      const runNextStep = (stepIndex: number) => {
        if (stepIndex >= stepsWithRandomDurations.length) {
          console.log('All steps completed')
          setIsRunning(false)
          return
        }

        console.log(`Moving to step ${stepIndex}: ${stepsWithRandomDurations[stepIndex].displayName}`)
        setCurrentStepIndex(stepIndex)
        onStepChange?.(stepIndex) // Notify parent of step change
        const step = stepsWithRandomDurations[stepIndex]

        // Move to next step after the randomized duration
        setTimeout(() => runNextStep(stepIndex + 1), step.duration)
      }

      runNextStep(0)
    }

    runSteps()
  }, [isVisible]) // Remove onStepChange from dependencies to prevent re-runs

  return (
    <Card className={`border-gray-200 bg-gray-50 ${!isVisible ? 'hidden' : ''}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
          Processing Your Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {randomizedSteps.map((step, index) => {
            const isCompleted = index < currentStepIndex
            const isCurrent = index === currentStepIndex

            return (
              <div key={step.name} className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${
                    isCompleted ? 'text-green-700' :
                    isCurrent ? 'text-gray-900' :
                    'text-gray-500'
                  }`}>
                    {step.displayName}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
