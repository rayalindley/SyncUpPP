import React, { ReactNode } from "react";
import { UserProvider } from "@/context/user_context";
import { ToastContainer } from "react-toastify";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <UserProvider>
      <div>
        <header>{/* Add your header content here */}</header>
        <main>{children}</main>
        <ToastContainer />
        <footer>{/* Add your footer content here */}</footer>
      </div>
    </UserProvider>
  );
};

export default Layout;
