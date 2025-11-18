import { useMarketStore } from "../../store/useMarketStore";

const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "OCAPXUSDT"];

export function Sidebar() {
  const { symbol, setSymbol } = useMarketStore();

  return (
    <aside className="flex w-56 flex-col border-r border-gray-800 bg-black/60">
      <div className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">OCAPX AI Desk</div>
      <div className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Symbols</div>
      <nav className="mt-2 flex-1 space-y-1 px-2">
        {symbols.map((s) => (
          <button
            key={s}
            onClick={() => setSymbol(s)}
            className={`w-full rounded-md px-3 py-2 text-left text-sm ${
              s === symbol ? "bg-emerald-500 text-black" : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            {s}
          </button>
        ))}
      </nav>
    </aside>
  );
}
