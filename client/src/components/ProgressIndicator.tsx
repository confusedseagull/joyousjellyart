import { Check } from "lucide-react";

interface ProgressStep {
  id: number;
  label: string;
  completed: boolean;
  current: boolean;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ steps, currentStep, totalSteps }: ProgressIndicatorProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full mb-8 sticky top-0 z-50 py-4">
      {/* Progress bar */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1" />
        <div className="relative" style={{ width: "calc(100% - 5rem)" }}>
          <div className="overflow-hidden h-1 text-xs flex rounded-full bg-muted">
          <div
            style={{ width: `${progressPercentage}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500 ease-out"
          />
        </div>
        </div>
        <div className="flex-1" />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between items-start">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <div className="relative flex items-center justify-center">
              {/* Circle indicator */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  step.completed
                    ? "bg-primary border-primary text-primary-foreground"
                    : step.current
                    ? "bg-background border-primary text-primary"
                    : "bg-background border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {step.completed ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute left-full w-full h-0.5 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                    step.completed ? "bg-primary" : "bg-muted-foreground/20"
                  }`}
                  style={{ width: "calc(100% - 2.5rem)" }}
                />
              )}
            </div>

            {/* Step label */}
            <div className="mt-3 text-center">
              <p
                className={`text-xs font-medium transition-colors duration-300 ${
                  step.current
                    ? "text-primary"
                    : step.completed
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
