import React from "react";

export function CopyrightBar() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="w-full bg-white border-t border-slate-100 py-6 px-6">
      <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs md:text-sm text-[#051A24]/60 font-medium">
        <div>
          © {currentYear} Knowledge Signal Engine · Provenance lab prototype. All rights reserved.
        </div>
        <div className="font-mono text-xs tracking-wider uppercase text-slate-400">
          Austin, USA // UTC timezone
        </div>
      </div>
    </div>
  );
}
