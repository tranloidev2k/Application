import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";
import type { EventLayout } from "../../utils/layout";
import { formatTime } from "../../utils/time";

interface Props {
  item: EventLayout;
  isPreview?: boolean;
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  onActivate?: () => void;
  onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
}

export function EventBlock({
  item,
  isPreview,
  onPointerDown,
  onClick,
  onActivate,
  onContextMenu,
}: Props) {
  const { event, top, height, column, columns } = item;
  const title = event.title || "New event";
  const range = `${formatTime(event.start)} – ${formatTime(event.end)}`;
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onActivate || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    onActivate();
  };
  return (
    <div
      role={isPreview ? "presentation" : "button"}
      tabIndex={isPreview ? undefined : 0}
      aria-label={isPreview ? undefined : `${title}, ${range}`}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onKeyDown={isPreview ? undefined : onKeyDown}
      onContextMenu={onContextMenu}
      className={`absolute z-10 overflow-hidden rounded-md border px-2 py-1.5 text-left text-xs leading-tight shadow-sm select-none ${isPreview ? "border-[#a8c7fa] bg-[#a8c7fa]/25 text-[#dbe9ff] opacity-80 hover:border-[#a8c7fa] hover:bg-[#a8c7fa]/25 hover:text-[#dbe9ff] hover:opacity-80" : "cursor-grab border-[#a8c7fa] bg-[#a8c7fa] text-[#17365d] hover:border-[#a8c7fa] hover:bg-[#a8c7fa] hover:text-[#17365d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:cursor-grabbing"}`}
      style={{
        top,
        height,
        left: `calc(${column * (100 / columns)}% + 3px)`,
        width: `calc(${100 / columns}% - 6px)`,
      }}
    >
      <div className="truncate font-bold">{title}</div>
      <div className="mt-0.5 truncate font-medium opacity-80">{range}</div>
    </div>
  );
}
