import { CtaLink } from "@/components/ui/button";

export function ContactSection() {
  return (
    <section id="contact" className="section-surface-contrast py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-heading">Get In Touch</h2>
        <p className="text-lg text-muted mb-8">
          Feel free to reach out — I&apos;d love to hear from you.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <CtaLink href="mailto:caitlyn@holland.vip">Send Me an Email</CtaLink>
          <CtaLink
            href="https://www.linkedin.com/in/caitlyn-holland-debona-93140678/"
            tone="secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
