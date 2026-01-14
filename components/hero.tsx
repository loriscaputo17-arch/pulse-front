export default function Hero() {
  return (
    <section className="relative pt-40 pb-32 px-6 text-center">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.25),transparent_60%)]" />

      <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
        Analytics that
        <span className="block text-violet-500">move in real-time</span>
      </h1>

      <p className="mt-6 max-w-xl mx-auto text-zinc-400">
        A dashboard experience built for founders, designers and engineers.
      </p>

      <div className="mt-10 flex justify-center gap-4">
        <button className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition">
          Get Started
        </button>
        <button className="px-6 py-3 rounded-xl border border-zinc-700 hover:border-zinc-500 transition">
          Live Demo
        </button>
      </div>
    </section>
  );
}
