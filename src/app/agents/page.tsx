import { redirect } from "next/navigation";

export default function AgentsIndex() {
  // O Módulo de visualização em lista isolada será implementado em breve.
  // Por ora, o Rankings é a melhor tela mapeada para visualizar os Agentes Ativos.
  redirect("/rankings");
}
