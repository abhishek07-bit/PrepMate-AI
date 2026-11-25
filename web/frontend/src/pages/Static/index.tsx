import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface StaticPageProps {
  title: string;
  content: string;
}

interface ParsedContent {
  intro: string[];
  sections: { heading: string; blocks: Array<{ type: 'p'; text: string } | { type: 'ul'; items: string[] }> }[];
}

function renderInlineFormatting(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="text-primary font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function parseStaticContent(content: string): ParsedContent {
  const lines = content.split('\n');
  const intro: string[] = [];
  const sections: ParsedContent['sections'] = [];
  let current: ParsedContent['sections'][number] | null = null;

  const pushBullet = (itemText: string) => {
    const targetBlocks = current ? current.blocks : null;
    if (!targetBlocks) {
      intro.push(itemText);
      return;
    }
    const lastBlock = targetBlocks[targetBlocks.length - 1];
    if (lastBlock && lastBlock.type === 'ul') {
      lastBlock.items.push(itemText);
    } else {
      targetBlocks.push({ type: 'ul', items: [itemText] });
    }
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (/^#{1,3}\s+/.test(trimmed)) {
      if (current) sections.push(current);
      current = { heading: trimmed.replace(/^#{1,3}\s+/, ''), blocks: [] };
    } else if (/^[-*]\s+/.test(trimmed)) {
      pushBullet(trimmed.replace(/^[-*]\s+/, ''));
    } else if (!current) {
      intro.push(trimmed);
    } else {
      current.blocks.push({ type: 'p', text: trimmed });
    }
  }

  if (current) sections.push(current);
  return { intro, sections };
}

export default function StaticPage({ title, content }: StaticPageProps) {
  const { intro, sections } = parseStaticContent(content);

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
            {intro.length > 0 && (
              <div className="flex flex-col gap-sm mt-md max-w-2xl">
                {intro.map((paragraph, idx) => (
                  <p key={idx} className="font-body-lg text-body-lg text-secondary leading-relaxed">
                    {renderInlineFormatting(paragraph)}
                  </p>
                ))}
              </div>
            )}
          </header>

          <div className="flex flex-col gap-xl">
            {sections.map((section, i) => (
              <section key={i} id={`section-${i}`} className="flex flex-col gap-md scroll-mt-24">
                <h2 className="font-headline-md text-headline-md text-primary tracking-tight">{section.heading}</h2>
                <div className="flex flex-col gap-sm font-body-md text-body-md text-secondary leading-relaxed">
                  {section.blocks.map((block, j) =>
                    block.type === 'ul' ? (
                      <ul key={j} className="list-disc pl-lg flex flex-col gap-xs">
                        {block.items.map((item, k) => (
                          <li key={k}>{renderInlineFormatting(item)}</li>
                        ))}
                      </ul>
                    ) : (
                      <p key={j}>{renderInlineFormatting(block.text)}</p>
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        </article>

        {/* TOC Sidebar */}
        {sections.length > 1 && (
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-[96px]">
              <nav className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg flex flex-col gap-md">
                <h3 className="font-label-bold text-label-bold text-primary uppercase tracking-widest">On this page</h3>
                <div className="flex flex-col gap-xs">
                  {sections.map((section, i) => (
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
