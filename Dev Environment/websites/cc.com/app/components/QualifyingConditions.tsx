const QualifyingConditions = () => {
  return (
    <section className="py-16 bg-green-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 text-blue-900">Florida's Qualifying Conditions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-white rounded-lg shadow">Anxiety & Depression</div>
            <div className="p-4 bg-white rounded-lg shadow">PTSD</div>
            <div className="p-4 bg-white rounded-lg shadow">Arthritis</div>
            <div className="p-4 bg-white rounded-lg shadow">Crohn's Disease</div>
            <div className="p-4 bg-white rounded-lg shadow">Glaucoma</div>
            <div className="p-4 bg-white rounded-lg shadow">Cancer</div>
          </div>
          <p className="text-lg">…and many more.</p>
          <a href="#" className="text-blue-600 underline mt-4 inline-block">See all qualifying conditions</a>
        </div>
      </div>
    </section>
  );
};

export default QualifyingConditions;