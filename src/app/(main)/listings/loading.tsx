export default function ListingsLoading() {
  return (
    <div className="animate-pulse pb-10" aria-label="Loading listings" role="status">
      <header className="border-b border-gray-200 pb-8">
        <div className="h-3 w-36 rounded-full bg-gray-200" />
        <div className="mt-4 h-12 max-w-xl rounded-xl bg-gray-200" />
        <div className="mt-4 h-4 max-w-2xl rounded-full bg-gray-100" />
      </header>

      <div className="flex gap-2 overflow-hidden border-b border-gray-200 py-5">
        {[96, 116, 104, 128, 110].map((width) => (
          <div
            key={width}
            className="h-10 shrink-0 rounded-xl bg-gray-100"
            style={{ width }}
          />
        ))}
      </div>

      <div className="flex gap-3 py-6">
        <div className="h-12 flex-1 rounded-xl bg-gray-100" />
        <div className="h-12 w-28 rounded-xl bg-gray-100" />
        <div className="hidden h-12 w-48 rounded-xl bg-gray-100 sm:block" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="aspect-[4/3] bg-gray-100" />
            <div className="space-y-3 p-4">
              <div className="h-3 w-24 rounded-full bg-gray-100" />
              <div className="h-5 w-4/5 rounded-full bg-gray-200" />
              <div className="h-5 w-2/5 rounded-full bg-gray-200" />
              <div className="h-3 w-3/5 rounded-full bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading marketplace listings</span>
    </div>
  );
}
