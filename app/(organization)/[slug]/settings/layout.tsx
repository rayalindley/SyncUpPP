import SideNavMenu from "@/components/organization/sidenav_setttings";

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex">
      <SideNavMenu />
      <div className="ml-72 flex-grow p-8">{children}</div>
    </div>
  );
}
