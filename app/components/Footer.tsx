import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div>
        <span className="brand-small">XVIS</span>
        <p>
          Every scene answers one question. Inputs, assumptions and outputs stay visible. Synthetic data is labeled as such; third-party engines are credited, not claimed.
        </p>
      </div>
      <nav aria-label="Footer">
        <Link href="/stack">Technology stack</Link>
        <Link href="/methodology">Method and boundaries</Link>
        <a href="https://github.com/buildvar/about-me" target="_blank" rel="noopener noreferrer">
          Source
        </a>
      </nav>
    </footer>
  );
}
