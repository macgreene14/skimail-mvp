import resortCollection from "../../../../assets/resorts.json";
import ResortPage from "./ResortPage";

export function generateStaticParams() {
  return resortCollection.features.map((feature) => ({
    slug: feature.properties.slug,
  }));
}

export default function Page({ params }) {
  return <ResortPage slug={params.slug} />;
}
