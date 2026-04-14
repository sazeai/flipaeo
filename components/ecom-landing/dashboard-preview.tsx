import { Button } from "@/components/ui/button"
export function DashboardPreview() {
  return (
    <section className="relative pb-16">
      <div className="max-w-[1060px] mx-auto px-4">
        {/* Dashboard Interface Mockup */}
        <div className="relative bg-white rounded-lg shadow-lg border border-[#e0dedb] overflow-hidden">
          {/* Dashboard Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#e0dedb]">
            <div className="flex items-center gap-3">
              <div className="text-[#37322f] font-semibold">Unboilerplate</div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-[#605a57]">Ready to Ship</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#37322f] rounded-full"></div>
            </div>
          </div>

          {/* Sidebar and Main Content */}
          <div className="flex">
            {/* Sidebar */}
            <div className="w-48 bg-[#fbfaf9] border-r border-[#e0dedb] p-4">
              <nav className="space-y-2">
                <div className="text-xs font-medium text-[#605a57] uppercase tracking-wide mb-3">Setup Complete</div>
                {[
                  "✓ Authentication",
                  "✓ Database",
                  "✓ Payments",
                  "✓ UI Components",
                  "✓ Deployment",
                  "Start Building",
                ].map((item, index) => (
                  <div
                    key={item}
                    className={`text-sm py-1 cursor-pointer ${
                      index === 5 ? "text-[#37322f] font-semibold" : "text-[#605a57]"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#37322f]">3-Minute Setup Complete</h2>
                <Button className="bg-[#37322f] hover:bg-[#37322f]/90 text-white text-sm">Deploy Now</Button>
              </div>

              {/* Table Mockup */}
              <div className="bg-white border border-[#e0dedb] rounded-lg overflow-hidden">
                <div className="grid grid-cols-6 gap-4 p-4 bg-[#fbfaf9] border-b border-[#e0dedb] text-sm font-medium text-[#605a57]">
                  <div>Component</div>
                  <div>Status</div>
                  <div>Provider</div>
                  <div>Time</div>
                  <div>Setup</div>
                  <div>Ready</div>
                </div>

                {/* Table Rows */}
                {[
                  { name: "Authentication", provider: "Supabase Auth", time: "30s" },
                  { name: "Database", provider: "Supabase DB", time: "45s" },
                  { name: "Payments", provider: "Dodopayments", time: "60s" },
                  { name: "UI Components", provider: "Shadcn/UI", time: "15s" },
                  { name: "Email", provider: "Resend", time: "20s" },
                  { name: "Deployment", provider: "Vercel", time: "30s" },
                  { name: "SSL & Domain", provider: "Auto-configured", time: "10s" },
                  { name: "Environment", provider: "Production Ready", time: "5s" },
                ].map((item, i) => (
                  <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b border-[#e0dedb] text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#37322f] rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <span>{item.name}</span>
                    </div>
                    <div>
                      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">Complete</span>
                    </div>
                    <div className="text-[#605a57]">{item.provider}</div>
                    <div className="font-medium">{item.time}</div>
                    <div className="text-[#605a57]">Automated</div>
                    <div className="text-[#605a57]">✓ Yes</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
