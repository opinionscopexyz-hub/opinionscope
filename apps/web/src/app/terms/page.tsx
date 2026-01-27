import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | OpinionScope",
  description: "Terms of Service for OpinionScope - Read our terms and conditions for using the service.",
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: January 22, 2026</p>

        <p>
          Please read these Terms of Service (&quot;Terms&quot;, &quot;Terms of Service&quot;) carefully before using
          the OpinionScope website (the &quot;Service&quot;) operated by OpinionScope (&quot;us&quot;, &quot;we&quot;,
          or &quot;our&quot;).
        </p>

        <h2>Agreement to Terms</h2>
        <p>
          By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the
          terms, then you may not access the Service.
        </p>

        <h2>Description of Service</h2>
        <p>
          OpinionScope provides prediction market intelligence tools and analytics, including market screening, whale
          tracking, activity feeds, and alerts. The Service is intended for informational purposes only and does not
          constitute financial advice.
        </p>

        <h2>User Accounts</h2>
        <p>
          When you create an account with us, you must provide information that is accurate, complete, and current at
          all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of
          your account.
        </p>
        <p>
          You are responsible for safeguarding the password that you use to access the Service and for any activities or
          actions under your password.
        </p>

        <h2>Subscription and Payments</h2>
        <p>
          Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and
          periodic basis (monthly or annually), depending on the subscription plan you select.
        </p>
        <p>
          At the end of each billing period, your subscription will automatically renew under the same conditions unless
          you cancel it or we cancel it.
        </p>

        <h3>Free Trials</h3>
        <p>
          We may offer free trial periods for certain subscription plans. At the end of the free trial period, your
          subscription will automatically convert to a paid subscription unless you cancel before the trial ends. You
          will be charged the applicable subscription fee at the then-current rate.
        </p>

        <h3>Price Changes</h3>
        <p>
          We reserve the right to modify subscription prices at any time. Any price changes will be communicated to you
          in advance and will take effect at the start of your next billing period. Your continued use of the Service
          after the price change constitutes your acceptance of the new pricing.
        </p>

        <h3>Cancellation</h3>
        <p>
          You may cancel your subscription at any time through your account settings or by contacting us. Upon
          cancellation, you will retain access to paid features until the end of your current billing period. We do not
          provide prorated refunds for partial billing periods.
        </p>

        <h3>Refunds</h3>
        <p>
          Refund requests will be considered on a case-by-case basis and granted at our sole discretion. To request a
          refund, please contact us at{" "}
          <a href="mailto:support@opinionscope.xyz">support@opinionscope.xyz</a>.
        </p>

        <h3>Failed Payments</h3>
        <p>
          If a payment fails, we will attempt to charge your payment method again. If payment continues to fail, your
          subscription may be suspended or downgraded to the free tier. We will notify you of any payment issues via
          email.
        </p>

        <h2>Analytics</h2>
        <p>
          We use Umami, a privacy-focused analytics service, to collect anonymous usage statistics about how visitors
          interact with our Service. This data helps us improve the user experience. Umami does not use cookies or
          collect personally identifiable information.
        </p>

        <h2>Acceptable Use</h2>
        <p>You agree not to use the Service:</p>
        <ul>
          <li>In any way that violates any applicable national or international law or regulation.</li>
          <li>
            To transmit, or procure the sending of, any advertising or promotional material, including any &quot;junk
            mail&quot;, &quot;chain letter&quot;, &quot;spam&quot;, or any other similar solicitation.
          </li>
          <li>
            To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person
            or entity.
          </li>
          <li>
            To engage in any other conduct that restricts or inhibits anyone&apos;s use or enjoyment of the Service, or
            which may harm the Company or users of the Service.
          </li>
          <li>To attempt to gain unauthorized access to any portion of the Service or any related systems or networks.</li>
          <li>To scrape, data mine, or use automated systems to access the Service without our prior written consent.</li>
        </ul>

        <h2>Intellectual Property</h2>
        <p>
          The Service and its original content, features, and functionality are and will remain the exclusive property
          of OpinionScope and its licensors. The Service is protected by copyright, trademark, and other laws.
        </p>

        <h2>Disclaimer</h2>
        <p>
          <strong>
            THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS. THE COMPANY DISCLAIMS
            ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED.
          </strong>
        </p>
        <p>
          The information provided through the Service is for informational purposes only and should not be considered
          financial, investment, or trading advice. You acknowledge that:
        </p>
        <ul>
          <li>Prediction markets involve significant risk of loss.</li>
          <li>Past performance is not indicative of future results.</li>
          <li>
            You are solely responsible for your own investment decisions and any losses that may result from them.
          </li>
          <li>
            We do not guarantee the accuracy, completeness, or timeliness of any information provided through the
            Service.
          </li>
        </ul>

        <h2>Limitation of Liability</h2>
        <p>
          In no event shall OpinionScope, nor its directors, employees, partners, agents, suppliers, or affiliates, be
          liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation,
          loss of profits, data, use, goodwill, or other intangible losses, resulting from:
        </p>
        <ul>
          <li>Your access to or use of or inability to access or use the Service;</li>
          <li>Any conduct or content of any third party on the Service;</li>
          <li>Any content obtained from the Service;</li>
          <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
        </ul>

        <h2>Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless OpinionScope and its licensee and licensors, and their
          employees, contractors, agents, officers, and directors, from and against any and all claims, damages,
          obligations, losses, liabilities, costs or debt, and expenses arising from your use of the Service.
        </p>

        <h2>Termination</h2>
        <p>
          We may terminate or suspend your account immediately, without prior notice or liability, for any reason
          whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the
          Service will immediately cease.
        </p>

        <h2>Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with the laws of Vietnam, without regard to its
          conflict of law provisions.
        </p>

        <h2>Changes to Terms</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is
          material, we will try to provide at least 30 days&apos; notice prior to any new terms taking effect.
        </p>

        <h2>Contact Us</h2>
        <p>If you have any questions about these Terms, please contact us:</p>
        <ul>
          <li>
            By email:{" "}
            <a href="mailto:support@opinionscope.xyz">support@opinionscope.xyz</a>
          </li>
        </ul>
      </article>
    </div>
  );
}
