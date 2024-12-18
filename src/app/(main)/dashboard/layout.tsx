import AppStateProvider from "@/lib/providers/state-provider";
import React from "react";

interface LayoutProps {
  children: React.ReactNode;
  params: any;
}

const Layout: React.FC<LayoutProps> = ({ children, params }) => {
  return (
    <main
      className="flex
    overflow-hidden
    h-screen"
    >
      <AppStateProvider>{children}</AppStateProvider>
    </main>
  );
};

export default Layout;
