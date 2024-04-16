import {
  CalendarIcon,
  ChartBarSquareIcon,
  ChatBubbleBottomCenterTextIcon,
  CreditCardIcon,
  PencilSquareIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

const features = [
  {
    name: "Payment Handling",
    description:
      "Effortlessly handle payments for memberships and event registrations, ensuring seamless transactions.",
    icon: CreditCardIcon,
  },
  {
    name: "Event Management",
    description:
      "Manage memberships seamlessly with tools for enrollment, profiles, and verification, ensuring accuracy and efficiency.",
    icon: CalendarIcon,
  },
  {
    name: "Membership Management",
    description:
      "Effortlessly manage memberships with streamlined tools, ensuring accuracy and efficiency in enrollment, updates, and verification.",
    icon: UserPlusIcon,
  },
  {
    name: "Communication Tools",
    description:
      "Enhance member communication with tailored emails, newsletters, and event alerts to boost engagement.",
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    name: "Reporting and Analytics",
    description:
      "Gain insights into member engagement, event attendance, and financial performance with detailed reports and analytics.",
    icon: ChartBarSquareIcon,
  },
  {
    name: "Website Customization",
    description:
      "Enable org admins to customize websites with permissions, events, posts, and memberships to their liking.",
    icon: PencilSquareIcon,
  },
];

export default function Features() {
  return (
    <div id="features" className="bg-eerieblack py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-junglegreen text-base font-semibold leading-7">
            Introducing SyncUp
          </h2>
          <p className="text-chinawhite mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Our Comprehensive Suite of Tools
          </p>
          <p className="text-chinawhite mt-6 text-lg leading-8">
            Explore our robust features designed to simplify membership enrollment,
            enhance communication, and provide insightful analytics, empowering you to
            drive growth and success.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-chinawhite text-base font-bold leading-7">
                  <div className="bg-junglegreen absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="text-chinawhite mt-2 text-base leading-7">
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
