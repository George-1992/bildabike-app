import {
    ArrowRight,
    Bike,
    CalendarClock,
    ClipboardList,
    FileText,
    Settings,
    Wrench,
} from "lucide-react";

const quickActions = [
    {
        title: "Manage Bikes",
        description: "View and update your current bike builds.",
        href: "/bikes",
        Icon: Bike,
    },
    {
        title: "Open Notes",
        description: "Capture ideas and keep service details handy.",
        href: "/notes",
        Icon: FileText,
    },
    {
        title: "Review Scraps",
        description: "Check saved snippets, links, and references.",
        href: "/scraps",
        Icon: ClipboardList,
    },
];

const highlights = [
    {
        label: "Build Workflow",
        value: "Fast & Organized",
        helper: "Track progress from first part to final tune.",
        Icon: Wrench,
    },
    {
        label: "Upcoming",
        value: "Service Planning",
        helper: "Keep upcoming tasks and reminders visible.",
        Icon: CalendarClock,
    },
    {
        label: "Workspace",
        value: "Ready to Customize",
        helper: "Adjust profile and preferences when needed.",
        Icon: Settings,
    },
];

export default function Home({ user }) {
    const firstName = user?.name?.split(" ")?.[0] || "Builder";

    return (
        <div className="container-main flex flex-col gap-4 md:gap-5">
            <section className="card-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-slate-50" />
                <div className="relative flex flex-col gap-3 md:gap-4">
                    <p className="text-sm font-medium text-slate-500">Welcome back, {firstName}</p>
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                            Build smarter, ride sooner.
                        </h1>
                        <p className="max-w-2xl text-sm text-slate-600 md:text-base">
                            Keep your bike projects, notes, and parts flow in one place so your next build is always
                            clear and moving.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <a
                            href="/bikes"
                            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
                        >
                            Go to Bikes
                            <ArrowRight className="h-4 w-4" />
                        </a>
                        <a
                            href="/notes"
                            className="inline-flex items-center gap-2 rounded-md border border-transparent bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                        >
                            Open Notes
                        </a>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {quickActions.map(({ title, description, href, Icon }) => (
                    <a
                        key={title}
                        href={href}
                        className="card-1 group flex items-start justify-between gap-3 transition-colors hover:bg-slate-50"
                    >
                        <div className="flex flex-col gap-1">
                            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                            <p className="text-sm text-slate-600">{description}</p>
                        </div>
                        <div className="rounded-md bg-slate-100 p-2 text-slate-600 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                            <Icon className="h-4 w-4" />
                        </div>
                    </a>
                ))}
            </section>

            <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                {highlights.map(({ label, value, helper, Icon }) => (
                    <article key={label} className="card-1 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-500">{label}</p>
                            <span className="rounded-md bg-slate-100 p-2 text-slate-600">
                                <Icon className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="text-lg font-semibold text-slate-900">{value}</p>
                        <p className="text-sm text-slate-600">{helper}</p>
                    </article>
                ))}
            </section>
        </div>
    );
}