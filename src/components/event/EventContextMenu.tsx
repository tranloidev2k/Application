import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CONTEXT_MENU_VIEWPORT_MARGIN } from "../../constants";
import { useEscapeKey } from "../../hooks/useEscapeKey";

interface Props {
  x: number;
  y: number;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function EventContextMenu({ x, y, onEdit, onDelete, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setPosition({
      left: Math.max(
        CONTEXT_MENU_VIEWPORT_MARGIN,
        Math.min(x, window.innerWidth - width - CONTEXT_MENU_VIEWPORT_MARGIN),
      ),
      top: Math.max(
        CONTEXT_MENU_VIEWPORT_MARGIN,
        Math.min(y, window.innerHeight - height - CONTEXT_MENU_VIEWPORT_MARGIN),
      ),
    });
  }, [x, y]);

  useEscapeKey(onClose);

  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    window.addEventListener("mousedown", listener);
    return () => window.removeEventListener("mousedown", listener);
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-[60] w-36 overflow-hidden rounded-lg border border-zinc-700 bg-[#24252a] py-1 text-zinc-100 shadow-2xl"
      style={position}
    >
      <button
        type="button"
        role="menuitem"
        onClick={onEdit}
        className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-700"
      >
        Edit
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={onDelete}
        className="w-full px-4 py-2 text-left text-sm text-rose-400 hover:bg-rose-950/50"
      >
        Delete
      </button>
    </div>
  );
}
