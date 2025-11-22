import Header from './Header';
import Hero from './Hero';
import HowItWorks from './HowItWorks';
import QualifyingConditions from './QualifyingConditions';
import Benefits from './Benefits';
import Pricing from './Pricing';
import PatientQuestionnaire from './PatientQuestionnaire';
import FAQ from './FAQ';
import Footer from './Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <HowItWorks />
      <QualifyingConditions />
      <Benefits />
      <Pricing />
      <PatientQuestionnaire />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Index;