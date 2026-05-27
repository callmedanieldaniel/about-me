import type { ReactNode } from "react";

export default function DemoFrame({
  title,
  children,
  caption,
}: Readonly<{
  title: string;
  children: ReactNode;
  caption?: string;
}>) {
  return (
    <>
      <div className="demo-wrap">
        <div className="demo-head">
          <div>
            <span className="dots">
              <i /><i /><i />
            </span>
            {title}
          </div>
          <span>live · canvas / webgl</span>
        </div>
        <div className="demo-body">{children}</div>
      </div>
      {caption && <p className="demo-caption">{caption}</p>}
    </>
  );
}
