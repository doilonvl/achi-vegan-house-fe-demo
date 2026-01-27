"use client";

import { useParams } from "next/navigation";
import BlogEditor from "../BlogEditor";

export default function AdminBlogEditPage() {
  const params = useParams();
  const blogId = String(params?.id || "");

  return <BlogEditor mode="edit" blogId={blogId} />;
}
