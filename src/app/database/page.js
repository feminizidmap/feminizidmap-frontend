import "./page.css";
import CasesList from "./CasesList";
import { getCases } from "../../services/api";

async function getData() {
  return getCases({ populate: "*", pageSize: 20000 });
}

export default async function Page() {
  const data = await getData();

  return <main>
    <CasesList cases={data} />
  </main>
}
