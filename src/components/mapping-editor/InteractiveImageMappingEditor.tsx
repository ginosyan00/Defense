"use client";

/* Custom editor state hook owns a viewport ref for pointer math; React
   Compiler's react-hooks/refs rule falsely taints the returned state object. */
/* eslint-disable react-hooks/refs */

import { DrawingToolbar } from "@/components/mapping-editor/DrawingToolbar";
import { EntitySidebar } from "@/components/mapping-editor/EntitySidebar";
import { HistoryControls } from "@/components/mapping-editor/HistoryControls";
import { MappingForm } from "@/components/mapping-editor/MappingForm";
import { SvgDrawingLayer } from "@/components/mapping-editor/SvgDrawingLayer";
import { useMappingEditorState } from "@/components/mapping-editor/useMappingEditorState";
import { ZoomControls } from "@/components/mapping-editor/ZoomControls";
import type { EditorRegion } from "@/lib/mapping/types";

export type InteractiveImageMappingEditorProps = {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  initialRegions?: EditorRegion[];
};

export function InteractiveImageMappingEditor({
  imageUrl,
  imageWidth,
  imageHeight,
  initialRegions = [],
}: InteractiveImageMappingEditorProps) {
  const editor = useMappingEditorState(
    imageWidth,
    imageHeight,
    initialRegions,
  );

  return (
    <div className="flex h-[min(78vh,820px)] min-h-[480px] flex-col overflow-hidden rounded-xl border border-[var(--mp-line)] bg-[var(--mp-canvas)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--mp-line)] px-3 py-2">
        <HistoryControls
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          onUndo={editor.undo}
          onRedo={editor.redo}
        />
        <ZoomControls
          scale={editor.transform.scale}
          onZoomIn={editor.zoomIn}
          onZoomOut={editor.zoomOut}
          onReset={editor.resetView}
        />
      </div>
      <DrawingToolbar
        tool={editor.tool}
        onToolChange={(next) => {
          editor.setTool(next);
          if (next !== "draw-polygon") editor.setDraftPoints([]);
        }}
        canDelete={Boolean(editor.selectedId)}
        onDelete={editor.onDelete}
        draftHint={editor.draftHint}
      />
      <div className="flex min-h-0 flex-1">
        <EntitySidebar
          regions={editor.regions}
          selectedId={editor.selectedId}
          onSelect={(id) => {
            editor.setSelectedId(id);
            editor.setTool("select");
          }}
        />
        <div
          ref={editor.bindViewport}
          className="relative min-w-0 flex-1 touch-none overflow-hidden bg-[#1a1c1f]"
          style={{
            cursor:
              editor.tool === "pan"
                ? "grab"
                : editor.tool === "draw-polygon"
                  ? "crosshair"
                  : "default",
          }}
          onPointerDown={editor.onPointerDown}
          onPointerMove={editor.onPointerMove}
          onPointerUp={editor.onPointerUp}
          onPointerCancel={editor.onPointerUp}
        >
          <div
            className="absolute inset-0 origin-center"
            style={{
              transform: `translate(${editor.transform.tx}px, ${editor.transform.ty}px) scale(${editor.transform.scale})`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              draggable={false}
              className="pointer-events-none absolute select-none"
              style={{
                left: editor.bounds.x,
                top: editor.bounds.y,
                width: editor.bounds.width,
                height: editor.bounds.height,
              }}
            />
            <div
              className="absolute"
              style={{
                left: editor.bounds.x,
                top: editor.bounds.y,
                width: editor.bounds.width,
                height: editor.bounds.height,
              }}
            >
              <SvgDrawingLayer
                imageWidth={imageWidth}
                imageHeight={imageHeight}
                regions={editor.regions}
                selectedId={editor.selectedId}
                draftPoints={editor.draftPoints}
                onSelectRegion={(id) => {
                  editor.setSelectedId(id);
                  editor.setTool("select");
                }}
              />
            </div>
          </div>
        </div>
        <MappingForm
          region={editor.selected}
          onChange={(patch) => {
            if (!editor.selectedId) return;
            editor.commitRegions(
              editor.regions.map((region) =>
                region.id === editor.selectedId
                  ? { ...region, ...patch }
                  : region,
              ),
            );
          }}
        />
      </div>
      <div className="border-t border-[var(--mp-line)] px-3 py-2 text-[11px] text-[var(--mp-ink-muted)]">
        Viewport {Math.round(editor.viewportSize.width)}×
        {Math.round(editor.viewportSize.height)} · content{" "}
        {Math.round(editor.bounds.width)}×{Math.round(editor.bounds.height)} ·
        draft only
      </div>
    </div>
  );
}
