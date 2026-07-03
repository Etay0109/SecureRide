export default function SectionHeading({ icon, title, number }) {
  return (
    <div className={`flex items-center gap-3 ${number !== undefined ? "mb-5" : "mb-4"}`}>
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-lg">
          {icon}
        </span>
      </div>
      <h2 className="text-lg font-bold">
        {number !== undefined ? `${number}. ${title}` : title}
      </h2>
    </div>
  );
}
