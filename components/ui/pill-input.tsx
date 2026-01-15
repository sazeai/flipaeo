"use client"

import * as React from "react"
import { X, Plus } from "lucide-react"

export interface PillInputProps {
    value: string[]
    onChange: (value: string[]) => void
    placeholder?: string
    className?: string
}

export function PillInput({ value = [], onChange, placeholder, className }: PillInputProps) {
    const [inputValue, setInputValue] = React.useState("")
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()
            addPill()
        } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
            // Delete the last item if input is empty
            const newValue = [...value]
            newValue.pop()
            onChange(newValue)
        }
    }

    const addPill = () => {
        const trimmed = inputValue.trim()
        if (trimmed) {
            onChange([...value, trimmed])
            setInputValue("")
        }
    }

    const removePill = (index: number) => {
        const newValue = [...value]
        newValue.splice(index, 1)
        onChange(newValue)
    }

    // Focus input when clicking on the container
    const handleContainerClick = () => {
        inputRef.current?.focus()
    }

    return (
        <div
            className={`flex flex-wrap gap-2 min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring focus-within:border-ring ${className}`}
            onClick={handleContainerClick}
        >
            {value.map((item, index) => (
                <div
                    key={index}
                    className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full text-xs font-medium animate-in fade-in zoom-in-95 duration-200"
                >
                    <span>{item}</span>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            removePill(index)
                        }}
                        className="text-secondary-foreground/50 hover:text-secondary-foreground focus:outline-none ml-1"
                    >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {item}</span>
                    </button>
                </div>
            ))}

            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addPill} // Add on blur as well
                className="flex-1 bg-transparent border-none outline-none min-w-[120px] placeholder:text-muted-foreground text-sm h-7"
                placeholder={value.length === 0 ? placeholder : ""}
            />
        </div>
    )
}
