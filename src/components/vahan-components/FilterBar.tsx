import { Input } from "@/components/ui/input";

interface Props {
  searchValue: string;
  setSearchValue: (s: string) => void;
}

export default function FilterBar({ searchValue, setSearchValue }: Props) {
  return (
    <Input
      value={searchValue}
      onChange={(e) => setSearchValue(e.target.value)}
      placeholder="Search maker or category..."
      className="md:w-96"
    />
  );
}