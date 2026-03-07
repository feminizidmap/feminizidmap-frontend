import Map from "./map";
import "./page.css";
import { getCasesPublic, getCases } from "../../services/api";

async function getData() {
  return getCasesPublic();
}

export default async function Page() {
  const data = await getData();

  return (
    <main>
      <Map cases={data.data} />
    </main>
  );
}
