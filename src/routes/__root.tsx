import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AppShell } from "@/core/components/AppShell";

function NotFoundComponent() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Lost in the syllabus.</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page bunked.</p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "StudentOS — Your College Lifestyle OS" },
      {
        name: "description",
        content:
          "StudentOS — the offline-first college companion. Grades, attendance, expenses, bunk simulator, insights, games. All on-device.",
      },
      { property: "og:title", content: "StudentOS — Your College Lifestyle OS" },
      { property: "og:description", content: "Track grades, plan bunks, log expenses. Offline. On-device. Always with you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "theme-color", content: "#1a0d2e" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

const themeBootstrap = `
(function(){
  try {
    var t = localStorage.getItem('sos_theme') || 'neon';
    var valid = ['neon','matte','pop','focus'];
    if (valid.indexOf(t) === -1) t = 'neon';
    document.documentElement.classList.add('theme-' + t);
  } catch(e) {
    document.documentElement.classList.add('theme-neon');
  }
})();
`;


// //amma
// function RootShell({ children }: { children: React.ReactNode }) {
//   return (
//     <>
//       <HeadContent />
//       <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
//       {children}
//       <Scripts />
//     </>
//   );
// }

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeadContent />
      <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      {children}
      <Scripts />
    </>
  );
}

function RootComponent() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
