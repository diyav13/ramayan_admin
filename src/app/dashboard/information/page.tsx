import { redirect } from "next/navigation";

/** Old Information hub — now separate Characters, Locations, Quiz Instructions pages. */
export default function InformationRedirectPage() {
  redirect("/dashboard/characters");
}
