"use client";

import { usePathname } from "next/navigation";
import { Container } from "react-bootstrap";
import Navigation from "./Navigation";
import Image from "next/image";

export default function LayoutShell({ children }) {
  const pathname = usePathname();

  if (pathname === "/map") {
    return children;
  }

  return (
    <Container>
      <Image
        alt="FeminizidMap.org"
        src="/title.svg"
        className="pt-3 d-none d-lg-block w-100 h-auto"
        width={0}
        height={0}
      />
      <Navigation />
      <div className="my-4">{children}</div>
    </Container>
  );
}
