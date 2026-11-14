import BlocksContent from "../BlocksContent";
import { getAbout } from "../../services/api";

export default async function Page() {
  let content = null;

  try {
    content = await getAbout();
  } catch (error) {
    console.error("Failed to load about content", error);
  }

  if (!content) {
    return <main>
      <p className="fs-3">
        We document all femi(ni)cides and killings of women* and girls* in Germany.
        Femi(ni)cide is intended to apply to certain killings of women* and girls* by men,
        those which occur in a context of a hierarchical power relationships where
        the subjects, women*/girls*, are placed on one side of that power structure, that
        of the subordinated; it is not meant to simply differentiate killings by the sex
        of the victims, distinguishing between homicides for males and femi(ni)cides for
        females. You can find more information on these concepts below.
        We acknowledge that we were inspired and helped by the work of Feminicidio.net.
      </p>
    </main>
  }

  return <main>
    <BlocksContent content={content} />
  </main>
}
