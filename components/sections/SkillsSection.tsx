const skills = [
  "Test Automation",
  "Python",
  "Java",
  "SAS Programming",
  "CI/CD Pipelines",
  "Data Analysis",
  "Information Security",
  "Analytics",
  "Regression Testing",
  "System Testing",
  "Mathematics",
  "Computer Science",
  "Systems Thinking",
  "Public Speaking",
];

export function SkillsSection() {
  return (
    <section id="skills" className="section-surface-contrast py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-heading">Skills</h2>
        <ul className="flex flex-wrap justify-center gap-3">
          {skills.map((skill) => (
            <li key={skill} className="card-bg-blue text-badge-blue text-sm px-3 py-1 rounded-full">
              {skill}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
