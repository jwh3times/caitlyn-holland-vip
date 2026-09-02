import { profile } from "@/lib/profile";

export function AboutSection() {
  return (
    <section id="about" className="section-surface py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-heading">About Me</h2>
        <div className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-lg text-muted leading-relaxed">{profile.bio}</p>
        </div>
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-xl font-bold text-heading mb-4">Education</h3>
            <div className="border-l-2 border-accent pl-4">
              <p className="font-semibold text-heading">Meredith College</p>
              <p className="text-sm text-muted">
                B.S. in Mathematics &amp; B.A. in Computer Science
              </p>
              <p className="text-sm text-label">2010 – 2014</p>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-heading mb-4">Certifications</h3>
            <div className="border-l-2 border-accent pl-4">
              <p className="font-semibold text-heading">Leadership Essentials</p>
              <p className="text-sm text-muted">Cornell University</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
