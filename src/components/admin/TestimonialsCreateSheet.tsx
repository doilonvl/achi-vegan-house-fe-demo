"use client";

import { Button } from "@/components/ui/button";
import ImageDropzone from "@/components/admin/ImageDropzone";
import { Input } from "@/components/ui/input";
import RatingInput from "@/components/admin/RatingInput";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type TestimonialsCreateSheetProps = {
  action: (formData: FormData) => void | Promise<void>;
  redirectPath: string;
};

export default function TestimonialsCreateSheet({
  action,
  redirectPath,
}: TestimonialsCreateSheetProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>New testimonial</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[min(92vw,640px)] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
          <DialogTitle>New testimonial</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new testimonial.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="px-6 pb-6 pt-4">
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
                <label htmlFor="quote_vi" className="text-sm font-medium">
                  Quote (vi)
                </label>
                <Textarea id="quote_vi" name="quote_vi" rows={3} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="quote_en" className="text-sm font-medium">
                  Quote (en)
                </label>
                <Textarea id="quote_en" name="quote_en" rows={3} />
              </div>
            </div>
            <RatingInput name="rating" />
            <div className="grid gap-2">
              <label htmlFor="authorName" className="text-sm font-medium">
                Author name
              </label>
              <Input id="authorName" name="authorName" required />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="authorRole_vi" className="text-sm font-medium">
                  Author role (vi)
                </label>
                <Input id="authorRole_vi" name="authorRole_vi" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="authorRole_en" className="text-sm font-medium">
                  Author role (en)
                </label>
                <Input id="authorRole_en" name="authorRole_en" />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="avatarInitials" className="text-sm font-medium">
                Avatar initials
              </label>
              <Input id="avatarInitials" name="avatarInitials" />
            </div>
            <ImageDropzone
              name="avatarFile"
              label="Avatar image (optional)"
              description="Upload a profile photo for the testimonial."
            />
            <ImageDropzone
              name="mediaFiles"
              label="Gallery images (optional)"
              description="Upload extra images for this testimonial."
              multiple
            />
            <div className="grid gap-2">
              <label htmlFor="source" className="text-sm font-medium">
                Source
              </label>
              <Input id="source" name="source" placeholder="google" required />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="sortOrder" className="text-sm font-medium">
                  Sort order
                </label>
                <Input id="sortOrder" name="sortOrder" type="number" />
              </div>
              <div className="flex flex-col gap-2 text-sm font-medium">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    className="h-4 w-4 rounded border-input"
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    className="h-4 w-4 rounded border-input"
                    defaultChecked
                  />
                  Active
                </label>
              </div>
            </div>
            <Button type="submit">Create testimonial</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
