"use client"

import * as React from "react"
import {
  DayButton,
  DayPicker,
  getDefaultClassNames,
  type DayPickerProps,
} from "react-day-picker"
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: DayPickerProps & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          `${date.getMonth() + 1}月`,
        formatWeekdayName: (date) =>
          date.toLocaleString("zh-CN", { weekday: "short" }),
        formatYearDropdown: (date) => `${date.getFullYear()}年`,
        ...formatters,
      }}
      labels={{
        labelMonthDropdown: () => "选择月份",
        labelYearDropdown: () => "选择年份",
        labelNext: () => "下个月",
        labelPrevious: () => "上个月",
        labelNav: () => "日历导航",
        labelWeekday: (date) =>
          date.toLocaleString("zh-CN", { weekday: "long" }),
        labelDayButton: (date) =>
          date.toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        labelGrid: (date) =>
          date.toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
          }),
      }}
      className={cn(
        "bg-background p-3 [--cell-size:2.75rem] md:[--cell-size:2.25rem]",
        String.raw`rtl:**:[.rdp-button_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button_previous>svg]:rotate-180`,
        className
      )}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant, size: "icon-sm" }),
          "size-9 select-none aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant, size: "icon-sm" }),
          "size-9 select-none aria-disabled:opacity-50",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-9 w-full items-center justify-center px-9",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-9 w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative rounded-md border border-input bg-background px-2 py-1 shadow-xs",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute inset-0 cursor-pointer opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none text-sm font-medium",
          defaultClassNames.caption_label
        ),
        month_grid: cn(
          "w-full border-collapse",
          defaultClassNames.month_grid
        ),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex size-(--cell-size) items-center justify-center rounded-md text-[0.75rem] font-normal text-muted-foreground select-none",
          defaultClassNames.weekday
        ),
        week: cn("mt-1 flex w-full", defaultClassNames.week),
        day: cn(
          "relative flex size-(--cell-size) items-center justify-center p-0 text-center text-sm select-none",
          defaultClassNames.day
        ),
        day_button: cn(
          buttonVariants({ variant: buttonVariant, size: "icon-sm" }),
          "size-10 rounded-md p-0 font-normal md:size-8 aria-selected:opacity-100",
          defaultClassNames.day_button
        ),
        today: cn(
          "text-primary **:font-semibold",
          defaultClassNames.today
        ),
        selected: cn(
          "rounded-md bg-primary text-primary-foreground **:bg-primary **:text-primary-foreground **:hover:bg-primary **:hover:text-primary-foreground",
          defaultClassNames.selected
        ),
        outside: cn(
          "text-muted-foreground opacity-45 aria-selected:opacity-30",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-35",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...props }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeftIcon
              : orientation === "right"
                ? ChevronRightIcon
                : ChevronDownIcon

          return <Icon className={cn("size-4", className)} {...props} />
        },
        DayButton: (props) => (
          <DayButton {...props} className={cn(props.className)} />
        ),
        ...components,
      }}
      {...props}
    />
  )
}

export { Calendar }
