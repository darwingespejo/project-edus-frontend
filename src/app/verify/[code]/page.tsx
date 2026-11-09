import VerifyClient from "@/components/Verify";

export default async function VerifyCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <VerifyClient initialCode={code} />;
}
