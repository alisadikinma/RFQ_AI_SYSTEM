import { redirect } from "next/navigation";

// Redirect ke /chat untuk new RFQ
export default function NewRFQPage() {
  redirect("/chat");
}
