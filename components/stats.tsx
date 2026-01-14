export default function Stats() {
  return (
    <section
      id="stats"
      className="relative py-28 sm:py-32 px-4 sm:px-6 bg-black overflow-hidden"
    >
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.08),transparent_70%)]" />

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="max-w-3xl mb-20">
          <span className="text-xs sm:text-sm text-violet-400 font-medium tracking-wide">
            Platform reliability
          </span>

          <h2 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Numbers that
            <span className="block text-violet-500">
              speak for themselves
            </span>
          </h2>

          <p className="mt-6 text-zinc-400 max-w-xl">
            Infrastructure and performance metrics trusted by modern teams
            running at scale.
          </p>
        </div>

        {/* Stats list */}
        <div className="space-y-14">

          {[
            {
              value: "99.99%",
              label: "Uptime SLA",
              desc: "Backed by multi-region infrastructure.",
            },
            {
              value: "<200ms",
              label: "Global latency",
              desc: "Consistent response times worldwide.",
            },
            {
              value: "24/7",
              label: "Live monitoring",
              desc: "Continuous tracking with no downtime.",
            },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12 border-t border-zinc-800 pt-10"
            >
              {/* Number */}
              <div className="w-full md:w-1/3">
                <p className="text-5xl sm:text-6xl lg:text-7xl font-bold text-violet-500">
                  {stat.value}
                </p>
              </div>

              {/* Text */}
              <div className="w-full md:w-2/3">
                <p className="text-lg sm:text-xl font-medium text-white">
                  {stat.label}
                </p>
                <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-lg">
                  {stat.desc}
                </p>
              </div>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}
