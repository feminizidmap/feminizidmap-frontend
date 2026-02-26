import Map from "./map";
import "./page.css";
import { getCases } from "../../services/api";

async function getData() {
  return getCases({ populate: "*", pageSize: 20000 });
}

export default async function Page() {
  const data = await getData();

  console.log(data.data[0].crime);

  return <main>
    <div className="mb-3">
      <Map cases={data.data} />
    </div>
  </main>
}
