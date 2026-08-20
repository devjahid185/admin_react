const effectiveDate = "Effective date: August 20, 2026";

const privacySections = [
  {
    title: "1. Introduction",
    body: [
      "Bholavashi is operated by Sohoj IT. This Privacy Policy explains how we collect, use, store and protect information when users access the Bholavashi mobile app, website and related local digital services.",
      "Bholavashi provides services such as food delivery, local service listings, restaurant and rider workflows, notifications, order tracking, support and community-focused information.",
    ],
  },
  {
    title: "2. Information We Collect",
    body: [
      "We collect only the information required to provide, secure and improve the service.",
    ],
    bullets: [
      "Account information such as name, phone number, email address, profile photo and address details.",
      "Order and service information such as food orders, saved delivery addresses, support tickets, booking or listing details and transaction status.",
      "Location information such as current or selected delivery location, restaurant location, rider location during active delivery and route visibility data.",
      "Device and notification information such as device token, app version and basic technical logs for push notifications, troubleshooting and fraud prevention.",
      "Media and documents voluntarily uploaded by users, riders, owners or service providers, including profile photos, food images, KYC files or delivery proof.",
    ],
  },
  {
    title: "3. How We Use Information",
    body: [
      "We use information to create accounts, process orders, provide delivery services, match riders, show service details, send notifications, provide support, prevent abuse and improve app reliability.",
      "Location data is used for user-selected delivery addresses, restaurant-to-customer distance, rider matching, live delivery tracking and route display. We do not sell personal location data.",
    ],
  },
  {
    title: "4. Sharing of Information",
    body: [
      "We share necessary information only with parties involved in providing the requested service, such as restaurants, riders, admins, support teams and trusted service providers.",
      "We may use third-party services including Google Maps, Firebase Cloud Messaging, hosting, SMS/email gateways and payment-related providers. These services process data according to their own privacy and security practices.",
    ],
  },
  {
    title: "5. Data Security and Retention",
    body: [
      "We apply reasonable technical and administrative safeguards to protect user data. However, no internet-based service can guarantee absolute security.",
      "We retain data only as long as needed for service delivery, legal, accounting, safety, fraud prevention, dispute resolution and operational purposes.",
    ],
  },
  {
    title: "6. User Choices and Account Deletion",
    body: [
      "Users may update certain profile information inside the app. Users may contact support to request account deletion or data deletion where applicable, subject to legal, security and transaction record requirements.",
      "For account or privacy requests, contact Sohoj IT at support@bholavashi.site or through the Help & Support section of the app.",
    ],
  },
  {
    title: "7. Children",
    body: [
      "Bholavashi is not intended for children under 13. If we learn that we have collected personal information from a child without appropriate consent, we will take reasonable steps to delete it.",
    ],
  },
  {
    title: "8. Policy Updates",
    body: [
      "We may update this Privacy Policy from time to time. Updated versions will be posted on this page and may also be available inside the app.",
    ],
  },
];

const termsSections = [
  {
    title: "Terms of Service",
    body: [
      "By using Bholavashi, users agree to provide accurate information, use the service lawfully and follow the rules applicable to each service category.",
      "Users must not create fake orders, upload harmful content, misuse delivery or support systems, harass others, attempt unauthorized access or violate local laws.",
    ],
    bullets: [
      "Food orders, delivery charges, cancellations and refunds may vary based on restaurant, rider availability, payment method and order status.",
      "Restaurant owners, riders and service providers are responsible for keeping profile, availability, pricing, KYC and service information accurate.",
      "Sohoj IT may suspend or restrict accounts that are fraudulent, unsafe, abusive or harmful to customers, partners, riders or the platform.",
      "Service availability may change due to maintenance, network issues, business hours, weather, local conditions or other operational reasons.",
    ],
  },
];

function PolicySection({ section }) {
  return (
    <section className="rounded-[16px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-[#101827]">{section.title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-7 text-[#53637a]">
        {section.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {!!section.bullets?.length && (
        <ul className="mt-4 space-y-2 text-[15px] leading-7 text-[#53637a]">
          {section.bullets.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ee0012]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function PublicPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f4f6f9] px-4 py-8 text-[#101827]">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#ee0012]">Sohoj IT</p>
          <h1 className="mt-3 text-3xl font-black tracking-normal text-[#101827]">Bholavashi Privacy Policy</h1>
          <p className="mt-3 text-sm font-semibold text-[#53637a]">{effectiveDate}</p>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-[#53637a]">
            This page is the official public privacy policy for the Bholavashi app, operated by Sohoj IT.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[14px] border border-[#edf1f6] bg-[#f8fafc] p-3">
              <div className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Company</div>
              <div className="mt-1 font-bold">Sohoj IT</div>
            </div>
            <div className="rounded-[14px] border border-[#edf1f6] bg-[#f8fafc] p-3">
              <div className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Product</div>
              <div className="mt-1 font-bold">Bholavashi</div>
            </div>
            <div className="rounded-[14px] border border-[#edf1f6] bg-[#f8fafc] p-3">
              <div className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Contact</div>
              <div className="mt-1 break-words font-bold">support@bholavashi.site</div>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {privacySections.map((section) => (
            <PolicySection key={section.title} section={section} />
          ))}
          {termsSections.map((section) => (
            <PolicySection key={section.title} section={section} />
          ))}
        </div>

        <footer className="py-8 text-center text-sm font-semibold text-[#64748b]">
          © 2026 Sohoj IT. Bholavashi is a digital service platform by Sohoj IT.
        </footer>
      </div>
    </main>
  );
}
