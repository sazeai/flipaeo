import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { 
  ChevronRight, FileText, FileJson, FileCode, Github, Search, PlusCircle, Star, 
  Check, Bold, Italic, Underline, Link as LinkIcon, File,
  ArrowDown, Target, ListOrdered, PenTool, CheckCircle, Award,
  MessageSquare, TrendingUp, Sparkles, Network, EyeOff, Bot
} from 'lucide-react';

const TornPaperBg = () => (
  <svg className="absolute inset-0 w-full h-full -z-10 drop-shadow-sm" preserveAspectRatio="none" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 0 H100 V96 L98 100 L96 96 L94 100 L92 96 L90 100 L88 96 L86 100 L84 96 L82 100 L80 96 L78 100 L76 96 L74 100 L72 96 L70 100 L68 96 L66 100 L64 96 L62 100 L60 96 L58 100 L56 96 L54 100 L52 96 L50 100 L48 96 L46 100 L44 96 L42 100 L40 96 L38 100 L36 96 L34 100 L32 96 L30 100 L28 96 L26 100 L24 96 L22 100 L20 96 L18 100 L16 96 L14 100 L12 96 L10 100 L8 96 L6 100 L4 96 L2 100 L0 96 Z" fill="white" stroke="#E5E7EB" strokeWidth="0.5" vectorEffect="non-scaling-stroke"/>
  </svg>
);

const Key = ({ children, key }: { children: React.ReactNode, key?: string | number }) => (
  <div key={key} className="relative h-[26px] w-[26px] origin-bottom-left cursor-pointer active:scale-95 mx-[1px]">
    <div className="absolute -left-1 -top-1 h-[34px] w-[34px] bg-gray-200 rounded-md shadow-sm opacity-50 pointer-events-none"></div>
    <div className="relative flex h-[26px] w-[26px] items-center justify-center rounded bg-white border-b-2 border-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
      <span className="text-[9px] font-bold text-gray-700">{children}</span>
    </div>
  </div>
);

export default function App() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 2;
      const y = (clientY / innerHeight - 0.5) * 2;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const springConfig = { damping: 50, stiffness: 100 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const x1 = useTransform(smoothX, [-1, 1], [-15, 15]);
  const y1 = useTransform(smoothY, [-1, 1], [-15, 15]);
  
  const x2 = useTransform(smoothX, [-1, 1], [-30, 30]);
  const y2 = useTransform(smoothY, [-1, 1], [-30, 30]);

  const x3 = useTransform(smoothX, [-1, 1], [-8, 8]);
  const y3 = useTransform(smoothY, [-1, 1], [-8, 8]);

  return (
    <div className="w-full overflow-x-hidden bg-[#F4F4F5] text-gray-900 font-sans selection:bg-gray-900 selection:text-white">
      
      {/* Site Navigation */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex rounded-[12px] border border-dashed border-gray-300 p-1 sm:p-1.5 bg-white/60 backdrop-blur-md shadow-sm w-[92%] sm:w-auto max-w-[400px] sm:max-w-none justify-center">
        <nav className="flex flex-row gap-1 w-full justify-between sm:justify-center">
          <a tabIndex={-1} className="pointer-events-none rounded-md bg-white px-2 sm:px-4 py-1.5 text-[9px] sm:text-xs shadow-sm font-medium text-gray-800 flex-1 text-center sm:flex-none" href="/">ChatGPT</a>
          <a className="rounded-md px-2 sm:px-4 py-1.5 text-[9px] sm:text-xs text-gray-500 transition-all duration-75 ease-out hover:bg-gray-100 font-medium flex-1 text-center sm:flex-none" href="/blog">Perplexity</a>
          <a className="rounded-md px-2 sm:px-4 py-1.5 text-[9px] sm:text-xs text-gray-500 transition-all duration-75 ease-out hover:bg-gray-100 font-medium flex-1 text-center sm:flex-none" href="/glossary">Gemini</a>
          <a className="rounded-md px-2 sm:px-4 py-1.5 text-[9px] sm:text-xs text-gray-500 transition-all duration-75 ease-out hover:bg-gray-100 font-medium flex-1 text-center sm:flex-none" href="/tools">Claude</a>
        </nav>
      </div>

      {/* Hero Section Wrapper */}
      <div className="relative h-screen w-full overflow-hidden">
        {/* Noise overlay */}
        <div className="pointer-events-none absolute inset-0 z-50 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

        {/* Floating Components Container */}
        <div id="components" className="absolute inset-0 z-10 h-full w-full select-none pointer-events-none">
          
          {/* Layer 2 (Furthest) */}
        <motion.div style={{ x: x2, y: y2 }} className="absolute w-full h-full">
          {/* File Tree */}
          <ul id="tree" className="absolute flex -rotate-2 flex-col gap-2 transition-all duration-[600ms] ease-out -left-12 -top-32 md:-top-8 md:left-0 lg:-top-4 lg:left-4 xl:left-[30px] xl:top-[26px] scale-[0.8] max-sm:hidden xl:scale-100 pointer-events-auto">
            <li className="flex flex-row items-center gap-2.5 text-[10px] font-mono text-gray-600"><ChevronRight size={12}/> Strategy</li>
            <li className="flex flex-row items-center gap-2.5 pl-6 text-[10px] font-mono text-gray-600"><ChevronRight size={12} className="rotate-90"/> AI_Search_Corpus</li>
            <li className="flex flex-row items-center gap-2.5 pl-12 text-[10px] font-mono text-gray-600"><FileJson size={12}/> gap_analysis.json</li>
            <li className="flex flex-row items-center gap-2.5 pl-12 text-[10px] font-mono text-gray-600"><FileText size={12}/> competitor_weakness.md</li>
            <li className="flex flex-row items-center gap-2.5 pl-6 text-[10px] font-mono text-gray-600"><ChevronRight size={12} className="rotate-90"/> Execution</li>
            <li className="flex flex-row items-center gap-2.5 pl-12 text-[10px] font-mono text-gray-600"><FileText size={12}/> 01_foundation_topic.md</li>
            <li className="flex flex-row items-center gap-2.5 pl-12 text-[10px] font-mono text-gray-600"><FileText size={12}/> 02_authority_builder.md</li>
            <li className="flex flex-row items-center gap-2.5 text-[10px] font-mono text-gray-600"><ChevronRight size={12} className="rotate-90"/> Brand_Voice</li>
            <li className="flex flex-row items-center gap-2.5 pl-6 text-[10px] font-mono text-gray-600"><FileJson size={12}/> tone_guidelines.json</li>
            <li className="flex flex-row items-center gap-2.5 pl-6 text-[10px] font-mono text-gray-600"><FileCode size={12}/> positioning.ts</li>
          </ul>

          {/* Git Terminal */}
          <div id="github" className="absolute flex -rotate-4 rounded-[12px] border border-dashed border-gray-300 px-4 py-3 transition-all duration-[600ms] ease-out -left-40 -top-20 sm:-top-[132px] sm:left-12 md:left-24 lg:left-40 xl:left-[210px] scale-[0.7] lg:scale-[0.8] xl:scale-100 bg-white/40 backdrop-blur-md pointer-events-auto">
            <p className="font-mono text-[10px] text-gray-500 leading-relaxed">
              Analyzing competitor content corpus...<br/>
              Identifying knowledge gaps: 100% (4/4), done.<br/>
              Reverse-engineering LLM weights...<br/>
              Writing objects: 100% (4/4), 9.60 KiB |<br/>
              9.60 MiB/s, done.<br/>
              Target: ChatGPT, Perplexity, Gemini<br/>
              Status: <span className="text-gray-800">Authority gap found. Exploiting.</span><br/>
              Citation probability: 99.8%<br/>
              To <span className="text-gray-800">https://flipaeo.com/engine</span><br/>
              <span className="whitespace-pre">   dfcaf81..76bc70f  strategy -&gt; execution</span>
            </p>
          </div>
        </motion.div>

        {/* Layer 1 (Middle) */}
        <motion.div style={{ x: x1, y: y1 }} className="absolute w-full h-full">
          {/* AEO Control Deck */}
          <div className="absolute -rotate-7 transition-all duration-[600ms] ease-out -left-36 bottom-2 sm:-left-40 sm:bottom-[120px] md:-left-14 md:bottom-[136px] lg:-left-12 lg:bottom-[168px] xl:-left-6 xl:bottom-[226px] scale-[0.7] lg:scale-[0.8] xl:scale-100 pointer-events-auto">
            <div className="bg-white/60 backdrop-blur-md border border-dashed border-gray-300 rounded-[20px] p-5 w-[340px] flex flex-col gap-6">
              
              {/* Top Bar: LEDs and Branding */}
              <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
                <div className="flex gap-2 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-800 shadow-[0_0_8px_rgba(0,0,0,0.3)]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                  <span className="text-[9px] font-mono font-bold text-gray-400 tracking-widest ml-2">AEO_CORE_v2</span>
                </div>
                <span className="text-[9px] font-mono font-semibold text-gray-400 tracking-wider">SYNCING...</span>
              </div>

              {/* Middle: Vertical Sliders */}
              <div className="flex justify-between px-4">
                {/* Slider 1 */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-1.5 h-28 bg-gray-200/80 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
                    <div className="absolute bottom-0 w-full h-[75%] bg-gray-800/20 rounded-full"></div>
                    {/* Fader Knob */}
                    <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-8 h-5 bg-white border border-gray-200 shadow-[0_2px_5px_rgba(0,0,0,0.08),_0_1px_1px_rgba(0,0,0,0.04)] rounded-[4px] flex flex-col justify-center items-center gap-[2px] cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="w-4 h-[1px] bg-gray-300"></div>
                      <div className="w-4 h-[1px] bg-gray-300"></div>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono font-semibold text-gray-500 tracking-wider text-center leading-tight">SEMANTIC<br/>DENSITY</span>
                </div>

                {/* Slider 2 */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-1.5 h-28 bg-gray-200/80 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
                    <div className="absolute bottom-0 w-full h-[90%] bg-gray-800/20 rounded-full"></div>
                    {/* Fader Knob */}
                    <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-8 h-5 bg-white border border-gray-200 shadow-[0_2px_5px_rgba(0,0,0,0.08),_0_1px_1px_rgba(0,0,0,0.04)] rounded-[4px] flex flex-col justify-center items-center gap-[2px] cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="w-4 h-[1px] bg-gray-300"></div>
                      <div className="w-4 h-[1px] bg-gray-300"></div>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono font-semibold text-gray-500 tracking-wider text-center leading-tight">CITATION<br/>WEIGHT</span>
                </div>

                {/* Slider 3 */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-1.5 h-28 bg-gray-200/80 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
                    <div className="absolute bottom-0 w-full h-[60%] bg-gray-800/20 rounded-full"></div>
                    {/* Fader Knob */}
                    <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-8 h-5 bg-white border border-gray-200 shadow-[0_2px_5px_rgba(0,0,0,0.08),_0_1px_1px_rgba(0,0,0,0.04)] rounded-[4px] flex flex-col justify-center items-center gap-[2px] cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="w-4 h-[1px] bg-gray-300"></div>
                      <div className="w-4 h-[1px] bg-gray-300"></div>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono font-semibold text-gray-500 tracking-wider text-center leading-tight">BRAND<br/>SALIENCE</span>
                </div>
              </div>

              {/* Bottom: Toggles & Dials */}
              <div className="flex justify-between items-center bg-gray-100/50 rounded-xl p-3 border border-gray-200/50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex gap-5 px-2">
                  {/* Toggle 1 */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-3.5 bg-gray-300 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] relative cursor-pointer">
                      <div className="absolute left-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full shadow-sm"></div>
                    </div>
                    <span className="text-[7px] font-mono font-bold text-gray-400 tracking-wider">VECTOR SYNC</span>
                  </div>
                  {/* Toggle 2 */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-3.5 bg-gray-800 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] relative cursor-pointer">
                      <div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full shadow-sm"></div>
                    </div>
                    <span className="text-[7px] font-mono font-bold text-gray-400 tracking-wider">ENTITY GRAPH</span>
                  </div>
                </div>

                {/* Mini Dial */}
                <div className="flex items-center gap-3 pr-2 border-l border-gray-200/60 pl-4">
                  <span className="text-[7px] font-mono font-bold text-gray-400 tracking-wider text-right">TRUST<br/>SCORE</span>
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-[0_2px_5px_rgba(0,0,0,0.05)] flex items-center justify-center relative">
                    <div className="w-1 h-1 rounded-full bg-gray-800 absolute top-1 shadow-[0_0_4px_rgba(0,0,0,0.3)]"></div>
                    <div className="text-[9px] font-bold text-gray-700 mt-1">99</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Task List */}
          <div className="absolute flex w-[456px] -rotate-4 scale-[0.7] flex-col gap-4 transition-all duration-[600ms] ease-out lg:scale-[0.8] xl:scale-100 -bottom-30 -left-32 md:-left-16 lg:-bottom-24 lg:-left-12 xl:-bottom-[60px] xl:left-1 max-sm:hidden pointer-events-auto">
            <div className="flex flex-row gap-2">
              <div className="flex w-52 relative">
                <Search size={12} className="absolute left-2.5 top-2 text-gray-400" />
                <input tabIndex={-1} placeholder="Search topics" className="z-10 w-full rounded-lg border border-gray-200 bg-white pl-7 pr-2 py-1.5 text-[10px] text-gray-800 shadow-sm placeholder:text-gray-400 focus-visible:outline-none" type="text" />
              </div>
              <span className="flex flex-row items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-2.5 py-1.5 text-[10px] text-gray-600 bg-white/40 backdrop-blur-sm cursor-pointer hover:bg-white/60"><PlusCircle size={12}/>Category</span>
              <span className="flex flex-row items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-2.5 py-1.5 text-[10px] text-gray-600 bg-white/40 backdrop-blur-sm cursor-pointer hover:bg-white/60"><PlusCircle size={12}/>Engine</span>
            </div>
            <div className="flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex h-8 flex-row items-center gap-3 px-3 bg-gray-50/50 border-b border-gray-100">
                <div className="flex h-3.5 w-3.5 flex-none cursor-pointer items-center justify-center rounded border border-gray-200 bg-white shadow-sm"></div>
                <span className="flex w-16 flex-row items-center gap-1 text-[10px] font-medium text-gray-500">ID</span>
                <span className="flex flex-row items-center gap-1 text-[10px] font-medium text-gray-500">Task</span>
              </div>
              {[
                { id: 'AEO-01', tag: 'Gap Domination', task: 'Analyze competitor coverage and exploit unclaimed authority', star: true },
                { id: 'AEO-02', tag: 'Content', task: 'Fully resolve user question with human clarity and AI trust' },
                { id: 'AEO-03', tag: 'Strategy', task: 'Sequence topics to compound authority over time' },
                { id: 'AEO-04', tag: 'Brand Voice', task: 'Enforce tone, positioning, and language consistency' },
                { id: 'AEO-05', tag: 'Verification', task: 'Surface missing data and verify claims for AI citation' },
              ].map((t, i) => (
                <div key={i} className="flex h-9 flex-row items-center gap-3 border-t border-dashed border-gray-200 px-3 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex h-3.5 w-3.5 flex-none cursor-pointer items-center justify-center rounded border border-gray-200 bg-white shadow-sm"></div>
                  <span className="w-16 flex-none text-[11px] font-medium text-gray-800">{t.id}</span>
                  <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[9px] font-medium text-gray-600">{t.tag}</span>
                  {t.star && <Star size={10} className="text-yellow-400 fill-yellow-400 flex-none" />}
                  <span className="truncate text-[10px] text-gray-600">{t.task}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Layer 3 (Closest) */}
        <motion.div style={{ x: x3, y: y3 }} className="absolute w-full h-full">
          {/* Cable */}
          <div id="cable" className="absolute -top-20 right-[104px] h-[226px] w-7 -rotate-5 scale-[0.8] transition-all duration-[600ms] ease-out sm:right-[224px] lg:right-[288px] lg:scale-100 xl:-top-16 xl:right-[386px] pointer-events-auto">
            <svg width="28" height="226" viewBox="0 0 28 226" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-all delay-100 duration-300 ease-in-out hover:translate-y-8 cursor-pointer">
              <path d="M14 0V200" stroke="#E5E7EB" strokeWidth="6" strokeLinecap="round"/>
              <rect x="10" y="200" width="8" height="16" rx="2" fill="#D1D5DB"/>
              <rect x="12" y="216" width="4" height="10" rx="1" fill="#9CA3AF"/>
            </svg>
          </div>

          {/* Torn Paper Transactions */}
          <div className="absolute z-10 flex -rotate-10 flex-col px-6 pb-8 pt-4 transition-all duration-[600ms] ease-out -right-40 -top-28 sm:-right-32 sm:-top-32 lg:-right-14 lg:-top-20 xl:-right-[34px] xl:-top-[68px] scale-[0.7] lg:scale-[0.8] xl:scale-100 pointer-events-auto">
            <TornPaperBg />
            <div className="relative z-10">
              {[
                { engine: 'Perplexity', type: 'Citation', status: 'Rank #1' },
                { engine: 'ChatGPT', type: 'Source', status: 'Verified' },
                { engine: 'Gemini', type: 'Mention', status: 'Rank #1' },
                { engine: 'Claude', type: 'Context', status: 'Included' },
                { engine: 'Google SGE', type: 'Answer', status: 'Rank #1' },
                { engine: 'Bing Copilot', type: 'Citation', status: 'Verified' },
                { engine: 'Meta AI', type: 'Source', status: 'Included' },
              ].map((item, i) => (
                <div key={i} className="relative flex h-[34px] w-[224px] flex-row items-center justify-between border-b border-dashed border-gray-200">
                  <div className="flex h-3.5 w-3.5 flex-none cursor-pointer items-center justify-center rounded border border-gray-200 bg-white shadow-sm"></div>
                  <span className="text-[11px] font-medium text-gray-800 w-20">{item.engine}</span>
                  <span className="text-[10px] text-gray-500 w-12">{item.type}</span>
                  <span className="flex flex-row items-center gap-1 rounded border border-green-200 bg-green-50 px-1.5 py-0.5 text-[9px] text-green-700 font-medium">
                    <Check size={10} strokeWidth={3} /> {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div id="calendar" className="absolute flex w-[158px] -rotate-4 flex-col rounded-[12px] border border-dashed border-gray-300 transition-all duration-[600ms] ease-out max-md:hidden -right-12 bottom-52 lg:-right-10 lg:bottom-64 xl:-right-[30px] xl:bottom-[324px] scale-[0.7] lg:scale-[0.8] xl:scale-100 bg-white/60 backdrop-blur-md p-3 pointer-events-auto">
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-center justify-between mb-1">
                <div className="flex h-5 w-5 items-center justify-center rounded border border-gray-200 bg-white shadow-sm cursor-pointer hover:bg-gray-50"><ChevronRight size={12} className="rotate-180 text-gray-600"/></div>
                <span className="text-[10px] font-medium text-gray-800">May 2024</span>
                <div className="flex h-5 w-5 items-center justify-center rounded border border-gray-200 bg-white shadow-sm cursor-pointer hover:bg-gray-50"><ChevronRight size={12} className="text-gray-600"/></div>
              </div>
              <div className="grid grid-cols-7 text-center text-[8px] font-medium text-gray-400 mb-1">
                <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
              </div>
              <div className="grid grid-cols-7 text-center text-[9px] gap-y-1 text-gray-700 font-medium">
                <span className="text-gray-300">29</span><span className="text-gray-300">30</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                <span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span>
                <span>13</span><span>14</span><span>15</span><span>16</span><span>17</span><span>18</span><span>19</span>
                <span>20</span><span>21</span><span>22</span><span>23</span><span>24</span><span>25</span><span>26</span>
                <span>27</span><span>28</span><span>29</span><span>30</span><span>31</span><span className="text-gray-300">1</span><span className="text-gray-300">2</span>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div id="toolbar" className="absolute flex -rotate-5 scale-[0.7] flex-row gap-3 transition-all duration-[600ms] ease-out lg:scale-[0.8] xl:scale-100 -right-4 bottom-26 sm:bottom-36 md:bottom-38 md:right-26 lg:bottom-46 lg:right-30 xl:bottom-[238px] xl:right-[180px] bg-white/60 backdrop-blur-md px-3 py-2 rounded-lg border border-dashed border-gray-300 pointer-events-auto">
            <Bold size={14} className="text-gray-700 cursor-pointer hover:text-black"/>
            <Italic size={14} className="text-gray-700 cursor-pointer hover:text-black"/>
            <Underline size={14} className="text-gray-700 cursor-pointer hover:text-black"/>
            <LinkIcon size={14} className="text-gray-700 cursor-pointer hover:text-black"/>
            <File size={14} className="text-gray-700 cursor-pointer hover:text-black"/>
          </div>

          {/* Sidebar */}
          <div id="sidebar" className="absolute flex w-[168px] -rotate-7 scale-[0.7] flex-col gap-2 transition-all duration-[600ms] ease-out max-md:hidden lg:scale-[0.8] xl:scale-100 -bottom-22 -right-16 lg:-bottom-18 xl:-bottom-[52px] xl:-right-[58px] bg-white/60 backdrop-blur-md p-2 rounded-2xl border border-dashed border-gray-300 pointer-events-auto">
            <div className="flex flex-row items-center px-2 py-1.5 hover:bg-white/50 rounded-lg cursor-pointer transition-colors">
              <div className="flex flex-row items-center gap-2">
                <div className="h-5 w-5 bg-gray-900 rounded-full overflow-hidden flex items-center justify-center text-white">
                  <Sparkles size={10} />
                </div>
                <span className="text-[11px] font-medium text-gray-800">FlipAEO Engine</span>
              </div>
            </div>
            <div className="h-px bg-gray-200 border-t border-dashed border-transparent mx-2"></div>
            <div className="flex flex-col gap-0.5">
              {[
                { icon: Target, label: 'Knowledge Gaps', count: 84 },
                { icon: ListOrdered, label: 'Topics Sequenced', count: 12 },
                { icon: PenTool, label: 'In Production', count: 7 },
                { icon: CheckCircle, label: 'Published', count: 142 },
                { icon: Award, label: 'Citations Earned', count: 892 },
              ].map((item, i) => (
                <div key={i} className="flex flex-row items-center justify-between px-2 py-1.5 hover:bg-white/50 rounded-lg cursor-pointer transition-colors">
                  <div className="flex flex-row items-center gap-2 text-gray-600">
                    <item.icon size={12} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </div>
                  {item.count && <span className="text-[9px] text-gray-400 font-medium">{item.count}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div id="form" className="absolute flex w-[272px] -rotate-10 scale-[0.7] flex-col rounded-2xl border border-dashed border-gray-300 transition-all duration-[600ms] ease-out lg:scale-[0.8] xl:scale-100 -bottom-40 -right-32 sm:-bottom-34 md:right-18 lg:-bottom-32 lg:right-24 xl:-bottom-[122px] xl:right-[162px] bg-white/60 backdrop-blur-md pointer-events-auto">
            <div className="flex flex-col gap-4 p-5">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-gray-900">Dominate AI Search</span>
                <span className="text-[10px] text-gray-500">Get a custom gap analysis for your brand.</span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-gray-700">Website URL</span>
                  <input tabIndex={-1} placeholder="https://yourbrand.com" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[10px] text-gray-800 shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300" type="url" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-gray-700">Target Category</span>
                  <input tabIndex={-1} placeholder="e.g. B2B SaaS" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[10px] text-gray-800 shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300" type="text" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-gray-700">Work Email</span>
                  <input tabIndex={-1} placeholder="you@company.com" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[10px] text-gray-800 shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300" type="email" />
                </div>
              </div>
              <button className="flex h-8 items-center justify-center rounded-lg bg-gray-900 text-[10px] font-medium text-white hover:bg-gray-800 transition-colors mt-1">
                Request Gap Analysis
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen w-full pointer-events-none">
        <div className="text-left md:text-center max-w-4xl px-6 md:px-4 pointer-events-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-gray-900 tracking-tight leading-tight mb-4">
            <span className="relative inline-block mr-2 md:mx-2 -translate-y-1">
              <svg className="absolute inset-0 w-[110%] h-[110%] -left-[5%] -top-[5%] text-gray-800 -rotate-2 drop-shadow-md" viewBox="0 0 100 40" preserveAspectRatio="none" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 20 Q10 5 50 5 Q90 5 95 20 Q100 35 50 35 Q0 35 5 20 Z" />
              </svg>
              <span className="relative text-white font-cursive text-5xl md:text-6xl lg:text-7xl px-4 py-1 inline-block -rotate-2">FlipAEO</span>
            </span>
            makes your brand the #1 citation in AI search with Strategic content.
          </h1>
          <div className="flex flex-wrap items-center justify-start md:justify-center gap-3 text-2xl md:text-3xl lg:text-4xl font-medium text-gray-900 mt-6">
            <a href="#" className="underline decoration-2 underline-offset-4 hover:text-gray-600 transition-colors">Start free trial</a>
            
            <div className="bg-[#1C1C1C] text-white rounded-[14px] w-12 h-12 flex items-center justify-center rotate-[-5deg] shadow-lg mx-1 border-2 border-white/10">
              <Sparkles size={20} strokeWidth={2.5} />
            </div>
            
            <span>or</span>
            
            <a href="#" className="underline decoration-2 underline-offset-4 hover:text-gray-600 transition-colors">see pricing</a>
            
            <div className="relative bg-[#1C1C1C] text-white rounded-[10px] px-3 py-2 flex items-center justify-center rotate-[10deg] shadow-lg mx-1 border-2 border-white/10">
              <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#F4F4F5] rounded-full border-r-2 border-[#1C1C1C]"></div>
              <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#F4F4F5] rounded-full border-l-2 border-[#1C1C1C]"></div>
              <span className="text-xs font-bold tracking-tight">$99/mo</span>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors bg-white/50 backdrop-blur-sm shadow-sm">
            <ArrowDown size={16} />
          </button>
        </div>
      </div>
      </div>
      {/* End Hero Section Wrapper */}