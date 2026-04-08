import { redirect } from "next/navigation";

export default function PoliciesIndex() {
  // O Módulo de cadastro e edição de Score Policies não pertence a este MVP.
  // Direcionamos para Radar e Auditoria, onde a Governança é observada no momento.
  redirect("/audit");
}
