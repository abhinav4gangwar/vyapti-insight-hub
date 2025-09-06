import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface LoadingStep {
  name: string;
  displayName: string;
  baseDuration: number;
}

interface LoadingStepsProps {
  isVisible: boolean;
  onStepChange?: (step: number) => void;
}

const PROCESSING_STEPS: LoadingStep[] = [
  { name: "SearchQueryExpander", displayName: "Expanding search query", baseDuration: 2000 },
  { name: "EmbeddingComponent", displayName: "Generating embeddings", baseDuration: 2500 },
  { name: "BM25Retriever", displayName: "Searching with BM25", baseDuration: 2500 },
  { name: "SemanticRetriever", displayName: "Semantic search", baseDuration: 2200 },
  { name: "ResultMerger", displayName: "Merging results", baseDuration: 2800 },
  { name: "ContextBuilder", displayName: "Building context", baseDuration: 1000 },
  { name: "AnswerLLM", displayName: "Generating answer", baseDuration: 2000 },
];

export function LoadingSteps({ isVisible, onStepChange }: LoadingStepsProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const next = Math.min(prev + 1, PROCESSING_STEPS.length - 1);
        if (onStepChange) {
          onStepChange(next + 1); // 1-based indexing for external use
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, onStepChange, PROCESSING_STEPS.length]);

  if (!isVisible) return null;

  return (
    <Card className="p-6 border-blue-200 bg-blue-50">
      <div className="flex items-center gap-3 mb-4">
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        <h3 className="font-medium text-blue-900">Searching...</h3>
      </div>
      <div className="space-y-2">
        {PROCESSING_STEPS.map((step, index) => (
          <div key={index} className={`flex items-center gap-2 text-sm ${
            index <= currentStep ? 'text-blue-700' : 'text-blue-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              index <= currentStep
                ? 'bg-blue-500 animate-pulse'
                : 'bg-blue-300'
            }`} />
            {step.displayName}
          </div>
        ))}
      </div>
    </Card>
  );
}
