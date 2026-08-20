import Atelier from "@/components/atelier";

export default async function Home(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const raw = searchParams?.url;
  const initialUrl = typeof raw === "string" ? raw : "";
  return <Atelier initialUrl={initialUrl} />;
}
