import React, { ReactNode } from "react";
import { UserProvider } from "@/context/user_context";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <UserProvider>
      <div>
        <header>{/* Add your header content here */}</header>
        <main>{children}</main>
        <footer>{/* Add your footer content here */}</footer>
      </div>
    </UserProvider>
  );
};

export default Layout;
