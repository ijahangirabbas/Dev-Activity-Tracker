'use client';

import React from 'react';

const ECOSYSTEM_LOGOS = [
  { name: 'VS Code', hoverClass: 'group-hover:text-accent-blue' },
  { name: 'Cursor Editor', hoverClass: 'group-hover:text-accent-cyan' },
  { name: 'Windsurf IDE', hoverClass: 'group-hover:text-accent-green' },
  { name: 'GitHub Sync', hoverClass: 'group-hover:text-accent-primary' },
  { name: 'Claude Analytics', hoverClass: 'group-hover:text-accent-orange' },
  { name: 'Gemini AI', hoverClass: 'group-hover:text-accent-purple' },
  { name: 'OpenAI Copilot', hoverClass: 'group-hover:text-accent-green' },
];

export default function TrustSection() {
  const marqueeLogos = [...ECOSYSTEM_LOGOS, ...ECOSYSTEM_LOGOS, ...ECOSYSTEM_LOGOS, ...ECOSYSTEM_LOGOS];

  return (
    <section className="py-10 border-y border-border-default bg-bg-trust w-full relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-[9px] font-bold uppercase tracking-[0.25em] text-text-muted mb-6">
          Seamlessly integrated with your development ecosystem
        </p>

        {/* Marquee Wrapper */}
        <div className="relative w-full overflow-hidden flex items-center py-2">
          {/* Edge fading overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-28 bg-gradient-to-r from-canvas to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-28 bg-gradient-to-l from-canvas to-transparent z-10 pointer-events-none" />
          
          <div className="flex gap-20 whitespace-nowrap animate-marquee shrink-0">
            {marqueeLogos.map((tech, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3.5 group cursor-pointer"
              >
                <div className="text-text-primary font-sans font-extrabold text-sm md:text-base tracking-tight flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent-primary group-hover:scale-125 transition-all duration-300" />
                  <span className={`transition-colors duration-300 ${tech.hoverClass}`}>
                    {tech.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
