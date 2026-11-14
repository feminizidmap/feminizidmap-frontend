"use client";

import { BlocksRenderer } from "@strapi/blocks-react-renderer";

const blocks = {
  heading: ({ children, level }) => {
    const Tag = `h${level}`;
    return <Tag className={level === 1 ? "purple display-1 fw-bold" : "purple fw-bold"}>{children}</Tag>;
  },
  paragraph: ({ children }) => <p className="fs-3">{children}</p>,
  list: ({ children, format }) => {
    const Tag = format === "ordered" ? "ol" : "ul";
    return <Tag className="fs-3">{children}</Tag>;
  },
  link: ({ children, url }) => (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

export default function BlocksContent({ content }) {
  return <BlocksRenderer content={content} blocks={blocks} />;
}
