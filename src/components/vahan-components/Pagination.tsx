type Props = { page: number; total: number; perPage: number; setPage: (n: number) => void };

export default function Pagination({ page, total, perPage, setPage }: Props) {
  const totalPages = Math.ceil(total / perPage);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-4 text-sm">
      <button
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
        className="px-3 py-1 border rounded disabled:opacity-30"
      >
        Prev
      </button>

      {page} / {totalPages}

      <button
        disabled={page === totalPages}
        onClick={() => setPage(page + 1)}
        className="px-3 py-1 border rounded disabled:opacity-30"
      >
        Next
      </button>
    </div>
  );
}
