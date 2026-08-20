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
        This site shows no ads, uses no advertising or analytics cookies, and
        embeds no third-party trackers. Nothing on this site profiles you or
        follows you across the web.
      </p>

      <h2>If you are in the EU, UK, or Switzerland</h2>
      <p>
        Because we set no advertising or analytics cookies, there is no consent
        banner to accept. The only processing is the branding fetch you trigger
        explicitly and standard server logs, both on the basis of legitimate
        interest in operating the service. You have the right to access,
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
