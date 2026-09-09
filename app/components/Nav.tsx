"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { domains } from "../scenes/domains";

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const seg = path.split("/")[1];
  return (
    <header className={`nav ${open ? "open" : ""}`}>
      <Link className="brand" href="/">
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <circle cx="11" cy="11" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11 L19 6" stroke="currentColor" strokeWidth="1.5" className="brand-needle" />
          <circle cx="11" cy="11" r="2" fill="currentColor" />
          <path d="M11 1.5 A9.5 9.5 0 0 1 20.5 11" fill="none" stroke="#5ee7ff" strokeWidth="2.5" />
        </svg>
        XVIS
      </Link>
      <button type="button" className="nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
        <i />
        <i />
      </button>
      <nav aria-label="Main">
        {domains.map((d) => (
          <Link key={d.id} href={`/${d.id}`} aria-current={seg === d.id ? "page" : undefined} style={{ ["--hue" as string]: d.hue }}>
            {d.short}
          </Link>
        ))}
        <span className="nav-sep" />
        <Link href="/stack" aria-current={seg === "stack" ? "page" : undefined}>
          Stack
        </Link>
        <Link href="/methodology" aria-current={seg === "methodology" ? "page" : undefined}>
          Method
        </Link>
      </nav>
    </header>
  );
}
