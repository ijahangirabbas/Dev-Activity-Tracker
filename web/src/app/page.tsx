'use client';

import React, { useState, useEffect } from 'react';
import Header from 'web/components/landing/Header';
import HeroSection from 'web/components/landing/HeroSection';
import TrustSection from 'web/components/landing/TrustSection';
import FeatureGrid from 'web/components/landing/FeatureGrid';
import DeveloperWorkflow from 'web/components/landing/DeveloperWorkflow';
import DashboardShowcase from 'web/components/landing/DashboardShowcase';
import ComparisonTable from 'web/components/landing/ComparisonTable';
import SocialProof from 'web/components/landing/SocialProof';
import Testimonials from 'web/components/landing/Testimonials';
import FAQAccordion from 'web/components/landing/FAQAccordion';
import FinalCTA from 'web/components/landing/FinalCTA';
import Footer from 'web/components/landing/Footer';

export default function Home() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-text-body selection:bg-accent-primary/20 selection:text-accent-primary transition-colors duration-500">
      
      {/* Noise overlay and global background structure */}
      <div className="noise-overlay" />
      
      <Header theme={theme} toggleTheme={toggleTheme} />
      
      <main className="flex-1 overflow-x-hidden relative">
        {/* Dynamic developer grid background mesh */}
        <div className="absolute inset-0 mesh-grid pointer-events-none -z-10 opacity-70" />
        
        {/* Shifting background container sections to create visual rhythm */}
        
        {/* Section 1: Hero */}
        <div className="bg-bg-hero transition-colors duration-500">
          <HeroSection />
        </div>

        {/* Section 2: Trust Marquee */}
        <div className="bg-bg-trust transition-colors duration-500">
          <TrustSection />
        </div>

        {/* Section 3: Bento Features */}
        <div className="bg-bg-features transition-colors duration-500">
          <FeatureGrid />
        </div>

        {/* Section 4: Developer Workflow */}
        <div className="bg-bg-workflow transition-colors duration-500">
          <DeveloperWorkflow />
        </div>

        {/* Section 5: Showcase Dashboard */}
        <div className="bg-bg-showcase transition-colors duration-500">
          <DashboardShowcase />
        </div>

        {/* Section 6: Comparison Grid & Contributor Banner */}
        <div className="bg-bg-comparison transition-colors duration-500">
          <ComparisonTable />
        </div>

        {/* Section 7: Social Proof Metrics */}
        <div className="bg-bg-socialproof transition-colors duration-500">
          <SocialProof />
        </div>

        {/* Section 8: Testimonials */}
        <div className="bg-bg-testimonials transition-colors duration-500">
          <Testimonials />
        </div>

        {/* Section 9: FAQ Accordions */}
        <div className="bg-bg-faq transition-colors duration-500">
          <FAQAccordion />
        </div>

        {/* Section 10: Final CTA */}
        <div className="bg-bg-cta pb-8 transition-colors duration-500">
          <FinalCTA />
        </div>
      </main>

      <Footer />
    </div>
  );
}
