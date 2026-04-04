"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/interfaces-select"

export default function SelectDemo() {
    return (
        <div className="flex w-full min-h-screen items-center justify-center bg-background p-8 overflow-hidden">
            <Select>
                <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select a timezone" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">Eastern (EST)</SelectItem>
                    <SelectItem value="cst">Central (CST)</SelectItem>
                    <SelectItem value="mst">Mountain (MST)</SelectItem>
                    <SelectItem value="pst">Pacific (PST)</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
