export default function Showcase() {
  return (
    <section
      id="showcase"
      className="relative py-32 px-6 overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.18),transparent_65%)]" />

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">

        {/* TEXT */}
        <div>
          <span className="text-sm text-violet-400 font-medium tracking-wide">
            Dashboard Preview
          </span>

          <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
            Designed to scale
            <span className="block text-violet-500">
              with your product
            </span>
          </h2>

          <p className="mt-6 text-zinc-400 max-w-xl leading-relaxed">
            Pulse provides a clean, modular dashboard layout with
            real-time components, smooth transitions and a design
            system that adapts as your product grows.
          </p>

          <ul className="mt-8 space-y-4 text-sm text-zinc-300">
            <li>• Modular widgets</li>
            <li>• Real-time analytics</li>
            <li>• Dark-first design system</li>
            <li>• Built with performance in mind</li>
          </ul>
        </div>

        {/* VISUAL */}
        <div className="relative">
          <div className="absolute -inset-6 bg-violet-600/20 blur-2xl rounded-3xl" />

          <div className="relative rounded-3xl border border-zinc-800 bg-zinc-900/70 backdrop-blur p-6 shadow-2xl">

            {/* Fake top bar */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-zinc-700" />
              <span className="w-3 h-3 rounded-full bg-zinc-700" />
              <span className="w-3 h-3 rounded-full bg-zinc-700" />
            </div>

            {/* Fake dashboard grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 rounded-xl bg-zinc-800/80" />
              <div className="h-24 rounded-xl bg-zinc-800/60" />
              <div className="h-24 rounded-xl bg-zinc-800/40" />

              <div className="col-span-2 h-32 rounded-xl bg-zinc-800/60" />
              <div className="h-32 rounded-xl bg-zinc-800/80" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
