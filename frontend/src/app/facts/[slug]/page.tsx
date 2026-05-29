import { FactsPage } from "@/components/pages/FactsPage";

export default function FactPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  return <FactsPage slug={slug} />;
}