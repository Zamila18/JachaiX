import { Suspense } from "react";
import { LoginPage } from "@/components/pages/LoginPage";

export default function Page() {
  // useSearchParams() (read ?returnUrl) requires a Suspense boundary for
  // Next.js production prerendering.
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
