interface Props {
  searchValue: string;
  setSearchValue: (s: string) => void;
}

export default function FilterBar({ searchValue, setSearchValue }: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      <input
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder="Search maker or category..."
        className="px-3 py-2 border rounded w-72"
      />
    </div>
  );
}
