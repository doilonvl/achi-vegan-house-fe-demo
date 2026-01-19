"use client";

import { Button } from "@/components/ui/button";
import ImageDropzone from "@/components/admin/ImageDropzone";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type MediaAssetsCreateSheetProps = {
  action: (formData: FormData) => void | Promise<void>;
  redirectPath: string;
};

export default function MediaAssetsCreateSheet({
  action,
  redirectPath,
}: MediaAssetsCreateSheetProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>New asset</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[min(92vw,640px)] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
          <DialogTitle>New media asset</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new media asset.
          </DialogDescription>
        </DialogHeader>
        <form
          action={action}
          className="px-6 pb-6 pt-4"
        >
          <input type="hidden" name="redirect" value={redirectPath} />
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="slug" className="text-sm font-medium">
                Slug
              </label>
              <Input id="slug" name="slug" required />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="kind" className="text-sm font-medium">
                  Kind
                </label>
                <Input id="kind" name="kind" placeholder="image" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="provider" className="text-sm font-medium">
                  Provider
                </label>
                <Input id="provider" name="provider" placeholder="cloudinary" />
              </div>
            </div>
            <ImageDropzone
              name="file"
              label="Upload image (optional)"
              description="PNG, JPG, or WebP are supported."
            />
            <div className="grid gap-2">
              <label htmlFor="url" className="text-sm font-medium">
                Asset URL
              </label>
              <Input id="url" name="url" placeholder="https://..." />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="alt_vi" className="text-sm font-medium">
                  Alt text (vi)
                </label>
                <Input id="alt_vi" name="alt_vi" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="alt_en" className="text-sm font-medium">
                  Alt text (en)
                </label>
                <Input id="alt_en" name="alt_en" />
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="caption_vi" className="text-sm font-medium">
                  Caption (vi)
                </label>
                <Textarea id="caption_vi" name="caption_vi" rows={3} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="caption_en" className="text-sm font-medium">
                  Caption (en)
                </label>
                <Textarea id="caption_en" name="caption_en" rows={3} />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="tags" className="text-sm font-medium">
                Tags (comma separated)
              </label>
              <Input id="tags" name="tags" placeholder="hero, homepage" />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="sortOrder" className="text-sm font-medium">
                  Sort order
                </label>
                <Input id="sortOrder" name="sortOrder" type="number" />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name="isActive"
                  className="h-4 w-4 rounded border-input"
                  defaultChecked
                />
                Active
              </label>
            </div>
            <Button type="submit">Create asset</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
