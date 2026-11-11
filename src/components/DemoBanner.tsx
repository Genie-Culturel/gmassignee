type DemoBannerProps = {
  onQuit: () => void;
};

/** Sticky amber/orange bar shown on every app page while demo mode is on. */
export function DemoBanner({ onQuit }: DemoBannerProps) {
  return (
    <div
      role="status"
      className="bg-orange-500 text-orange-950 border-b-2 border-orange-700"
    >
      <div className="container flex flex-col items-center justify-center gap-2 px-4 py-2.5 sm:flex-row sm:justify-between">
        <p className="text-center text-sm font-bold sm:text-left">
          MODE DÉMO – données fictives, rien n'est enregistré
        </p>
        <button
          type="button"
          onClick={onQuit}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border-2 border-orange-950 bg-orange-950 px-3 text-sm font-semibold text-orange-50 hover:bg-orange-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-950 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-500"
        >
          Quitter le mode démo
        </button>
      </div>
    </div>
  );
}
