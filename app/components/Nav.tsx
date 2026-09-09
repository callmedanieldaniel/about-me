import Link from "next/link";

export default function Nav({ current }: { current?: string }) {
  const items = [
    ["/#labs", "Labs"],
    ["/#catalog", "Catalog"],
    ["/stack", "Stack"],
    ["/methodology", "Method"],
  ];
  return (
    <header className="nav">
      <Link className="brand" href="/">
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <circle cx="11" cy="11" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11 L19 6" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="11" cy="11" r="2" fill="currentColor" />
          <path d="M11 1.5 A9.5 9.5 0 0 1 20.5 11" fill="none" stroke="#5ee7ff" strokeWidth="2.5" />
        </svg>
        OMNIVIS
      </Link>
      <nav aria-label="Main">
        {items.map(([href, label]) => (
          <Link key={href} href={href} aria-current={current === href ? "page" : undefined}>
            {label}
          </Link>
        ))}
        <a href="https://github.com/buildvar/about-me" target="_blank" rel="noopener noreferrer">
          Source
        </a>
      </nav>
    </header>
  );
}
