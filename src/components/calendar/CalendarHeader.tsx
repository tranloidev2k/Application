import { formatUtcOffset, startOfDay } from "../../utils/time";

interface Props {
  days: Date[];
}

export function CalendarHeader({ days }: Props) {
  const today = startOfDay(new Date());
  const timezoneLabel = formatUtcOffset();

  return (
    <div className="sticky top-0 z-30 border-b border-[#2a2a2a] bg-[#151515]">
      <div className="grid min-w-[743px] grid-cols-[78px_repeat(7,minmax(95px,1fr))]">
        <div className="border-r border-[#2a2a2a] px-1 pt-[43px] text-center text-xs font-semibold text-[#c6c6c6]">
          {timezoneLabel}
        </div>
        {days.map((day) => {
          const isToday = startOfDay(day).getTime() === today.getTime();
          return (
            <div
              key={day.toISOString()}
              className="min-w-0 border-r border-[#2a2a2a] px-2 py-2 text-center last:border-r-0"
            >
              <div
                className={`text-xs font-semibold uppercase tracking-wide ${isToday ? "text-[#a8c7fa]" : "text-[#c6c6c6]"}`}
              >
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div
                className={`mx-auto mt-1.5 grid h-10 w-10 place-items-center rounded-full text-[26px] font-light leading-none ${isToday ? "bg-[#a8c7fa] text-[#17365d]" : "text-[#e4e4e4]"}`}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
