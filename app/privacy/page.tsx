import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — QR Atelier",
  description:
    "How QR Atelier handles your data: what stays in your browser, what our servers touch, and how advertising cookies are used.",
};

const UPDATED = "August 20, 2026";

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated={UPDATED}>
      <h2>The short version</h2>
      <p>
        QR Atelier generates every QR code and barcode locally, inside your
        browser. The codes you create, the colors you pick, and the images you
        upload as logos are never transmitted to us and never stored on a
        server. There are no accounts and no tracking of what you design.
      </p>

      <h2>What actually leaves your browser</h2>
      <p>
        One feature makes a network request: <strong>&ldquo;Brand it&rdquo;</strong>. When you
        paste a website URL and ask us to detect its branding, your browser
        sends that URL to our own server, which fetches the page to read its
        title, description, theme color, and icon. We use the result to build
        your QR code and then discard it — the fetched page is not logged or
        retained. If you never use that feature, no URL you type ever reaches us.
      </p>
      <p>
        Our host records standard server logs (IP address, user agent, time of
        request) as part of normal operation and abuse prevention. We do not
        combine these with anything you design.
      </p>

      <h2>Camera</h2>
      <p>
        The scanner asks for camera permission only when you press &ldquo;Test it with
        your camera&rdquo;. The video is processed entirely on your device to decode
        the code in frame. No frame, image, or video is uploaded or recorded.
        Revoking the permission in your browser stops it immediately.
      </p>

      <h2>Advertising and cookies</h2>
      <p>
        This site displays ads served by Google AdSense. Specifically:
      </p>
      <ul>
        <li>
          Third-party vendors, including Google, use cookies to serve ads based
          on your prior visits to this site or other sites.
        </li>
        <li>
          Google&rsquo;s use of advertising cookies enables it and its partners to
          serve ads to you based on your visit to this and/or other sites on the
          internet.
        </li>
        <li>
          You may opt out of personalized advertising by visiting{" "}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
            Google Ads Settings
          </a>
          .
        </li>
        <li>
          You can opt out of some third-party vendors&rsquo; use of cookies for
          personalized advertising at{" "}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">
            aboutads.info/choices
          </a>{" "}
          or{" "}
          <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer">
            the NAI opt-out page
          </a>
          .
        </li>
      </ul>
      <p>
        Google&rsquo;s handling of data from partner sites is described in its{" "}
        <a
          href="https://policies.google.com/technologies/partner-sites"
          target="_blank"
          rel="noopener noreferrer"
        >
          partner-sites policy
        </a>
        .
      </p>

      <h2>If you are in the EU, UK, or Switzerland</h2>
      <p>
        Where required, a consent banner asks permission before any personalized
        advertising cookie is set, and you can change or withdraw that choice at
        any time from the same banner. Our legal basis for the branding fetch and
        server logs is legitimate interest in operating the service; for
        advertising cookies it is your consent. You have the right to access,
        correct, delete, or port your personal data, and to complain to your
        local supervisory authority.
      </p>

      <h2>Children</h2>
      <p>
        QR Atelier is not directed at children under 13, and we do not knowingly
        collect personal information from them.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes materially, the date above changes with it.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy or your data:{" "}
        <a href="mailto:etsygurruofficetool@gmail.com">
          etsygurruofficetool@gmail.com
        </a>
        .
      </p>
    </LegalPage>
  );
}
