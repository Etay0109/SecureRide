import SectionHeading from "../ui/SectionHeading";

function FormField({ name, label, placeholder, fullWidth, required }) {
  return (
    <div className={fullWidth ? "col-span-full" : ""}>
      <label className="block text-sm font-semibold text-on-surface mb-1.5">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text" name={name} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
      />
    </div>
  );
}

export default function VehicleDetailsFields() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 mb-10">
      <SectionHeading icon="directions_bike" number={2} title="Vehicle Details" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField name="brand" label="Brand" placeholder="e.g. Specialized, Xiaomi" />
        <FormField name="model" label="Model" placeholder="e.g. Turbo Vado 4.0" />
        <FormField name="color" label="Color" placeholder="e.g. Matte Graphite" />
        <FormField name="frame_number" label="Frame number" placeholder="Enter serial or frame number" required />
      </div>
    </div>
  );
}
