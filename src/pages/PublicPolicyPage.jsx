const effectiveDate = "Effective date: September 24, 2026";

const privacySections = [
  {
    title: "1. Who We Are",
    body: [
      "Bholavashi is a local digital service platform operated by Sohoj IT. This Privacy Policy explains how we collect, use, store, share and protect information when users access the Bholavashi mobile app, website and related services.",
      "The app includes features such as account login, local service listings, food and medicine ordering, restaurant owner tools, rider delivery workflows, map-based delivery location, order tracking, notifications, support, reviews and account deletion requests.",
      "This policy is designed to match our Google Play Data safety disclosures. If a feature is not used by a user, data related to that feature may not be collected from that user.",
    ],
  },
  {
    title: "2. Information We Collect",
    body: [
      "We collect only the information required to provide, secure and improve the service.",
    ],
    bullets: [
      "Account information such as name, phone number, email address, profile photo and address details.",
      "Order and service information such as food and medicine orders, saved delivery addresses, support tickets, booking or listing details and transaction status.",
      "Payment and financial records related to orders, such as item totals, delivery fees, discounts, payment method, cash-on-delivery status, manual bKash/Nagad transaction ID, payment proof and settlement status.",
      "Health-related service information users provide through medicine delivery, blood donor/request, doctor appointment or similar features, such as medicine order details, prescription-related notes, blood group, age/gender/weight, last donation information or appointment details.",
      "Location information such as current or selected delivery location, restaurant location, rider location during active delivery and route visibility data.",
      "Device and notification information such as device token, app version and basic technical logs for push notifications, troubleshooting and fraud prevention.",
      "Media, photos, files and documents voluntarily uploaded by users, riders, restaurant owners or service providers, including profile photos, food images, KYC documents, NID/driving license/vehicle documents, screenshots, support attachments or delivery/payment proof.",
      "App activity and analytics information such as app interactions, searches, deep link opens, cart/order actions, reviews, support messages and events collected by trusted SDKs where enabled.",
      "Login and security information such as OTP verification, Google sign-in identifiers, active device records, IP-based security logs and account deletion request records.",
    ],
  },
  {
    title: "3. How We Use Information",
    body: [
      "We use information to create and secure accounts, verify OTP or Google login, process orders, calculate delivery charges, apply discounts, assign riders, manage restaurant owner/rider workflows, provide support, send service notifications, prevent fraud and improve app reliability.",
      "Location data is used for user-selected delivery addresses, distance calculation, rider matching, live delivery tracking and route display. Location access is requested only when a user chooses a location-based feature or when a rider uses delivery features. We do not sell personal location data.",
      "Uploaded photos, files and documents are used only for the feature where they are submitted, such as KYC verification, product/restaurant listing, support, payment proof or delivery proof.",
    ],
  },
  {
    title: "4. Sharing of Information",
    body: [
      "We share only the information needed to provide the requested service. For example, a restaurant may receive order and delivery details, a rider may receive delivery contact/location information, and support/admin teams may access records needed to resolve issues or keep the platform safe.",
      "We may use trusted third-party services including Google Maps and routing services, Firebase Cloud Messaging, Google sign-in, Meta App Events, hosting/database/media storage providers, SMS/email gateways and payment-related providers. These providers process data according to their own privacy and security practices.",
      "We do not sell personal data. We do not share data for unrelated third-party resale.",
    ],
  },
  {
    title: "5. Google Play Permissions and Optional Access",
    body: [
      "The Android app may request notification permission for order updates, rider requests, support updates and important service alerts.",
      "The app may request approximate or precise location permission when users select current location, delivery location, restaurant location, rider delivery routing or live tracking features.",
      "The app may allow users to choose images or files for profile photos, food/restaurant images, rider KYC, support attachments, payment proof or delivery proof. These uploads are user initiated.",
    ],
  },
  {
    title: "6. Data We Do Not Collect From the Device",
    body: [
      "Based on the current app implementation, Bholavashi does not request or collect contacts, SMS/MMS message content, call logs, calendar data, microphone/audio recordings, installed apps list or web browsing history from the device.",
      "If future versions add any new sensitive permission or data type, this policy and the Google Play Data safety declaration will be updated before or with that release.",
    ],
  },
  {
    title: "7. Data Security and Retention",
    body: [
      "We use HTTPS for data in transit and apply reasonable technical and administrative safeguards to protect user data. However, no internet-based service can guarantee absolute security.",
      "We retain data only as long as needed for account management, service delivery, legal/accounting obligations, rider and restaurant settlement, safety, fraud prevention, dispute resolution and operational purposes.",
      "Some transaction, payout, fraud-prevention or legal records may be retained even after account deletion if required for legitimate business, tax, accounting, safety or legal reasons.",
    ],
  },
  {
    title: "8. User Choices and Account Deletion",
    body: [
      "Users may update certain profile information inside the app and may control permissions such as notification and location access from Android device settings.",
      "Users can request account deletion or data deletion from inside the app or through the official deletion page: https://bholavashi.site/delete-account/",
      "For account, deletion or privacy requests, contact Sohoj IT at support@bholavashi.site or through the Help & Support section of the app. Deletion requests are subject to legal, security, fraud-prevention, dispute and transaction record requirements.",
    ],
  },
  {
    title: "9. Children",
    body: [
      "Bholavashi is not intended for children under 13. If we learn that we have collected personal information from a child without appropriate consent, we will take reasonable steps to delete it.",
    ],
  },
  {
    title: "10. Policy Updates",
    body: [
      "We may update this Privacy Policy from time to time. Updated versions will be posted on this page and may also be available inside the app.",
      "The effective date at the top of this page shows when the policy was last updated.",
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
