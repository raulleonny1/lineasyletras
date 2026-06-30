import { redirect } from "next/navigation";

export default function NewStoryRedirect() {
  redirect("/admin/escribir");
}
