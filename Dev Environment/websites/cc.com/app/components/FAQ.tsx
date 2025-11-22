const FAQ = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16 text-blue-900">Frequently Asked Questions</h2>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="border-b border-gray-200 pb-8">
            <h3 className="text-2xl font-semibold mb-4 text-blue-900">What is a medical cannabis card?</h3>
            <p className="text-gray-700 text-lg">A medical cannabis card allows patients with qualifying conditions to legally purchase and use medical cannabis products from licensed dispensaries.</p>
          </div>
          <div className="border-b border-gray-200 pb-8">
            <h3 className="text-2xl font-semibold mb-4 text-blue-900">How do I qualify for a medical cannabis card?</h3>
            <p className="text-gray-700 text-lg">You must be a resident of a state where medical cannabis is legal and have one of the qualifying conditions recognized by that state's program.</p>
          </div>
          <div className="border-b border-gray-200 pb-8">
            <h3 className="text-2xl font-semibold mb-4 text-blue-900">How long does the process take?</h3>
            <p className="text-gray-700 text-lg">Our streamlined process typically takes 1-2 weeks from application to card approval, depending on your state's processing times.</p>
          </div>
          <div className="border-b border-gray-200 pb-8">
            <h3 className="text-2xl font-semibold mb-4 text-blue-900">Is my information secure?</h3>
            <p className="text-gray-700 text-lg">Yes, we use HIPAA-compliant security measures to protect your personal and medical information throughout the entire process.</p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-4 text-blue-900">What if I don't qualify?</h3>
            <p className="text-gray-700 text-lg">If you don't qualify, we'll provide guidance on next steps and may recommend alternative treatment options or resources.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;