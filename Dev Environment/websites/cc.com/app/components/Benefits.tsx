const Benefits = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16 text-blue-900">Why Choose Cannabis Cardz?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-2">
            <div className="text-6xl mb-6">⚡</div>
            <h3 className="text-2xl font-bold mb-4 text-blue-900">Fast & Easy</h3>
            <p className="text-gray-700">Complete your assessment in under a minute and get approved quickly.</p>
          </div>
          <div className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-2">
            <div className="text-6xl mb-6">🛡️</div>
            <h3 className="text-2xl font-bold mb-4 text-blue-900">Trusted & Secure</h3>
            <p className="text-gray-700">Your information is protected with HIPAA-compliant security.</p>
          </div>
          <div className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-2">
            <div className="text-6xl mb-6">👨‍⚕️</div>
            <h3 className="text-2xl font-bold mb-4 text-blue-900">Expert Doctors</h3>
            <p className="text-gray-700">Licensed physicians specializing in medical cannabis evaluations.</p>
          </div>
          <div className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-2">
            <div className="text-6xl mb-6">💚</div>
            <h3 className="text-2xl font-bold mb-4 text-blue-900">Compassionate Care</h3>
            <p className="text-gray-700">We prioritize your health and well-being with personalized support.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;