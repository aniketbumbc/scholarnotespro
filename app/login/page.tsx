import { LandingPage } from "../src/components/docs/landing-page";
import { AuthCard } from "../src/components/auth/auth-card";

export default function LoginPage() {
  return <LandingPage heroAside={<AuthCard />} ctaHref="#signin" />;
}
