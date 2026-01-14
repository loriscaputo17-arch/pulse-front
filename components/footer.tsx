import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-12">

        {/* TOP */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">

          {/* Brand */}
          <div className="md:col-span-2">
            <p className="text-2xl font-bold tracking-tight">
              Pulse<span className="text-violet-500">.</span>
            </p>

            <p className="mt-4 max-w-sm text-zinc-400 text-sm leading-relaxed">
              Pulse is a modern analytics platform designed for teams that care
              about performance, clarity and aesthetics.
            </p>

            {/* Socials */}
            <div className="mt-6 flex gap-4">
              {["Twitter", "GitHub", "LinkedIn"].map((social) => (
                <div
                  key={social}
                  className="px-3 py-2 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:border-violet-500 hover:text-white transition cursor-pointer"
                >
                  {social}
                </div>
              ))}
            </div>
          </div>

          {/* Columns */}
          <div>
            <p className="text-sm font-semibold text-white mb-4">
              Product
            </p>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="#">Features</Link></li>
              <li><Link href="#">Pricing</Link></li>
              <li><Link href="#">Integrations</Link></li>
              <li><Link href="#">Changelog</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white mb-4">
              Company
            </p>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="#">About</Link></li>
              <li><Link href="#">Careers</Link></li>
              <li><Link href="#">Blog</Link></li>
              <li><Link href="#">Press</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white mb-4">
              Legal
            </p>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="#">Privacy Policy</Link></li>
              <li><Link href="#">Terms of Service</Link></li>
              <li><Link href="#">Cookies</Link></li>
            </ul>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="my-12 h-px bg-zinc-800" />

        {/* BOTTOM */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <p>
            © {new Date().getFullYear()} Pulse. All rights reserved.
          </p>

          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition">
              Status
            </Link>
            <Link href="#" className="hover:text-white transition">
              Security
            </Link>
            <Link href="#" className="hover:text-white transition">
              Support
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
