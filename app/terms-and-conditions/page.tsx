import Header from "@/components/header";
import { getUser } from "@/lib/supabase/server";

export default async function TermsAndConditions() {
  const { user } = await getUser();
  return (
    <div >
      <Header user={user} />
      <main className="p-6 font-sans">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-[#bababa] text-xl font-bold mb-3">SyncUp++</h3>
          <h1 className="text-3xl font-bold mb-4 text-[#efefef] mb-6">Terms & Conditions</h1>
          <p className="mb-4 text-[#bababa] text-lg font-semibold">These Terms & Conditions outline the rules and regulations for using our platform. SyncUp offers organizations a streamlined system to manage memberships, events, and communications efficiently. By using our services, users agree to comply with the terms set forth below. These terms are designed to ensure the protection of both users and administrators while providing a secure and reliable experience. Please review them carefully, as your continued use of the platform indicates your acceptance and understanding of these conditions.</p>
          
          <div className="ml-4">
            <h2 className="text-2xl font-bold mb-5 text-[#efefef] mt-6">Acceptance of Terms</h2>
            <div className="mb-4 ml-4 text-lg text-[#bababa]">
              <p>By accessing and using SyncUp, you agree to be bound by the following terms and conditions. If you do not agree with these terms, please do not use our platform. SyncUp reserves the right to update these terms at any time, and continued use of the platform constitutes acceptance of the revised terms.</p>
            </div>

            <h2 className="text-2xl font-bold mb-5 text-[#efefef] mt-6">Services Provided</h2>
            <div className="mb-4 ml-4 text-lg text-[#bababa]">
              <p>SyncUp provides an integrated digital platform for managing memberships, events, and communication within organizations. Users can:</p>
              <ul className="list-disc list-inside mb-4">
                <li>Create and manage memberships</li>
                <li>Register for events</li>
                <li>Manage organizational activities (for admins)</li>
                <li>Receive notifications and communications</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mb-5 text-[#efefef] mt-6">User Responsibilities</h2>
            <div className="mb-4 ml-4 text-lg text-[#bababa]">
              <p className="mb-5"><strong>Account Security</strong><p> Users are responsible for maintaining the confidentiality of their login information. Any activity performed under your account is your responsibility.</p></p>
              <p className="mb-5"><strong>Accuracy of Information</strong> <p>You agree to provide accurate, current, and complete information during registration and maintain your profile with up-to-date information.</p></p>
              <p className="mb-6"><strong>Prohibited Activities</strong> <p>You must not misuse the platform, including engaging in unlawful activities, spamming, or violating others&apos privacy.</p></p>
            </div>

            <h2 className="text-2xl font-bold mb-5 text-[#efefef] mt-6">Payment and Fees</h2>
            <div className="mb-4 ml-4 text-lg text-[#bababa]">
              <p className="mb-5"><strong>Membership Fees</strong><p>SyncUp may charge membership fees depending on the plan chosen. Payments must be made through the integrated payment gateways, and all transactions are final, subject to refund policies of specific organizations.</p> </p>
              <p className="mb-6"><strong>Event Registration</strong><p>Some events may have associated fees. SyncUp is not responsible for refunds; they are managed by the event organizers.</p> </p>
            </div>

            <h2 className="text-2xl font-bold mb-5 text-[#efefef] mt-6">Communication</h2>
            <div className="mb-4 ml-4 text-lg text-[#bababa]">
              <p>Users agree to receive notifications regarding membership renewals, event reminders, and other updates relevant to their participation. Users can customize notification settings within the platform.</p>
            </div>

            <h2 className="text-2xl font-bold mb-5 text-[#efefef] mt-6">Data Privacy</h2>
            <div className="mb-4 ml-4 text-lg text-[#bababa]">
              <p>SyncUp adheres to data protection regulations, ensuring the confidentiality of users&apos personal and payment information. Data will be stored securely, and only authorized personnel will have access to sensitive information.</p>
            </div>

            <h2 className="text-2xl font-bold mb-5 text-[#efefef] mt-6">Content and Postings</h2>
            <div className="mb-4 ml-4 text-lg text-[#bababa]">
              <p>Users may post content within the platform, including comments and reactions. By posting, you agree not to share harmful or inappropriate content. SyncUp reserves the right to moderate or remove posts that violate community standards.</p>
            </div>

            <h2 className="text-2xl font-bold mb-5 text-[#efefef] mt-6">Termination</h2>
            <div className="mb-4 ml-4 text-lg text-[#bababa]">
              <p>SyncUp reserves the right to terminate accounts that breach these terms, including those involved in fraudulent activities, abuse of services, or violations of the law.</p>
            </div>

            <h2 className="text-2xl font-bold mb-5 text-[#efefef] mt-6">Limitation of Liability</h2>
            <div className="mb-4 ml-4 text-lg text-[#bababa]">
              <p>SyncUp is not liable for any indirect, incidental, or consequential damages arising from the use of the platform. This includes, but is not limited to, errors in the system, delays, or failures in delivering notifications.</p>
            </div>

            <h2 className="text-2xl font-bold mb-5 text-[#efefef] mt-6">Governing Law</h2>
            <div className="mb-4 ml-4 text-lg text-[#bababa]">
              <p>These terms are governed by the laws of the jurisdiction where SyncUp operates. Any disputes arising from these terms or use of the platform will be resolved in accordance with the applicable laws.</p>
            </div>

            <h2 className="text-2xl font-bold mb-5 text-[#efefef] mt-6">Contact Information</h2>
            <p className="mb-12 ml-4 text-lg text-[#bababa]">For any questions regarding these Terms & Conditions, please contact SyncUp support via <a href="https://mail.google.com/mail/?view=cm&fs=1&to=syncup.supp@gmail.com" className="hover:text-primarydark text-primary font-semibold" target="_blank" rel="noopener noreferrer">syncup.supp@gmail.com</a></p>
          </div>
        </div>
      </main>
    </div>
  );
}
