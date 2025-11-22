import React from 'react';

const ThemeLayout = () => {
  return (
    <div className="bg-gray-100 text-gray-800 font-sans">
      {/* Header Section */}
      <header className="bg-blue-900 text-white py-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Cannabis Cardz</h1>
          <nav>
            <ul className="flex space-x-4">
              <li><a href="#" className="hover:underline">Home</a></li>
              <li><a href="#" className="hover:underline">About</a></li>
              <li><a href="#" className="hover:underline">Services</a></li>
              <li><a href="#" className="hover:underline">Contact</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-cover bg-center h-96 text-white flex items-center justify-center" style={{ backgroundImage: 'url(\'/path-to-hero-image.jpg\')' }}>
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">Just .59 cents a day!</h2>
          <p className="text-lg mb-6">Helping you every step of the way to get your medical cannabis card.</p>
          <a href="#" className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600">Get Started</a>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6">Easy 3-Step Application Process</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white shadow rounded">
              <h4 className="text-xl font-bold mb-2">Step 1: Online Assessment</h4>
              <p>Take our quick, 60-second assessment and answer a few questions about your medical condition.</p>
            </div>
            <div className="p-6 bg-white shadow rounded">
              <h4 className="text-xl font-bold mb-2">Step 2: Office Visit</h4>
              <p>Meet with our certified professionals to review your records and determine eligibility.</p>
            </div>
            <div className="p-6 bg-white shadow rounded">
              <h4 className="text-xl font-bold mb-2">Step 3: Submit Your Application</h4>
              <p>We help you submit all necessary paperwork for your medical cannabis card.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gray-200 py-12">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6">What Our Clients Say</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 bg-white shadow rounded">
              <p>"Great service and very helpful staff!"</p>
              <span className="block mt-4 text-sm text-gray-600">- John Doe</span>
            </div>
            <div className="p-6 bg-white shadow rounded">
              <p>"The process was smooth and easy. Highly recommend!"</p>
              <span className="block mt-4 text-sm text-gray-600">- Jane Smith</span>
            </div>
            <div className="p-6 bg-white shadow rounded">
              <p>"Professional and compassionate care."</p>
              <span className="block mt-4 text-sm text-gray-600">- Alex Johnson</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-blue-900 text-white py-6">
        <div className="container mx-auto text-center">
          <p>&copy; 2025 Cannabis Cardz. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ThemeLayout;