import { Hero } from "@/components/Hero";
import { DashboardPreview } from "@/components/sections/DashboardPreview";
import { FeaturesGrid } from "@/components/sections/FeaturesGrid";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { StatsBar } from "@/components/sections/StatsBar";
import { CTASection } from "@/components/sections/CTASection";

const Index = () => {
  const scrollToDashboard = () => {
    const dashboardSection = document.getElementById('dashboard-preview');
    dashboardSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Hero onGetStarted={scrollToDashboard} />
      <div id="dashboard-preview">
        <DashboardPreview />
      </div>
      <FeaturesGrid />
      <HowItWorks />
      <StatsBar />
      <CTASection />
    </div>
  );
};

export default Index;
