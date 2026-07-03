const STEPS = ["VEHICLE TYPE", "DETAILS"];

export default function StepProgress({ activeStep }) {
  return (
    <div className="flex items-center justify-between mb-14">
      {STEPS.map((step, i) => {
        const reached = i <= activeStep;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300 ${reached ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"}`}>
                {i + 1}
              </div>
              <span className={`text-[11px] font-bold tracking-wider transition-colors duration-300 ${reached ? "text-primary" : "text-on-surface-variant"}`}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-[2px] mx-3 mt-[-20px] overflow-hidden bg-surface-container-high">
                <div className={`h-full bg-primary transition-all duration-500 ${i < activeStep ? "w-full" : "w-0"}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
