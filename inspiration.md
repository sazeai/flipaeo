<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clean Flat Dashboard UI</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                    },
                    colors: {
                        textMain: '#111827',
                        textMuted: '#6b7280',
                        bgSidebar: '#ffffff',
                        bgCanvas: '#ffffff', /* Clean white canvas */
                    }
                }
            }
        }
    </script>
    <style>
        /* =========================================================
           CLEAN, FLAT CARD DESIGN SYSTEM (No Glassmorphism)
           ========================================================= */
           
        /* 1. Flat Gray Outer Container */
        .neo-container {
            background-color: #f4f5f7 !important; /* Solid light gray */
            border: 1px solid #e5e7eb !important; /* Thin gray border */
            box-shadow: none !important; /* Removed all heavy glowing shadows */
        }

        /* 2. Flat White Inner Container */
        .neo-inner-recess {
            background-color: #ffffff !important; /* Pure white inner bg */
            border: 1px solid #f3f4f6 !important; /* Ultra thin inner border */
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important; /* Just a tiny drop shadow for separation */
        }

        /* 3. Volumetric "Swelling" Black Button (Kept ONLY for interactive buttons to maintain your brand contrast) */
        .neo-dark-btn {
            background: linear-gradient(180deg, #38383b 0%, #111112 100%) !important;
            box-shadow: 
                inset 0px 1.5px 1px rgba(255, 255, 255, 0.35), 
                inset 0px 6px 10px rgba(255, 255, 255, 0.1),   
                inset 0px -2px 4px rgba(0, 0, 0, 0.6),         
                0px 6px 10px -3px rgba(0, 0, 0, 0.5),          
                0px 2px 4px -1px rgba(0, 0, 0, 0.3) !important; 
            border: none !important;
            color: #ffffff !important;
            transition: all 0.2s ease;
        }
        .neo-dark-btn:active {
            transform: translateY(2px);
            box-shadow: 
                inset 0px 2px 4px rgba(0, 0, 0, 0.6), 
                inset 0px 4px 8px rgba(0, 0, 0, 0.4),
                0px 2px 4px rgba(0, 0, 0, 0.2) !important;
        }

        /* 4. Solid Cool Gray Buttons (Inactive states) */
        .neo-light-btn {
            background-color: #f3f4f6; 
            border: 1px solid #e5e7eb !important;
            box-shadow: none !important;
            color: #111827 !important;
        }
        .neo-light-btn:hover {
            background-color: #e5e7eb;
        }
        
        /* 5. Flat Input Wrapper */
        .neo-input-wrapper {
            background-color: #f4f5f7;
            border: 1px solid transparent;
            box-shadow: none;
            transition: all 0.2s ease;
        }
        .neo-input-wrapper:focus-within {
            background-color: #ffffff;
            border-color: #d1d5db;
            box-shadow: 0 2px 4px 0 rgba(0,0,0,0.02);
        }

        /* Custom Hatched Pattern for In-Progress Bars */
        .bg-hatched {
            background-color: #ecfdf5; 
            background-image: repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 3px,
                #a7f3d0 3px, 
                #a7f3d0 4.5px
            );
        }
    </style>
</head>
<body class="bg-[#d1d5db] min-h-screen p-4 sm:p-8 flex items-center justify-center font-sans text-textMain antialiased">

    <!-- The Actual App Window -->
    <div class="w-full max-w-[1440px] h-[900px] bg-bgCanvas rounded-[32px] overflow-hidden flex shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
        
        <!-- ================= SIDEBAR ================= -->
        <aside class="w-[260px] flex-shrink-0 bg-bgSidebar border-r border-gray-100 flex flex-col h-full hidden lg:flex z-20">
            
            <!-- Logo Area -->
            <div class="px-6 py-6 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg neo-dark-btn flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <span class="font-bold tracking-tight text-[16px]">MAC IQ</span>
                </div>
            </div>

            <!-- Search Bar -->
            <div class="px-6 pb-4">
                <div class="w-full rounded-lg h-10 flex items-center px-3 neo-input-wrapper cursor-text group">
                    <svg class="text-textMuted group-focus-within:text-textMain transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    <input type="text" placeholder="Search" class="w-full bg-transparent border-none text-sm font-medium text-textMain placeholder:text-textMuted focus:outline-none focus:ring-0 ml-2">
                </div>
            </div>

            <!-- Navigation Scroll Area -->
            <div class="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-6 scrollbar-hide">
                
                <!-- Main Menu Group -->
                <div>
                    <h3 class="px-3 text-[11px] font-bold text-gray-400 tracking-[0.15em] uppercase mb-3">Main Menu</h3>
                    <nav class="flex flex-col gap-1">
                        <!-- Active Item -->
                        <a href="#" class="flex items-center gap-3 px-3 py-2 neo-dark-btn rounded-lg font-medium text-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                            Dashboard
                        </a>
                        <!-- Inactive Items -->
                        <a href="#" class="flex items-center gap-3 px-3 py-2 text-textMuted hover:text-textMain hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
                            Tasks
                        </a>
                        <a href="#" class="flex items-center gap-3 px-3 py-2 text-textMuted hover:text-textMain hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
                            Notes
                        </a>
                    </nav>
                </div>

                <!-- Information Group -->
                <div>
                    <h3 class="px-3 text-[11px] font-bold text-gray-400 tracking-[0.15em] uppercase mb-3">Information</h3>
                    <nav class="flex flex-col gap-1">
                        <a href="#" class="flex items-center gap-3 px-3 py-2 text-textMuted hover:text-textMain hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                            Reports
                        </a>
                        <a href="#" class="flex items-center gap-3 px-3 py-2 text-textMuted hover:text-textMain hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            Contacts
                        </a>
                    </nav>
                </div>
            </div>

            <!-- Profile Bottom Area -->
            <div class="p-4 border-t border-gray-100">
                <button class="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div class="flex items-center gap-3 text-left">
                        <div class="w-8 h-8 rounded-full neo-dark-btn flex items-center justify-center font-bold text-sm">
                            V
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-textMain leading-tight">Hamed Afolabi</p>
                            <p class="text-xs text-textMuted font-medium">Workspace</p>
                        </div>
                    </div>
                </button>
            </div>
        </aside>

        <!-- ================= MAIN CONTENT ================= -->
        <main class="flex-1 flex flex-col h-full overflow-hidden relative">
            
            <!-- Top Header -->
            <header class="px-8 py-5 flex items-center justify-between z-10 sticky top-0 bg-bgCanvas/90 backdrop-blur-md">
                <h1 class="text-xl font-bold text-textMain">Dashboard</h1>
                
                <div class="flex items-center gap-4">
                    <!-- Notifications -->
                    <button class="w-9 h-9 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center text-textMuted hover:text-textMain transition-all">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                    </button>
                    
                    <!-- Share Button -->
                    <button class="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-semibold text-textMain hover:bg-gray-50 transition-all">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                        Share
                    </button>
                    
                    <!-- Menu dots -->
                    <button class="w-8 h-8 flex items-center justify-center text-textMuted hover:text-textMain">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                    </button>
                </div>
            </header>

            <!-- Scrollable Body -->
            <div class="flex-1 overflow-y-auto px-8 pb-10 scrollbar-hide">
                
                <!-- Welcome Banner & Top Actions -->
                <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 mt-2">
                    <div>
                        <h2 class="text-2xl font-bold text-textMain leading-tight mb-1">Welcome Back, Hameed</h2>
                        <p class="text-sm text-textMuted font-medium">Your team's success started here. Let's make progress together.</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <button class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold neo-light-btn transition-all">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                            Apr 01- Apr 07, 2026
                        </button>
                        <button class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold neo-dark-btn transition-all">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                            Add New
                        </button>
                    </div>
                </div>

                <!-- ==========================================
                     YOUR EXACT SKETCHED STAT CARDS (Rebuilt Flat)
                     ========================================== -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    
                    <!-- Stat Card 1 -->
                    <!-- Outer Card: Gray Background, Rounded-xl, p-1.5 -->
                    <div class="neo-container rounded-xl p-1.5 flex flex-col">
                        <!-- Inner Card: White Background, Rounded-lg, p-4 -->
                        <div class="neo-inner-recess rounded-lg p-4 flex items-center gap-4">
                            <!-- Circular Icon -->
                            <div class="w-12 h-12 rounded-full neo-dark-btn flex items-center justify-center shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-textMain leading-none mb-1">560</h3>
                                <p class="text-sm font-medium text-textMuted">Attendance</p>
                            </div>
                        </div>
                        <!-- Bottom Action -->
                        <div class="py-2.5 flex justify-center items-center">
                            <button class="text-xs font-semibold text-textMuted hover:text-textMain transition-colors flex items-center gap-1.5">
                                View Details 
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            </button>
                        </div>
                    </div>

                    <!-- Stat Card 2 -->
                    <div class="neo-container rounded-xl p-1.5 flex flex-col">
                        <div class="neo-inner-recess rounded-lg p-4 flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full neo-dark-btn flex items-center justify-center shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M10 14l4 4M14 14l-4 4"/></svg>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-textMain leading-none mb-1">010</h3>
                                <p class="text-sm font-medium text-textMuted">Absent</p>
                            </div>
                        </div>
                        <div class="py-2.5 flex justify-center items-center">
                            <button class="text-xs font-semibold text-textMuted hover:text-textMain transition-colors flex items-center gap-1.5">
                                View Details 
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            </button>
                        </div>
                    </div>

                    <!-- Stat Card 3 -->
                    <div class="neo-container rounded-xl p-1.5 flex flex-col">
                        <div class="neo-inner-recess rounded-lg p-4 flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full neo-dark-btn flex items-center justify-center shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><rect x="8" y="14" width="8" height="4" rx="1"/></svg>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-textMain leading-none mb-1">040</h3>
                                <p class="text-sm font-medium text-textMuted">Leave Apply</p>
                            </div>
                        </div>
                        <div class="py-2.5 flex justify-center items-center">
                            <button class="text-xs font-semibold text-textMuted hover:text-textMain transition-colors flex items-center gap-1.5">
                                View Details 
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Main Content Grid (Applied the same flat gray/white logic everywhere) -->
                <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    
                    <!-- Left Column -->
                    <div class="xl:col-span-2 flex flex-col gap-8">
                        
                        <!-- Course Graph (Restored) -->
                        <div class="neo-container rounded-xl p-1.5">
                            <div class="neo-inner-recess rounded-lg p-6 pb-8">
                                <div class="flex items-center justify-between mb-10">
                                    <h3 class="text-lg font-bold text-textMain">Course</h3>
                                    
                                    <!-- Premium Graph Legend -->
                                    <div class="flex items-center gap-5 text-[13px] font-semibold text-textMain">
                                        <div class="flex items-center gap-2">
                                            <div class="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
                                            Completed
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <div class="w-2.5 h-2.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0]"></div>
                                            <span class="text-textMuted font-medium">In progress</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Stacked Bar Chart Visualization -->
                                <div class="relative h-[220px] w-full flex mt-2">
                                    
                                    <!-- Y Axis Labels -->
                                    <div class="flex flex-col justify-between items-end h-full text-xs font-semibold text-textMuted w-6 py-0.5">
                                        <span>100</span>
                                        <span>60</span>
                                        <span>40</span>
                                        <span>20</span>
                                        <span>10</span>
                                        <span>0</span>
                                    </div>
                                    
                                    <!-- Chart Grid & Bars -->
                                    <div class="flex-1 relative ml-4">
                                        
                                        <!-- Horizontal Dotted Grid Lines -->
                                        <div class="absolute inset-0 flex flex-col justify-between py-2">
                                            <div class="border-b border-dotted border-gray-200 w-full h-0"></div>
                                            <div class="border-b border-dotted border-gray-200 w-full h-0"></div>
                                            <div class="border-b border-dotted border-gray-200 w-full h-0"></div>
                                            <div class="border-b border-dotted border-gray-200 w-full h-0"></div>
                                            <div class="border-b border-dotted border-gray-200 w-full h-0"></div>
                                            <div class="border-b border-dotted border-gray-200 w-full h-0"></div>
                                        </div>

                                        <!-- Bars Container -->
                                        <div class="absolute inset-0 flex justify-between items-end px-2 pt-4 pb-2 z-10">
                                            
                                            <!-- Jan -->
                                            <div class="relative flex flex-col justify-end items-center w-8 h-full gap-1 group">
                                                <div class="w-full bg-hatched rounded-lg" style="height: 35%;"></div>
                                                <div class="w-full bg-[#10b981] rounded-lg" style="height: 25%;"></div>
                                                <span class="absolute -bottom-8 text-xs font-semibold text-textMuted">Jan</span>
                                            </div>

                                            <!-- Feb -->
                                            <div class="relative flex flex-col justify-end items-center w-8 h-full gap-1 group">
                                                <div class="w-full bg-hatched rounded-lg" style="height: 25%;"></div>
                                                <div class="w-full bg-[#10b981] rounded-lg" style="height: 45%;"></div>
                                                <span class="absolute -bottom-8 text-xs font-semibold text-textMuted">Feb</span>
                                            </div>

                                            <!-- Mar -->
                                            <div class="relative flex flex-col justify-end items-center w-8 h-full gap-1 group">
                                                <div class="w-full bg-hatched rounded-lg" style="height: 45%;"></div>
                                                <div class="w-full bg-[#10b981] rounded-lg" style="height: 15%;"></div>
                                                <span class="absolute -bottom-8 text-xs font-semibold text-textMuted">Mar</span>
                                            </div>

                                            <!-- Apr -->
                                            <div class="relative flex flex-col justify-end items-center w-8 h-full gap-1 group">
                                                <div class="w-full bg-hatched rounded-lg" style="height: 30%;"></div>
                                                <div class="w-full bg-[#10b981] rounded-lg" style="height: 25%;"></div>
                                                <span class="absolute -bottom-8 text-xs font-semibold text-textMuted">Apr</span>
                                            </div>

                                            <!-- May -->
                                            <div class="relative flex flex-col justify-end items-center w-8 h-full gap-1 group">
                                                <div class="w-full bg-hatched rounded-lg" style="height: 25%;"></div>
                                                <div class="w-full bg-[#10b981] rounded-lg" style="height: 35%;"></div>
                                                <span class="absolute -bottom-8 text-xs font-semibold text-textMuted">May</span>
                                            </div>

                                            <!-- Jun -->
                                            <div class="relative flex flex-col justify-end items-center w-8 h-full gap-1 group">
                                                <div class="w-full bg-hatched rounded-lg" style="height: 32%;"></div>
                                                <div class="w-full bg-[#10b981] rounded-lg" style="height: 18%;"></div>
                                                <span class="absolute -bottom-8 text-xs font-semibold text-textMuted">Jun</span>
                                            </div>

                                            <!-- Jul (Active/Hovered State) -->
                                            <div class="relative flex flex-col justify-end items-center w-8 h-full gap-1 z-20">
                                                <!-- Active Gray Pill Background -->
                                                <div class="absolute -inset-x-3 -top-2 -bottom-10 bg-[#f4f5f7] rounded-xl -z-10 border border-gray-100"></div>
                                                
                                                <!-- Custom Floating Tooltip -->
                                                <div class="absolute bottom-[80%] left-1/2 ml-3 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-3 border border-gray-100 w-[145px]">
                                                    <p class="text-[13px] font-bold text-textMain mb-2.5">July 2025</p>
                                                    <div class="flex flex-col gap-1.5">
                                                        <div class="flex items-center gap-2 text-[12px] font-bold text-textMain">
                                                            <div class="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div> Completed: 15
                                                        </div>
                                                        <div class="flex items-center gap-2 text-[12px] font-semibold text-textMuted">
                                                            <div class="w-2.5 h-2.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0]"></div> In progress: 60
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="w-full bg-hatched rounded-lg" style="height: 48%;"></div>
                                                <div class="w-full bg-[#10b981] rounded-lg" style="height: 30%;"></div>
                                                <span class="absolute -bottom-8 text-xs font-bold text-textMain">Jul</span>
                                            </div>

                                            <!-- Aug -->
                                            <div class="relative flex flex-col justify-end items-center w-8 h-full gap-1 group">
                                                <div class="w-full bg-hatched rounded-lg" style="height: 30%;"></div>
                                                <div class="w-full bg-[#10b981] rounded-lg" style="height: 30%;"></div>
                                                <span class="absolute -bottom-8 text-xs font-semibold text-textMuted">Aug</span>
                                            </div>

                                            <!-- Sep -->
                                            <div class="relative flex flex-col justify-end items-center w-8 h-full gap-1 group">
                                                <div class="w-full bg-hatched rounded-lg" style="height: 25%;"></div>
                                                <div class="w-full bg-[#10b981] rounded-lg" style="height: 25%;"></div>
                                                <span class="absolute -bottom-8 text-xs font-semibold text-textMuted">Sep</span>
                                            </div>

                                            <!-- Oct -->
                                            <div class="relative flex flex-col justify-end items-center w-8 h-full gap-1 group">
                                                <div class="w-full bg-hatched rounded-lg" style="height: 25%;"></div>
                                                <div class="w-full bg-[#10b981] rounded-lg" style="height: 10%;"></div>
                                                <span class="absolute -bottom-8 text-xs font-semibold text-textMuted">Oct</span>
                                            </div>

                                            <!-- Nov -->
                                            <div class="relative flex flex-col justify-end items-center w-8 h-full gap-1 group">
                                                <div class="w-full bg-hatched rounded-lg" style="height: 25%;"></div>
                                                <div class="w-full bg-[#10b981] rounded-lg" style="height: 30%;"></div>
                                                <span class="absolute -bottom-8 text-xs font-semibold text-textMuted">Nov</span>
                                            </div>

                                            <!-- Dec -->
                                            <div class="relative flex flex-col justify-end items-center w-8 h-full gap-1 group">
                                                <div class="w-full bg-hatched rounded-lg" style="height: 35%;"></div>
                                                <div class="w-full bg-[#10b981] rounded-lg" style="height: 25%;"></div>
                                                <span class="absolute -bottom-8 text-xs font-semibold text-textMuted">Dec</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Complete Calendar Card -->
                        <div class="neo-container rounded-xl p-1.5 flex flex-col">
                            
                            <!-- Header in Outer Gray Container -->
                            <div class="px-5 py-3 flex items-center justify-between">
                                <h3 class="text-base font-bold text-textMain ml-1">April 2026</h3>
                                <div class="flex gap-2">
                                    <button class="w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center text-textMuted hover:text-textMain transition-all">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                    </button>
                                    <button class="w-8 h-8 rounded-lg neo-dark-btn flex items-center justify-center text-white transition-all">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                    </button>
                                </div>
                            </div>

                            <!-- Inner White Card for Calendar UI -->
                            <div class="neo-inner-recess rounded-lg p-6">
                                
                                <!-- Days Header -->
                                <div class="grid grid-cols-7 mb-4">
                                    <div class="text-xs font-bold text-textMuted text-center uppercase tracking-wider">Mon</div>
                                    <div class="text-xs font-bold text-textMuted text-center uppercase tracking-wider">Tue</div>
                                    <div class="text-xs font-bold text-textMuted text-center uppercase tracking-wider">Wed</div>
                                    <div class="text-xs font-bold text-textMuted text-center uppercase tracking-wider">Thu</div>
                                    <div class="text-xs font-bold text-textMuted text-center uppercase tracking-wider">Fri</div>
                                    <div class="text-xs font-bold text-textMuted text-center uppercase tracking-wider">Sat</div>
                                    <div class="text-xs font-bold text-textMuted text-center uppercase tracking-wider">Sun</div>
                                </div>

                                <!-- Full Calendar Grid -->
                                <div class="grid grid-cols-7 gap-y-3 gap-x-2">
                                    <!-- Row 1 -->
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg border border-transparent"><span class="text-sm font-semibold text-textMuted/40 pl-1">30</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg border border-transparent"><span class="text-sm font-semibold text-textMuted/40 pl-1">31</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">1</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                                        <span class="text-sm font-bold text-textMain pl-1">2</span>
                                        <div class="w-full bg-brand-50 text-brand-600 border border-brand-100 rounded px-1.5 py-0.5 text-[10px] font-bold truncate">Project Kickoff</div>
                                    </div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">3</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">4</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">5</span></div>
                                    
                                    <!-- Row 2 -->
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">6</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">7</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">8</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">9</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">10</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">11</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                                        <span class="text-sm font-bold text-textMain pl-1">12</span>
                                        <div class="w-full bg-[#fce7f3] text-[#db2777] border border-[#fbcfe8] rounded px-1.5 py-0.5 text-[10px] font-bold truncate">Review Meeting</div>
                                    </div>
                                    
                                    <!-- Row 3 -->
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg bg-gray-50 ring-1 ring-gray-200 shadow-sm cursor-pointer">
                                        <div class="w-6 h-6 flex items-center justify-center rounded-md neo-dark-btn text-white text-[11px] font-bold shadow-sm">13</div>
                                        <div class="flex flex-col gap-1 mt-0.5">
                                            <div class="w-full bg-[#ecfdf5] text-[#059669] border border-[#d1fae5] rounded px-1.5 py-0.5 text-[10px] font-bold truncate">Client Call</div>
                                            <div class="w-full bg-[#fef3c7] text-[#d97706] border border-[#fde68a] rounded px-1.5 py-0.5 text-[10px] font-bold truncate">Update Assets</div>
                                        </div>
                                    </div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">14</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">15</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">16</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">17</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">18</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">19</span></div>

                                    <!-- Row 4 -->
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">20</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">21</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">22</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">23</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">24</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">25</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">26</span></div>

                                    <!-- Row 5 -->
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">27</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">28</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">29</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"><span class="text-sm font-bold text-textMain pl-1">30</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg border border-transparent"><span class="text-sm font-semibold text-textMuted/40 pl-1">1</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg border border-transparent"><span class="text-sm font-semibold text-textMuted/40 pl-1">2</span></div>
                                    <div class="min-h-[76px] p-2 flex flex-col gap-1 rounded-lg border border-transparent"><span class="text-sm font-semibold text-textMuted/40 pl-1">3</span></div>
                                </div>
                            </div>
                        </div>

                        <!-- Top Performance List -->
                        <div class="neo-container rounded-xl p-1.5">
                            <div class="neo-inner-recess rounded-lg p-6">
                                <div class="flex items-center justify-between mb-6">
                                    <h3 class="text-sm font-bold text-textMain">Top Performance</h3>
                                    <button class="flex items-center gap-1.5 neo-light-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                                        Daily
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                    </button>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <!-- List Item (Clean Borders, No Recess) -->
                                    <div class="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 rounded-md bg-white border border-gray-200 shadow-sm flex items-center justify-center font-bold text-sm text-textMain">AM</div>
                                            <div>
                                                <p class="text-sm font-bold text-textMain leading-tight">Abdul Mujeeb</p>
                                                <p class="text-xs text-textMuted font-medium mt-0.5">mujeeb@gmail.com</p>
                                            </div>
                                        </div>
                                        <button class="w-8 h-8 flex items-center justify-center text-textMuted hover:text-textMain"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg></button>
                                    </div>
                                    <!-- List Item -->
                                    <div class="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 rounded-md bg-white border border-gray-200 shadow-sm flex items-center justify-center font-bold text-sm text-textMain">HA</div>
                                            <div>
                                                <p class="text-sm font-bold text-textMain leading-tight">Hamed Afolabi</p>
                                                <p class="text-xs text-textMuted font-medium mt-0.5">hamed@gmail.com</p>
                                            </div>
                                        </div>
                                        <button class="w-8 h-8 flex items-center justify-center text-textMuted hover:text-textMain"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Right Column -->
                    <div class="flex flex-col gap-8">
                        
                        <!-- Mini Calendar Widget -->
                        <div class="neo-container rounded-xl p-1.5">
                            <div class="neo-inner-recess rounded-lg p-6">
                                <div class="flex items-center justify-between mb-6">
                                    <h3 class="text-sm font-bold text-textMain">April 2026</h3>
                                    <div class="flex gap-2">
                                        <button class="w-8 h-8 rounded-lg neo-light-btn flex items-center justify-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
                                        <button class="w-8 h-8 rounded-lg neo-dark-btn flex items-center justify-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>
                                    </div>
                                </div>
                                <div class="grid grid-cols-7 text-center gap-y-4 text-xs font-bold text-textMuted">
                                    <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
                                    <div class="text-textMain mt-1">10</div><div class="text-textMain mt-1">11</div><div class="text-textMain mt-1">12</div>
                                    <!-- Active Dark Date -->
                                    <div class="relative text-white z-10 flex items-center justify-center mt-1">
                                        <span class="absolute inset-0 m-auto w-7 h-7 neo-dark-btn rounded-md -z-10"></span>
                                        13
                                    </div>
                                    <div class="text-textMain mt-1">14</div><div class="text-textMain mt-1">16</div><div class="text-textMain mt-1">17</div>
                                </div>
                            </div>
                        </div>

                        <!-- Today To-do List -->
                        <div class="neo-container rounded-xl p-1.5">
                            <div class="neo-inner-recess rounded-lg p-6">
                                <h3 class="text-sm font-bold text-textMain mb-4">Today To-do</h3>
                                <div class="flex flex-col gap-3">
                                    <!-- Card 1 -->
                                    <div class="border border-gray-100 rounded-lg p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p class="text-sm font-bold text-textMain mb-0.5">Meeting with Henry</p>
                                            <p class="text-[11px] font-semibold text-textMuted">12:00pm-02:00pm</p>
                                        </div>
                                        <div class="w-8 h-8 rounded-lg neo-dark-btn flex items-center justify-center font-bold text-[11px]">+9</div>
                                    </div>
                                    <!-- Card 2 -->
                                    <div class="border border-gray-100 rounded-lg p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p class="text-sm font-bold text-textMain mb-0.5">UI Review</p>
                                            <p class="text-[11px] font-semibold text-textMuted">03:00pm-04:00pm</p>
                                        </div>
                                        <div class="w-8 h-8 rounded-lg neo-dark-btn flex items-center justify-center font-bold text-[11px]">+3</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </main>
        
    </div>

</body>
</html>