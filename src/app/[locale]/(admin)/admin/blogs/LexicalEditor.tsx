"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  type EditorState,
  REDO_COMMAND,
  UNDO_COMMAND,
  createCommand,
  DecoratorNode,
  ElementNode,
  KEY_BACKSPACE_COMMAND,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $createCodeNode, CodeHighlightNode, CodeNode } from "@lexical/code";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { AutoLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  INSERT_TABLE_COMMAND,
  TableCellNode,
  TableNode,
  TableRowNode,
  $insertTableRow__EXPERIMENTAL,
  $insertTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $deleteTableColumn__EXPERIMENTAL,
} from "@lexical/table";
import { TRANSFORMERS } from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import {
  AutoLinkPlugin,
  createLinkMatcherWithRegExp,
} from "@lexical/react/LexicalAutoLinkPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading2,
  Heading3,
  Image,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Underline,
  Undo2,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { uploadBlogImage, uploadBlogImages } from "@/lib/api/blogs.admin";
import type { RichDocJSON as LexicalDoc } from "@/types/blog";

type ImagePayload = {
  src: string;
  altText?: string;
  caption?: string | null;
  alignment?: ImageAlignment;
  size?: ImageSize;
};

type SerializedImageNode = Spread<
  {
    type: "image";
    version: 1;
    src: string;
    altText?: string;
    caption?: string | null;
    alignment?: ImageAlignment;
    size?: ImageSize;
  },
  SerializedLexicalNode
>;

type ImageAlignment = "full" | "left" | "right" | "center";
type ImageSize = "full" | "large" | "medium" | "small";

// Video types
type VideoSource = "youtube" | "vimeo" | "direct";
type VideoPayload = {
  src: string;
  videoSource: VideoSource;
  title?: string;
  caption?: string | null;
};

type SerializedVideoNode = Spread<
  {
    type: "video";
    version: 1;
    src: string;
    videoSource: VideoSource;
    title?: string;
    caption?: string | null;
  },
  SerializedLexicalNode
>;

// Layout types
type SerializedLayoutContainerNode = Spread<
  { type: "layout-container"; version: 1; templateColumns: string },
  SerializedElementNode
>;
type SerializedLayoutItemNode = Spread<
  { type: "layout-item"; version: 1 },
  SerializedElementNode
>;

const IMAGE_CLASSNAME = "w-full rounded-2xl border object-cover";
const IMAGE_SIZE_CLASSES: Record<ImageSize, string> = {
  full: "md:w-full",
  large: "md:w-2/3",
  medium: "md:w-1/2",
  small: "md:w-1/3",
};
const IMAGE_ALIGN_CLASSES: Record<ImageAlignment, string> = {
  full: "",
  center: "md:mx-auto",
  left: "md:float-left md:mr-6",
  right: "md:float-right md:ml-6",
};

const getImageLayoutClass = (alignment: ImageAlignment, size: ImageSize) => {
  const safeAlignment = IMAGE_ALIGN_CLASSES[alignment] ?? "";
  const safeSize = IMAGE_SIZE_CLASSES[size] ?? IMAGE_SIZE_CLASSES.full;
  if (alignment === "full") {
    return `${IMAGE_SIZE_CLASSES.full} ${safeAlignment}`.trim();
  }
  return `${safeSize} ${safeAlignment}`.trim();
};

export const INSERT_IMAGE_COMMAND = createCommand<ImagePayload>();
export const INSERT_VIDEO_COMMAND = createCommand<VideoPayload>();
export const INSERT_LAYOUT_COMMAND = createCommand<{
  templateColumns: string;
  columnCount: number;
}>();
export const REMOVE_LAYOUT_COMMAND = createCommand<void>();

// Helper functions for video
function parseVideoUrl(
  url: string,
): { source: VideoSource; id: string } | null {
  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) return { source: "youtube", id: match[1] };
  }

  // Vimeo patterns
  const vimeoPatterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];
  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern);
    if (match) return { source: "vimeo", id: match[1] };
  }

  // Direct video file
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) {
    return { source: "direct", id: url };
  }

  return null;
}

function getVideoEmbedUrl(src: string, source: VideoSource): string {
  if (source === "youtube") {
    const parsed = parseVideoUrl(src);
    if (parsed)
      return `https://www.youtube.com/embed/${parsed.id}?rel=0&modestbranding=1`;
  }
  if (source === "vimeo") {
    const parsed = parseVideoUrl(src);
    if (parsed)
      return `https://player.vimeo.com/video/${parsed.id}?title=0&byline=0&portrait=0`;
  }
  return src;
}

class ImageNode extends DecoratorNode<ReactNode> {
  __src: string;
  __altText: string;
  __caption: string | null;
  __alignment: ImageAlignment;
  __size: ImageSize;

  static getType() {
    return "image";
  }

  static clone(node: ImageNode) {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__caption,
      node.__alignment,
      node.__size,
      node.__key,
    );
  }

  constructor(
    src: string,
    altText = "",
    caption: string | null = null,
    alignment: ImageAlignment = "full",
    size: ImageSize = "full",
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__caption = caption;
    this.__alignment = alignment;
    this.__size = size;
  }

  static importJSON(serializedNode: SerializedImageNode) {
    return new ImageNode(
      serializedNode.src,
      serializedNode.altText || "",
      serializedNode.caption ?? null,
      serializedNode.alignment ?? "full",
      serializedNode.size ?? "full",
    );
  }

  exportJSON(): SerializedImageNode {
    return {
      type: "image",
      version: 1,
      src: this.__src,
      altText: this.__altText,
      caption: this.__caption,
      alignment: this.__alignment,
      size: this.__size,
    };
  }

  createDOM(_config: EditorConfig) {
    const span = document.createElement("span");
    return span;
  }

  updateDOM(_prevNode: ImageNode, _dom: HTMLElement, _config: EditorConfig) {
    return false;
  }

  isInline() {
    return false;
  }

  decorate(): ReactNode {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        caption={this.__caption}
        alignment={this.__alignment}
        size={this.__size}
        nodeKey={this.getKey()}
      />
    );
  }

  setAltText(altText: string) {
    const writable = this.getWritable();
    writable.__altText = altText;
  }

  setCaption(caption: string | null) {
    const writable = this.getWritable();
    writable.__caption = caption;
  }

  setAlignment(alignment: ImageAlignment) {
    const writable = this.getWritable();
    writable.__alignment = alignment;
  }

  setSize(size: ImageSize) {
    const writable = this.getWritable();
    writable.__size = size;
  }
}

function $isImageNode(
  node: { getType?: () => string } | null | undefined,
): node is ImageNode {
  return !!node && node.getType?.() === "image";
}

function ImageComponent({
  src,
  altText,
  caption,
  alignment,
  size,
  nodeKey,
}: {
  src: string;
  altText: string;
  caption: string | null;
  alignment: ImageAlignment;
  size: ImageSize;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey);
  const [isEditing, setIsEditing] = useState(false);
  const [draftAlt, setDraftAlt] = useState(altText);
  const [draftCaption, setDraftCaption] = useState(caption || "");
  const [draftAlignment, setDraftAlignment] =
    useState<ImageAlignment>(alignment);
  const [draftSize, setDraftSize] = useState<ImageSize>(size);

  useEffect(() => {
    setDraftAlt(altText);
  }, [altText]);

  useEffect(() => {
    setDraftCaption(caption || "");
  }, [caption]);

  useEffect(() => {
    setDraftAlignment(alignment);
  }, [alignment]);

  useEffect(() => {
    setDraftSize(size);
  }, [size]);

  const applyChanges = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setAltText(draftAlt.trim());
        node.setCaption(draftCaption.trim() ? draftCaption.trim() : null);
        node.setAlignment(draftAlignment);
        node.setSize(draftSize);
      }
    });
    setIsEditing(false);
  };

  const layoutClass = getImageLayoutClass(alignment, size);

  return (
    <figure className={cn("relative my-6 w-full md:clear-both", layoutClass)}>
      <div
        className="group relative"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setSelected(true);
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setSelected(true);
          setIsEditing(true);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={altText}
          className={[
            IMAGE_CLASSNAME,
            isSelected ? "ring-2 ring-amber-300/70" : "",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsEditing((prev) => !prev);
          }}
          className={cn(
            "absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-white",
            "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto",
            isSelected || isEditing ? "opacity-100 pointer-events-auto" : "",
          )}
        >
          Edit image
        </button>
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
      {isEditing ? (
        <div
          className="mt-3 grid gap-2 rounded-lg border bg-white p-3 text-xs shadow-sm"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="grid gap-1">
            <span className="font-semibold text-neutral-700">Alt text</span>
            <Input
              value={draftAlt}
              onChange={(event) => setDraftAlt(event.target.value)}
              placeholder="Alt text"
            />
          </div>
          <div className="grid gap-1">
            <span className="font-semibold text-neutral-700">Caption</span>
            <Input
              value={draftCaption}
              onChange={(event) => setDraftCaption(event.target.value)}
              placeholder="Caption"
            />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-1">
              <span className="font-semibold text-neutral-700">Alignment</span>
              <select
                className="h-9 rounded-md border px-2 text-xs"
                value={draftAlignment}
                onChange={(event) =>
                  setDraftAlignment(event.target.value as ImageAlignment)
                }
              >
                <option value="full">Full</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="center">Center</option>
              </select>
            </div>
            <div className="grid gap-1">
              <span className="font-semibold text-neutral-700">Size</span>
              <select
                className="h-9 rounded-md border px-2 text-xs"
                value={draftSize}
                onChange={(event) =>
                  setDraftSize(event.target.value as ImageSize)
                }
              >
                <option value="full">Full</option>
                <option value="large">Large</option>
                <option value="medium">Medium</option>
                <option value="small">Small</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={applyChanges}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </figure>
  );
}

function $createImageNode(payload: ImagePayload) {
  return new ImageNode(
    payload.src,
    payload.altText || "",
    payload.caption ?? null,
    payload.alignment ?? "full",
    payload.size ?? "full",
  );
}

// ============ VIDEO NODE ============

class VideoNode extends DecoratorNode<ReactNode> {
  __src: string;
  __videoSource: VideoSource;
  __title: string;
  __caption: string | null;

  static getType() {
    return "video";
  }

  static clone(node: VideoNode) {
    return new VideoNode(
      node.__src,
      node.__videoSource,
      node.__title,
      node.__caption,
      node.__key,
    );
  }

  constructor(
    src: string,
    videoSource: VideoSource = "direct",
    title = "",
    caption: string | null = null,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__videoSource = videoSource;
    this.__title = title;
    this.__caption = caption;
  }

  static importJSON(serializedNode: SerializedVideoNode) {
    return new VideoNode(
      serializedNode.src,
      serializedNode.videoSource || "direct",
      serializedNode.title || "",
      serializedNode.caption ?? null,
    );
  }

  exportJSON(): SerializedVideoNode {
    return {
      type: "video",
      version: 1,
      src: this.__src,
      videoSource: this.__videoSource,
      title: this.__title,
      caption: this.__caption,
    };
  }

  createDOM(_config: EditorConfig) {
    const span = document.createElement("span");
    return span;
  }

  updateDOM(_prevNode: VideoNode, _dom: HTMLElement, _config: EditorConfig) {
    return false;
  }

  isInline() {
    return false;
  }

  decorate(): ReactNode {
    return (
      <VideoComponent
        src={this.__src}
        videoSource={this.__videoSource}
        title={this.__title}
        caption={this.__caption}
        nodeKey={this.getKey()}
      />
    );
  }

  setTitle(title: string) {
    const writable = this.getWritable();
    writable.__title = title;
  }

  setCaption(caption: string | null) {
    const writable = this.getWritable();
    writable.__caption = caption;
  }
}

function $isVideoNode(
  node: { getType?: () => string } | null | undefined,
): node is VideoNode {
  return !!node && node.getType?.() === "video";
}

// ─── Layout nodes ────────────────────────────────────────────────────────────

class LayoutContainerNode extends ElementNode {
  __templateColumns: string;

  static getType() {
    return "layout-container";
  }

  static clone(node: LayoutContainerNode) {
    return new LayoutContainerNode(node.__templateColumns, node.__key);
  }

  constructor(templateColumns: string, key?: NodeKey) {
    super(key);
    this.__templateColumns = templateColumns;
  }

  static importJSON(serializedNode: SerializedLayoutContainerNode) {
    return new LayoutContainerNode(serializedNode.templateColumns);
  }

  exportJSON(): SerializedLayoutContainerNode {
    return {
      ...super.exportJSON(),
      type: "layout-container",
      version: 1,
      templateColumns: this.__templateColumns,
    };
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement("div");
    div.style.display = "grid";
    div.style.gridTemplateColumns = this.__templateColumns;
    div.style.gap = "1rem";
    div.style.margin = "1.5rem 0";
    div.style.alignItems = "start";
    return div;
  }

  updateDOM(prevNode: LayoutContainerNode, dom: HTMLElement): boolean {
    if (prevNode.__templateColumns !== this.__templateColumns) {
      (dom as HTMLElement).style.gridTemplateColumns = this.__templateColumns;
    }
    return false;
  }

  isInline() {
    return false;
  }
}

class LayoutItemNode extends ElementNode {
  static getType() {
    return "layout-item";
  }

  static clone(node: LayoutItemNode) {
    return new LayoutItemNode(node.__key);
  }

  static importJSON(_serializedNode: SerializedLayoutItemNode) {
    return new LayoutItemNode();
  }

  exportJSON(): SerializedLayoutItemNode {
    return {
      ...super.exportJSON(),
      type: "layout-item",
      version: 1,
    };
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement("div");
    div.style.minHeight = "2rem";
    div.style.padding = "4px";
    div.style.borderRadius = "8px";
    div.style.outline = "1px dashed #e2e8f0";
    div.style.minWidth = "0";
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  isInline() {
    return false;
  }
}

function $createLayoutContainerNode(templateColumns: string) {
  return new LayoutContainerNode(templateColumns);
}

function $createLayoutItemNode() {
  return new LayoutItemNode();
}

// Insert vào trong layout-item nếu cursor đang ở trong đó,
// nếu không thì insert tại nearest root như bình thường
function $smartInsertBlock(node: LexicalNode) {
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
    let current: LexicalNode | null = selection.focus.getNode();
    while (current !== null) {
      const p: ElementNode | null = current.getParent();
      if (p !== null && p.getType() === "layout-item") {
        // Nếu đang ở trong paragraph rỗng → thay thế luôn, không để lại paragraph thừa
        const isEmptyParagraph =
          current.getType() === "paragraph" &&
          current.getTextContent().trim() === "";
        if (isEmptyParagraph) {
          current.replace(node);
        } else {
          current.insertAfter(node);
        }
        node.selectNext();
        return;
      }
      current = p;
    }
  }
  $insertNodeToNearestRoot(node);
}

// ─────────────────────────────────────────────────────────────────────────────

function VideoComponent({
  src,
  videoSource,
  title,
  caption,
  nodeKey,
}: {
  src: string;
  videoSource: VideoSource;
  title: string;
  caption: string | null;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftCaption, setDraftCaption] = useState(caption || "");

  useEffect(() => {
    setDraftTitle(title);
  }, [title]);

  useEffect(() => {
    setDraftCaption(caption || "");
  }, [caption]);

  const applyChanges = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isVideoNode(node)) {
        node.setTitle(draftTitle.trim());
        node.setCaption(draftCaption.trim() ? draftCaption.trim() : null);
      }
    });
    setIsEditing(false);
  };

  const embedUrl = getVideoEmbedUrl(src, videoSource);

  return (
    <figure className="relative my-6 w-full">
      <div
        className="group relative"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setSelected(true);
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setSelected(true);
          setIsEditing(true);
        }}
      >
        <div
          className={cn(
            "relative aspect-video w-full overflow-hidden rounded-2xl border bg-slate-900",
            isSelected ? "ring-2 ring-amber-300/70" : "",
          )}
        >
          {videoSource === "direct" ? (
            <video
              src={src}
              controls
              className="h-full w-full object-contain"
              title={title || "Video"}
              preload="metadata"
            >
              <track kind="captions" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <iframe
              src={embedUrl}
              title={title || "Embedded video"}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsEditing((prev) => !prev);
          }}
          className={cn(
            "absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-white",
            "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto",
            isSelected || isEditing ? "opacity-100 pointer-events-auto" : "",
          )}
        >
          Edit video
        </button>
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
      {isEditing ? (
        <div
          className="mt-3 grid gap-2 rounded-lg border bg-white p-3 text-xs shadow-sm"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="grid gap-1">
            <span className="font-semibold text-neutral-700">Title</span>
            <Input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="Video title"
            />
          </div>
          <div className="grid gap-1">
            <span className="font-semibold text-neutral-700">Caption</span>
            <Input
              value={draftCaption}
              onChange={(event) => setDraftCaption(event.target.value)}
              placeholder="Caption (optional)"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={applyChanges}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </figure>
  );
}

function $createVideoNode(payload: VideoPayload) {
  return new VideoNode(
    payload.src,
    payload.videoSource,
    payload.title || "",
    payload.caption ?? null,
  );
}

const editorTheme = {
  paragraph: "mb-3 text-sm leading-6 text-foreground",
  indent: "editor-indent",
  heading: {
    h2: "mt-6 mb-2 text-xl font-semibold",
    h3: "mt-5 mb-2 text-lg font-semibold",
  },
  quote: "my-4 border-l-4 pl-4 italic text-muted-foreground",
  list: {
    ul: "my-3 ml-6 list-disc",
    ol: "my-3 ml-6 list-decimal",
    listitem: "my-1",
    nested: {
      listitem: "ml-4",
    },
  },
  code: "rounded bg-muted px-1 py-0.5 font-mono text-xs",
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    code: "rounded bg-muted px-1 py-0.5 font-mono text-xs",
  },
  table:
    "my-4 w-full border-collapse overflow-hidden rounded-lg border border-slate-200 text-sm",
  tableRow: "",
  tableCell:
    "border border-slate-200 px-3 py-2 align-top min-w-[80px] relative",
  tableCellHeader:
    "border border-slate-300 bg-slate-100 px-3 py-2 align-top font-semibold text-left min-w-[80px]",
  tableCellSelected: "bg-emerald-50",
  tableSelected: "outline outline-2 outline-offset-0 outline-emerald-400",
  tableSelectionCaret: "absolute right-0 bottom-0",
};

const URL_MATCHER = createLinkMatcherWithRegExp(
  /https?:\/\/[^\s]+/i,
  (text) => text,
);
const EMAIL_MATCHER = createLinkMatcherWithRegExp(
  /[\w.+-]+@[\w-]+\.[\w.-]+/i,
  (text) => `mailto:${text}`,
);

function ToolbarButton({
  onClick,
  label,
  icon,
  text,
  className,
}: {
  onClick: () => void;
  label: string;
  icon?: ReactNode;
  text?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn("h-8 gap-2 px-2 text-xs", className)}
      title={label}
      aria-label={label}
    >
      {icon ? <span className="h-4 w-4">{icon}</span> : null}
      {icon ? null : text || label}
    </Button>
  );
}

function ToolbarGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white/80 px-2 py-1 shadow-sm">
      {children}
    </div>
  );
}

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [imageAlignment, setImageAlignment] = useState<ImageAlignment>("full");
  const [imageSize, setImageSize] = useState<ImageSize>("full");

  // Video state
  const [showVideoPanel, setShowVideoPanel] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoCaption, setVideoCaption] = useState("");

  // Table state
  const [showTablePanel, setShowTablePanel] = useState(false);
  const [tableHoverRows, setTableHoverRows] = useState(0);
  const [tableHoverCols, setTableHoverCols] = useState(0);
  const [isInTable, setIsInTable] = useState(false);

  // Detect if cursor is inside a table
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setIsInTable(false);
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let node: any = selection.anchor.getNode();
        while (node !== null) {
          if (node.getType?.() === "table") {
            setIsInTable(true);
            return;
          }
          node = node.getParent?.() ?? null;
        }
        setIsInTable(false);
      });
    });
  }, [editor]);

  const addTableRowBelow = () => {
    editor.update(() => {
      $insertTableRow__EXPERIMENTAL(true);
    });
  };
  const addTableColumnRight = () => {
    editor.update(() => {
      $insertTableColumn__EXPERIMENTAL(true);
    });
  };
  const deleteTableRow = () => {
    editor.update(() => {
      $deleteTableRow__EXPERIMENTAL();
    });
  };
  const deleteTableColumn = () => {
    editor.update(() => {
      $deleteTableColumn__EXPERIMENTAL();
    });
  };

  const applyHeading = (tag: "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
    });
  };

  const applyParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const applyQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  const applyCodeBlock = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createCodeNode());
      }
    });
  };

  const insertLink = () => {
    const url = window.prompt("Enter a URL");
    if (!url) return;
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  };

  const insertLayout = (templateColumns: string, columnCount: number) => {
    editor.dispatchCommand(INSERT_LAYOUT_COMMAND, {
      templateColumns,
      columnCount,
    });
  };

  const insertImage = () => {
    setShowImagePanel((prev) => !prev);
    setShowVideoPanel(false);
    setShowTablePanel(false);
  };

  const confirmInsertImage = () => {
    if (!imageUrl.trim()) return;
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
      src: imageUrl.trim(),
      altText: imageAlt.trim(),
      caption: imageCaption.trim() || null,
      alignment: imageAlignment,
      size: imageSize,
    });
    setImageUrl("");
    setImageAlt("");
    setImageCaption("");
    setImageAlignment("full");
    setImageSize("full");
    setShowImagePanel(false);
  };

  const insertVideo = () => {
    setShowVideoPanel((prev) => !prev);
    setShowImagePanel(false);
    setShowTablePanel(false);
  };

  const confirmInsertVideo = () => {
    if (!videoUrl.trim()) return;
    const parsed = parseVideoUrl(videoUrl.trim());
    if (!parsed) {
      toast.error(
        "Invalid video URL. Supports YouTube, Vimeo, or direct video files (.mp4, .webm, .ogg)",
      );
      return;
    }
    editor.dispatchCommand(INSERT_VIDEO_COMMAND, {
      src: videoUrl.trim(),
      videoSource: parsed.source,
      title: videoTitle.trim(),
      caption: videoCaption.trim() || null,
    });
    setVideoUrl("");
    setVideoTitle("");
    setVideoCaption("");
    setShowVideoPanel(false);
  };

  return (
    <div className="sticky top-0 z-10 border-b bg-white/90 px-3 py-2 backdrop-blur">
      {isInTable ? (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5">
          <span className="text-[11px] font-semibold text-emerald-700">
            Bảng:
          </span>
          <ToolbarButton
            label="Thêm hàng bên dưới"
            text="+ Hàng"
            onClick={addTableRowBelow}
          />
          <ToolbarButton
            label="Thêm cột bên phải"
            text="+ Cột"
            onClick={addTableColumnRight}
          />
          <ToolbarButton
            label="Xóa hàng hiện tại"
            text="✕ Hàng"
            onClick={deleteTableRow}
            className="text-red-500 hover:text-red-600"
          />
          <ToolbarButton
            label="Xóa cột hiện tại"
            text="✕ Cột"
            onClick={deleteTableColumn}
            className="text-red-500 hover:text-red-600"
          />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <ToolbarGroup>
          <ToolbarButton
            label="Undo"
            onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
            icon={<Undo2 className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Redo"
            onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
            icon={<Redo2 className="h-4 w-4" />}
          />
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarButton
            label="Bold"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
            icon={<Bold className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Italic"
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
            }
            icon={<Italic className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Underline"
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
            }
            icon={<Underline className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Strike"
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
            }
            icon={<Strikethrough className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Inline code"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
            icon={<Code className="h-4 w-4" />}
          />
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarButton
            label="Paragraph"
            onClick={applyParagraph}
            text="P"
            className="px-3"
          />
          <ToolbarButton
            label="Heading 2"
            onClick={() => applyHeading("h2")}
            icon={<Heading2 className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Heading 3"
            onClick={() => applyHeading("h3")}
            icon={<Heading3 className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Quote"
            onClick={applyQuote}
            icon={<Quote className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Code block"
            onClick={applyCodeBlock}
            icon={<Code className="h-4 w-4" />}
          />
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarButton
            label="Bullet"
            onClick={() =>
              editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
            }
            icon={<List className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Number"
            onClick={() =>
              editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
            }
            icon={<ListOrdered className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Clear List"
            onClick={() =>
              editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
            }
            text="Clear"
          />
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarButton
            label="Align left"
            onClick={() =>
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")
            }
            icon={<AlignLeft className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Align center"
            onClick={() =>
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")
            }
            icon={<AlignCenter className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Align right"
            onClick={() =>
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")
            }
            icon={<AlignRight className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Indent"
            onClick={() =>
              editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
            }
            icon={<IndentIncrease className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Outdent"
            onClick={() =>
              editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
            }
            icon={<IndentDecrease className="h-4 w-4" />}
          />
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarButton
            label="Link"
            onClick={insertLink}
            icon={<Link2 className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Image"
            onClick={insertImage}
            icon={<Image className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Video"
            onClick={insertVideo}
            icon={<Video className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Table"
            onClick={() => {
              setShowTablePanel((prev) => !prev);
              setShowImagePanel(false);
              setShowVideoPanel(false);
            }}
            icon={<Table2 className="h-4 w-4" />}
          />
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarButton
            label="2 cột bằng nhau"
            onClick={() => insertLayout("1fr 1fr", 2)}
            text="2 Cols"
          />
          <ToolbarButton
            label="3 cột bằng nhau"
            onClick={() => insertLayout("1fr 1fr 1fr", 3)}
            text="3 Cols"
          />
          <ToolbarButton
            label="Ảnh trái | Chữ phải (1:2)"
            onClick={() => insertLayout("1fr 2fr", 2)}
            text="Img|Text"
          />
          <ToolbarButton
            label="Chữ trái | Ảnh phải (2:1)"
            onClick={() => insertLayout("2fr 1fr", 2)}
            text="Text|Img"
          />
          <ToolbarButton
            label="Bỏ layout — giữ lại nội dung (khi con trỏ đang trong layout)"
            onClick={() =>
              editor.dispatchCommand(REMOVE_LAYOUT_COMMAND, undefined)
            }
            text="✕ Layout"
            className="text-red-500 hover:text-red-600"
          />
        </ToolbarGroup>
      </div>
      {showImagePanel ? (
        <div className="mt-3 grid gap-2 rounded-lg border bg-white p-3 shadow-sm">
          <div className="grid gap-2 md:grid-cols-2">
            <Input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="Image URL"
            />
            <Input
              value={imageAlt}
              onChange={(event) => setImageAlt(event.target.value)}
              placeholder="Alt text (optional)"
            />
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              value={imageCaption}
              onChange={(event) => setImageCaption(event.target.value)}
              placeholder="Caption (optional)"
            />
            <div className="flex items-center gap-2">
              <Button type="button" onClick={confirmInsertImage}>
                Insert
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowImagePanel(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <select
              className="h-9 rounded-md border px-2 text-xs"
              value={imageAlignment}
              onChange={(event) =>
                setImageAlignment(event.target.value as ImageAlignment)
              }
            >
              <option value="full">Full</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="center">Center</option>
            </select>
            <select
              className="h-9 rounded-md border px-2 text-xs"
              value={imageSize}
              onChange={(event) =>
                setImageSize(event.target.value as ImageSize)
              }
            >
              <option value="full">Full</option>
              <option value="large">Large</option>
              <option value="medium">Medium</option>
              <option value="small">Small</option>
            </select>
          </div>
        </div>
      ) : null}
      {showVideoPanel ? (
        <div className="mt-3 grid gap-2 rounded-lg border bg-white p-3 shadow-sm">
          <div className="text-xs text-muted-foreground mb-1">
            Supports YouTube, Vimeo, or direct video files (.mp4, .webm, .ogg)
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <Input
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              placeholder="Video URL (YouTube, Vimeo, or direct link)"
            />
            <Input
              value={videoTitle}
              onChange={(event) => setVideoTitle(event.target.value)}
              placeholder="Title (optional)"
            />
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              value={videoCaption}
              onChange={(event) => setVideoCaption(event.target.value)}
              placeholder="Caption (optional)"
            />
            <div className="flex items-center gap-2">
              <Button type="button" onClick={confirmInsertVideo}>
                Insert Video
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowVideoPanel(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {showTablePanel ? (
        <div className="mt-3 rounded-lg border bg-white p-3 shadow-sm">
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            {tableHoverRows > 0 && tableHoverCols > 0
              ? `Bảng ${tableHoverRows} × ${tableHoverCols} — click để chèn`
              : "Di chuột để chọn kích thước bảng"}
          </div>
          <div
            className="inline-grid gap-1"
            style={{ gridTemplateColumns: `repeat(8, 1.5rem)` }}
            onMouseLeave={() => {
              setTableHoverRows(0);
              setTableHoverCols(0);
            }}
          >
            {Array.from({ length: 8 * 8 }).map((_, i) => {
              const row = Math.floor(i / 8) + 1;
              const col = (i % 8) + 1;
              const highlighted =
                row <= tableHoverRows && col <= tableHoverCols;
              return (
                <button
                  key={i}
                  type="button"
                  className={cn(
                    "h-6 w-6 rounded border transition-colors",
                    highlighted
                      ? "bg-emerald-500 border-emerald-600"
                      : "border-slate-200 bg-slate-50 hover:border-slate-400",
                  )}
                  onMouseEnter={() => {
                    setTableHoverRows(row);
                    setTableHoverCols(col);
                  }}
                  onClick={() => {
                    if (tableHoverRows > 0 && tableHoverCols > 0) {
                      editor.dispatchCommand(INSERT_TABLE_COMMAND, {
                        rows: String(tableHoverRows),
                        columns: String(tableHoverCols),
                      });
                      setShowTablePanel(false);
                      setTableHoverRows(0);
                      setTableHoverCols(0);
                    }
                  }}
                />
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setShowTablePanel(false)}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Hủy
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ImagePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const imageNode = $createImageNode(payload);
        $smartInsertBlock(imageNode);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}

function VideoPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_VIDEO_COMMAND,
      (payload) => {
        const videoNode = $createVideoNode(payload);
        $smartInsertBlock(videoNode);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}

function LayoutPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeInsert = editor.registerCommand(
      INSERT_LAYOUT_COMMAND,
      ({ templateColumns, columnCount }) => {
        const container = $createLayoutContainerNode(templateColumns);
        for (let i = 0; i < columnCount; i++) {
          const item = $createLayoutItemNode();
          item.append($createParagraphNode());
          container.append(item);
        }
        $insertNodeToNearestRoot(container);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );

    // Helper: tìm layout-container chứa selection hiện tại
    const findLayoutContainer = () => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return null;
      let node: LexicalNode = selection.anchor.getNode();
      let parent = node.getParent();
      while (parent !== null) {
        if (parent.getType() === "layout-container") return parent;
        if (parent.getType() === "layout-item") {
          const container = parent.getParent();
          return container?.getType() === "layout-container" ? container : null;
        }
        node = parent;
        parent = node.getParent();
      }
      return null;
    };

    // Nút ✕ Layout: unwrap content ra khỏi layout (giữ nội dung, xóa container)
    const removeLayoutCmd = editor.registerCommand(
      REMOVE_LAYOUT_COMMAND,
      () => {
        const container = findLayoutContainer();
        if (container) {
          const c = container as ElementNode;
          // Move all children from every layout-item to before the container
          for (const item of c.getChildren()) {
            if (item.getType() === "layout-item") {
              for (const child of (item as ElementNode).getChildren()) {
                container.insertBefore(child);
              }
            }
          }
          container.remove();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_EDITOR,
    );

    // Backspace tại ranh giới đầu layout cell:
    //   - Ô trống → xóa toàn bộ layout
    //   - Ô có nội dung → chặn thoát khỏi cell (tiêu thụ event, không làm gì)
    const removeBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        // Case: cursor anywhere inside an empty table → delete the whole table.
        // Works regardless of cursor offset — if table has no text content it's safe to remove.
        {
          let tableWalk: LexicalNode | null = selection.anchor.getNode();
          while (tableWalk !== null) {
            if (tableWalk.getType() === "table") {
              if (tableWalk.getTextContent().trim() === "") {
                tableWalk.remove();
                return true;
              }
              break; // Table has content – don't delete, fall through to normal backspace
            }
            tableWalk = tableWalk.getParent();
          }
        }

        if (selection.anchor.offset !== 0) return false;

        const anchorNode = selection.anchor.getNode();

        // Case: empty paragraph inside layout-item that is NOT the first child
        // (e.g. empty paragraph left after an image). Delete it directly.
        if (
          anchorNode.getType() === "paragraph" &&
          anchorNode.getTextContent().trim() === ""
        ) {
          const directParent = anchorNode.getParent();
          if (
            directParent?.getType() === "layout-item" &&
            directParent.getFirstChild() !== anchorNode
          ) {
            anchorNode.remove();
            return true;
          }
        }

        // Leo lên cây, chỉ xử lý nếu luôn là first child
        let node: LexicalNode = anchorNode;
        let parent = node.getParent();
        while (parent !== null) {
          // Nếu không phải first child tại tầng này → backspace bình thường
          if (parent.getFirstChild() !== node) return false;

          if (parent.getType() === "layout-item") {
            const container = parent.getParent();
            if (container?.getType() === "layout-container") {
              if (parent.getTextContent().trim() === "") {
                // Whole cell is empty → delete the entire container
                container.remove();
              } else if (
                anchorNode.getType() === "paragraph" &&
                anchorNode.getTextContent().trim() === ""
              ) {
                // Empty first-child paragraph but cell has other content
                // → delete just this empty paragraph to avoid trapping the cursor
                anchorNode.remove();
              }
              return true;
            }
            break;
          }
          node = parent;
          parent = node.getParent();
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );

    return () => {
      removeInsert();
      removeLayoutCmd();
      removeBackspace();
    };
  }, [editor]);

  return null;
}

function EditorSurface({ placeholder }: { placeholder?: string }) {
  const [editor] = useLexicalComposerContext();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((file) =>
        file.type.startsWith("image/"),
      );
      if (!list.length) return;
      setIsUploading(true);
      if (list.length > 1) {
        try {
          const results = await uploadBlogImages(list);
          if (!results.length) throw new Error("Empty upload result");
          results.forEach((item, index) => {
            const url = item.secure_url || item.url;
            if (!url) return;
            const fallback = list[index]?.name || "image";
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
              src: url,
              altText: fallback,
              caption: null,
            });
          });
          setIsUploading(false);
          return;
        } catch (error) {
          toast.error("Multi upload failed. Uploading one by one.");
        }
      }
      for (const file of list) {
        try {
          const result = await uploadBlogImage(file);
          const url = result.secure_url || result.url;
          if (!url) {
            throw new Error("Upload failed");
          }
          editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
            src: url,
            altText: file.name,
            caption: null,
          });
        } catch (error) {
          toast.error("Upload image failed.");
        }
      }
      setIsUploading(false);
    },
    [editor],
  );

  const handleDragOver = (event: DragEvent) => {
    if (event.dataTransfer?.types?.includes("Files")) {
      event.preventDefault();
    }
  };

  const handleDragEnter = (event: DragEvent) => {
    if (event.dataTransfer?.types?.includes("Files")) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (event: DragEvent) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragActive(false);
  };

  const handleDrop = (event: DragEvent) => {
    if (!event.dataTransfer?.files?.length) return;
    event.preventDefault();
    setIsDragActive(false);
    void handleFiles(event.dataTransfer.files);
  };

  const handlePaste = (event: ClipboardEvent) => {
    if (!event.clipboardData?.files?.length) return;
    event.preventDefault();
    void handleFiles(event.clipboardData.files);
  };

  return (
    <div className="relative">
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className="min-h-[320px] px-5 py-4 text-sm leading-7 text-slate-800 outline-none"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
          />
        }
        placeholder={
          <div className="pointer-events-none absolute left-5 top-4 text-sm text-muted-foreground">
            {placeholder || "Write something..."}
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      {isDragActive ? (
        <div className="pointer-events-none absolute inset-3 grid place-items-center rounded-xl border-2 border-dashed border-slate-300 bg-white/80 text-sm text-slate-600">
          Drop images to upload
        </div>
      ) : null}
      {isUploading ? (
        <div className="pointer-events-none absolute inset-3 grid place-items-center rounded-xl border border-slate-200 bg-white/90 text-sm text-slate-600">
          Uploading images...
        </div>
      ) : null}
    </div>
  );
}

type LexicalEditorProps = {
  value: LexicalDoc | null;
  onChange: (doc: LexicalDoc) => void;
  placeholder?: string;
  className?: string;
  editorKey?: string;
};

export default function LexicalEditor({
  value,
  onChange,
  placeholder,
  className,
  editorKey,
}: LexicalEditorProps) {
  const namespace = editorKey ? `blog-editor-${editorKey}` : "blog-editor";
  const initialConfig = {
    namespace,
    theme: editorTheme,
    onError(error: Error) {
      // eslint-disable-next-line no-console
      console.error(error);
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      ImageNode,
      VideoNode,
      LayoutContainerNode,
      LayoutItemNode,
    ],
    editorState: value ? JSON.stringify(value) : undefined,
  };

  const handleChange = useCallback(
    (editorState: EditorState) => {
      onChange(editorState.toJSON() as LexicalDoc);
    },
    [onChange],
  );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-sm ring-1 ring-transparent transition focus-within:ring-2 focus-within:ring-slate-200",
        className,
      )}
    >
      <LexicalComposer initialConfig={initialConfig} key={editorKey}>
        <ToolbarPlugin />
        <EditorSurface placeholder={placeholder} />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <AutoLinkPlugin matchers={[URL_MATCHER, EMAIL_MATCHER]} />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <TablePlugin hasCellMerge={false} hasCellBackgroundColor={false} />
        <OnChangePlugin onChange={handleChange} />
        <ImagePlugin />
        <VideoPlugin />
        <LayoutPlugin />
      </LexicalComposer>
    </div>
  );
}
