import "@/app/globals.css";
import Chatbot from "@/components/chatbot";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SyncUp++",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className=" h-full ">
      <body className={`${inter.className} h-full bg-eerieblack bg-none`}>
        {children}
        <Chatbot/>
      </body>
    </html>
  );
}
