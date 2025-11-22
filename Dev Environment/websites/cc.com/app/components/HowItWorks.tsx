const HowItWorks = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16 text-blue-900">3-Step Process</h2>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center mb-12">
            <div className="flex-1 text-center md:text-left">
              <div className="text-6xl font-bold text-green-500 mb-4">1</div>
              <h3 className="text-2xl font-bold mb-4">Online Assessment</h3>
              <p className="text-gray-700">Answer a few questions about your medical condition in under a minute.</p>
            </div>
            <div className="hidden md:block w-px h-20 bg-gray-300 mx-8"></div>
            <div className="flex-1 text-center md:text-left">
              <div className="text-6xl font-bold text-green-500 mb-4">2</div>
              <h3 className="text-2xl font-bold mb-4">Physician Consultation</h3>
              <p className="text-gray-700">Schedule an appointment with our licensed doctors for evaluation.</p>
            </div>
            <div className="hidden md:block w-px h-20 bg-gray-300 mx-8"></div>
            <div className="flex-1 text-center md:text-left">
              <div className="text-6xl font-bold text-green-500 mb-4">3</div>
              <h3 className="text-2xl font-bold mb-4">Get Your Card</h3>
              <p className="text-gray-700">Receive your medical cannabis card and start your treatment.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;