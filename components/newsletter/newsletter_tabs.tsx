"use client";
import React from "react";
import { Tab } from "@headlessui/react";
import NewsletterCreation from "./newsletter_creation";
import Emails from "./emails";

interface NewsletterTabsProps {
  organizationName: string;
  organizationId: string;
  organizationSlug: string;
  events: any[]; // Replace with actual type
  users: any[]; // Replace with actual type
  sentEmails: any[]; // Replace with Email type
  incomingEmails: any[]; // Replace with Email type
  hasPermission: boolean;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const NewsletterTabs: React.FC<NewsletterTabsProps> = ({
  organizationName,
  organizationId,
  organizationSlug,
  events,
  users,
  sentEmails,
  incomingEmails,
  hasPermission,
}) => {
  return (
    <div className="bg-raisin rounded-lg font-sans text-white">
      <Tab.Group>
        <Tab.List className="mb-6 flex space-x-1 rounded-xl bg-[#333333] p-1">
          <Tab
            className={({ selected }) =>
              classNames(
                "w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-white",
                selected
                  ? "bg-primary shadow"
                  : "hover:bg-white/[0.12] hover:text-white"
              )
            }
          >
            Newsletter Creation
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                "w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-white",
                selected
                  ? "bg-primary shadow"
                  : "hover:bg-white/[0.12] hover:text-white"
              )
            }
          >
            Emails
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <NewsletterCreation
              organizationName={organizationName}
              organizationId={organizationId}
              organizationSlug={organizationSlug}
              events={events}
              users={users}
              hasPermission={hasPermission}
            />
          </Tab.Panel>
          <Tab.Panel>
            <Emails
              sentEmails={sentEmails}
              incomingEmails={incomingEmails}
              organizationName={organizationName}
              organizationId={organizationId}
              hasPermission={hasPermission}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default NewsletterTabs;
