"use client";

import Link from "next/link";

export default function ToolboxPage() {
  const tools = [
    {
      title: "My Routes",
      desc: "Manage paths and GPX files",
      href: "/toolbox/routes",
      icon: "route",
      color: "text-blue-600"
    },
    {
      title: "My Groups",
      desc: "Communities and neighborhoods",
      href: "/toolbox/groups",
      icon: "group",
      color: "text-emerald-600"
    }
  ];

  return (
    <div className="fixed inset-0 overflow-y-scroll bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-32 flex flex-col gap-6">
        
        {/* BIG PRIMARY ACTION: SCHEDULE */}
        <Link href="/events/create" className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group active:scale-[0.98] transition-all">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-40" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Next Mission</p>
              <h2 className="text-3xl font-black italic uppercase leading-none tracking-tighter">Schedule <br/>a Ride</h2>
            </div>
            <span className="material-symbols-rounded text-5xl text-blue-500 group-hover:rotate-12 transition-transform">calendar_add_on</span>
          </div>
        </Link>

        {/* SUB-TOOLS GRID */}
        <div className="grid grid-cols-1 gap-4">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all">
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${tool.color}`}>
                  <span className="material-symbols-rounded text-2xl">{tool.icon}</span>
                </div>
                <div>
                  <h3 className="font-black uppercase italic text-slate-900 leading-none">{tool.title}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{tool.desc}</p>
                </div>
              </div>
              <span className="material-symbols-rounded text-slate-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}