import { ClaimResultPage } from "@/components/pages/ClaimResultPage";

export default function ResultPage({ params }: { params: { id: string } }) {
  return <ClaimResultPage claimId={Number(params.id)} />;
}
