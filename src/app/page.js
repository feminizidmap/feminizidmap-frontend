import BlocksContent from "./BlocksContent";
import { getHome } from "../services/api";

export default async function Page() {
  let content = null;

  try {
    content = await getHome();
  } catch (error) {
    console.error("Failed to load home content", error);
  }

  if (!content) {
    return <main>
      <h1 className="purple display-1 fw-bold">A research project on femi(ni)cides in Germany</h1>
      <p className="fs-3">
        We document all murders of women* by men in Germany and we develop an online database on femi(ni)cide, the killing of women* because they are women*.
      </p>
      <p className="fs-3">
        Read more about the project and the definitions of femi(ni)cides.
      </p>
    </main>
  }

  return <main>
    <BlocksContent content={content} />
  </main>
}
