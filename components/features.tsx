const features = [
  {
    title: "Real-time metrics",
    desc: "Track every event as it happens with live updates and instant feedback.",
  },
  {
    title: "Dark-first UI",
    desc: "Designed from the ground up for dark mode, reducing noise and eye strain.",
  },
  {
    title: "Ultra-fast loading",
    desc: "Optimized for performance with sub-second load times at scale.",
  },
  {
    title: "Modular widgets",
    desc: "Compose your dashboard with flexible, reusable components.",
  },
  {
    title: "Secure by default",
    desc: "Enterprise-grade security baked directly into the platform.",
  },
  {
    title: "Scalable architecture",
    desc: "Built to grow with your product, from MVP to millions of users.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="relative py-24 sm:py-28 lg:py-32 px-4 sm:px-6 overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.15),transparent_60%)]" />

      <div className="max-w-7xl mx-auto">

        {/* Heading */}
        <div className="max-w-xl sm:max-w-2xl mx-auto text-center">
          <span className="text-xs sm:text-sm text-violet-400 font-medium tracking-wide">
            Platform features
          </span>

          <h2 className="mt-3 sm:mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Everything you need
            <span className="block text-violet-500">
              to build better dashboards
            </span>
          </h2>

          <p className="mt-4 sm:mt-6 text-sm sm:text-base text-zinc-400 leading-relaxed">
            Pulse provides a powerful set of tools to design, scale and
            operate modern analytics dashboards without complexity.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-14 sm:mt-16 lg:mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="relative rounded-2xl sm:rounded-3xl border border-zinc-800 bg-zinc-900/60 backdrop-blur p-6 sm:p-8"
            >
              {/* Accent */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-violet-600/5 blur-xl -z-10" />

              <h3 className="text-lg sm:text-xl font-semibold text-white">
                {feature.title}
              </h3>

              <p className="mt-2 sm:mt-3 text-sm text-zinc-400 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
