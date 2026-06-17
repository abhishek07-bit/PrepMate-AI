import { Link } from 'react-router-dom';

interface StaticPageProps {
  title: string;
  content: string;
}

function parseSections(content: string) {
  const lines = content.split('\n').filter(l => l.trim());
  const sections: { heading: string; items: string[] }[] = [];
  let current: { heading: string; items: string[] } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^\d+\.\s|^#/.test(trimmed) || trimmed.endsWith(':')) {
      if (current) sections.push(current);
      current = { heading: trimmed.replace(/^#\s*/, '').replace(/^\d+\.\s*/, ''), items: [] };
    } else {
      if (!current) current = { heading: '', items: [] };
      current.items.push(trimmed);
    }
  }
  if (current) sections.push(current);
  return sections;
}

export default function StaticPage({ title, content }: StaticPageProps) {
  const sections = parseSections(content);

  return (
    <div className="w-full max-w-max-width mx-auto px-lg md:px-xl lg:px-2xl pt-[calc(var(--spacing-navbar-h)+24px)] pb-2xl animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-xs mb-xl">
        <Link to="/" className="text-[11px] font-label-bold text-secondary hover:text-primary transition-colors uppercase tracking-widest">Home</Link>
        <span className="material-symbols-outlined text-[14px] text-secondary">chevron_right</span>
        <span className="text-[11px] font-label-bold text-primary uppercase tracking-widest">{title}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-xl lg:gap-2xl">
        {/* Main Content */}
        <article className="flex-1 min-w-0">
          <header className="mb-xl pb-xl border-b border-outline-variant">
            <h1 className="font-display text-headline-lg md:text-display text-primary leading-none tracking-tighter">{title}</h1>
            <p className="font-body-lg text-body-lg text-secondary mt-md max-w-2xl">{sections[0]?.items[0] || ''}</p>
          </header>

          <div className="flex flex-col gap-xl">
            {sections.slice(1).map((section, i) => (
              <section key={i} id={`section-${i}`} className="flex flex-col gap-md">
                <h2 className="font-headline-md text-headline-md text-primary tracking-tight">{section.heading}</h2>
                <div className="flex flex-col gap-sm font-body-md text-body-md text-secondary leading-relaxed">
                  {section.items.map((item, j) => (
                    <p key={j}>{item}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>

        {/* TOC Sidebar */}
        {sections.length > 2 && (
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-[96px]">
              <nav className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg flex flex-col gap-md">
                <h3 className="font-label-bold text-label-bold text-primary uppercase tracking-widest">On this page</h3>
                <div className="flex flex-col gap-xs">
                  {sections.slice(1).map((section, i) => (
                    <a
                      key={i}
                      href={`#section-${i}`}
                      className="font-body-sm text-body-sm text-secondary hover:text-primary transition-colors py-xs"
                    >
                      {section.heading}
                    </a>
                  ))}
                </div>
              </nav>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
