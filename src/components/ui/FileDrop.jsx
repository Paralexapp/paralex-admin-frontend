import { useRef, useState } from "react";
import { PiImage, PiX } from "react-icons/pi";

/** FileDrop - drag-and-drop or click-to-pick image field with a preview */
export default function FileDrop({ file, onChange, accept = "image/png,image/jpeg", hint = "PNG or JPG" }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const preview = file ? URL.createObjectURL(file) : null;

  const pick = (files) => files?.[0] && onChange(files[0]);

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl p-3 ring-1 ring-inset ring-stone-200">
        <img src={preview} alt="Selected upload preview" className="size-14 rounded-lg object-cover" onLoad={() => URL.revokeObjectURL(preview)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-800">{file.name}</p>
          <p className="text-xs text-stone-500">{Math.max(1, Math.round(file.size / 1024))} KB</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove image"
          className="inline-flex size-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
        >
          <PiX className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        pick(event.dataTransfer.files);
      }}
      className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition ${
        dragging ? "border-brand-500 bg-brand-50" : "border-stone-300 hover:border-brand-400 hover:bg-stone-50"
      }`}
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <PiImage className="size-5" />
      </span>
      <span className="text-sm font-medium text-stone-700">
        Drop an image or <span className="text-brand-700">browse</span>
      </span>
      <span className="text-xs text-stone-500">{hint}</span>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(event) => pick(event.target.files)} />
    </button>
  );
}
