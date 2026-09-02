const experience = [
  {
    title: "Software Engineering Manager",
    period: "Nov 2024 – Present",
    description:
      "Led the Platform Products Enablement team, focused on solving pain points and improving the software delivery lifecycle for developers through tooling, automation, and process enhancements.",
  },
  {
    title: "Manager, Software Development Engineer in Test",
    period: "Apr 2021 – Nov 2024",
    description:
      "Managed the deployment and GUI automation teams within the Platform Products area.",
  },
  {
    title: "Software Development Engineer in Test",
    period: "Jan 2019 – Apr 2021",
    description:
      "Automated product tests to allow functional testers more time to focus on detailed testing.",
  },
  {
    title: "Test Engineer",
    period: "May 2014 – Jan 2019",
    description:
      "Worked with development and product management to ensure the functionality and usability of the product.",
  },
];

export function ExperienceSection() {
  return (
    <section id="experience" className="section-surface py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-heading">
          Experience &mdash; SAS <span className="text-muted font-normal text-xl">(13 years)</span>
        </h2>
        <div className="space-y-6">
          {experience.map((role) => (
            <article key={role.title} className="border-l-2 border-accent pl-4">
              <h3 className="font-semibold text-heading leading-snug">{role.title}</h3>
              <p className="text-sm text-label mb-1">{role.period}</p>
              <p className="text-sm text-muted leading-relaxed">{role.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
