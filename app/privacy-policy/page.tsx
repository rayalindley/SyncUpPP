import Header from "@/components/header";
import { getUser } from "@/lib/supabase/server";

export default async function PrivacyPolicy() {
  const { user } = await getUser();
  return (
    <div >
      <Header user={user} />
      <main className="p-6 font-sans">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-[#bababa] text-xl font-bold mb-3">SyncUp</h3>
          <h1 className="text-3xl font-bold mb-4 text-[#efefef] mb-6">Privacy Policy</h1>
          <p className="mb-4 text-[#bababa] text-lg font-semibold">SyncUp is committed to protecting the privacy of its users. This privacy policy outlines how we collect, use, store, and share personal information in connection with the SyncUp platform.</p>
          <div className="ml-4">
            <h2 className="text-2xl font-bold mb-5 text-[#efefef] mt-6">Information We Collect</h2>
            <div className="mb-4 ml-4 text-lg text-[#bababa]">
              <p><strong>Personal Information</strong></p>
              <p className="mb-5">When users sign up for SyncUp, we collect personal details such as names, email addresses, contact information, and payment details (if applicable).</p>
              <p><strong>Usage Data</strong></p>
              <p className="mb-5">This includes login details, activity logs, and interactions with the platform such as event registration, posts, and messages.</p>
              <p><strong>Technical Data</strong></p>
              <p className="mb-6">SyncUp collects technical information like IP addresses, browser types, and device information for security and improvement of services.</p>
            </div>

          
            <h2 className="text-2xl font-bold mb-5 text-[#efefef] mt-6">How We Use Your Information</h2>
            <div className="mb-4 ml-4 text-lg text-[#bababa]">
              <p><strong>To provide and enhance the SyncUp services</strong></p>
              <p className="mb-5">This includes membership management, event handling, and communication tools.</p>
              <p><strong>To process payments securely</strong></p>
              <p className="mb-5">We use integrated payment gateways for secure transactions.</p>
              <p><strong>To send notifications</strong></p>
              <p className="mb-5">We notify users regarding updates, renewals, events, or other relevant content based on their preferences.</p>
              <p><strong>To generate reports and analytics</strong></p>
              <p className="mb-6">This helps in improving the platform and supporting organizational decisions.</p>
            </div>

            <h2 className="text-2xl font-bold mb-5 text-[#efefef] mt-6">Sharing Your Information</h2>
            <div className="mb-4 ml-4 text-lg text-[#bababa]">
              <p><strong>Payment Processors</strong></p>
              <p className="mb-5">To facilitate payments, your information may be shared with secure third-party payment processors that comply with industry standards (e.g., PCI DSS).</p>
              <p><strong>Legal Requirements:</strong></p>
              <p className="mb-5">We may share your information if required by law or to protect the rights and safety of our users and platform.</p>
              <p><strong>Service Providers:</strong></p>
              <p className="mb-6">In cases where third-party services are used (e.g., email services or data analytics), we ensure they adhere to strict data protection regulations.</p>
            </div>

            <h2 className="text-2xl font-bold mb-5 text-[#efefef] mt-6">Data Security</h2>
            <div className="mb-4 ml-4 text-lg text-[#bababa]">
              <p><strong>Encryption</strong></p>
              <p className="mb-5">We use encryption protocols to protect sensitive information such as passwords and payment details both during transmission and when stored.</p>
              <p><strong>Access Controls:</strong></p>
              <p className="mb-5">Role-based access control ensures that only authorized personnel can view or modify user data.</p>
              <p><strong>Regular Audits:</strong></p>
              <p className="mb-6">SyncUp conducts regular security audits and vulnerability assessments to ensure the safety and integrity of the platform.</p>
            </div>

            <h2 className="text-2xl font-bold mb-5 text-[#efefef] mt-6">User Rights</h2>
            <div className="mb-4 ml-4 text-lg text-[#bababa]">
  <p><strong>Users have the right to:</strong></p>
  <ul className="list-disc list-inside mb-4">
    <li>Access, update, or delete their personal information at any time.</li>
    <li>Opt out of marketing or non-essential notifications.</li>
    <li>Request a copy of the data SyncUp holds about them.</li>
  </ul>
</div>

<h2 className="text-2xl font-bold mb-5 text-[#efefef] mt-6">Data Retention</h2>
<p className="mb-4 ml-4 text-lg text-[#bababa]">We retain user data for as long as necessary to provide services or comply with legal obligations. Upon termination of an account, personal data will be securely deleted or anonymized.</p>

<h2 className="text-2xl font-bold mb-5 text-[#efefef] mt-6">Changes to the Privacy Policy</h2>
<p className="mb-12 ml-4 text-lg text-[#bababa]">We may update this privacy policy from time to time to reflect changes in our practices or regulatory requirements. Users will be notified of any significant changes.</p></div>
          

<p className="mb-4 ml-4 text-lg text-[#bababa]">If you have any questions or concerns about this privacy policy, please contact us at [Contact Information].</p>
<p className="mb-4 ml-4 text-lg text-[#bababa]">This Privacy Policy was last updated on September 18, 2024.</p>
        </div>
        
      </main>
    </div>
  );
}
