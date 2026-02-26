import Map from "./map";
import "./page.css";
import { getCases } from "../../services/api";

async function getData() {
  return getCases({ populate: "*", pageSize: 20000 });
}

export default async function Page() {
  const data = await getData();
  return (
    <main className="py-2 py-md-3">
      <Map cases={data.data} />
    </main>
  );
}
