"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { PreviewProvider, usePreview } from "./preview-context";
import { Avatar, Icon, type IconName } from "./ui";
import s from "./workspace.module.css";
const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/agreements", label: "Agreements", icon: "file" },
  { href: "/reviews", label: "Reviews", icon: "star" },
  { href: "/profile", label: "My public profile", icon: "person" },
  { href: "/settings", label: "Profile settings", icon: "settings" },
];
function Workspace({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { profile, agreements } = usePreview();
  const current = links.find((l) => path.startsWith(l.href));
  return (
    <div className={s.app}>
      <a className={s.skip} href="#workspace-content">
        Skip to content
      </a>
      <aside className={s.sidebar}>
        <Link href="/" className={s.brand}>
          <span>
            <Icon name="layers" />
          </span>
          TrustLayer<span className={s.brandDot}>.</span>
        </Link>
        <p className={s.navCaption}>YOUR WORKSPACE</p>
        <nav aria-label="Workspace" className={s.navigation}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={path.startsWith(l.href) ? s.activeNav : ""}
              aria-current={path.startsWith(l.href) ? "page" : undefined}
            >
              <Icon name={l.icon} />
              <span>{l.label}</span>
              {l.href === "/agreements" && (
                <small>
                  {agreements.filter((a) => a.status === "open").length}
                </small>
              )}
            </Link>
          ))}
        </nav>
        <div className={s.sidebarNote}>
          <Icon name="shield" />
          <strong>Good work adds up.</strong>
          <p>
            Every completed interaction is another layer of your reputation.
          </p>
          <Link href="/profile">
            View your profile
            <Icon name="arrow" />
          </Link>
        </div>
        <div className={s.sidebarBottom}>
          <Link href="/" className={s.homeLink}>
            <Icon name="back" />
            Back to homepage
          </Link>
          <Link href="/settings" className={s.account}>
            <Avatar name={profile.display_name} />
            <span>
              <strong>{profile.display_name}</strong>
              <small>Sample account</small>
            </span>
            <Icon name="settings" />
          </Link>
        </div>
      </aside>
      <div className={s.workspace}>
        <header className={s.topbar}>
          <span>
            Workspace <span className={s.slash}>/</span>{" "}
            <strong>{current?.label ?? "Overview"}</strong>
          </span>
          <span className={s.previewPill}>
            <span />
            UI PREVIEW
          </span>
        </header>
        <div className={s.previewBanner}>
          <span>
            Sample workspace. Try the flow—changes reset when you refresh.
          </span>
          <span>No live account or blockchain activity</span>
        </div>
        <main id="workspace-content" className={s.content} key={path}>
          {children}
        </main>
        <footer className={s.footer}>
          TrustLayer <span>Real work. Verifiable reputation.</span>
        </footer>
      </div>
    </div>
  );
}
export default function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <PreviewProvider>
      <Workspace>{children}</Workspace>
    </PreviewProvider>
  );
}
