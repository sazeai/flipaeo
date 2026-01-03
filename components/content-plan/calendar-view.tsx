"use client"

import { useMemo } from "react"
import { ContentPlanItem } from "@/lib/schemas/content-plan"
import { CompactPlanCard } from "./compact-plan-card"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays } from "date-fns"
import { cn } from "@/lib/utils"

interface CalendarViewProps {
    items: ContentPlanItem[]
    onItemClick: (item: ContentPlanItem) => void
}

export function CalendarView({ items, onItemClick }: CalendarViewProps) {
    // Generate the 30-day timeline based on the items
    const timeline = useMemo(() => {
        if (items.length === 0) return []

        // Sort items by date
        const sorted = [...items].sort((a, b) =>
            new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
        )

        const startDate = new Date(sorted[0].scheduled_date)
        const endDate = new Date(sorted[sorted.length - 1].scheduled_date)

        // Return structured days
        return eachDayOfInterval({ start: startDate, end: endDate }).map(day => {
            const dayItems = items.filter(item => isSameDay(new Date(item.scheduled_date), day))
            return {
                day,
                items: dayItems,
                dayNumber: format(day, "d"),
                dayName: format(day, "EEE"),
                isToday: isSameDay(new Date(), day)
            }
        })
    }, [items])

    // Find the next upcoming article (first pending)
    const nextArticleId = useMemo(() => {
        const sorted = [...items].sort((a, b) =>
            new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
        )
        return sorted.find(item => item.status === "pending")?.id
    }, [items])

    return (
        <div className="w-full">
            {/* Calendar Grid Header */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-px border border-stone-200 bg-stone-100 rounded-xl overflow-hidden">
                {timeline.map(({ day, items: dayItems, dayNumber, dayName, isToday }, idx) => (
                    <div
                        key={day.toISOString()}
                        className={cn(
                            "min-h-[140px] p-2 flex flex-col gap-2 transition-colors",
                            isToday ? "bg-stone-50/80" : "bg-white",
                            dayItems.length === 0 && "opacity-60 bg-stone-50/40"
                        )}
                    >
                        {/* Day Label */}
                        <div className="flex items-center justify-between mb-1 px-1">
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest",
                                isToday ? "text-stone-900" : "text-stone-400"
                            )}>
                                {dayName}
                            </span>
                            <span className={cn(
                                "flex items-center justify-center w-5 h-5 text-[11px] font-bold rounded-full",
                                isToday ? "bg-stone-900 text-white" : "text-stone-500"
                            )}>
                                {dayNumber}
                            </span>
                        </div>

                        {/* Article(s) for this day */}
                        <div className="flex-1 flex flex-col gap-2">
                            {dayItems.length > 0 ? (
                                dayItems.map(item => (
                                    <CompactPlanCard
                                        key={item.id}
                                        item={item}
                                        onClick={() => onItemClick(item)}
                                        isNext={item.id === nextArticleId}
                                    />
                                ))
                            ) : (
                                <div className="flex-1 rounded-lg border border-dashed border-stone-100 flex items-center justify-center">
                                    <span className="text-[10px] text-stone-300 font-medium">Safe Zone</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-6 px-4 py-3 bg-stone-50 rounded-lg border border-stone-100">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-medium text-stone-600">Published</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                    </div>
                    <span className="text-[11px] font-medium text-stone-600">Writing</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full border border-stone-200 bg-white" />
                    <span className="text-[11px] font-medium text-stone-600">Planned</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-stone-900 flex items-center justify-center">
                        <ArrowUpRight className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-[11px] font-medium text-stone-900 font-bold">Priority Next</span>
                </div>
            </div>
        </div>
    )
}

function ArrowUpRight({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M7 17L17 7" />
            <path d="M7 7h10v10" />
        </svg>
    )
}
