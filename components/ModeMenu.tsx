export function ModeMenu({
  onSelectCpu,
  onSelectOnline,
}: {
  onSelectCpu: () => void;
  onSelectOnline: () => void;
}) {
  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col items-center justify-center gap-6 px-4 py-10 text-stone-50 text-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ti Vitti</h1>
        <p className="text-sm text-amber-100/70 mt-2">
          Il classico gioco di carte siciliano e calabrese.
        </p>
      </div>
      <div className="w-full flex flex-col gap-3">
        <button onClick={onSelectCpu} className="btn-primary w-full py-3 text-base">
          Gioca contro il CPU
        </button>
        <button onClick={onSelectOnline} className="btn-option w-full py-3 text-base">
          Gioca online con un amico
        </button>
      </div>
    </div>
  );
}
