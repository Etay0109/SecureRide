import { Link } from "react-router-dom";

export default function EmptyState({ icon, title, description, actionLabel, actionTo }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-10 text-center">
      <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-4">
        <span className="material-symbols-outlined text-on-surface-variant text-2xl">
          {icon}
        </span>
      </div>
      <p className="font-semibold text-on-surface mb-1">{title}</p>
      <p className="text-sm text-on-surface-variant mb-4">{description}</p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all"
        >
          {actionLabel}
          <span className="material-symbols-outlined text-base">
            arrow_forward
          </span>
        </Link>
      )}
    </div>
  );
}
