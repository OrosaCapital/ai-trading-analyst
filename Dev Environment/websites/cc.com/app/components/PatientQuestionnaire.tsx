const PatientQuestionnaire = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-8 text-blue-900">Start Your Assessment</h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto">Answer a few quick questions to see if you qualify for a medical cannabis card.</p>
        <form className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
          <div className="mb-4">
            <label className="block text-left mb-2">Full Name</label>
            <input type="text" className="w-full p-3 border rounded-lg" placeholder="Enter your name" />
          </div>
          <div className="mb-4">
            <label className="block text-left mb-2">Email</label>
            <input type="email" className="w-full p-3 border rounded-lg" placeholder="Enter your email" />
          </div>
          <div className="mb-6">
            <label className="block text-left mb-2">Phone</label>
            <input type="tel" className="w-full p-3 border rounded-lg" placeholder="Enter your phone" />
          </div>
          <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition w-full">Begin Assessment</button>
        </form>
      </div>
    </section>
  );
};

export default PatientQuestionnaire;