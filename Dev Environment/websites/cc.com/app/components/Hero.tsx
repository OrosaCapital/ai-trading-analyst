const Hero = () => {
  return (
    <section id="home" className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 text-white relative overflow-hidden min-h-screen flex items-center">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-green-600/80"></div>
      <div className="container mx-auto text-center px-4 relative z-10">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight animate-fade-in">Medical Cannabis Made Simple</h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90 animate-slide-up">Get your Florida medical marijuana card in minutes. Trusted by 4000+ patients with compassionate care and expert guidance.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12">
          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-10 rounded-full text-lg shadow-lg transition transform hover:scale-105 animate-pulse">Start Free Assessment</button>
          <button className="bg-white/10 backdrop-blur border-2 border-white text-white font-bold py-4 px-10 rounded-full text-lg hover:bg-white/20 transition animate-bounce">Call 1-855-718-2273</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 shadow-lg animate-fade-in">
            <div className="text-4xl font-bold mb-2">60 Sec</div>
            <div className="text-lg opacity-90">Online Assessment</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 shadow-lg animate-fade-in delay-200">
            <div className="text-4xl font-bold mb-2">4000+</div>
            <div className="text-lg opacity-90">Satisfied Patients</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 shadow-lg animate-fade-in delay-400">
            <div className="text-4xl font-bold mb-2">$129</div>
            <div className="text-lg opacity-90">Annual Fee</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;