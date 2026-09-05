"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useHotkeys } from "@/components/hotkeys-context"
import {
  Bold,
  Italic,
  Strikethrough,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Table2,
  Undo2,
  Redo2,
  Eye,
  Pencil,
  Columns,
  FileCode2,
} from "lucide-react"
import { MilkdownProvider, Milkdown, useEditor, useInstance } from "@milkdown/react"
import { Editor, rootCtx, defaultValueCtx, editorViewOptionsCtx } from "@milkdown/kit/core"
import {
  commonmark,
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  wrapInHeadingCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  createCodeBlockCommand,
  toggleLinkCommand,
  insertImageCommand,
  insertHrCommand,
} from "@milkdown/kit/preset/commonmark"
import {
  gfm,
  toggleStrikethroughCommand,
  insertTableCommand,
} from "@milkdown/kit/preset/gfm"
import { history, undoCommand, redoCommand } from "@milkdown/kit/plugin/history"
import { clipboard } from "@milkdown/kit/plugin/clipboard"
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener"
import { callCommand } from "@milkdown/kit/utils"
import { nord } from "@milkdown/theme-nord"
import { useT } from "@/lib/i18n"
import { uploadImage } from "@/lib/api"

type Mode = "preview" | "editor" | "split" | "source"

interface Props {
  value: string
  onChange: (md: string) => void
  /** 初始模式，默认 preview；新建笔记落地时传 editor 直接进入编辑 */
  initialMode?: Mode
}

type IconType = typeof Bold

interface ToolbarButtonProps {
  icon: IconType
  label: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  active = false,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      disabled={disabled}
      className={[
        "w-7 h-7 flex items-center justify-center rounded transition-colors",
        disabled
          ? "text-warm-300 cursor-not-allowed"
          : active
            ? "bg-warm-200 text-warm-900"
            : "text-warm-700 hover:bg-warm-200 hover:text-warm-900",
      ].join(" ")}
    >
      <Icon size={15} />
    </button>
  )
}

function Sep() {
  return <span className="w-px h-5 bg-warm-300/60 mx-1" aria-hidden />
}

interface ModeSwitcherProps {
  mode: Mode
  setMode: (mode: Mode) => void
}

function ModeSwitcher({ mode, setMode }: ModeSwitcherProps) {
  const { t } = useT()
  const modes: { key: Mode; icon: IconType; label: string }[] = [
    { key: "preview", icon: Eye, label: t("editor.modePreview") },
    { key: "editor", icon: Pencil, label: t("editor.modeEditor") },
    { key: "split", icon: Columns, label: t("editor.modeSplit") },
    { key: "source", icon: FileCode2, label: t("editor.modeSource") },
  ]

  return (
    <div className="flex items-center gap-0.5">
      {modes.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          type="button"
          title={label}
          onClick={() => setMode(key)}
          onMouseDown={(e) => e.preventDefault()}
          className={[
            "flex items-center gap-1 px-2 h-7 rounded text-xs transition-colors",
            mode === key
              ? "bg-warm-200 text-warm-900 font-medium"
              : "text-warm-600 hover:bg-warm-100 hover:text-warm-800",
          ].join(" ")}
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  )
}

interface ToolbarProps {
  mode: Mode
  setMode: (mode: Mode) => void
  onRunReady?: (run: (key: Parameters<typeof callCommand>[0], payload?: unknown) => void) => void
}

function Toolbar({ mode, setMode, onRunReady }: ToolbarProps) {
  const { t } = useT()
  const [loading, getInstance] = useInstance()
  const editable = mode === "editor" || mode === "split"

  const run = useCallback(
    (key: Parameters<typeof callCommand>[0], payload?: unknown) => {
      if (loading || !editable) return
      const editor = getInstance()
      if (!editor) return
      editor.action(callCommand(key, payload))
    },
    [loading, getInstance, editable],
  )

  useEffect(() => {
    onRunReady?.(run)
  }, [run, onRunReady])

  const handleLink = useCallback(() => {
    if (!editable) return
    const url = window.prompt(t("editor.linkPrompt"), "https://")
    if (url === null) return
    run(toggleLinkCommand.key, { href: url })
  }, [run, editable, t])

  // 图片：选择本地文件 → 上传 Supabase Storage → 插入公开 URL
  const handleImage = useCallback(() => {
    if (!editable) return
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/bmp"
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const url = await uploadImage(file)
        run(insertImageCommand.key, { src: url })
      } catch (e) {
        console.error("image upload failed", e)
        alert(t("editor.imageUploadFailed") + (e as Error).message)
      }
    }
    input.click()
  }, [run, editable, t])

  const handleTable = useCallback(() => {
    if (!editable) return
    run(insertTableCommand.key, { row: 3, col: 3 })
  }, [run, editable])

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-warm-200 bg-warm-50/60 flex-wrap shrink-0">
      <ModeSwitcher mode={mode} setMode={setMode} />
      <Sep />
      <ToolbarButton
        icon={Bold}
        label={t("editor.bold")}
        onClick={() => run(toggleStrongCommand.key)}
        disabled={!editable}
      />
      <ToolbarButton
        icon={Italic}
        label={t("editor.italic")}
        onClick={() => run(toggleEmphasisCommand.key)}
        disabled={!editable}
      />
      <ToolbarButton
        icon={Strikethrough}
        label={t("editor.strikethrough")}
        onClick={() => run(toggleStrikethroughCommand.key)}
        disabled={!editable}
      />
      <ToolbarButton
        icon={Code2}
        label={t("editor.inlineCode")}
        onClick={() => run(toggleInlineCodeCommand.key)}
        disabled={!editable}
      />
      <Sep />
      <ToolbarButton
        icon={Heading1}
        label={t("editor.h1")}
        onClick={() => run(wrapInHeadingCommand.key, 1)}
        disabled={!editable}
      />
      <ToolbarButton
        icon={Heading2}
        label={t("editor.h2")}
        onClick={() => run(wrapInHeadingCommand.key, 2)}
        disabled={!editable}
      />
      <ToolbarButton
        icon={Heading3}
        label={t("editor.h3")}
        onClick={() => run(wrapInHeadingCommand.key, 3)}
        disabled={!editable}
      />
      <Sep />
      <ToolbarButton
        icon={Quote}
        label={t("editor.quote")}
        onClick={() => run(wrapInBlockquoteCommand.key)}
        disabled={!editable}
      />
      <ToolbarButton
        icon={List}
        label={t("editor.bulletList")}
        onClick={() => run(wrapInBulletListCommand.key)}
        disabled={!editable}
      />
      <ToolbarButton
        icon={ListOrdered}
        label={t("editor.orderedList")}
        onClick={() => run(wrapInOrderedListCommand.key)}
        disabled={!editable}
      />
      <Sep />
      <ToolbarButton
        icon={LinkIcon}
        label={t("editor.link")}
        onClick={handleLink}
        disabled={!editable}
      />
      <ToolbarButton
        icon={ImageIcon}
        label={t("editor.image")}
        onClick={handleImage}
        disabled={!editable}
      />
      <ToolbarButton
        icon={Minus}
        label={t("editor.hr")}
        onClick={() => run(insertHrCommand.key)}
        disabled={!editable}
      />
      <Sep />
      <ToolbarButton
        icon={Code2}
        label={t("editor.codeBlock")}
        onClick={() => run(createCodeBlockCommand.key)}
        disabled={!editable}
      />
      <ToolbarButton
        icon={Table2}
        label={t("editor.table")}
        onClick={handleTable}
        disabled={!editable}
      />
      <Sep />
      <ToolbarButton
        icon={Undo2}
        label={t("editor.undo")}
        onClick={() => run(undoCommand.key)}
        disabled={!editable}
      />
      <ToolbarButton
        icon={Redo2}
        label={t("editor.redo")}
        onClick={() => run(redoCommand.key)}
        disabled={!editable}
      />
    </div>
  )
}

interface MilkdownCoreProps {
  value: string
  onChange?: (md: string) => void
  editable: boolean
  syncOnValueChange?: boolean
}

function MilkdownCore({ value, onChange, editable, syncOnValueChange = false }: MilkdownCoreProps) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const deps = syncOnValueChange ? [editable, value] : [editable]

  const editor = useEditor((root) => {
    return Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, value)
        ctx.get(listenerCtx).markdownUpdated((_ctx, md) => {
          if (onChangeRef.current) {
            onChangeRef.current(md)
          }
        })
        ctx.set(editorViewOptionsCtx, {
          editable: () => editable,
          attributes: {
            class: "thinkingnotes-milkdown",
            spellcheck: "false",
          },
        })
      })
      .config(nord)
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(clipboard)
      .use(listener)
  }, deps)

  return <Milkdown />
}

interface SourceEditorProps {
  value: string
  onChange: (md: string) => void
}

function SourceEditor({ value, onChange }: SourceEditorProps) {
  const { t } = useT()
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const v = e.target.value
      setLocalValue(v)
      onChange(v)
    },
    [onChange],
  )

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-warm-200 bg-warm-50/60 shrink-0 text-xs text-warm-500">
        <FileCode2 size={13} />
        <span>{t("editor.sourceHint")}</span>
      </div>
      <textarea
        value={localValue}
        onChange={handleChange}
        spellCheck={false}
        className="flex-1 min-h-0 w-full p-4 font-mono text-sm leading-relaxed bg-white text-warm-900 resize-none outline-none border-0"
      />
    </div>
  )
}

function MilkdownEditor({ value, onChange, initialMode }: Props) {
  const { t } = useT()
  const [mode, setMode] = useState<Mode>(initialMode ?? "preview")
  const modeRef = useRef<Mode>(initialMode ?? "preview")
  const runRef = useRef<(key: Parameters<typeof callCommand>[0], payload?: unknown) => void>()
  const { register, unregister, setScope } = useHotkeys()

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    setScope("editor")
    return () => setScope(null)
  }, [setScope])

  useEffect(() => {
    const h1 = () => {
      const cur = modeRef.current
      const next: Mode = cur === "preview" ? "editor"
        : cur === "editor" ? "preview"
        : cur === "split" ? "editor"
        : "editor"  // source → editor
      setMode(next)
    }
    const h2 = () => {
      window.alert(t("editor.searchHint"))
    }
    window.addEventListener("thinknote:editor-toggle-mode", h1)
    window.addEventListener("thinknote:editor-search", h2)
    return () => {
      window.removeEventListener("thinknote:editor-toggle-mode", h1)
      window.removeEventListener("thinknote:editor-search", h2)
    }
  }, [t])

  useEffect(() => {
    register(
      "edit.bold",
      () => runRef.current?.(toggleStrongCommand.key),
      { scope: "editor", priority: 10 },
    )
    register(
      "edit.italic",
      () => runRef.current?.(toggleEmphasisCommand.key),
      { scope: "editor", priority: 10 },
    )
    register(
      "edit.link",
      () => {
        const editable = modeRef.current === "editor" || modeRef.current === "split"
        if (!editable) return
        const url = window.prompt(t("editor.linkPrompt"), "https://")
        if (url === null) return
        runRef.current?.(toggleLinkCommand.key, { href: url })
      },
      { scope: "editor", priority: 10 },
    )
    register(
      "edit.indent",
      () => {
        const editable = modeRef.current === "editor" || modeRef.current === "split"
        if (!editable) return
        document.execCommand("indent")
      },
      { scope: "editor", priority: 10, preventDefault: true },
    )
    register(
      "edit.outdent",
      () => {
        const editable = modeRef.current === "editor" || modeRef.current === "split"
        if (!editable) return
        document.execCommand("outdent")
      },
      { scope: "editor", priority: 10, preventDefault: true },
    )
    return () => {
      unregister("edit.bold", "editor")
      unregister("edit.italic", "editor")
      unregister("edit.link", "editor")
      unregister("edit.indent", "editor")
      unregister("edit.outdent", "editor")
    }
  }, [register, unregister, t])

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* 模式切换始终可见，源码模式也能切回 */}
      {mode === "source" ? (
        <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-warm-200 bg-warm-50/60 shrink-0">
          <ModeSwitcher mode={mode} setMode={setMode} />
        </div>
      ) : (
        <Toolbar
          mode={mode}
          setMode={setMode}
          onRunReady={(fn) => { runRef.current = fn }}
        />
      )}

      {mode === "source" ? (
        <SourceEditor value={value} onChange={onChange} />
      ) : (
        <div className="flex-1 min-h-0 flex">
          <MilkdownProvider>
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 overflow-auto">
                <MilkdownCore
                  value={value}
                  onChange={onChange}
                  editable={mode !== "preview"}
                />
              </div>
            </div>
          </MilkdownProvider>

          {mode === "split" && (
            <>
              <div className="w-px bg-warm-200 shrink-0" />
              <MilkdownProvider>
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="flex items-center gap-1 px-3 py-1.5 border-b border-warm-200 bg-warm-50/60 shrink-0 text-xs text-warm-500">
                    <Eye size={13} />
                    <span>{t("editor.previewPane")}</span>
                  </div>
                  <div className="flex-1 min-h-0 overflow-auto">
                    <MilkdownCore
                      value={value}
                      editable={false}
                      syncOnValueChange
                    />
                  </div>
                </div>
              </MilkdownProvider>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export { MilkdownEditor }