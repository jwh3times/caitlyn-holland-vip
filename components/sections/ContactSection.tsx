export function ContactSection() {
  return (
    <section id="contact" className="section-surface-contrast py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-heading">Get In Touch</h2>
        <p className="text-lg text-muted mb-8">
          Feel free to reach out — I&apos;d love to hear from you.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="mailto:caitlyn.holland121@gmail.com"
            className="inline-block bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Send Me an Email
          </a>
          <a
            href="https://www.linkedin.com/in/caitlyn-holland-debona-93140678/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </section>
  );
}
