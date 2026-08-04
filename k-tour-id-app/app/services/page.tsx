import { redirect } from "next/navigation"

export default async function LegacyServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const focus = category === "delivery"
    ? "food"
    : category === "convenience"
      ? "shopping"
      : category === "mobility" || category === "shopping"
        ? category
        : null
  redirect(focus ? `/explore?focus=${focus}` : "/explore")
}
