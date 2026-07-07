import { useRef } from "react";
import { MAX_PHOTOS } from "../../utils/constants";
import { readImageAsDataUrl } from "../../utils/readImageFile";

export default function PhotoUploader({ photos, setPhotos }) {
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    Array.from(files).forEach(async (file) => {
      try {
        const dataUrl = await readImageAsDataUrl(file);
        setPhotos((prev) => (prev.length >= MAX_PHOTOS ? prev : [...prev, dataUrl]));
      } catch {
        // Skip files that fail validation (wrong type or too large).
      }
    });
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="mb-8">
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {photos.map((src, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden border border-outline-variant/30 group">
              <img src={src} alt={`Photo ${i + 1}`} className="w-full h-28 object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <span className="material-symbols-outlined text-red-500 text-xl">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all py-8 px-4"
      >
        <span className="material-symbols-outlined text-primary/60 text-4xl mb-2">add_photo_alternate</span>
        <p className="text-sm font-medium text-on-surface-variant">Click or drag photos here</p>
        <p className="text-xs text-on-surface-variant/70 mt-1">PNG, JPG up to 10MB each</p>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>
    </div>
  );
}
