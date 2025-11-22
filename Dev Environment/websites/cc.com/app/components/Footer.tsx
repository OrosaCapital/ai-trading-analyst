const Footer = () => {
  return (
    <footer className="bg-blue-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">Cannabis Cardz</h3>
            <p className="text-blue-200">Your trusted partner for medical cannabis card applications.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-blue-200">
              <li><a href="#" className="hover:text-white transition">Medical Card Application</a></li>
              <li><a href="#" className="hover:text-white transition">Qualification Assessment</a></li>
              <li><a href="#" className="hover:text-white transition">Doctor Consultation</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-blue-200">
              <li><a href="#" className="hover:text-white transition">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-blue-200 hover:text-white transition text-2xl">📘</a>
              <a href="#" className="text-blue-200 hover:text-white transition text-2xl">🐦</a>
              <a href="#" className="text-blue-200 hover:text-white transition text-2xl">📷</a>
            </div>
          </div>
        </div>
        <div className="border-t border-blue-800 mt-8 pt-8 text-center text-blue-200">
          <p>&copy; 2024 Cannabis Cardz. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;