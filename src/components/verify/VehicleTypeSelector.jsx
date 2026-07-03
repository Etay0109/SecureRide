import SectionHeading from "../ui/SectionHeading";

const VEHICLE_TYPES = [
  { id: "Electric Scooter", label: "Electric Scooter", icon: "electric_scooter" },
  { id: "Bicycle", label: "Bicycle", icon: "pedal_bike" },
  { id: "Electric Bicycle", label: "Electric Bicycle", icon: "electric_moped" },
];

export default function VehicleTypeSelector({ selectedType, onSelect }) {
  return (
    <>
      <SectionHeading icon="bolt" number={1} title="Vehicle Type Selection" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {VEHICLE_TYPES.map((type) => {
          const active = selectedType === type.id;
          return (
            <button
              key={type.id} type="button" onClick={() => onSelect(type.id)}
              className={`flex flex-col items-start gap-3 p-5 rounded-xl border-2 transition-all text-left ${active ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-surface-container-lowest border-outline-variant/20 hover:border-primary/30 hover:shadow-md"}`}
            >
              <span className={`material-symbols-outlined text-3xl ${active ? "text-white" : "text-primary"}`}>{type.icon}</span>
              <div className="font-bold text-sm">{type.label}</div>
            </button>
          );
        })}
      </div>
    </>
  );
}
