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
import { Textarea } from "@/components/ui/textarea";
import type { MediaAsset } from "@/types/admin";

type MediaAssetsEditDialogProps = {
  item: MediaAsset;
  action: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  redirectPath: string;
};

export default function MediaAssetsEditDialog({
  item,
  action,
  deleteAction,
  redirectPath,
}: MediaAssetsEditDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[min(94vw,720px)] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
          <DialogTitle>Edit media asset</DialogTitle>
          <DialogDescription className="sr-only">
            Update or delete a media asset.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 pt-4">
          <div className="flex items-center gap-4 rounded-lg border bg-muted/20 p-3">
            <div className="h-16 w-16 overflow-hidden rounded-md bg-muted/30">
              {item.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt={item.alt ?? item.slug}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{item.slug}</p>
              <p className="break-all">{item.url}</p>
            </div>
          </div>

          <form action={action} className="mt-4 grid gap-4">
            <input type="hidden" name="id" value={item._id} />
            <input type="hidden" name="redirect" value={redirectPath} />
            <div className="grid gap-2">
              <label htmlFor={`slug-${item._id}`} className="text-sm font-medium">
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
                  htmlFor={`kind-${item._id}`}
                  className="text-sm font-medium"
                >
                  Kind
                </label>
                <Input id={`kind-${item._id}`} name="kind" defaultValue={item.kind} />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor={`provider-${item._id}`}
                  className="text-sm font-medium"
                >
                  Provider
                </label>
                <Input
                  id={`provider-${item._id}`}
                  name="provider"
                  defaultValue={item.provider ?? ""}
                />
              </div>
            </div>
            <ImageDropzone
              name="file"
              label="Replace image (optional)"
              description="Upload a new image to replace the current one."
            />
            <div className="grid gap-2">
              <label htmlFor={`url-${item._id}`} className="text-sm font-medium">
                Asset URL
              </label>
              <Input
                id={`url-${item._id}`}
                name="url"
                defaultValue={item.url}
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label
                  htmlFor={`alt-vi-${item._id}`}
                  className="text-sm font-medium"
                >
                  Alt text (vi)
                </label>
                <Input
                  id={`alt-vi-${item._id}`}
                  name="alt_vi"
                  defaultValue={item.alt_i18n?.vi ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor={`alt-en-${item._id}`}
                  className="text-sm font-medium"
                >
                  Alt text (en)
                </label>
                <Input
                  id={`alt-en-${item._id}`}
                  name="alt_en"
                  defaultValue={item.alt_i18n?.en ?? ""}
                />
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label
                  htmlFor={`caption-vi-${item._id}`}
                  className="text-sm font-medium"
                >
                  Caption (vi)
                </label>
                <Textarea
                  id={`caption-vi-${item._id}`}
                  name="caption_vi"
                  rows={3}
                  defaultValue={item.caption_i18n?.vi ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor={`caption-en-${item._id}`}
                  className="text-sm font-medium"
                >
                  Caption (en)
                </label>
                <Textarea
                  id={`caption-en-${item._id}`}
                  name="caption_en"
                  rows={3}
                  defaultValue={item.caption_i18n?.en ?? ""}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor={`tags-${item._id}`} className="text-sm font-medium">
                Tags (comma separated)
              </label>
              <Input
                id={`tags-${item._id}`}
                name="tags"
                defaultValue={item.tags?.join(", ") ?? ""}
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
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name="isActive"
                  className="h-4 w-4 rounded border-input"
                  defaultChecked={item.isActive ?? true}
                />
                Active
              </label>
            </div>
            <Button type="submit">Save changes</Button>
          </form>

          <form action={deleteAction} className="mt-4">
            <input type="hidden" name="id" value={item._id} />
            <input type="hidden" name="redirect" value={redirectPath} />
            <Button type="submit" variant="destructive">
              Delete asset
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
