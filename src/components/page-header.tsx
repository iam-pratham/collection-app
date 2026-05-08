"use client"


export function PageHeader({ title }: { title: string }) {
    return (
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        </div>
    )
}
