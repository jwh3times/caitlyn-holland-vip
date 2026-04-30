const experience = [
  {
    title: 'Software Engineering Manager',
    period: 'Nov 2024 – Present',
    description:
      'Led the Platform Products Enablement team, focused on solving pain points and improving the software delivery lifecycle for developers through tooling, automation, and process enhancements.',
  },
  {
    title: 'Manager, Software Development Engineer in Test',
    period: 'Apr 2021 – Nov 2024',
    description:
      'Managed the deployment and GUI automation teams within the Platform Products area.',
  },
  {
    title: 'Software Development Engineer in Test',
    period: 'Jan 2019 – Apr 2021',
    description:
      'Automated product tests to allow functional testers more time to focus on detailed testing.',
  },
  {
    title: 'Test Engineer',
    period: 'May 2014 – Jan 2019',
    description:
      'Worked with development and product management to ensure the functionality and usability of the product.',
  },
];

const skills = [
  'Test Automation',
  'Python',
  'Java',
  'SAS Programming',
  'CI/CD Pipelines',
  'Data Analysis',
  'Information Security',
  'Analytics',
  'Regression Testing',
  'System Testing',
  'Mathematics',
  'Computer Science',
  'Systems Thinking',
  'Public Speaking',
];

export function AboutSection() {
  return (
    <section id="about" className="section-surface py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-heading">About Me</h2>

        <div className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-lg text-muted leading-relaxed">
            I work with the Platform Products DevOps and Integrated Quality team at SAS. We provide
            our division with customer-like deployments used for testing, and maintain the
            division&apos;s automated GUI smoke tests that run in our CI/CD pipeline. I enjoy
            helping others work on challenges and discover their passion.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Experience */}
          <div>
            <h3 className="text-xl font-bold text-heading mb-6">
              Experience &mdash; SAS <span className="text-muted font-normal text-base">(13 years)</span>
            </h3>
            <div className="space-y-6">
              {experience.map((role) => (
                <div
                  key={role.title}
                  className="border-l-2 border-blue-500 dark:border-blue-400 pl-4"
                >
                  <p className="font-semibold text-heading leading-snug">{role.title}</p>
                  <p className="text-sm text-label mb-1">{role.period}</p>
                  <p className="text-sm text-muted leading-relaxed">{role.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Education, Certifications, Skills */}
          <div className="space-y-10">
            <div>
              <h3 className="text-xl font-bold text-heading mb-4">Education</h3>
              <div className="border-l-2 border-blue-500 dark:border-blue-400 pl-4">
                <p className="font-semibold text-heading">Meredith College</p>
                <p className="text-sm text-muted">
                  B.S. in Mathematics &amp; B.A. in Computer Science
                </p>
                <p className="text-sm text-label">2010 – 2014</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-heading mb-4">Certifications</h3>
              <div className="border-l-2 border-blue-500 dark:border-blue-400 pl-4">
                <p className="font-semibold text-heading">Leadership Essentials</p>
                <p className="text-sm text-muted">Cornell University</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-heading mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="card-bg-blue text-blue-700 dark:text-blue-300 text-sm px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
