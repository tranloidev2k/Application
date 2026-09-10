import { DAY_HEIGHT, HOUR_HEIGHT, HOURS_PER_DAY } from "../../constants";

export function TimeAxis() {
  const label = (hour: number) => {
    if (hour === 0 || hour === HOURS_PER_DAY) return "";
    const suffix = hour < 12 ? "AM" : "PM";
    const display = hour % 12 || 12;
    return `${display} ${suffix}`;
  };

  return (
    <div
      className="relative w-[78px] shrink-0 border-r border-[#2a2a2a] bg-[#151515]"
      style={{ height: DAY_HEIGHT }}
    >
      {Array.from({ length: HOURS_PER_DAY + 1 }, (_, hour) => (
        <div
          key={hour}
          className="absolute w-full -translate-y-2 pr-2 text-right text-xs font-semibold text-[#c6c6c6]"
          style={{ top: hour * HOUR_HEIGHT }}
        >
          {label(hour)}
        </div>
      ))}
    </div>
  );
}
