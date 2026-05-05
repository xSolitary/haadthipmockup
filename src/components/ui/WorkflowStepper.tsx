interface WorkflowStepperProps {
  steps: string[];
  activeIndex?: number;
}

export function WorkflowStepper({ steps, activeIndex = 0 }: WorkflowStepperProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm shadow-slate-100">
      <div className="flex flex-wrap items-center gap-2 text-sm tracking-normal text-slate-600">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                index <= activeIndex
                  ? "bg-[#007946] text-white"
                  : "border border-slate-200 bg-white text-slate-500"
              }`}
            >
              {index + 1}
            </div>
            <div className={`max-w-[120px] ${index <= activeIndex ? "text-slate-900" : "text-slate-500"}`}>
              {step}
            </div>
            {index !== steps.length - 1 ? <div className="h-px w-6 bg-slate-200" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
