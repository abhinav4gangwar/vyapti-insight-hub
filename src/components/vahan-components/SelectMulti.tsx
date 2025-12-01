import { useState } from "react";

interface SelectMultiProps {
  label: string;
  options: (string | number | null | undefined)[];
  selected: string[];
  setSelected: (values: string[]) => void;
  placeholder?: string;
}

export default function SelectMulti({
  label,
  options,
  selected,
  setSelected,
  placeholder = "Search..."
}: SelectMultiProps) {
  const [search, setSearch] = useState("");
  const [showDrop, setShowDrop] = useState(false);

  const normalizedOptions = options
    .filter(o => o !== null && o !== undefined)
    .map(o => String(o));

  const filtered = normalizedOptions.filter(o =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const toggleValue = (value: string) => {
    setSelected(
      selected.includes(value)
        ? selected.filter(v => v !== value)
        : [...selected, value]
    );
  };

  return (
    <div className="relative w-full">
      <label className="font-medium text-sm">{label}</label>

      <div
        className="border px-2 py-1 rounded mt-1 bg-white cursor-text"
        onClick={() => setShowDrop(true)}
      >
        {selected.length === 0 ? (
          <span className="text-gray-400">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selected.map(val => (
              <span
                key={val}
                className="bg-black text-white px-2 py-0.5 rounded text-xs flex items-center gap-1"
              >
                {val}
                <button
                  className="text-white"
                  onClick={e => {
                    e.stopPropagation();
                    toggleValue(val);
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {showDrop && (
        <>
          <div className="absolute z-30 border bg-white w-full max-h-48 overflow-auto rounded shadow-md mt-1">
            <input
              className="w-full px-2 py-1 border-b text-sm"
              placeholder={placeholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />

            {filtered.length === 0 ? (
              <div className="p-2 text-gray-400 text-sm">No Results</div>
            ) : (
              filtered.map(item => (
                <div
                  key={item}
                  onClick={() => toggleValue(item)}
                  className={`px-2 py-1 cursor-pointer hover:bg-gray-100 text-sm ${
                    selected.includes(item) ? "bg-gray-200 font-medium" : ""
                  }`}
                >
                  {item}
                </div>
              ))
            )}
          </div>

          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDrop(false)}
          />
        </>
      )}
    </div>
  );
}
