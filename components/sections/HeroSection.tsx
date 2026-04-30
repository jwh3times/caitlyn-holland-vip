export function HeroSection() {
  return (
    <section className="relative overflow-hidden hero-section transition-colors duration-300">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50 dark:opacity-20"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fadeInUp text-heading">
            Hi, I&apos;m <span className="gradient-text">Caitlyn Holland</span>
          </h1>
          <p className="text-2xl md:text-3xl text-subheading mb-6 animate-fadeInUp font-semibold">
            Software Engineering Manager at SAS
          </p>
          <p className="text-lg md:text-xl text-muted max-w-3xl mx-auto mb-10 animate-fadeInUp leading-relaxed">
            I work with the Platform Products DevOps and Integrated Quality team at SAS, providing
            customer-like deployments for testing and maintaining the division&apos;s automated GUI
            smoke tests in our CI/CD pipeline. I enjoy helping others work on challenges and
            discover their passion.
          </p>

          <div className="flex flex-wrap gap-4 justify-center animate-fadeInUp">
            <a
              href="#about"
              className="group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white px-10 py-4 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-2xl"
            >
              About Me
            </a>
            <a
              href="#contact"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white px-10 py-4 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
