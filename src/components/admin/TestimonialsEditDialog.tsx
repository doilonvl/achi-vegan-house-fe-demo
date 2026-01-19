"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ImageDropzone from "@/components/admin/ImageDropzone";
import { Input } from "@/components/ui/input";
import RatingInput from "@/components/admin/RatingInput";
import { Textarea } from "@/components/ui/textarea";
import type { Testimonial } from "@/types/admin";

type TestimonialsEditDialogProps = {
  item: Testimonial;
  action: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  redirectPath: string;
};

export default function TestimonialsEditDialog({
  item,
  action,
  deleteAction,
  redirectPath,
}: TestimonialsEditDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[min(94vw,720px)] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
          <DialogTitle>Edit testimonial</DialogTitle>
          <DialogDescription className="sr-only">
            Update or delete a testimonial.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 pt-4">
          <form action={action} className="grid gap-4">
            <input type="hidden" name="id" value={item._id} />
            <input type="hidden" name="redirect" value={redirectPath} />
            <input
              type="hidden"
              name="existingAvatarAssetId"
              value={item.avatarAssetId ?? ""}
            />
            <input
              type="hidden"
              name="existingMediaAssetIds"
              value={item.mediaAssetIds?.join(", ") ?? ""}
            />
            <div className="grid gap-2">
              <label
                htmlFor={`slug-${item._id}`}
                className="text-sm font-medium"
              >
                Slug
              </label>
              <Input
                id={`slug-${item._id}`}
                name="slug"
                defaultValue={item.slug}
                required
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label
                  htmlFor={`quote-vi-${item._id}`}
                  className="text-sm font-medium"
                >
                  Quote (vi)
                </label>
                <Textarea
                  id={`quote-vi-${item._id}`}
                  name="quote_vi"
                  rows={3}
                  defaultValue={item.quote_i18n?.vi ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor={`quote-en-${item._id}`}
                  className="text-sm font-medium"
                >
                  Quote (en)
                </label>
                <Textarea
                  id={`quote-en-${item._id}`}
                  name="quote_en"
                  rows={3}
                  defaultValue={item.quote_i18n?.en ?? ""}
                />
              </div>
            </div>
            <RatingInput name="rating" defaultValue={item.rating ?? null} />
            <div className="grid gap-2">
              <label
                htmlFor={`author-${item._id}`}
                className="text-sm font-medium"
              >
                Author name
              </label>
              <Input
                id={`author-${item._id}`}
                name="authorName"
                defaultValue={item.authorName}
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label
                  htmlFor={`role-vi-${item._id}`}
                  className="text-sm font-medium"
                >
                  Author role (vi)
                </label>
                <Input
                  id={`role-vi-${item._id}`}
                  name="authorRole_vi"
                  defaultValue={item.authorRole_i18n?.vi ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor={`role-en-${item._id}`}
                  className="text-sm font-medium"
                >
                  Author role (en)
                </label>
                <Input
                  id={`role-en-${item._id}`}
                  name="authorRole_en"
                  defaultValue={item.authorRole_i18n?.en ?? ""}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label
                htmlFor={`initials-${item._id}`}
                className="text-sm font-medium"
              >
                Avatar initials
              </label>
              <Input
                id={`initials-${item._id}`}
                name="avatarInitials"
                defaultValue={item.avatarInitials ?? ""}
              />
            </div>
            <ImageDropzone
              name="avatarFile"
              label="Replace avatar image (optional)"
              description="Upload a new avatar to replace the current one."
            />
            <ImageDropzone
              name="mediaFiles"
              label="Replace gallery images (optional)"
              description="Upload new images to replace existing gallery images."
              multiple
            />
            <div className="grid gap-2">
              <label
                htmlFor={`source-${item._id}`}
                className="text-sm font-medium"
              >
                Source
              </label>
              <Input
                id={`source-${item._id}`}
                name="source"
                defaultValue={item.source ?? ""}
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label
                  htmlFor={`sort-${item._id}`}
                  className="text-sm font-medium"
                >
                  Sort order
                </label>
                <Input
                  id={`sort-${item._id}`}
                  name="sortOrder"
                  type="number"
                  defaultValue={
                    typeof item.sortOrder === "number" ? item.sortOrder : ""
                  }
                />
              </div>
              <div className="flex flex-col gap-2 text-sm font-medium">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    className="h-4 w-4 rounded border-input"
                    defaultChecked={item.isFeatured ?? false}
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    className="h-4 w-4 rounded border-input"
                    defaultChecked={item.isActive ?? true}
                  />
                  Active
                </label>
              </div>
            </div>
            <Button type="submit">Save changes</Button>
          </form>

          <form action={deleteAction} className="mt-4">
            <input type="hidden" name="id" value={item._id} />
            <input type="hidden" name="redirect" value={redirectPath} />
            <Button type="submit" variant="destructive">
              Delete testimonial
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
