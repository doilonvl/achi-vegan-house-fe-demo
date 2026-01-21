"use client";

import { useState } from "react";
import { X } from "lucide-react";
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
  avatarAsset?: { id: string; url: string };
  mediaAssets?: Array<{ id: string; url: string }>;
};

export default function TestimonialsEditDialog({
  item,
  action,
  deleteAction,
  redirectPath,
  avatarAsset,
  mediaAssets,
}: TestimonialsEditDialogProps) {
  const [currentAvatar, setCurrentAvatar] = useState(avatarAsset);
  const [currentGallery, setCurrentGallery] = useState(mediaAssets ?? []);
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
              value={currentAvatar?.id ?? ""}
            />
            <input
              type="hidden"
              name="existingMediaAssetIds"
              value={currentGallery.map((asset) => asset.id).join(", ")}
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
            {currentAvatar ? (
              <div className="grid gap-2">
                <p className="text-sm font-medium">Current avatar</p>
                <div className="relative h-24 w-24 overflow-hidden rounded-lg border bg-muted/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentAvatar.url}
                    alt={item.authorName}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentAvatar(undefined)}
                    className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-muted-foreground shadow hover:text-foreground"
                    aria-label="Remove avatar image"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            ) : null}
            <ImageDropzone
              name="avatarFile"
              label="Replace avatar image (optional)"
              description="Upload a new avatar to replace the current one."
            />
            {currentGallery.length ? (
              <div className="grid gap-2">
                <p className="text-sm font-medium">Current gallery images</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {currentGallery.map((asset) => (
                    <div
                      key={asset.id}
                      className="relative overflow-hidden rounded-lg border bg-muted/20"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.url}
                        alt={item.authorName}
                        className="h-40 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentGallery((prev) =>
                            prev.filter((entry) => entry.id !== asset.id)
                          )
                        }
                        className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-muted-foreground shadow hover:text-foreground"
                        aria-label="Remove gallery image"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <ImageDropzone
              name="mediaFiles"
              label="Add gallery images (optional)"
              description="Upload new images to add alongside existing gallery images."
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
