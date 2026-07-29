import { redirect } from "next/navigation"

/** The canonical interactive architecture surface is the evidence dashboard. */
export default function ArchitecturePage() {
  redirect("/evidence")
}
