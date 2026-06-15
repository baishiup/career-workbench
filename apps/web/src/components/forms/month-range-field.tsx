"use client";

import type { DateValue } from "@internationalized/date";

import { Checkbox, DateRangePicker, Label, RangeCalendar } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { useRef } from "react";

import { cn } from "@/lib/utils";

type MonthRangeValue = {
  startDate: string;
  endDate: string;
  current: boolean;
};

type MonthRangeFieldProps = {
  className?: string;
  startLabel?: string;
  endLabel?: string;
  label?: string;
  value: MonthRangeValue;
  onChange: (value: MonthRangeValue) => void;
  /** "至今" 复选框文案，默认"至今"。 */
  currentLabel?: string;
};

type DateRangeValue = {
  start: DateValue;
  end: DateValue;
};

function monthToDateValue(month: string): DateValue | null {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return null;
  }

  try {
    return parseDate(`${month}-01`);
  } catch {
    return null;
  }
}

function dateValueToMonth(date: DateValue) {
  return `${String(date.year).padStart(4, "0")}-${String(date.month).padStart(
    2,
    "0",
  )}`;
}

function monthToDisplayDate(month: string) {
  return /^\d{4}-\d{2}$/.test(month) ? `${month}-01` : "";
}

/**
 * 月份区间选择控件：底层存 YYYY-MM，展示和选择时补齐为当月 1 日。
 * 点击整行唤起 HeroUI DateRangePicker；勾选"至今"后清空结束日期。
 */
function MonthRangeField({
  className,
  startLabel = "开始日期",
  endLabel = "结束日期",
  label = "时间范围",
  value,
  onChange,
  currentLabel = "至今",
}: MonthRangeFieldProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const start = monthToDateValue(value.startDate);
  const end = value.current
    ? start
    : (monthToDateValue(value.endDate) ?? start);
  const rangeValue = start && end ? { end, start } : null;

  function setRange(range: DateRangeValue | null) {
    if (!range) {
      onChange({ ...value, current: false, endDate: "", startDate: "" });
      return;
    }

    onChange({
      ...value,
      current: false,
      endDate: dateValueToMonth(range.end),
      startDate: dateValueToMonth(range.start),
    });
  }

  function setCurrent(current: boolean) {
    onChange({
      ...value,
      current,
      endDate: current ? "" : value.endDate,
    });
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <DateRangePicker
        className="w-full"
        endName="endDate"
        startName="startDate"
        value={rangeValue}
        onChange={setRange}
      >
        <Label className="text-[11px] font-semibold text-slate-500">
          {label}
        </Label>
        <DateRangePicker.Trigger
          ref={triggerRef}
          className="flex min-h-9 w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-left text-[12.5px] font-medium text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-400/25"
        >
          <span
            className={cn(
              "min-w-[5.75rem]",
              value.startDate ? "text-slate-900" : "text-slate-400",
            )}
          >
            {monthToDisplayDate(value.startDate) || startLabel}
          </span>
          <span className="text-slate-300">-</span>
          <span
            className={cn(
              "min-w-[5.75rem] flex-1",
              value.current || value.endDate
                ? "text-slate-900"
                : "text-slate-400",
            )}
          >
            {value.current
              ? currentLabel
              : monthToDisplayDate(value.endDate) || endLabel}
          </span>
          <DateRangePicker.TriggerIndicator className="shrink-0 text-slate-400" />
        </DateRangePicker.Trigger>
        <DateRangePicker.Popover
          offset={8}
          placement="bottom start"
          triggerRef={triggerRef}
        >
          <RangeCalendar aria-label={label}>
            <RangeCalendar.Header>
              <RangeCalendar.YearPickerTrigger>
                <RangeCalendar.YearPickerTriggerHeading />
                <RangeCalendar.YearPickerTriggerIndicator />
              </RangeCalendar.YearPickerTrigger>
              <RangeCalendar.NavButton slot="previous" />
              <RangeCalendar.NavButton slot="next" />
            </RangeCalendar.Header>
            <RangeCalendar.Grid>
              <RangeCalendar.GridHeader>
                {(day) => (
                  <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>
                )}
              </RangeCalendar.GridHeader>
              <RangeCalendar.GridBody>
                {(date) => <RangeCalendar.Cell date={date} />}
              </RangeCalendar.GridBody>
            </RangeCalendar.Grid>
            <RangeCalendar.YearPickerGrid>
              <RangeCalendar.YearPickerGridBody>
                {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
              </RangeCalendar.YearPickerGridBody>
            </RangeCalendar.YearPickerGrid>
          </RangeCalendar>
        </DateRangePicker.Popover>
      </DateRangePicker>
      <Checkbox
        className="text-[12px] text-slate-500"
        isSelected={value.current}
        onChange={setCurrent}
      >
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>{currentLabel}</Checkbox.Content>
      </Checkbox>
    </div>
  );
}

export type { MonthRangeValue };
export { MonthRangeField };
