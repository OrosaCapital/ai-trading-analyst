const Pricing = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-8 text-blue-900">Simple Pricing</h2>
        <div className="max-w-md mx-auto bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold mb-4">Medical Cannabis Card</h3>
          <div className="text-5xl font-extrabold text-green-600 mb-4">$129</div>
          <div className="text-lg text-gray-600 mb-6">Per Year</div>
          <ul className="text-left mb-6">
            <li className="mb-2">✓ Online Assessment</li>
            <li className="mb-2">✓ Physician Consultation</li>
            <li className="mb-2">✓ Card Processing</li>
            <li className="mb-2">✓ Ongoing Support</li>
          </ul>
          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition">Get Started</button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;