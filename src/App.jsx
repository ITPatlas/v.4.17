import { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  ReferenceLine, Brush, RadialBarChart, RadialBar, Treemap,
  ComposedChart, FunnelChart, Funnel, LabelList
} from "recharts";

// ── MAPBOX TOKEN ──────────────────────────────────────────────────────
mapboxgl.accessToken = "pk.eyJ1IjoiMjAyNml0cCIsImEiOiJjbXBoOTl2ZXUweWZ5MnBvaDN2bXk4Z3AxIn0.m7A9AIho4xrDvCKlflPj6w";

// ── DESIGN TOKENS ─────────────────────────────────────────────────────
const C = {
  teal:"#0D7A6B", tealL:"#E8F5F2", tealM:"#5DCAA5", tealD:"#085041",
  blue:"#185FA5", blueL:"#E6F1FB", blueM:"#85B7EB",
  green:"#3B6D11", greenL:"#EAF3DE", greenM:"#97C459",
  amber:"#854F0B", amberL:"#FAEEDA", amberM:"#EF9F27",
  slate:"#1E2A38", slateM:"#5A6A7A", slateL:"#94A3B8",
  border:"#E2E8F0", bg:"#F7F9FA", white:"#FFFFFF",
  red:"#A32D2D", redL:"#FCEBEB",
  coral:"#993C1D", coralL:"#FAECE7",
  purple:"#534AB7", purpleL:"#EEEDFE",
  nav:"#131E2B",
  panelBg:"rgba(255,255,255,0.97)",
};


// ── SHARED DROPDOWN HELPER ────────────────────────────────────────────
const ddStyle = (accentColor = C.teal) => ({
  fontSize:13, padding:"7px 32px 7px 10px", borderRadius:8,
  border:`1px solid ${C.border}`, background:C.white,
  color:C.slate, cursor:"pointer", outline:"none",
  fontFamily:"inherit", WebkitAppearance:"none", appearance:"none",
  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235A6A7A' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center",
  minWidth:130, transition:"border-color 0.15s",
});

// ── DATA ──────────────────────────────────────────────────────────────

const PROJECTS = [
  // ── Original Hydrogen Atlas projects (detailed, with gaps/desc/source) ──
  { id:1,  name:"Fort Nelson FN — H2 & BESS",       investment:"$15M", energySource:"Run-of-river hydro + solar PV", ownership:"Fort Nelson First Nation (100% Indigenous)", productionCost:"~$5–8/kg H₂", operationalEmissions:"< 0.5 kg CO₂e/kg H₂ (renewable grid)",
    province:"BC", tech:"Green H2",          stage:"Pre-feasibility", cap_kt:null, value:12,   lng:-122.68, lat:58.81,  gaps:["Developer","Financing","Technology supplier"], urgent:true,  oems:["Nel Hydrogen","Cummins"],         desc:"Fort Nelson First Nation seeking partners to replace diesel generation with green hydrogen and BESS for ~650 residents. Federal ISED funding letter received.", source:"NRCan Indigenous Community Energy", url:"https://natural-resources.canada.ca/energy-efficiency/communities-and-buildings/indigenous-off-diesel-initiative/21231" },
  { id:2,  name:"Strait of Canso — Atlantic Export", investment:"~$2.4B (Phase 1)", energySource:"Offshore wind (800 MW)", ownership:"World Energy GH2 + Atlantic First Nations partnership", productionCost:"~$2.5–4/kg H₂", operationalEmissions:"< 1 kg CO₂e/kg H₂",
    province:"NS", tech:"Green H2",          stage:"Development",     cap_kt:null, value:800,  lng:-61.38,  lat:45.61,  gaps:["Grid connection","Equity financing"],           urgent:true,  oems:["Nel Hydrogen","Chart Industries"],desc:"Shovel-ready wind-to-hydrogen project targeting Canada-Germany Alliance shipments. 800 MW offshore wind resource. Seeking $120M equity co-investment.",      source:"Nova Scotia Dept. of Energy",      url:"https://novascotia.ca/energy/renewables/" },
  { id:3,  name:"Alberta Carbon Trunk — Blue H2",    investment:"~$1.2B", energySource:"Natural gas + CCUS", ownership:"Enhance Energy / Wolf Carbon Solutions", productionCost:"~$1.5–2.5/kg H₂ (w/ CCS credit)", operationalEmissions:"< 2 kg CO₂e/kg H₂ (CCUS-paired)",
    province:"AB", tech:"Blue H2",           stage:"Development",     cap_kt:null, value:450,  lng:-113.49, lat:52.82,  gaps:["Equity financing","CCS partner"],               urgent:false, oems:["Air Liquide","Chart Industries"], desc:"Expansion of blue hydrogen production by 200 MW with integrated CCS. Qualifies for federal Clean Hydrogen ITC at 40% tier. EA filed March 2026.",            source:"Alberta Energy Regulator",         url:"https://www.aer.ca/" },
  { id:4,  name:"Énergie Propre QC — Green NH3",     investment:"~$4.2B", energySource:"Wind + Hydro-Québec grid (electrolysis)", ownership:"Québec consortium (private)", productionCost:"~$3–5/kg H₂", operationalEmissions:"< 0.5 kg CO₂e/kg H₂",
    province:"QC", tech:"Low-carbon ammonia",stage:"Pre-feasibility", cap_kt:null, value:1200, lng:-71.21,  lat:46.81,  gaps:["Developer","Offtake agreement","Financing"],   urgent:false, oems:["Nel Hydrogen","Air Liquide"],     desc:"Québec consortium exploring wind-to-ammonia export facility targeting EU fertilizer and shipping markets. 500 MW electrolyser scale proposed.",               source:"Investissement Québec",            url:"https://www.investquebec.com/quebec/en/" },
  { id:5,  name:"Port of Prince Rupert — H2 Bunker", investment:"$85M (Phase 1)", energySource:"BC Hydro (low-carbon grid) + wind", ownership:"Port of Prince Rupert Authority", productionCost:"~$3–4/kg H₂", operationalEmissions:"< 1 kg CO₂e/kg H₂",
    province:"BC", tech:"Green H2",          stage:"Feasibility",     cap_kt:null, value:85,   lng:-130.32, lat:54.32,  gaps:["Equity financing","Offtake agreement"],         urgent:false, oems:["Plug Power","HTEC Hydrogen"],    desc:"Port authority RFI for green hydrogen bunkering infrastructure. $4.2M feasibility underway. Seeking equity co-investment and shipping line offtake.",        source:"Port of Prince Rupert",            url:"https://www.rupertport.com/" },
  { id:6,  name:"Air Canada — SAF Procurement",      investment:"N/A (demand-side)", energySource:"Power-to-liquid (green H₂ + CO₂)", ownership:"Air Canada (offtake)", productionCost:"~$1,500–2,500/tonne SAF", operationalEmissions:"80% reduction vs. fossil Jet-A",
    province:"ON", tech:"SAF",               stage:"Procurement",     cap_kt:null, value:null, lng:-79.63,  lat:43.68,  gaps:["SAF supplier","Long-term offtake"],             urgent:false, oems:["Air Liquide"],                   desc:"Air Canada RFP for domestic SAF supply beginning 2028, targeting 10% blend. 10-year offtake framework. CI must be below CORSIA threshold.",                 source:"Air Canada Sustainability Report", url:"https://www.aircanada.com/ca/en/aco/home/about/sustainability.html" },
  { id:7,  name:"Cenovus — Blue H2 Decarbonization", investment:"~$800M", energySource:"Natural gas + CCS", ownership:"Cenovus Energy", productionCost:"~$1.5–2.5/kg H₂", operationalEmissions:"< 4 kg CO₂e/kg H₂ (CCS-dependent)",
    province:"AB", tech:"Blue H2",           stage:"Feasibility",     cap_kt:null, value:350,  lng:-114.07, lat:51.05,  gaps:["Technology partner","CCS storage operator"],   urgent:false, oems:["Air Liquide","Chart Industries"], desc:"Cenovus seeking technology partner for 300 MW blue hydrogen facility at Edmonton complex. SMR + CCS configuration preferred.",                                source:"Cenovus Energy Press Release",     url:"https://www.cenovus.com/news" },
  { id:8,  name:"Winnipeg — H2 Transit Bus Pilot",   investment:"$22M (Phase 1)", energySource:"Manitoba Hydro (near-zero CI grid)", ownership:"City of Winnipeg", productionCost:"~$5–7/kg H₂ (small-scale)", operationalEmissions:"< 0.3 kg CO₂e/kg H₂",
    province:"MB", tech:"Green H2",          stage:"Procurement",     cap_kt:null, value:22,   lng:-97.14,  lat:49.90,  gaps:["Fuelling infrastructure","Bus supplier"],       urgent:false, oems:["Ballard Power Systems","HTEC Hydrogen"], desc:"City of Winnipeg Transit RFP for 20 fuel cell buses and hydrogen fuelling infrastructure. Federal ZEV Transit Fund approved.",                              source:"City of Winnipeg Procurement",     url:"https://winnipeg.ca/matmgt/bidopp.stm" },
  { id:9,  name:"Calgary Region H2 Hub",             investment:"~$650M", energySource:"Natural gas + CCS (primary) + renewables", ownership:"Calgary region consortium (private + municipal)", productionCost:"~$2–3/kg H₂", operationalEmissions:"< 4 kg CO₂e/kg H₂",
    province:"AB", tech:"Blue H2",           stage:"Development",     cap_kt:null, value:650,  lng:-114.10, lat:51.10,  gaps:["Grid connection","Offtake agreement"],          urgent:true,  oems:["Air Liquide","Ekona Power"],      desc:"Calgary Region Hydrogen Hub — multi-project cluster supporting industrial decarbonization in the Calgary economic region. $57M provincial fund contributor.", source:"Alberta Innovates H2 Centre",      url:"https://albertainnovates.ca/programs/hydrogen-centre-of-excellence/" },
  { id:10, name:"BC Offshore Wind-to-H2",            investment:"~$6–8B (estimated)", energySource:"Offshore wind (2 GW)", ownership:"TBD — Crown / private partnership", productionCost:"~$3–6/kg H₂ (cost reduction pathway)", operationalEmissions:"< 1 kg CO₂e/kg H₂",
    province:"BC", tech:"Green H2",          stage:"Pre-feasibility", cap_kt:null, value:2000, lng:-128.0,  lat:50.5,   gaps:["Developer","Policy clarity","Grid connection"], urgent:false, oems:["Nel Hydrogen","Plug Power"],      desc:"Large-scale offshore wind resource off BC coast. 2 GW wind potential identified. Pre-feasibility study underway with federal support.",                     source:"BC Ministry of Energy",            url:"https://www.gov.bc.ca/gov/content/industry/electricity-alternative-energy/energy-resources/hydrogen" },
  { id:11, name:"Newfoundland Green H2 Export",      investment:"~$2.5B (Phase 1)", energySource:"Onshore wind", ownership:"Private developer (TBD)", productionCost:"~$2.5–4/kg H₂", operationalEmissions:"< 1 kg CO₂e/kg H₂",
    province:"NL", tech:"Green H2",          stage:"Feasibility",     cap_kt:null, value:900,  lng:-52.73,  lat:47.56,  gaps:["Equity financing","Offtake agreement"],         urgent:false, oems:["Nel Hydrogen","Chart Industries"],desc:"Wind-to-hydrogen export project targeting EU buyers. 500 MW wind resource. Environmental assessment underway.",                                              source:"NL Dept. of Industry, Energy & Tech", url:"https://www.gov.nl.ca/iet/energy/" },
  { id:12, name:"Quebec City — E-fuel Plant",        investment:"~$800M", energySource:"Hydro-Québec grid (electrolysis) + biogenic CO₂", ownership:"Private consortium", productionCost:"~$1,200–2,000/tonne e-fuel", operationalEmissions:"70–90% CI reduction vs. fossil fuels",
    province:"QC", tech:"E-fuels",           stage:"Pre-feasibility", cap_kt:null, value:180,  lng:-71.25,  lat:46.85,  gaps:["Technology partner","Project financing"],       urgent:false, oems:["Air Liquide","Plug Power"],      desc:"Power-to-liquid e-fuel plant concept in Québec City leveraging low-CI hydro grid. Targeting aviation and marine markets.",                                    source:"Transition Energétique Québec",    url:"https://transitionenergetique.gouv.qc.ca/en/" },

  // ── IEA Global Hydrogen Production Projects Database (Sep 2025) ──────
  // Source: IEA Global Hydrogen Production Projects Database, September 2025
  // Coordinates, capacity, and status from IEA. Descriptions and source URLs
  // from official project/developer websites where available.

  // ── LARGE EXPORT & INDUSTRIAL PROJECTS ───────────────────────────────
  { id:104, name:"Quest CCS Project (Shell)",
    province:"AB", tech:"Blue H2", stage:"Operational", cap_kt:300.0, lng:-113.09175, lat:53.79655,
    gaps:[], oems:["Air Liquide"],
    desc:"Shell's Quest CCS project at Fort Saskatchewan, AB — operational since 2015. Canada's largest CCS facility, capturing ~1.2 Mt CO₂/yr from hydrogen production at the Scotford Upgrader. 300 kt H₂/yr capacity.",
    source:"Shell Canada — Quest CCS Project", url:"https://www.shell.ca/en_ca/about-us/projects-and-sites/quest-carbon-capture-and-storage-project.html" },

  { id:106, name:"Blue but better — Canada Net-zero H2 Complex",
    province:"AB", tech:"Blue H2", stage:"FID/Construction", cap_kt:140.0, lng:-113.27850, lat:53.60294,
    gaps:["Offtake agreement"], oems:["Air Liquide","Chart Industries"],
    desc:"Canada Net-zero Hydrogen Energy Complex at Fort Saskatchewan — ATR+CCUS blue hydrogen. IEA June 2026 DB revised capacity to 140 kt H₂/yr (down from previously announced 548 kt/yr). FID taken, construction underway.",
    source:"ATCO — Hydrogen Projects", url:"https://www.atco.com/en-ca/our-business/energy-infrastructure/hydrogen/hydrogen-projects.html" },

  { id:130, name:"Linde — Fort Saskatchewan (ATR+CCS)",
    province:"AB", tech:"Blue H2", stage:"FID/Construction", cap_kt:1000.0, lng:-113.20796, lat:53.71402,
    gaps:["Long-term offtake"], oems:["Air Liquide"],
    desc:"Linde and ATCO's 1,000 kt H₂/yr ATR+CCS project at Fort Saskatchewan — one of the largest clean hydrogen projects in Canada. Low-carbon hydrogen for industrial customers in Alberta's Industrial Heartland.",
    source:"ATCO — Fort Saskatchewan H2 Project", url:"https://www.atco.com/en-ca/our-business/energy-infrastructure/hydrogen/hydrogen-projects.html" },

  { id:133, name:"Bear Head Energy NS — Phase 1a (NH3)",
    province:"NS", tech:"Low-carbon ammonia", stage:"Dormant", cap_kt:514.5, lng:-61.33988, lat:45.58335,
    gaps:["Grid connection","Equity financing","Offtake agreement"], oems:["Nel Hydrogen","Chart Industries"],
    desc:"World Energy GH2's flagship green ammonia export project at Bear Head, Cape Breton NS. Phase 1a targets 514 kt NH₃/yr from onshore wind. Key anchor for Canada-Germany hydrogen alliance export corridor.",
    source:"World Energy GH2", url:"https://www.worldenergygh2.com/" },

  { id:159, name:"Exploits Valley Green H2 (NH3)",
    province:"NL", tech:"Low-carbon ammonia", stage:"Feasibility", cap_kt:450.5, lng:-55.35363, lat:49.13459,
    gaps:["Developer","Equity financing","Offtake agreement"], oems:["Nel Hydrogen"],
    desc:"Large-scale green hydrogen and ammonia production in Central Newfoundland leveraging the province's offshore wind potential. 450 kt NH₃/yr proposed, targeting European export markets.",
    source:"Government of Newfoundland and Labrador", url:"https://www.gov.nl.ca/iet/energy/green-hydrogen/" },

  { id:139, name:"Tse'khene Energy Transition Hub (TETH)",
    province:"BC", tech:"Low-carbon ammonia", stage:"Dormant", cap_kt:398.0, lng:-122.78217, lat:54.71848,
    gaps:["Grid connection","Project financing","Developer"], oems:["Nel Hydrogen"],
    desc:"Indigenous-led green hydrogen and ammonia project in northern BC at the Tse'khene Energy Transition Hub. 398 kt NH₃/yr from renewable energy. Community-owned development with First Nations equity participation.",
    source:"BC Hydrogen Office", url:"https://www.gov.bc.ca/gov/content/industry/electricity-alternative-energy/energy-resources/hydrogen" },

  { id:127, name:"Point Tupper Green H2 — Phase 2 (NH3)",
    province:"NS", tech:"Low-carbon ammonia", stage:"Pre-feasibility", cap_kt:382.7, lng:-61.33988, lat:45.58335,
    gaps:["Developer","Offtake agreement","Equity financing"], oems:["Nel Hydrogen"],
    desc:"EverWind Fuels' Point Tupper expansion — Phase 2 targeting 382 kt NH₃/yr from offshore wind at Cape Breton. Leverages deep-water port at Point Tupper. Follows Phase 1 feasibility completion.",
    source:"EverWind Fuels", url:"https://everwindfuels.com/" },

  { id:161, name:"Burin Peninsula Green Fuels — Phase 2 (NH3)",
    province:"NL", tech:"Low-carbon ammonia", stage:"Cancelled", cap_kt:310.0, lng:-55.49927, lat:46.99965,
    gaps:["Equity financing","Offtake agreement","Grid connection"], oems:["Nel Hydrogen"],
    desc:"Foresight Energy Partners' Phase 2 green ammonia project on the Burin Peninsula, NL. 310 kt NH₃/yr from offshore wind. Phase 2 of a 3-phase development totalling 677 kt NH₃/yr.",
    source:"Foresight Energy Partners", url:"https://foresightep.ca/" },

  { id:163, name:"Hydrogen New Brunswick (NH3)",
    province:"NB", tech:"Low-carbon ammonia", stage:"Concept", cap_kt:300.0, lng:-65.69442, lat:47.56371,
    gaps:["Developer","Project financing","Grid connection"], oems:["Nel Hydrogen"],
    desc:"Provincial green hydrogen and ammonia concept for New Brunswick leveraging offshore and onshore wind resources. 300 kt NH₃/yr. Supported by the NB Hydrogen Strategy.",
    source:"Government of New Brunswick", url:"https://www2.gnb.ca/content/gnb/en/departments/erd/energy/content/hydrogen.html" },

  { id:112, name:"ATCO Heartland Hydrogen Hub",
    province:"AB", tech:"Blue H2", stage:"Feasibility", cap_kt:300.0, lng:-113.21333, lat:53.71278,
    gaps:["Equity financing","Offtake agreement","CCS storage operator"], oems:["Air Liquide"],
    desc:"ATCO's Heartland Hydrogen Hub at Alberta's Industrial Heartland. 300 kt H₂/yr using SMR+CCUS, integrated with the Alberta Carbon Trunk Line. Targeting industrial customers and export.",
    source:"ATCO — Heartland Hydrogen Hub", url:"https://www.atco.com/en-ca/our-business/energy-infrastructure/hydrogen/hydrogen-projects.html" },

  { id:143, name:"North Atlantic Green Energy Hub — NL",
    province:"NL", tech:"Green H2", stage:"Feasibility", cap_kt:250.0, lng:-53.62545, lat:47.42509,
    gaps:["Developer","Equity financing","Offtake agreement"], oems:["Nel Hydrogen"],
    desc:"Multi-product green energy hub on NL's Avalon Peninsula. 250 kt H₂/yr targeting H₂, NH₃, and e-fuels leveraging Newfoundland's world-class wind resources and deep-water port access.",
    source:"NL Dept. of Industry, Energy & Technology", url:"https://www.gov.nl.ca/iet/energy/green-hydrogen/" },

  { id:134, name:"Argentia Renewables Project (NH3)",
    province:"NL", tech:"Low-carbon ammonia", stage:"Cancelled", cap_kt:220.3, lng:-53.97421, lat:47.29376,
    gaps:["Grid connection","Equity financing","Offtake agreement"], oems:["Nel Hydrogen","Chart Industries"],
    desc:"Green ammonia project at the former Argentia naval base, NL — a deep-water port site with existing infrastructure. 220 kt NH₃/yr from Newfoundland offshore wind. Export-oriented project.",
    source:"Argentia Energy Alliance", url:"https://argentiarenewables.com/" },

  { id:158, name:"Bear Head Energy NS — Phase 2 (NH3)",
    province:"NS", tech:"Low-carbon ammonia", stage:"Dormant", cap_kt:207.9, lng:-61.33988, lat:45.58335,
    gaps:["Developer","Equity financing","Offtake agreement"], oems:["Nel Hydrogen"],
    desc:"World Energy GH2 Bear Head Phase 2 expansion at Cape Breton NS. 208 kt NH₃/yr from additional offshore wind capacity. Builds on Phase 1a/1b feasibility work.",
    source:"World Energy GH2", url:"https://www.worldenergygh2.com/" },

  { id:125, name:"Proton Energy Project Apollo (SK)",
    province:"SK", tech:"Green H2", stage:"Feasibility", cap_kt:182.5, lng:-109.13560, lat:51.91880,
    gaps:["Technology validation","Developer","Project financing"], oems:["Proton Energy"],
    desc:"Proton Energy's underground partial oxidation project in Saskatchewan. 182.5 kt H₂/yr from novel in-situ coal conversion technology without surface mining. SaskPower and Saskatchewan government supported.",
    source:"Proton Energy Systems", url:"https://protonenergy.ca/" },

  { id:128, name:"Pembina Low Carbon Complex (NH3)",
    province:"AB", tech:"Low-carbon ammonia", stage:"Dormant", cap_kt:180.1, lng:-112.97125, lat:53.83135,
    gaps:["Equity financing","CCS storage operator","Offtake agreement"], oems:["Air Liquide","Chart Industries"],
    desc:"Pembina Pipeline and Mitsubishi Corporation's proposed low-carbon ammonia complex at Alberta's Industrial Heartland. 180 kt NH₃/yr using NG+CCS, targeting Asian export markets.",
    source:"Pembina Pipeline Corporation", url:"https://www.pembina.com/who-we-are/growth" },

  { id:154, name:"Hydrogen Canada — Clean H2 & Ammonia Facility",
    province:"AB", tech:"Low-carbon ammonia", stage:"Feasibility", cap_kt:180.1, lng:-114.07101, lat:51.04640,
    gaps:["Equity financing","CCS storage operator","Offtake agreement"], oems:["Air Liquide"],
    desc:"ATR+CCUS clean hydrogen and ammonia facility in the Calgary region. 180 kt NH₃/yr targeting domestic industrial users and export. Supported by Alberta Innovates hydrogen innovation program.",
    source:"Alberta Innovates", url:"https://albertainnovates.ca/programs/hydrogen-centre-of-excellence/" },

  { id:108, name:"WCS Redwater — Low-carbon Ammonia (ACTL)",
    province:"AB", tech:"Low-carbon ammonia", stage:"Operational", cap_kt:180.1, lng:-113.12694, lat:53.99249,
    gaps:[], oems:["Air Liquide"],
    desc:"Nutrien/Redwater CO₂ recovery and ammonia production at Alberta Carbon Trunk Line. Operational low-carbon ammonia capturing CO₂ from existing fertilizer operations. 180 kt NH₃/yr.",
    source:"Enhance Energy — ACTL", url:"https://www.enhanceenergy.com/" },

  { id:155, name:"Hydrogen Naturally — Co-located H2 Hub",
    province:"AB", tech:"Green H2", stage:"Dormant", cap_kt:160.0, lng:-112.72316, lat:57.50551,
    gaps:["Developer","Equity financing","Biomass feedstock supply"], oems:[],
    desc:"Biomass+CCUS hydrogen hub in Northern Alberta leveraging the province's forestry industry. 160 kt H₂/yr from biomass gasification with carbon capture — potential negative-emissions hydrogen.",
    source:"Natural Resources Canada", url:"https://natural-resources.canada.ca/our-natural-resources/energy-sources-distribution/clean-fuels/hydrogen/canadas-national-hydrogen-strategy/23485" },

  { id:115, name:"Edmonton Blue H2 Plant (Shell Polaris)",
    province:"AB", tech:"Blue H2", stage:"Dormant", cap_kt:165.0, lng:-113.09115, lat:53.79674,
    gaps:["Equity financing","CCS storage","Offtake agreement"], oems:["Air Liquide"],
    desc:"Shell Polaris CCS expansion concept at Fort Saskatchewan — proposed blue hydrogen facility adding 165 kt H₂/yr to existing Scotford complex with dedicated geological CO₂ storage.",
    source:"Shell Canada", url:"https://www.shell.ca/en_ca/about-us/projects-and-sites/quest-carbon-capture-and-storage-project.html" },

  // ── MID-SCALE PROJECTS ────────────────────────────────────────────────
  { id:167, name:"L'usine H₂V de Bécancour (Biomass)",
    province:"QC", tech:"Green H2", stage:"Dormant", cap_kt:116.0, lng:-72.43333, lat:46.33333,
    gaps:["Feedstock supply","Offtake agreement","Project financing"], oems:["Air Liquide"],
    desc:"H2V Canada biomass-to-hydrogen facility at Bécancour, QC industrial park. 116 kt H₂/yr from biomass gasification. Adjacent to Air Liquide's electrolysis facility in Bécancour industrial zone.",
    source:"H2V Canada / Bécancour Industrial Park", url:"https://www.parc-industriel-becancour.com/en/" },

  { id:141, name:"Nujio'qonik Green H2 — Phase 3",
    province:"NL", tech:"Green H2", stage:"Cancelled", cap_kt:112.6, lng:-58.43473, lat:48.52240,
    gaps:["Equity financing","Offtake agreement"], oems:[],
    desc:"World Energy GH2 Phase 3 expansion at Stephenville, NL. 112.6 kt H₂/yr from additional wind capacity. Part of the phased Nujio'qonik green hydrogen development.",
    source:"World Energy GH2", url:"https://www.worldenergygh2.com/" },

  { id:144, name:"Nujio'qonik Green H2 — Phase 4",
    province:"NL", tech:"Green H2", stage:"Cancelled", cap_kt:112.6, lng:-58.43473, lat:48.52240,
    gaps:["Equity financing","Offtake agreement"], oems:[],
    desc:"World Energy GH2 Phase 4 expansion — furthest-out phase of the Nujio'qonik multi-phase development at Stephenville, NL. 112.6 kt H₂/yr.",
    source:"World Energy GH2", url:"https://www.worldenergygh2.com/" },

  { id:164, name:"Goldboro Renewable Energy Park (Synfuels)",
    province:"NS", tech:"SAF", stage:"Feasibility", cap_kt:108.6, lng:-61.65437, lat:45.18243,
    gaps:["Grid connection","Equity financing","Offtake agreement"], oems:[],
    desc:"Ceres Clean Energy's renewable energy and green hydrogen hub at Goldboro, NS. 108 kt synfuels/yr from wind-powered electrolysis. Deep-water port with direct export capability to European markets.",
    source:"Ceres Clean Energy", url:"https://www.cerescleanenergy.com/" },

  { id:157, name:"Bear Head Energy NS — Phase 1b (NH3)",
    province:"NS", tech:"Low-carbon ammonia", stage:"Dormant", cap_kt:69.3, lng:-61.33988, lat:45.58335,
    gaps:["Grid connection","Equity financing"], oems:[],
    desc:"World Energy GH2 Bear Head Phase 1b at Cape Breton NS — intermediate phase between Phase 1a and Phase 2. 69.3 kt NH₃/yr from onshore wind expansion.",
    source:"World Energy GH2", url:"https://www.worldenergygh2.com/" },

  { id:160, name:"Burin Peninsula Green Fuels — Phase 1 (NH3)",
    province:"NL", tech:"Low-carbon ammonia", stage:"Cancelled", cap_kt:247.4, lng:-55.49927, lat:46.99965,
    gaps:["Equity financing","Offtake agreement","Grid connection"], oems:["Nel Hydrogen"],
    desc:"Foresight Energy Partners' flagship Phase 1 green ammonia project on the Burin Peninsula, NL. 247 kt NH₃/yr from offshore wind. Deep-water port at Marystown for export. Environmental assessment submitted.",
    source:"Foresight Energy Partners", url:"https://foresightep.ca/" },

  { id:162, name:"Burin Peninsula Green Fuels — Phase 3 (NH3)",
    province:"NL", tech:"Low-carbon ammonia", stage:"Cancelled", cap_kt:120.0, lng:-55.49927, lat:46.99965,
    gaps:["Equity financing","Offtake agreement"], oems:[],
    desc:"Foresight Energy Partners' Phase 3 concept on the Burin Peninsula, NL. 120 kt NH₃/yr. Longest-dated phase of the 3-phase development totalling 677 kt NH₃/yr.",
    source:"Foresight Energy Partners", url:"https://foresightep.ca/" },

  { id:135, name:"Nujio'qonik Green H2 — Phase 2",
    province:"NL", tech:"Green H2", stage:"Cancelled", cap_kt:97.5, lng:-58.43473, lat:48.52240,
    gaps:["Equity financing","Offtake agreement"], oems:[],
    desc:"World Energy GH2 Phase 2 at Stephenville NL — scale-up from Phase 1 NH3 production, adding 97.5 kt H₂/yr pipeline-quality hydrogen for domestic and export use.",
    source:"World Energy GH2", url:"https://www.worldenergygh2.com/" },

  { id:131, name:"Nujio'qonik Green H2 — Phase 1 (NH3)",
    province:"NL", tech:"Low-carbon ammonia", stage:"Cancelled", cap_kt:97.5, lng:-58.43473, lat:48.52240,
    gaps:["Grid connection","Equity financing"], oems:["Nel Hydrogen"],
    desc:"World Energy GH2 Phase 1 at Stephenville, NL — first phase of the Nujio'qonik green hydrogen and ammonia development. FEED underway for port infrastructure. Linked to NH₃ export terminal.",
    source:"World Energy GH2", url:"https://www.worldenergygh2.com/" },

  { id:132, name:"Toqlukuti'k Wind & H2 — Phase 1",
    province:"NL", tech:"Green H2", stage:"Feasibility", cap_kt:87.5, lng:-53.91198, lat:47.81209,
    gaps:["Developer","Grid connection","Offtake agreement"], oems:[],
    desc:"Wind-to-hydrogen Phase 1 on the Avalon Peninsula, Newfoundland. 87.5 kt H₂/yr from offshore wind. Indigenous and community stakeholder engagement underway. Environmental assessment initiated.",
    source:"Government of Newfoundland and Labrador", url:"https://www.gov.nl.ca/iet/energy/green-hydrogen/" },

  { id:138, name:"Project Mauricie — Green H2",
    province:"QC", tech:"Green H2", stage:"Feasibility", cap_kt:86.6, lng:-72.61553, lat:46.91541,
    gaps:["Developer","Project financing","Offtake agreement"], oems:[],
    desc:"Green hydrogen production project in Mauricie, QC leveraging low-carbon hydro grid. 86.6 kt H₂/yr targeting industrial and export applications. Quebec hydrogen strategy supported project.",
    source:"Transition Énergétique Québec", url:"https://transitionenergetique.gouv.qc.ca/en/" },

  { id:176, name:"Sundance Hydrogen — BC",
    province:"BC", tech:"Green H2", stage:"Dormant", cap_kt:43.8, lng:-120.98976, lat:55.12620,
    gaps:["Developer","Equity financing","Offtake agreement"], oems:[],
    desc:"Green hydrogen project in northeastern BC leveraging wind and hydro resources. 43.8 kt MeOH/yr equivalent target. Feasibility underway with provincial support.",
    source:"BC Ministry of Energy", url:"https://www.gov.bc.ca/gov/content/industry/electricity-alternative-energy/energy-resources/hydrogen" },

  { id:126, name:"Point Tupper Green H2 — Phase 1 (NH3)",
    province:"NS", tech:"Low-carbon ammonia", stage:"Feasibility", cap_kt:51.4, lng:-61.33988, lat:45.58335,
    gaps:["Grid connection","Equity financing"], oems:["Nel Hydrogen"],
    desc:"EverWind Fuels' Phase 1 at Point Tupper, Cape Breton NS. 51.4 kt NH₃/yr from onshore wind. Feasibility complete; FEED underway. Deep-water port with direct ship loading capability.",
    source:"EverWind Fuels", url:"https://everwindfuels.com/" },

  { id:121, name:"Courant Green Ammonia — Québec",
    province:"QC", tech:"Low-carbon ammonia", stage:"Feasibility", cap_kt:45.0, lng:-68.12962, lat:49.23247,
    gaps:["Developer","Equity financing","Offtake agreement"], oems:[],
    desc:"Green ammonia production facility in Québec's Côte-Nord region. 45 kt NH₃/yr leveraging Québec's hydro grid for electrolysis. Targeting agricultural and industrial ammonia markets.",
    source:"Transition Énergétique Québec", url:"https://transitionenergetique.gouv.qc.ca/en/" },

  { id:165, name:"Belledune Green Energy Hub (NH3)",
    province:"NB", tech:"Low-carbon ammonia", stage:"Concept", cap_kt:34.7, lng:-65.84720, lat:47.90269,
    gaps:["Equity financing","Grid connection","Offtake agreement"], oems:[],
    desc:"Green hydrogen and ammonia hub at Belledune Industrial Park, NB. 34.7 kt NH₃/yr from wind. Leverages existing industrial port infrastructure at Belledune — one of NB's key industrial sites.",
    source:"Port of Belledune", url:"https://portofbelledune.ca/" },

  { id:148, name:"NTE Campbell River H2 — Phase 2",
    province:"BC", tech:"Green H2", stage:"Cancelled", cap_kt:25.7, lng:-125.24450, lat:50.01630,
    gaps:["Developer","Project financing","Offtake agreement"], oems:[],
    desc:"NTE Energy's Phase 2 green hydrogen at Campbell River, BC. 25.7 kt H₂/yr from run-of-river hydro and wind. Targeting industrial and transportation hydrogen supply for Vancouver Island.",
    source:"BC Hydrogen Office", url:"https://www.gov.bc.ca/gov/content/industry/electricity-alternative-energy/energy-resources/hydrogen" },

  { id:172, name:"Projet d'écosystème — Côte-Nord QC",
    province:"QC", tech:"Green H2", stage:"Feasibility", cap_kt:20.8, lng:-68.13692, lat:49.23910,
    gaps:["Developer","Project financing"], oems:[],
    desc:"Green hydrogen ecosystem project for the municipality of Côte-Nord, QC. 20.8 kt H₂/yr from hydro-powered electrolysis. Community-scale hydrogen for local industry, transportation, and heating.",
    source:"Transition Énergétique Québec", url:"https://transitionenergetique.gouv.qc.ca/en/" },

  { id:140, name:"SAF+ Consortium SAF Plant — Montréal",
    province:"QC", tech:"SAF", stage:"Cancelled", cap_kt:15.1, lng:-73.52131, lat:45.63427,
    gaps:["SAF technology partner","Equity financing","Offtake agreement"], oems:[],
    desc:"SAF+ Consortium's power-to-liquid sustainable aviation fuel plant near Montréal. 15 kt SAF/yr from green hydrogen. Partnered with Air Canada, Air Transat, and Pratt & Whitney Canada.",
    source:"SAF+ Consortium", url:"https://safplus.com/" },

  { id:171, name:"SAF Production — BC Renewable Diesel Site",
    province:"BC", tech:"SAF", stage:"Feasibility", cap_kt:14.1, lng:-122.69660, lat:53.92683,
    gaps:["Technology partner","Offtake agreement","Project financing"], oems:[],
    desc:"Co-located sustainable aviation fuel production at a BC renewable diesel facility. 14 kt SAF/yr from locally produced green hydrogen. Site leverages existing refinery infrastructure in Prince George.",
    source:"BC Ministry of Energy", url:"https://www.gov.bc.ca/gov/content/industry/electricity-alternative-energy/energy-resources/hydrogen" },

  { id:116, name:"Tent Mountain Green H2",
    province:"AB", tech:"Green H2", stage:"Dormant", cap_kt:14.0, lng:-114.72493, lat:49.55146,
    gaps:["Developer","Project financing","Technology partner"], oems:[],
    desc:"Green hydrogen project at the former Tent Mountain coal mine in SW Alberta. 14 kt H₂/yr leveraging site's existing infrastructure and wind resources. Repurposing coal mining land for clean energy.",
    source:"Tent Mountain Development Corp.", url:"https://tentmountain.ca/" },

  { id:109, name:"Recyclage Carbone Varennes (MeOH)",
    province:"QC", tech:"E-fuels", stage:"Feasibility", cap_kt:13.5, lng:-73.44520, lat:45.64205,
    gaps:[], oems:["Air Liquide"],
    desc:"World's first commercial-scale waste plastic gasification facility with hydrogen and methanol production at Varennes, QC. Partners: Enerkem, Shell, Suncor, Praxair. 13.5 kt MeOH/yr. FID taken, construction underway.",
    source:"Recyclage Carbone Varennes", url:"https://www.rcvarennes.com/" },

  { id:149, name:"NTE Campbell River H2 — Phase 1",
    province:"BC", tech:"Green H2", stage:"Cancelled", cap_kt:6.9, lng:-125.24450, lat:50.01630,
    gaps:["Developer","Project financing"], oems:[],
    desc:"NTE Energy's Phase 1 green hydrogen at Campbell River, BC. 6.9 kt H₂/yr — first phase of a larger development. BC Hydro run-of-river connection supporting low-carbon electrolysis.",
    source:"BC Hydrogen Office", url:"https://www.gov.bc.ca/gov/content/industry/electricity-alternative-energy/energy-resources/hydrogen" },

  { id:129, name:"First Hydrogen — Shawinigan QC",
    province:"QC", tech:"Green H2", stage:"Dormant", cap_kt:6.1, lng:-72.80987, lat:46.69769,
    gaps:["Project financing","Grid connection"], oems:["First Hydrogen"],
    desc:"First Hydrogen's proposed 35 MW green hydrogen production and fuel cell vehicle assembly facility in Shawinigan, QC. 6 kt H₂/yr leveraging Québec's clean hydro grid. Integrated FCEV manufacturing.",
    source:"First Hydrogen Corp.", url:"https://firsthydrogen.com/" },

  { id:166, name:"Project Gwinya — NL Green H2",
    province:"NL", tech:"Green H2", stage:"Concept", cap_kt:9.6, lng:-57.92925, lat:48.96536,
    gaps:["Developer","Project financing","Offtake agreement"], oems:[],
    desc:"Green hydrogen concept in northwestern Newfoundland leveraging coastal wind resources. 9.6 kt H₂/yr. Pre-feasibility stage; environmental and resource assessment underway.",
    source:"NL Dept. of Industry, Energy & Technology", url:"https://www.gov.nl.ca/iet/energy/green-hydrogen/" },

  { id:110, name:"Prince George Refinery (Biomass H2)",
    province:"BC", tech:"Green H2", stage:"Operational", cap_kt:9.2, lng:-122.69414, lat:53.92703,
    gaps:[], oems:[],
    desc:"Canfor's Prince George pulp and paper complex producing hydrogen from biomass gasification. 9.2 kt H₂/yr — operational facility producing hydrogen as a co-product of bioenergy production.",
    source:"BC Ministry of Energy", url:"https://www.gov.bc.ca/gov/content/industry/electricity-alternative-energy/energy-resources/hydrogen" },

  { id:150, name:"Xaxli'p H2 Production Project",
    province:"BC", tech:"Green H2", stage:"Pre-feasibility", cap_kt:4.3, lng:-121.93520, lat:50.68520,
    gaps:["Developer","Project financing","Technology partner"], oems:[],
    desc:"Indigenous-led green hydrogen project at Xaxli'p First Nation territory in BC. 4.3 kt H₂/yr from renewable energy. Community energy sovereignty and economic development project.",
    source:"BC Hydrogen Office", url:"https://www.gov.bc.ca/gov/content/industry/electricity-alternative-energy/energy-resources/hydrogen" },

  { id:170, name:"Ekona Gold Creek Commercial Demo",
    province:"BC", tech:"Green H2", stage:"Demo", cap_kt:4.0, lng:-118.64496, lat:54.81501,
    gaps:["Scale-up financing"], oems:["Ekona Power"],
    desc:"Ekona Power's Gold Creek commercial demonstration plant in Northern Alberta/BC border region. 4 kt H₂/yr from methane pyrolysis with solid carbon co-product. Series B funded 2025. Scaling toward commercial deployment.",
    source:"Ekona Power", url:"https://ekonapower.com/" },

  // ── SMALL SCALE / DEMO / OPERATIONAL ─────────────────────────────────
  { id:174, name:"Air Liquide Bécancour (PEM Electrolyser)",
    province:"QC", tech:"Green H2", stage:"Operational", cap_kt:3.0, lng:-72.37264, lat:46.38218,
    gaps:[], oems:["Air Liquide"],
    desc:"Air Liquide's 20 MW PEM electrolyser at Bécancour Industrial Park, QC. 3 kt H₂/yr from Québec's clean hydro grid. One of the largest operating PEM electrolysers in Canada.",
    source:"Air Liquide Canada", url:"https://www.airliquide.com/canada/hydrogen" },

  { id:122, name:"Niagara Hydrogen Centre (NHC)",
    province:"ON", tech:"Green H2", stage:"FID/Construction", cap_kt:3.0, lng:-79.06175, lat:43.09849,
    gaps:[], oems:["Cummins / Hydrogenics","HTEC Hydrogen"],
    desc:"Atura Power and HTEC's 20 MW PEM electrolysis facility at Niagara Falls, ON. 3 kt H₂/yr from Ontario's clean grid. Grid-scale green hydrogen demonstration project. FID taken, construction underway.",
    source:"Atura Power", url:"https://www.aturapower.com/" },

  { id:118, name:"Hazer-Suncor-FortisBC Demo Facility",
    province:"BC", tech:"Green H2", stage:"Feasibility", cap_kt:2.5, lng:-125.33254, lat:55.32683,
    gaps:["Technology validation","Project financing"], oems:["Hazer Group Canada"],
    desc:"Hazer Group's methane pyrolysis pilot at Prince George, BC with Suncor and FortisBC. 2.5 kt H₂/yr with graphite co-product using iron ore as catalyst. NRCan and BC government supported.",
    source:"Hazer Group / FortisBC", url:"https://hazergroup.com.au/projects/fortisbc/" },

  { id:113, name:"Horizon H2 — Oil Sands Tailings CCS",
    province:"AB", tech:"Blue H2", stage:"Operational", cap_kt:null, lng:-111.68501, lat:57.35140,
    gaps:[], oems:[],
    desc:"Canadian Natural Resources' Horizon facility with hydrogen and carbon capture from oil sands operations. Operational CCS integrated with upgrader hydrogen production in Northern Alberta.",
    source:"Canadian Natural Resources", url:"https://www.cnrl.com/operations/in-situ-oil-sands/horizon-oil-sands/" },

  { id:107, name:"North West Sturgeon Refinery",
    province:"AB", tech:"Blue H2", stage:"Operational", cap_kt:null, lng:-113.12107, lat:53.83935,
    gaps:[], oems:["Air Liquide"],
    desc:"North West Redwater Partnership's Sturgeon Refinery at Alberta's Industrial Heartland — operates with integrated hydrogen production and CO₂ capture for enhanced oil recovery via the ACTL pipeline.",
    source:"North West Redwater Partnership", url:"https://www.nwrp.ca/" },

  { id:142, name:"Scotford Refinery — Shell Polaris CCS",
    province:"AB", tech:"Blue H2", stage:"FID/Construction", cap_kt:null, lng:-113.09115, lat:53.79674,
    gaps:[], oems:["Air Liquide"],
    desc:"Shell's Polaris CCS project at Scotford refinery and chemicals complex. CCS retrofit capturing CO₂ from hydrogen production at the Scotford Upgrader. Extends beyond the original Quest project.",
    source:"Shell Canada — Polaris CCS", url:"https://www.shell.ca/en_ca/about-us/projects-and-sites/quest-carbon-capture-and-storage-project.html" },

  { id:111, name:"Heritage Gas Ottawa (H2 Blending)",
    province:"ON", tech:"Green H2", stage:"Construction", cap_kt:null, lng:-75.72897, lat:45.43315,
    gaps:[], oems:["Cummins / Hydrogenics"],
    desc:"Enbridge Gas / Heritage Gas green hydrogen production and blending project in Ottawa, ON. Electrolyser under construction for blending hydrogen into existing natural gas distribution network.",
    source:"Enbridge Gas", url:"https://www.enbridgegas.com/en-ca/about-enbridge-gas/our-company/environment/hydrogen" },

  { id:153, name:"Battle River Carbon Hub",
    province:"AB", tech:"Blue H2", stage:"Dormant", cap_kt:null, lng:-111.67122, lat:52.20093,
    gaps:["Technology partner","Equity financing","CCS storage operator"], oems:[],
    desc:"Blue hydrogen and carbon capture hub concept in the Battle River region, AB. Feasibility examining SMR+CCUS configurations near the Alberta Carbon Trunk Line for CO₂ transport.",
    source:"Alberta Innovates", url:"https://albertainnovates.ca/" },

  { id:136, name:"Green Steel Plant — Québec",
    province:"QC", tech:"Green H2", stage:"Dormant", cap_kt:null, lng:-66.07494, lat:50.31894,
    gaps:["Developer","Project financing","Offtake agreement"], oems:[],
    desc:"Green steel production concept in Quebec's Côte-Nord region using direct reduced iron (DRI) powered by green hydrogen. Leverages Quebec's hydro grid and iron ore proximity.",
    source:"Transition Énergétique Québec", url:"https://transitionenergetique.gouv.qc.ca/en/" },

  { id:147, name:"HTEC North Vancouver H2 Production",
    province:"BC", tech:"Green H2", stage:"Feasibility", cap_kt:null, lng:-123.06660, lat:49.31660,
    gaps:["Offtake agreement","Project financing"], oems:["HTEC Hydrogen"],
    desc:"HTEC Hydrogen's planned electrolytic hydrogen production facility in North Vancouver, BC. Supporting HTEC's expanding retail and commercial fuelling network in Metro Vancouver.",
    source:"HTEC Hydrogen", url:"https://h-tec.com/" },

  { id:114, name:"Bruce Nuclear Clean Energy H2 Hub",
    province:"ON", tech:"Green H2", stage:"Dormant", cap_kt:0.5, lng:-81.57398, lat:44.31856,
    gaps:["Offtake agreement","Project financing"], oems:["Cummins / Hydrogenics"],
    desc:"Atura Power's feasibility study for nuclear-powered hydrogen production at Bruce Power, ON. 0.5 kt H₂/yr using low-carbon nuclear electricity. Ontario's grid-connected nuclear hydrogen pilot.",
    source:"Atura Power / Bruce Power", url:"https://www.aturapower.com/" },

  { id:175, name:"Markham Power to Gas",
    province:"ON", tech:"Green H2", stage:"Operational", cap_kt:0.4, lng:-79.33112, lat:43.85735,
    gaps:[], oems:["Cummins / Hydrogenics"],
    desc:"Enbridge Gas and Hydrogenics' power-to-gas facility at Markham, ON — Canada's first power-to-gas project. 0.4 kt H₂/yr injected into the natural gas grid. Operational since 2018.",
    source:"Enbridge Gas — Power to Gas", url:"https://www.enbridgegas.com/en-ca/about-enbridge-gas/our-company/environment/hydrogen" },

  { id:120, name:"HTEC Burnaby H2 Plant",
    province:"BC", tech:"Green H2", stage:"Operational", cap_kt:0.4, lng:-122.96057, lat:49.28513,
    gaps:[], oems:["HTEC Hydrogen","Cummins / Hydrogenics"],
    desc:"HTEC Hydrogen's electrolytic production facility in Burnaby, BC. 0.4 kt H₂/yr for HTEC's Greater Vancouver fuelling network. Supports HTEC's 700-bar heavy-duty truck refuelling stations.",
    source:"HTEC Hydrogen", url:"https://h-tec.com/" },

  { id:173, name:"Aurora Hydrogen Demo Plant",
    province:"AB", tech:"Green H2", stage:"Demo", cap_kt:0.1, lng:-113.18253, lat:53.70254,
    gaps:["Scale-up financing"], oems:["Aurora Hydrogen"],
    desc:"Aurora Hydrogen's microwave methane pyrolysis demonstration plant in Edmonton, AB. 0.1 kt H₂/yr commercial demo of novel low-carbon process — no CO₂ emissions, solid carbon co-product. NRCan funded.",
    source:"Aurora Hydrogen", url:"https://aurorahydrogen.com/" },

  { id:169, name:"VulcanX Energy Pyrolysis Plant (Demo)",
    province:"AB", tech:"Green H2", stage:"Demo", cap_kt:0.4, lng:-116.57650, lat:53.93327,
    gaps:["Scale-up financing","Technology partner"], oems:["VulcanX Energy"],
    desc:"VulcanX Energy's methane pyrolysis demonstration facility in Alberta. 0.4 kt H₂/yr with solid carbon co-product. Pilot-scale testing underway, scaling toward commercial demonstration.",
    source:"VulcanX Energy", url:"https://vulcanxenergy.com/" },

  { id:123, name:"Prince George H2 Refueling & Production",
    province:"BC", tech:"Green H2", stage:"FID/Construction", cap_kt:1.7, lng:-122.75380, lat:53.91546,
    gaps:[], oems:["HTEC Hydrogen"],
    desc:"HTEC and City of Prince George hydrogen production and fuelling station. 1.7 kt H₂/yr electrolytic production. First hydrogen fuelling facility in northern BC. Federal ZEV infrastructure funded.",
    source:"HTEC Hydrogen / City of Prince George", url:"https://h-tec.com/" },

  { id:146, name:"HTEC Nanaimo H2 Production",
    province:"BC", tech:"Green H2", stage:"Feasibility", cap_kt:0.9, lng:-123.94000, lat:49.16630,
    gaps:["Project financing"], oems:["HTEC Hydrogen"],
    desc:"HTEC's planned electrolytic hydrogen production facility in Nanaimo, BC. 0.9 kt H₂/yr supporting the expansion of HTEC's Vancouver Island fuelling network.",
    source:"HTEC Hydrogen", url:"https://h-tec.com/" },

  { id:119, name:"Saint John NB Refinery H2",
    province:"NB", tech:"Green H2", stage:"Dormant", cap_kt:0.7, lng:-66.00731, lat:45.28364,
    gaps:[], oems:["Cummins / Hydrogenics"],
    desc:"Irving Oil refinery hydrogen production upgrade at Saint John, NB. PEM electrolyser adding 0.7 kt H₂/yr of low-carbon hydrogen for refinery operations. Federal clean fuel fund supported.",
    source:"Irving Oil / NB Dept. of Energy", url:"https://www2.gnb.ca/content/gnb/en/departments/erd/energy/content/hydrogen.html" },

  { id:152, name:"Liberty NB Thermochemical H2 (Demo)",
    province:"NB", tech:"Blue H2", stage:"Dormant", cap_kt:1.0, lng:-66.64310, lat:45.96360,
    gaps:["Technology validation"], oems:[],
    desc:"Liberty New Brunswick hydrogen production demonstration using thermochemical process at Fredericton, NB. 1 kt H₂/yr from NG+CCS pathway. Technology demonstration for NB's clean hydrogen roadmap.",
    source:"Government of New Brunswick", url:"https://www2.gnb.ca/content/gnb/en/departments/erd/energy/content/hydrogen.html" },

  { id:124, name:"Proton Energy DEMO — Saskatchewan",
    province:"SK", tech:"Green H2", stage:"Demo", cap_kt:null, lng:-109.13560, lat:51.91880,
    gaps:["Technology validation"], oems:["Proton Energy"],
    desc:"Proton Energy Systems' technology demonstration in Saskatchewan for underground partial oxidation hydrogen production. Proof-of-concept for low-cost H₂ without surface mining infrastructure.",
    source:"Proton Energy Systems", url:"https://protonenergy.ca/" },

  { id:117, name:"Fortescue Future Industries — Gull Island",
    province:"ON", tech:"Low-carbon ammonia", stage:"Cancelled", cap_kt:null, lng:-85.90023, lat:45.86821,
    gaps:["Developer","Equity financing","Grid connection"], oems:[],
    desc:"Fortescue Future Industries' green ammonia concept at Gull Island, ON — leveraging Ontario's hydro resources on the Canadian Shield. Pre-feasibility exploring large-scale ammonia export potential.",
    source:"Fortescue Future Industries", url:"https://ffi.com/" },

  { id:145, name:"Toqlukuti'k Wind & H2 (NH3 Concept)",
    province:"NL", tech:"Low-carbon ammonia", stage:"Pre-feasibility", cap_kt:null, lng:-56.60117, lat:52.70953,
    gaps:["Developer","Equity financing","Offtake agreement"], oems:[],
    desc:"Wind-to-ammonia concept in Labrador leveraging the region's exceptional wind resources. Pre-feasibility for large-scale NH₃ export from a remote northern site with significant wind potential.",
    source:"NL Dept. of Industry, Energy & Technology", url:"https://www.gov.nl.ca/iet/energy/green-hydrogen/" },
  // ── New entries from IEA Hydrogen Production Projects Database — June 2026 ──
  { id:3423, name:"Charbone Sorel-Tracy — Phase 1a",
    province:"QC", tech:"Green H2", stage:"Operational", cap_kt:0.07, lng:-73.115, lat:46.0415,
    gaps:[], oems:["Cummins / Hydrogenics"],
    desc:"Charbone Hydrogen Corporation's Phase 1a PEM electrolyser at Sorel-Tracy, QC — now operational. First commercial green H2 production plant by a publicly-listed Canadian hydrogen company (TSXV: CH). Uses Cummins PEM technology.",
    source:"Charbone Hydrogen Corporation", url:"https://www.charbonehydrogen.com" },

  { id:3939, name:"Charbone Sorel-Tracy — Phase 1b",
    province:"QC", tech:"Green H2", stage:"FID/Construction", cap_kt:0.26, lng:-73.115, lat:46.0415,
    gaps:[], oems:["Cummins / Hydrogenics"],
    desc:"Charbone Hydrogen Phase 1b expansion at Sorel-Tracy, QC. FID taken and construction underway. Scales the existing Phase 1a electrolyser plant with additional PEM capacity. TSXV-listed Charbone Hydrogen (CH) project.",
    source:"Charbone Hydrogen Corporation", url:"https://www.charbonehydrogen.com" },

  { id:3772, name:"Charbone Sorel-Tracy — Phase 2",
    province:"QC", tech:"Green H2", stage:"Feasibility", cap_kt:0.37, lng:-73.115, lat:46.0415,
    gaps:["Project financing","Equipment procurement"], oems:["Cummins / Hydrogenics"],
    desc:"Charbone Hydrogen Phase 2 expansion feasibility at Sorel-Tracy, QC. Third phase of the progressive build-out at the Sorel-Tracy site. Would bring total site capacity to ~0.7 kt H₂/yr.",
    source:"Charbone Hydrogen Corporation", url:"https://www.charbonehydrogen.com" },

  { id:3940, name:"Kamloops Clean Energy Center",
    province:"BC", tech:"Green H2", stage:"Feasibility", cap_kt:1.7, lng:-120.476741, lat:50.713284,
    gaps:["Project financing","Offtake agreement"], oems:[],
    desc:"Proposed green hydrogen production facility in Kamloops, BC. 1.7 kt H₂/yr from BC's low-carbon grid. Targeting industrial hydrogen supply and transportation fuelling in the BC Interior.",
    source:"BC Ministry of Energy", url:"https://www.gov.bc.ca/gov/content/industry/electricity-alternative-energy/energy-resources/hydrogen" },

  { id:3775, name:"e-Methane Project — Brandon, Manitoba",
    province:"MB", tech:"E-fuels", stage:"Concept", cap_kt:20.3, lng:-99.989243, lat:49.8606029,
    gaps:["Developer","Equity financing","CO₂ source"], oems:[],
    desc:"Power-to-methane concept in Brandon, MB. 20.3 kt CH₄/yr from green hydrogen and CO₂ methanation. Targets renewable natural gas injection into Manitoba's gas distribution grid.",
    source:"IEA Hydrogen Production Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:3377, name:"Source3X Skeen Clean H2 Hub",
    province:"BC", tech:"Green H2", stage:"Concept", cap_kt:null, lng:-128.5, lat:55.5,
    gaps:["Developer","Project definition","Equity financing"], oems:[],
    desc:"Multi-project green hydrogen hub initiative in the Skeen region, BC. Concept stage aggregating potential renewable H2 production sites for industrial and export markets in northern BC.",
    source:"IEA Hydrogen Production Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:3941, name:"CPXP — Sarnia, Ontario",
    province:"ON", tech:"Green H2", stage:"Concept", cap_kt:17.3, lng:-82.4072, lat:42.9757,
    gaps:["Developer","Equity financing","Offtake agreement"], oems:[],
    desc:"Canadian Power-to-X Partners (CPXP) green hydrogen concept at Sarnia, ON. 17.3 kt H₂/yr from Ontario's low-carbon grid. Part of a multi-site CPXP initiative targeting industrial hydrogen markets.",
    source:"IEA Hydrogen Production Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:3942, name:"CPXP — Manitoba",
    province:"MB", tech:"Green H2", stage:"Concept", cap_kt:17.3, lng:-97.1384, lat:49.8951,
    gaps:["Developer","Equity financing","Offtake agreement"], oems:[],
    desc:"Canadian Power-to-X Partners (CPXP) green hydrogen concept in Manitoba. 17.3 kt H₂/yr leveraging Manitoba Hydro's near-zero-emission grid. Part of a multi-site CPXP portfolio.",
    source:"IEA Hydrogen Production Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  // ══════════════════════════════════════════════════════════════════
  // NATURAL (GEOLOGICAL) HYDROGEN — IEA Geological Hydrogen Projects
  // Database, June 2026. 20 Canadian exploration projects.
  // Source: https://www.iea.org/data-and-statistics/data-product/
  //         hydrogen-production-and-infrastructure-projects-database
  // Gold hydrogen = naturally occurring H₂ in geological formations.
  // Max Power confirmed Canada's first drilling discovery Jan 2026.
  // ══════════════════════════════════════════════════════════════════

  { id:4001, name:"Max Power — Lawson Project (SK)",
    province:"SK", tech:"Natural H2", stage:"Commercial validation", cap_kt:null,
    lng:-106.5, lat:51.0,
    gaps:["Flow rate confirmation","Resource modelling","Offtake agreement"],
    oems:[],
    desc:"Max Power Mining Corp (CSE: MAXX) confirmed Canada's first natural H₂ system at Lawson well (2,278m, Central Butte SK, Nov 2025) — 286,000 ppm H₂ confirmed, free-flowing to surface. Multi-well commercial validation program launched July 2026. Genesis Trend spans 475 km. Stage upgraded from exploration drilling to commercial validation. Source: Interesting Engineering, Jul 2026.",
    source:"Max Power Mining Corp / Interesting Engineering", url:"https://interestingengineering.com/energy/lawson-canada-natural-hydrogen-commercial-production-phase" },

  { id:4002, name:"Vema Hydrogen — EMH Project (QC)",
    province:"QC", tech:"Natural H2", stage:"Exploration drilling", cap_kt:null,
    lng:-71.3, lat:46.1,
    gaps:["Pilot flow testing","Scaling pathway","Project financing"],
    oems:[],
    desc:"Vema Hydrogen's Engineered Mineral Hydrogen (EMH) project at Thetford Mines, QC. Uses stimulated artificial serpentinisation to trigger H₂ generation in ophiolite rocks. First two pilot wells completed Feb 2026. CHA member. One of North America's first active natural H₂ drilling campaigns.",
    source:"Vema Hydrogen / Hydrogen Fuel News", url:"https://www.hydrogenfuelnews.com/hydrogen-production-advances-as-vema-hydrogen-begins-natural-hydrogen-drilling-in-quebec/8576295/" },

  { id:4003, name:"QMET / QIMC — Nova Scotia Discovery",
    province:"NS", tech:"Natural H2", stage:"Exploration drilling", cap_kt:null,
    lng:-63.0, lat:45.0,
    gaps:["Further drilling","Resource assessment","Regulatory framework"],
    oems:[],
    desc:"QMET and Quebec Innovative Materials (QIMC) completed a 711m discovery hole in Nova Scotia, confirming natural hydrogen presence. One of Canada's earliest confirmed geological hydrogen occurrences. Exploration drilling stage.",
    source:"IEA Geological Hydrogen Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:4004, name:"Primary Hydrogen — British Columbia",
    province:"BC", tech:"Natural H2", stage:"Exploration started", cap_kt:null,
    lng:-125.0, lat:54.5,
    gaps:["Exploration drilling","Resource confirmation"],
    oems:[],
    desc:"Primary Hydrogen Corporation has started exploration in British Columbia targeting geological hydrogen in basement rock formations. Part of a multi-province Canadian exploration portfolio.",
    source:"IEA Geological Hydrogen Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:4005, name:"Primary Hydrogen — Kapuskasing, Ontario",
    province:"ON", tech:"Natural H2", stage:"Exploration started", cap_kt:null,
    lng:-82.4, lat:49.4,
    gaps:["Exploration drilling","Resource confirmation"],
    oems:[],
    desc:"Primary Hydrogen Corporation exploring natural hydrogen in the Kapuskasing region of Northern Ontario. The area overlaps with Precambrian Shield geology identified by the University of Ottawa (May 2026) as highly prospective for natural H₂.",
    source:"IEA Geological Hydrogen Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:4006, name:"Primary Hydrogen — Newfoundland & Labrador",
    province:"NL", tech:"Natural H2", stage:"Exploration started", cap_kt:null,
    lng:-56.0, lat:48.5,
    gaps:["Exploration drilling","Resource confirmation"],
    oems:[],
    desc:"Primary Hydrogen Corporation exploring geological hydrogen potential in Newfoundland and Labrador. Third province in Primary Hydrogen's Canadian exploration portfolio.",
    source:"IEA Geological Hydrogen Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:4007, name:"QIMC — Ville-Marie, Quebec",
    province:"QC", tech:"Natural H2", stage:"Exploration started", cap_kt:null,
    lng:-79.4, lat:47.3,
    gaps:["Exploration drilling","Resource confirmation"],
    oems:[],
    desc:"QIMC holds a 5,000m drilling permit in Abitibi-Témiscamingue, QC. Quebec Bill 17 (royal assent June 12, 2026) now authorizes government-backed natural H₂ pilot projects. QIMC plans to immediately engage with the Ministry of Economy to initiate pilots. MOU with Témiscamingue First Nation signed Oct 2025. Quebec is highly prospective due to diverse geological environments spanning 1.5M km².",
    source:"IEA Geological Hydrogen Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:4008, name:"Rev Exploration — Alberta",
    province:"AB", tech:"Natural H2", stage:"Exploration started", cap_kt:null,
    lng:-115.0, lat:55.0,
    gaps:["Exploration drilling","Licence award","Resource confirmation"],
    oems:[],
    desc:"Rev Exploration pursuing natural hydrogen exploration licences in Alberta. Alberta's geological survey has identified several formations with potential for geological hydrogen occurrence.",
    source:"IEA Geological Hydrogen Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:4009, name:"Squatex Resources — Quebec",
    province:"QC", tech:"Natural H2", stage:"Exploration started", cap_kt:null,
    lng:-71.0, lat:48.0,
    gaps:["Exploration drilling","Resource confirmation"],
    oems:[],
    desc:"Squatex Resources exploring for natural hydrogen in Quebec. Active in a sector gaining momentum following QIMC's Nova Scotia discovery and Vema's Quebec pilot wells.",
    source:"IEA Geological Hydrogen Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:4010, name:"Anteros — Newfoundland & Labrador",
    province:"NL", tech:"Natural H2", stage:"Exploration drilling", cap_kt:null,
    lng:-52.7, lat:47.5,
    gaps:["Drilling results","Resource assessment","Regulatory framework"],
    oems:[],
    desc:"Anteros pursuing natural hydrogen exploration drilling in the St. John's area of Newfoundland and Labrador. The province's geology includes Precambrian basement rocks prospective for natural H₂.",
    source:"IEA Geological Hydrogen Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:4011, name:"GeoRedox / Canada Nickel — Timmins District, ON",
    province:"ON", tech:"Natural H2", stage:"Early stage", cap_kt:null,
    lng:-81.3, lat:48.5,
    gaps:["Pilot stimulation","Resource quantification"],
    oems:[],
    desc:"GeoRedox and Canada Nickel Company pursuing stimulated natural hydrogen (artificial serpentinisation) in the Timmins Nickel District. Co-located with Canada Nickel's nickel sulphide operations. U of Ottawa (May 2026) confirmed Precambrian Shield rocks in this region are naturally H₂-generative.",
    source:"IEA Geological Hydrogen Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:4012, name:"DiagnaMed — Cumberland Basin, Nova Scotia",
    province:"NS", tech:"Natural H2", stage:"Early stage", cap_kt:null,
    lng:-64.5, lat:45.8,
    gaps:["Exploration drilling","Geological survey","Resource confirmation"],
    oems:[],
    desc:"DiagnaMed exploring natural hydrogen potential in the Cumberland Basin of Nova Scotia. The Basin's sedimentary sequences and structural geology provide prospective conditions.",
    source:"IEA Geological Hydrogen Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:4013, name:"DiagnaMed / QIMC — Temiscamingue, QC",
    province:"QC", tech:"Natural H2", stage:"Early stage", cap_kt:null,
    lng:-79.1, lat:47.1,
    gaps:["Exploration drilling","Resource confirmation"],
    oems:[],
    desc:"DiagnaMed and QIMC joint natural hydrogen exploration in the Temiscamingue region of Quebec. Area sits within Abitibi greenstone belt geology prospective for natural H₂.",
    source:"IEA Geological Hydrogen Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:4014, name:"First Atlas — Nova Scotia",
    province:"NS", tech:"Natural H2", stage:"Early stage", cap_kt:null,
    lng:-63.5, lat:45.0,
    gaps:["Exploration drilling","Geological survey"],
    oems:[],
    desc:"First Atlas pursuing natural hydrogen exploration in Nova Scotia, building on positive indicators from QIMC's nearby discovery well.",
    source:"IEA Geological Hydrogen Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:4015, name:"First Atlas / QIMC — Matane, Quebec",
    province:"QC", tech:"Natural H2", stage:"Early stage", cap_kt:null,
    lng:-67.5, lat:48.8,
    gaps:["Exploration drilling","Resource confirmation"],
    oems:[],
    desc:"First Atlas and QIMC joint natural hydrogen exploration at Matane, QC. The Gaspésie region's ophiolitic sequences are prospective for both natural and stimulated hydrogen.",
    source:"IEA Geological Hydrogen Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:4016, name:"Inomin Mines — British Columbia",
    province:"BC", tech:"Natural H2", stage:"Early stage", cap_kt:null,
    lng:-124.0, lat:55.0,
    gaps:["Exploration drilling","Resource confirmation"],
    oems:[],
    desc:"Inomin Mines exploring natural hydrogen potential in British Columbia, building on its existing critical minerals portfolio in BC's geological settings.",
    source:"IEA Geological Hydrogen Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:4017, name:"Benton Resources / Metals Creek — Newfoundland (Site A)",
    province:"NL", tech:"Natural H2", stage:"Early stage", cap_kt:null,
    lng:-57.0, lat:48.0,
    gaps:["Exploration drilling","Resource confirmation"],
    oems:[],
    desc:"Benton Resources and Metals Creek Resources co-exploring natural hydrogen in Newfoundland and Labrador. The province's Precambrian basement and ophiolitic sequences are prospective for geological H₂.",
    source:"IEA Geological Hydrogen Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:4018, name:"Benton Resources / Metals Creek — Newfoundland (Site B)",
    province:"NL", tech:"Natural H2", stage:"Early stage", cap_kt:null,
    lng:-56.5, lat:47.5,
    gaps:["Exploration drilling","Resource confirmation"],
    oems:[],
    desc:"Second Benton Resources and Metals Creek Resources natural hydrogen exploration licence in Newfoundland and Labrador, covering a distinct geological target.",
    source:"IEA Geological Hydrogen Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:4019, name:"Alaska Energy Metals — Quebec",
    province:"QC", tech:"Natural H2", stage:"Early stage", cap_kt:null,
    lng:-71.2, lat:46.8,
    gaps:["Exploration drilling","Resource confirmation"],
    oems:[],
    desc:"Alaska Energy Metals exploring natural hydrogen potential in Quebec alongside its critical minerals portfolio. Quebec has been highlighted as highly prospective by a 2024 INRS-ETE study covering 1.5M km².",
    source:"IEA Geological Hydrogen Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  { id:4020, name:"Proton H2 — In-situ Conversion, Saskatchewan",
    province:"SK", tech:"Natural H2", stage:"Early stage", cap_kt:null,
    lng:-109.1, lat:51.9,
    gaps:["Technology validation","Pilot drilling","Resource confirmation"],
    oems:[],
    desc:"Proton H2 (related to Proton Energy Systems) pursuing in-situ hydrocarbon conversion for natural hydrogen production in Kerrobert, Saskatchewan. Distinct from Proton Energy's UCG-based approach; targets geological H₂ generation from subsurface reactions.",
    source:"IEA Geological Hydrogen Projects Database, June 2026", url:"https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database" },

  // ── Projects NOT in IEA database (IEA June 2026) — verified from press ──
  { id:4021, name:"Kavenex Energy — Canadian Natural H₂ Exploration",
    province:"AB", tech:"Natural H2", stage:"Pre-feasibility", cap_kt:null,
    lng:-114.07, lat:51.05,
    gaps:["Drilling permits","Exploration targets","Offtake agreement"],
    oems:[],
    desc:"Calgary-based startup with sizable private investment pursuing geological hydrogen in Canada. Long-term strategy targets sedimentary basins in AB, SK, MB, NWT, QC, and Atlantic Canada — locating H₂ pools near industrial off-takers (power plants, steel mills, ammonia plants). Planning first wells 2027–2028. Not yet in IEA database.",
    source:"The Globe and Mail", url:"https://www.theglobeandmail.com/business/article-calgary-startup-joins-the-hunt-for-natural-hydrogen/" },

];




const OEMS = [
  // ── Canadian OEMs ──────────────────────────────────────────────────
  { id:"ballard",   name:"Ballard Power Systems",      hq:"Burnaby, BC",      type:"Fuel cell systems",         products:["PEM fuel cells","HD transport","Marine FC","Stationary power"],     verified:true,  region:"Canada / Global", color:C.tealD,   projects:[8],                url:"https://www.ballard.com",                              desc:"Global leader in PEM fuel cell technology for heavy-duty transport, marine, and stationary power. TSX/NASDAQ listed. Based in Burnaby, BC." },
  { id:"ekona",     name:"Ekona Power",                hq:"Burnaby, BC",      type:"Turquoise H2 / Pyrolysis",  products:["Methane pyrolysis reactors","Solid carbon co-product"],             verified:true,  region:"Canada",          color:C.amber,   projects:[9,170],            url:"https://ekonapower.com",                               desc:"Methane pyrolysis producing turquoise hydrogen and solid carbon. Gold Creek commercial demo plant operational. Series B funded 2025." },
  { id:"htec",      name:"HTEC Hydrogen",              hq:"Vancouver, BC",    type:"H2 fuelling operator",      products:["700-bar HD stations","Retail H2 stations","H2 production"],         verified:true,  region:"Canada",          color:C.green,   projects:[5,8,120,146,147],  url:"https://h-tec.com",                                    desc:"Canada's leading H2 fuelling network operator. 10+ stations across BC. Building North America's first 700-bar heavy-duty truck network." },
  { id:"ionomr",    name:"Ionomr Innovations",         hq:"Vancouver, BC",    type:"Membrane materials OEM",    products:["AEM membranes","PEM membranes","Ionomer materials"],                 verified:true,  region:"Canada",          color:"#7C3AED",  projects:[],                 url:"https://ionomr.com",                                   desc:"Manufacturer of advanced anion and proton exchange membranes for electrolysers and fuel cells. Collaborating with Cipher Neutron on 250 kW AEM electrolyser." },
  { id:"cipher",    name:"Cipher Neutron",             hq:"Toronto, ON",      type:"AEM Electrolyser OEM",      products:["250 kW AEM electrolysers"],                                          verified:true,  region:"Canada",          color:"#0891B2",  projects:[],                 url:"https://cipherneutron.com",                            desc:"Developer of North America's first 250 kW AEM hydrogen electrolyser — 100% made in Canada. Partnership with Ionomr and dynaCERT." },
  { id:"nextH2",    name:"Next Hydrogen",              hq:"Mississauga, ON",  type:"Alkaline Electrolyser OEM", products:["Alkaline electrolysers (up to 9 MW)","RuggedCell technology"],         verified:true,  region:"Canada",          color:C.blue,    projects:[],                 url:"https://nexthydrogen.com",                             desc:"Canadian manufacturer of large-scale alkaline electrolysers. RuggedCell™ technology targets MW-to-GW scale green hydrogen. Alberta testing centre." },
  { id:"hydroOpt",  name:"Hydrogen Optimized",         hq:"Toronto, ON",      type:"Large-scale ALK OEM",       products:["RuggedCell™ ALK electrolysers","GW-scale systems"],                   verified:true,  region:"Canada",          color:"#0369A1",  projects:[],                 url:"https://hydrogenoptimized.com",                        desc:"Developer of large-scale RuggedCell™ alkaline electrolysers for GW-scale green hydrogen and ammonia projects. NRCan-funded development." },
  { id:"aurora",    name:"Aurora Hydrogen",            hq:"Edmonton, AB",     type:"Microwave Pyrolysis OEM",   products:["Microwave methane pyrolysis","Turquoise H2 systems"],                 verified:true,  region:"Canada",          color:C.coral,   projects:[173],              url:"https://aurorahydrogen.com",                           desc:"Microwave methane pyrolysis technology producing low-carbon hydrogen. Demo plant operational in Edmonton, AB. NRCan-funded commercialisation." },
  { id:"vulcanx",   name:"VulcanX Energy",             hq:"Edmonton, AB",     type:"Pyrolysis OEM",             products:["Methane pyrolysis systems"],                                          verified:true,  region:"Canada",          color:"#B45309",  projects:[169],              url:"https://vulcanxenergy.com",                            desc:"Alberta-based methane pyrolysis developer producing turquoise hydrogen with solid carbon co-product. Pilot plant operational." },
  { id:"first",     name:"First Hydrogen",             hq:"Montréal, QC",     type:"FCEV + Green H2",           products:["Fuel cell vans","Green H2 production","H2 distribution"],             verified:true,  region:"Canada",          color:"#059669",  projects:[129],              url:"https://firsthydrogen.com",                            desc:"Fuel cell electric commercial vehicles and integrated green hydrogen supply. Shawinigan QC facility planned. Fleet testing ongoing in Europe." },
  { id:"proton",    name:"Proton Energy",              hq:"Saskatchewan",     type:"Underground H2 Production", products:["Partial oxidation systems","Underground H2"],                          verified:false, region:"Canada",          color:"#7C3AED",  projects:[124,125],          url:"https://protonenergy.ca",                              desc:"Underground partial oxidation technology for low-cost hydrogen from in-situ coal seams. SaskPower collaboration. Demo and feasibility stage." },
  { id:"hazer",     name:"Hazer Group Canada",         hq:"BC (with Suncor)", type:"Methane Pyrolysis",         products:["Methane pyrolysis (graphite co-product)"],                            verified:false, region:"Canada",          color:"#0D9488",  projects:[118],              url:"https://hazergroup.com.au",                            desc:"Methane pyrolysis producing hydrogen and graphite using iron ore catalyst. Pilot demo with Suncor and FortisBC at Prince George, BC." },
  { id:"dynacert",  name:"dynaCERT",                   hq:"Toronto, ON",      type:"Electrolysis / HHO",        products:["HydraGEN™ HHO system","Emission reduction technology"],                verified:false, region:"Canada",          color:"#DC2626",  projects:[],                 url:"https://dynacert.com",                                 desc:"TSX-listed. HydraGEN™ technology electrolytically generates hydrogen and oxygen on demand to improve fuel efficiency and reduce emissions." },
  { id:"cummins",   name:"Cummins / Hydrogenics",      hq:"Mississauga, ON",  type:"Electrolyser OEM",          products:["PEM electrolysers","Alkaline electrolysers","Fuelling systems"],      verified:true,  region:"N. America",      color:C.purple,  projects:[1,122,175,111],    url:"https://www.cummins.com/new-power/products-and-solutions/hydrogen", desc:"Hydrogenics (Cummins) — Mississauga-based global electrolyser manufacturer. PEM and alkaline systems for industrial and mobility applications." },
  { id:"powertech", name:"Powertech Labs",             hq:"Surrey, BC",       type:"H2 Testing & Engineering",  products:["H2 testing services","Fuelling station engineering","Safety"],        verified:true,  region:"Canada",          color:"#0891B2",  projects:[],                 url:"https://powertechlabs.com",                            desc:"BC Hydro subsidiary. H2 technology testing, certification, safety analysis, and fuelling station engineering across North America." },
  // ── International OEMs active in Canada ────────────────────────────
  { id:"nel",       name:"Nel Hydrogen",               hq:"Norway",           type:"Electrolyser OEM",          products:["PEM electrolysers","Alkaline electrolysers"],                        verified:true,  region:"Global",          color:C.teal,    projects:[1,2,4,10,11,126,131,134,160], url:"https://nelhydrogen.com", desc:"World-leading electrolyser manufacturer. Products from 1 MW to multi-GW. Active in several major Canadian green hydrogen export projects." },
  { id:"plug",      name:"Plug Power",                 hq:"USA",              type:"Green H2 + Fuel cells",     products:["PEM electrolysers","FC systems","H2 liquefaction"],                   verified:true,  region:"N. America",      color:C.blue,    projects:[5,10,12],          url:"https://www.plugpower.com",                            desc:"Vertically integrated green hydrogen company. Electrolysers, fuelling infrastructure, and fuel cell systems. Active in Canadian export projects." },
  { id:"airliq",    name:"Air Liquide",                hq:"France",           type:"Industrial / Blue H2",      products:["SMR units","ATR systems","H2 liquefaction","Gas distribution"],      verified:true,  region:"Global",          color:C.blueM,   projects:[3,4,6,7,9,12,106,107,108,112,128,130,142,154,174], url:"https://www.airliquide.com/hydrogen", desc:"World's largest industrial gas company. Bécancour PEM electrolyser operational. Major blue hydrogen, ATR/SMR, and H2 distribution presence in Canada." },
  { id:"chart",     name:"Chart Industries",           hq:"USA",              type:"Cryogenic / LH2",           products:["H2 liquefiers","Cryogenic storage tanks","Vaporisers"],               verified:true,  region:"Global",          color:C.coral,   projects:[2,3,7,11,133,134], url:"https://www.chartindustries.com/hydrogen",             desc:"Leading cryogenic equipment manufacturer for hydrogen liquefaction, storage, and transport. Critical for Atlantic Canada LH2 export projects." },
  // ── Additional CHA-verified OEMs (Small Business / Industry / Start-up categories) ──
  { id:"cellcentric",name:"Cellcentric Canada",            hq:"Burnaby, BC",    type:"PEM FC systems — heavy duty",  products:["PEM FC systems (up to 300 kW)","HD truck powertrain modules"],  verified:true,  region:"Canada/Global", color:"#1E40AF", projects:[], url:"https://www.cellcentric.net",                            desc:"50:50 joint venture between Daimler Truck AG and Volvo Group AB. Designs and manufactures PEM fuel cell systems for heavy-duty trucks and commercial vehicles. Expanded R&D and manufacturing facility in Burnaby, BC in 2025. CHA member." },
  { id:"boschCA",   name:"Bosch Canada",                   hq:"Mississauga, ON",type:"PEM electrolysers / FC parts",  products:["Hybrion PEM electrolyser stacks","FC bipolar plates","Balance-of-plant"], verified:true, region:"Canada/Global", color:"#DC2626", projects:[], url:"https://www.bosch-hydrogen-energy.com",                desc:"Bosch Canada supplies large-scale industrial PEM electrolysis stacks (Hybrion platform), fuel cell components, and system integration. CHA Industry member." },
  { id:"topsoe",    name:"Topsoe Inc.",                    hq:"Canada (Denmark)",type:"SOEC electrolysers / catalysts",products:["SOEC electrolysers (eREACT™)","H2 process catalysts","NH3 synthesis"], verified:true, region:"Global",       color:"#7C3AED", projects:[], url:"https://www.topsoe.com/our-resources/knowledge/hydrogen", desc:"Global leader in SOEC electrolysis and catalysis. Provides catalysts for SMR, ATR, and ammonia synthesis. Active in Canadian green H2 and clean ammonia projects. CHA Small Business member." },
  { id:"avlCA",     name:"AVL Fuel Cell Canada",            hq:"Burnaby, BC",    type:"FC stack R&D / testing OEM",   products:["PEM FC stacks","Powertrain simulation","FC testing systems"],      verified:true,  region:"Canada/Global", color:"#0369A1", projects:[], url:"https://www.avl.com/en/hydrogen",                         desc:"Canadian subsidiary of AVL List GmbH (Austria). Performs PEM fuel cell stack development and testing for automotive, heavy-duty, and stationary applications. CHA Small Business member." },
  { id:"cimtech",   name:"CIMtech Green Energy Mfg.",       hq:"BC, Canada",     type:"Electrolyser / FC manufacturer",products:["Electrolyser stacks","FC components","Bipolar plates"],             verified:true,  region:"Canada",        color:"#059669", projects:[], url:"https://www.cimtechgreenenergy.com",                     desc:"Canadian electrolyser and fuel cell component manufacturer. Industry 4.0 automated production platform. CHA Small Business member." },
  { id:"dpoint",    name:"dPoint Humidifiers (CORE Energy)", hq:"Vancouver, BC", type:"FC humidification / heat recovery",products:["Membrane humidifiers for FC","Water vapour transfer","Heat exchangers"], verified:true, region:"Canada/Global", color:"#0891B2", projects:[], url:"https://dpointtech.com",                                desc:"Vancouver-based manufacturer of hollow-fibre membrane humidifiers and vapour transfer plates for PEM fuel cells and electrolysers. Products installed globally by major OEMs. CHA Small Business member." },
  { id:"unilia",    name:"Unilia (Canada) Fuel Cells",      hq:"Canada",         type:"SOFC / stationary fuel cells",  products:["SOFC systems","Distributed power units"],                          verified:true,  region:"Canada",        color:"#F59E0B", projects:[], url:"https://canadah2.ca/member/unilia-canada-fuel-cells/",     desc:"Developer of solid oxide fuel cell systems for stationary and distributed power applications. CHA board member." },
  { id:"ayrton",    name:"Ayrton Energy",                   hq:"Calgary, AB",    type:"LOHC hydrogen transport & storage",products:["LOHC carrier oil system","H2 transport modules","Storage compatible with oilfield infra"], verified:true, region:"Canada", color:"#6D28D9", projects:[], url:"https://ayrtonenergy.com",                               desc:"Developing liquid organic hydrogen carrier (LOHC) technology enabling safe, low-pressure H2 transport via existing oilfield infrastructure. $6.8M seed round closed 2024. CHA Start-up member." },
  { id:"azolla",    name:"Azolla Hydrogen",                 hq:"BC, Canada",     type:"Onsite H2 production (bio-methanol)",products:["AZ225 Biodrome system","Bio-methanol H2 stations","Fleet fuelling systems"], verified:true, region:"Canada", color:"#10B981", projects:[], url:"https://azollahydrogen.com",                               desc:"Produces on-site low-GHG hydrogen via bio-methanol + deionized water reforming (Biodrome™ technology). 44–70% GHG reduction vs diesel. Targets return-to-base trucking and forklift fleets. CHA Start-up member." },
];

// ── INDUSTRY MEMBERS (project developers, EPC, energy companies) ──────
const INDUSTRY_MEMBERS = [
  { id:"atcogas",   name:"ATCO Gas and Pipelines",        hq:"Calgary, AB",       type:"Pipeline operator",            role:"H2 production & distribution",  url:"https://www.atco.com",           desc:"Key developer of Heartland Hydrogen Hub and Fort Saskatchewan ATR+CCS. Blue and green H2 production and gas distribution across Alberta and BC." },
  { id:"enbridge",  name:"Enbridge Inc.",                  hq:"Calgary, AB",       type:"Energy infrastructure",        role:"Pipeline & H2 blending",        url:"https://www.enbridge.com",       desc:"Canada's largest pipeline company. H2 blending programs in Ontario and BC. Partner on Markham power-to-gas facility. CHA Executive member." },
  { id:"fortisbc",  name:"FortisBC Energy Inc.",           hq:"Surrey, BC",        type:"Gas distribution",             role:"H2 distribution & blending",    url:"https://www.fortisbc.com",       desc:"BC gas utility leading H2 blending demonstration. Partner on Hazer Group Prince George pilot and residential H2 blend testing. CHA Executive member." },
  { id:"shellCA",   name:"Shell Canada",                   hq:"Calgary, AB",       type:"H2 production / CCUS",         role:"H2 production & CCS",           url:"https://www.shell.ca",           desc:"Operator of Quest CCS (300 kt H₂/yr) and Scotford Polaris CCS expansion. Leads Recyclage Carbone Varennes e-fuels project. CHA Executive member." },
  { id:"suncorCA",  name:"Suncor Energy",                  hq:"Calgary, AB",       type:"Integrated energy / H2",       role:"H2 production / co-investment", url:"https://www.suncor.com",         desc:"Integrated energy company active in blue and turquoise H2. Co-investor in Hazer Group BC pilot and Recyclage Carbone Varennes e-fuels. CHA Executive member." },
  { id:"tcenergy",  name:"TC Energy",                      hq:"Calgary, AB",       type:"Pipeline infrastructure",      role:"H2 transport & storage",        url:"https://www.tcenergy.com",       desc:"Major pipeline operator evaluating H2 transport and blending on existing network. Working on H2 backbone infrastructure for production-hub connectivity." },
  { id:"lindeCA",   name:"Linde Canada Inc.",              hq:"Alberta",           type:"Industrial gases / H2",        role:"H2 production & distribution",  url:"https://www.lindecanada.ca",     desc:"Operator of 1,000 kt/yr ATR+CCS at Fort Saskatchewan. Industrial gas distribution, liquefaction, and H2 supply infrastructure across Canada. CHA Executive." },
  { id:"hatch",     name:"Hatch Ltd.",                     hq:"Mississauga, ON",   type:"Engineering & advisory",       role:"FEED & project development",    url:"https://www.hatch.com",          desc:"Major engineering consultancy active across Canadian H2 projects providing FEED studies, techno-economic assessments, and project management. CHA Executive." },
  { id:"certarus",  name:"Certarus",                       hq:"Calgary, AB",       type:"Compressed gas transport",     role:"H2 delivery / last-mile",       url:"https://certarus.com",           desc:"Mobile compressed gas delivery including H2. Active in H2 delivery and fuelling services for industrial and transit customers across Canada." },
  { id:"wegh2",     name:"World Energy GH2",               hq:"St. John's, NL",   type:"Green H2 export developer",    role:"H2/NH3 project developer",      url:"https://www.worldenergygh2.com", desc:"Developer of Nujio'qonik (NL) and Bear Head (NS) green H2/NH3 export projects. Total portfolio >1,200 kt NH₃/yr across 5 phases. CHA board member." },
  { id:"ghd",       name:"GHD Limited",                    hq:"Canada (global)",   type:"Engineering & consulting",     role:"Project feasibility & EPC",     url:"https://www.ghd.com",            desc:"Engineering and project delivery firm active across Canadian H2 feasibility studies and environmental assessments. CHA Industry member." },
  { id:"bird",      name:"Bird Construction",              hq:"Mississauga, ON",   type:"EPC / general contractor",     role:"Construction / EPC",            url:"https://www.bird.ca",            desc:"National EPC contractor active in clean energy infrastructure. CHA member providing construction expertise for H2 production and fuelling facilities." },
  { id:"everwind",  name:"EverWind Fuels",                 hq:"Halifax, NS",       type:"Green H2 / NH3 export",        role:"H2/NH3 production & export",    url:"https://everwindfuels.com",      desc:"Developer of Point Tupper Phase 1 and 2 green NH₃ export projects in NS. FEED complete for Phase 1. Deep-water terminal at Cape Breton." },
  { id:"siemensCA", name:"Siemens Energy Canada",          hq:"Calgary, AB",       type:"Power-to-H2 systems",          role:"Electrolysers & H2 turbines",   url:"https://www.siemens-energy.com/ca",desc:"PEM electrolysis systems and hydrogen-ready turbines. Industrial H2 integration. CHA Executive board past chair. Active in Canadian H2 transition." },
  { id:"airprod",   name:"Air Products Canada Ltd.",       hq:"Mississauga, ON",   type:"Industrial gases / H2 supply", role:"H2 supply & liquefaction",      url:"https://www.airproducts.com",    desc:"Major H2 supplier in Canada. Industrial gases, liquefaction, distribution. Partner on Edmonton International Airport H2 vehicle program. CHA Executive." },
  { id:"greenfield",name:"Greenfield Global",              hq:"Montreal, QC",      type:"Biofuels / low-carbon fuels",  role:"H2-SAF / bioenergy",            url:"https://www.greenfield.com",     desc:"Canadian producer of bio-based and low-carbon fuels. Exploring hydrogen integration for SAF and bioenergy applications. CHA Industry member." },
  // ── Additional CHA-verified Industry members ──────────────────────
  { id:"hydraE",    name:"Hydra Energy",                  hq:"Vancouver, BC",     type:"H2-diesel dual-fuel retrofit",  role:"H2 last-mile delivery / HaaS",  url:"https://www.hydraenergy.com",    desc:"Provides Hydrogen-as-a-Service (HaaS) by retrofitting diesel semi-trucks with H2-diesel dual-fuel injection kits. 40% H2 displacement. 80+ orders received; NRCan Progress Report highlighted. CHA Small Business member." },
  { id:"northAtl",  name:"North Atlantic Refining",       hq:"Come By Chance, NL",type:"Oil refining / H2 user",        role:"Industrial H2 consumer",        url:"https://www.northatlantic.ca",   desc:"Newfoundland's major oil refinery and CHA board member. Evaluating H2 integration for refinery decarbonization. Significant industrial H2 demand potential in NL." },
  { id:"intertek",  name:"Intertek",                      hq:"Canada (global)",   type:"Testing, certification & inspection",role:"H2 equipment certification",  url:"https://www.intertek.com/hydrogen/",desc:"Global testing and certification body for hydrogen equipment, stations, and components. Provides TSSA-recognized testing, inspection, and certification across Canada. CHA board member." },
  { id:"charbone",  name:"Charbone Hydrogen Corporation", hq:"Sorel-Tracy, QC",   type:"Small-scale green H2 producer", role:"H2 production & distribution",  url:"https://www.charbonehydrogen.com",desc:"Canadian public company (TSXV: CH) developing small-scale green H2 production facilities in QC and across Canada. Site agreement with City of Sorel-Tracy, QC for first plant. CHA Industry member." },
  { id:"ilf",       name:"ILF Consultants Inc.",           hq:"Canada (global)",   type:"Engineering consulting",        role:"H2 project engineering & FEED", url:"https://www.ilf.com",            desc:"International engineering firm providing FEED, detailed design, and project management for hydrogen production, distribution, and fuelling infrastructure. CHA Small Business member." },
  { id:"sea2sky",   name:"Sea to Sky Energy Solutions",   hq:"BC, Canada",        type:"Clean energy project development",role:"H2 project development & advisory",url:"https://canadah2.ca/member/sea-to-sky-energy-solutions/",desc:"BC-based project development and advisory firm active in clean hydrogen and renewable energy projects. CHA Small Business member." },
  // ── Natural (Geological) Hydrogen explorers ──────────────────────
  { id:"maxpower",  name:"Max Power Mining Corp.",          hq:"Saskatchewan",      type:"Natural H₂ exploration",         role:"Geological H₂ explorer",          url:"https://www.maxpowermining.com", desc:"Drilled Canada's first-ever natural hydrogen exploration well (Lawson well, 2,278m, Nov 2025) near Central Butte, SK. Confirmed Canada's first natural H₂ drilling discovery Jan 2026. CSE: MAXX." },
  { id:"vema",      name:"Vema Hydrogen",                   hq:"Quebec, Canada",    type:"Stimulated natural H₂",          role:"Engineered Mineral H₂ developer", url:"https://canadah2.ca/member/vema/", desc:"Canadian startup developing Engineered Mineral Hydrogen (EMH) via stimulated artificial serpentinisation in Quebec ophiolite rocks. Completed first two pilot wells Feb 2026. CHA member." },
  { id:"primaryH2", name:"Primary Hydrogen Corporation",    hq:"Canada (multi-prov)",type:"Natural H₂ exploration",        role:"Multi-province natural H₂ explorer",url:"https://www.primaryhydrogen.com", desc:"Exploration started in BC, Kapuskasing ON, and NL. Building a multi-province geological H₂ exploration portfolio across Canada's Precambrian Shield and ophiolitic terrain." },
  { id:"qimc",      name:"Quebec Innovative Materials (QIMC)",hq:"Quebec, Canada",  type:"Natural H₂ exploration",         role:"Natural H₂ discoverer / explorer", url:"https://quebecim.com", desc:"Completed 711m discovery hole in NS (with QMET). Active exploration in Ville-Marie QC, Temiscamingue (with DiagnaMed), and Matane QC (with First Atlas)." },
  { id:"revExplo",  name:"Rev Exploration",                  hq:"Alberta, Canada",  type:"Natural H₂ exploration",         role:"Alberta natural H₂ explorer",     url:"https://canadah2.ca/", desc:"Pursuing natural hydrogen exploration licences in Alberta. Part of the emerging Canadian natural H₂ exploration sector that reached 20 projects by June 2026 per IEA data." },
];

// ── END-USERS (final hydrogen consumers) ─────────────────────────────
const END_USERS = [
  { id:"cpkc",    name:"Canadian Pacific Kansas City (CPKC)", hq:"Calgary, AB",       type:"Rail transportation",       role:"H2 locomotive fuel",      url:"https://www.cpr.ca",           desc:"CPKC evaluating hydrogen-powered locomotives for its North American rail network. CHA End-user member. Active in Green Corridor initiative." },
  { id:"cityEDM", name:"City of Edmonton",                    hq:"Edmonton, AB",      type:"Municipal government",      role:"H2 transit & district",   url:"https://www.edmonton.ca",       desc:"Operating H2 fuel cell bus pilot with Strathcona County. Exploring H2 for district heating and industrial decarbonization. CHA board member." },
  { id:"eia",     name:"Edmonton International Airport",      hq:"Edmonton, AB",      type:"Aviation / logistics",      role:"H2 ground support fleet", url:"https://flyeia.com",            desc:"100 Toyota Mirai H2 fuel cell vehicles for taxi, rental car, and airport fleet. Partnership with Air Products. First H2 airport fleet in Canada." },
  { id:"gtaa",    name:"Greater Toronto Airports Authority",  hq:"Toronto, ON",       type:"Aviation",                  role:"H2 ground operations",    url:"https://www.torontopearson.com",desc:"Exploring H2 for Pearson Airport ground operations and fuelling. Partner in CUTRIC/CHA GTHA H2 transit study. CHA End-user member." },
  { id:"toyota",  name:"Toyota Motor Manufacturing Canada",   hq:"Cambridge, ON",     type:"Automotive manufacturing", role:"FCEV production & supply", url:"https://www.toyota.ca",         desc:"Toyota Canada manufactures and promotes hydrogen fuel cell vehicles (Mirai). Supplied 100 units to EIA. CHA Premier member and leading FCEV champion." },
  { id:"nbcH2",   name:"Northern BC Hydrogen Hub",            hq:"Prince George, BC", type:"Community H2 cluster",      role:"Industrial H2 demand",    url:"https://nbc-hydrogen.ca",       desc:"Regional consortium aggregating industrial and municipal H2 demand in northern BC. Anchor customer for HTEC Prince George station. CHA end-user." },
  { id:"miway",   name:"City of Mississauga — MiWay Transit", hq:"Mississauga, ON",  type:"Public transit",            role:"H2 fuel cell bus fleet",  url:"https://www.mississauga.ca/projects-and-strategies/city-projects/hydrogen-fuel-cell-electric-bus-pilot-project/",desc:"Ontario's first municipal H2 bus pilot. 10 New Flyer FCEBs with Ballard fuel cells. H2-as-a-Service model. $20M ZETF-backed." },
  { id:"airCan",  name:"Air Canada",                          hq:"Montréal, QC",      type:"Aviation",                  role:"SAF offtake buyer",       url:"https://www.aircanada.com/ca/en/aco/home/about/sustainability.html",desc:"Issued RFP for 50M L/yr SAF starting 2028. 10-year offtake framework with CORSIA CI threshold. One of Canada's largest SAF demand signals." },
  { id:"cenovus", name:"Cenovus Energy",                      hq:"Calgary, AB",       type:"Oil sands / refining",      role:"Blue H2 offtake",         url:"https://www.cenovus.com",       desc:"Seeking blue H2 for Edmonton refinery decarbonization. 300 MW SMR+CCS planned at Scotford complex. Major industrial H2 demand anchor in Alberta." },
  // ── Additional CHA-verified End-users ─────────────────────────────
  { id:"cityCAL",  name:"City of Calgary",                    hq:"Calgary, AB",       type:"Municipal government",       role:"H2 fleet & heating pilot",url:"https://www.calgary.ca",        desc:"City of Calgary exploring H2 for municipal fleet and district heating. Partner in Calgary Region H2 Hub. CHA Community member." },
  { id:"creative", name:"Creative Truck Performance",          hq:"Canada",            type:"H2-diesel truck conversion",  role:"H2 vehicle end-user",    url:"https://canadah2.ca/member/creative-truck-performance/",desc:"Commercial trucking company and end-user of hydrogen-diesel dual-fuel vehicles. CHA End-user member demonstrating H2 adoption in long-haul transport." },
  { id:"hybrigen", name:"HybriGenix Futures Inc.",             hq:"Canada",            type:"H2 mobility & applications",  role:"H2 technology end-user",  url:"https://canadah2.ca/member/hybrigenix-futures-inc/", desc:"Organization focused on advancing hydrogen adoption across mobility applications. CHA End-user member." },

];
// ── CANADA H2 MARKET POTENTIAL DATA ─────────────────────────────────
// Sources: NRCan Hydrogen Strategy Progress Report 2024 (modelling scenarios),
//          Canada Energy Regulator Market Snapshot Sep 2025,
//          IEA Canada Hydrogen Strategy, CHA 2024 Sector Profile
// CER 2025: Canada currently produces ~4 Mt/yr total; 0.5 Mt CCS-paired
// NRCan modelling: 3-12% of Canada energy demand by 2050 (15-60 Mt H2)
// IEA/NRCan: >CAD $50B revenues potential by 2050; 350,000 jobs
const CA_H2_MARKET_DATA = [
  { year:"2024", actual:4.0,  low:4.0,  reference:4.0,  transformative:4.0   },
  { year:"2026", actual:5.5,  low:5.5,  reference:6.5,  transformative:8.0   },
  { year:"2028", actual:null, low:7.0,  reference:9.5,  transformative:14.0  },
  { year:"2030", actual:null, low:9.0,  reference:14.0, transformative:22.0  },
  { year:"2035", actual:null, low:10.5, reference:22.0, transformative:38.0  },
  { year:"2040", actual:null, low:12.0, reference:30.0, transformative:48.0  },
  { year:"2045", actual:null, low:13.0, reference:38.0, transformative:55.0  },
  { year:"2050", actual:null, low:15.0, reference:45.0, transformative:60.0  },
];
// Revenue potential ($B CAD) — NRCan Strategy: >$50B by 2050
const CA_H2_REVENUE_DATA = [
  { year:"2024", revenue:2.0  },
  { year:"2026", revenue:3.5  },
  { year:"2028", revenue:5.5  },
  { year:"2030", revenue:9.0  },
  { year:"2035", revenue:18.0 },
  { year:"2040", revenue:28.0 },
  { year:"2045", revenue:40.0 },
  { year:"2050", revenue:52.0 },
];

// ── INFRASTRUCTURE PROJECTS ──────────────────────────────────────────
// Source: IEA Infrastructure Database Sep 2025 + known Canadian H2 infra
const INFRA_PROJECTS = [
  { id:200, type:"infrastructure", name:"Alberta Carbon Trunk Line (ACTL)", province:"AB", tech:"Blue H2", stage:"Operational", cap_kt:null, lng:-113.50000, lat:53.50000, desc:"240 km CO₂ pipeline running from the Industrial Heartland to Clive oil field. Carries CO₂ from Quest, WCS Redwater, and other CCS projects. Critical for Alberta blue H2 ecosystem.", ownership:"Enhance Energy / Wolf Carbon Solutions", investment:"$630M", source:"Enhance Energy", url:"https://www.enhanceenergy.com/" },
  { id:201, type:"infrastructure", name:"FortisBC H2 Blending Program — BC", province:"BC", tech:"Green H2", stage:"Operational", cap_kt:null, lng:-122.90000, lat:49.18000, desc:"FortisBC's hydrogen blending program injecting H2 into natural gas distribution network in BC. Includes the Prince George pilot with Hazer Group/Suncor and residential blend testing.", ownership:"FortisBC Energy Inc.", investment:"~$30M (phase 1)", source:"FortisBC", url:"https://www.fortisbc.com/about-us/environment/renewablegas/hydrogen" },
  { id:202, type:"infrastructure", name:"Enbridge H2 Blending — Ontario", province:"ON", tech:"Green H2", stage:"Construction", cap_kt:null, lng:-79.50000, lat:43.70000, desc:"Enbridge Gas expanding H2 blending across Ontario natural gas distribution network. Builds on Markham power-to-gas project. Targets up to 10% H2 blend in residential and commercial gas supply.", ownership:"Enbridge Gas Inc.", investment:"~$100M", source:"Enbridge Gas", url:"https://www.enbridgegas.com/en-ca/about-enbridge-gas/our-company/environment/hydrogen" },
  { id:203, type:"infrastructure", name:"HTEC H2 Fuelling Network — BC", province:"BC", tech:"Green H2", stage:"Operational", cap_kt:null, lng:-122.97000, lat:49.24000, desc:"10+ hydrogen fuelling stations across BC operated by HTEC. Includes 700-bar HD truck stations at Tsawwassen and Abbotsford (BC Pilot H2 Truck Program), and retail stations in Metro Vancouver.", ownership:"HTEC Hydrogen Technology & Energy Corporation", investment:"~$80M (network)", source:"HTEC Hydrogen", url:"https://h-tec.com/" },
  { id:204, type:"infrastructure", name:"Point Tupper H2 Export Terminal — NS", province:"NS", tech:"Low-carbon ammonia", stage:"Feasibility", cap_kt:null, lng:-61.34000, lat:45.58000, desc:"EverWind Fuels' proposed green ammonia export terminal at the former Point Tupper industrial site. Deep-water port with direct ship loading. 1 Mt NH₃/yr export capacity at full build-out.", ownership:"EverWind Fuels", investment:"~$1.5B", source:"EverWind Fuels", url:"https://everwindfuels.com/" },
  { id:205, type:"infrastructure", name:"Bear Head LNG Terminal Repurposing — NS", province:"NS", tech:"Low-carbon ammonia", stage:"Feasibility", cap_kt:null, lng:-61.34500, lat:45.57800, desc:"Repurposing of former Bear Head LNG import terminal for green ammonia export. World Energy GH2's Cape Breton export infrastructure. Enables Phase 1a Bear Head Energy NH₃ export.", ownership:"World Energy GH2", investment:"~$500M", source:"World Energy GH2", url:"https://www.worldenergygh2.com/" },
  { id:206, type:"infrastructure", name:"Linde H2 Distribution — Alberta Industrial Heartland", province:"AB", tech:"Blue H2", stage:"Operational", cap_kt:null, lng:-113.15000, lat:53.72000, desc:"Linde's pipeline and distribution network connecting hydrogen producers in Alberta's Industrial Heartland to industrial customers in Fort Saskatchewan, Edmonton, and Redwater. Includes pipeline, storage, and compression.", ownership:"Linde Canada Inc.", investment:"$200M+", source:"Linde Canada", url:"https://www.lindecanada.ca/" },
  { id:207, type:"infrastructure", name:"Bécancour H2 Industrial Hub — QC", province:"QC", tech:"Green H2", stage:"Operational", cap_kt:null, lng:-72.40000, lat:46.37000, desc:"Industrial park infrastructure connecting Air Liquide's PEM electrolyser, H2V Canada biomass facility, and future H2 distribution at Bécancour. Quebec's primary H2 industrial cluster with port access.", ownership:"Parc Industriel de Bécancour / Multi-tenant", investment:"Multi-project", source:"Bécancour Industrial Park", url:"https://www.parc-industriel-becancour.com/en/" },
];


// ── CANADA H2 MARKET POTENTIAL — IEA POLICY SCENARIOS ─────────────────
// Stated Policies Scenario (STEPS): current enacted policies only
// Announced Pledges Scenario (APS): all announced targets honoured
// Net Zero Scenario (NZE): full 1.5°C-aligned decarbonisation
// Source: NRCan Hydrogen Strategy Progress Report 2024 (>CAD $50B revenues by 2050),
//         IEA World Energy Outlook 2024 (Canada extrapolation), CHA 2024 Sector Profile
// NRCan Transformative scenario: >$50B revenues + 350,000 jobs by 2050
const CA_MARKET_SCENARIOS = [
  { year:"2024", steps:2.0,  aps:2.0,  nze:2.0  },
  { year:"2026", steps:2.8,  aps:3.5,  nze:4.5  },
  { year:"2028", steps:3.8,  aps:5.5,  nze:8.0  },
  { year:"2030", steps:5.0,  aps:9.0,  nze:14.0 },
  { year:"2035", steps:7.5,  aps:18.0, nze:28.0 },
  { year:"2040", steps:10.5, aps:28.0, nze:45.0 },
  { year:"2045", steps:14.0, aps:40.0, nze:60.0 },
  { year:"2050", steps:18.0, aps:52.0, nze:75.0 },
];

// ── H2 & DERIVATIVES DEMAND FORECAST — IEA POLICY SCENARIOS ───────────
// Total Canadian H2 + H2-equivalent derivatives demand (Mt H2-eq/yr)
// Includes: pure H2, ammonia (H2-equivalent), SAF (H2-equivalent), methanol
// Source: IEA Global Hydrogen Review 2025 (Canadian end-use extrapolation)
const H2_DEMAND_SCENARIOS = [
  { year:"2024", steps:3.4,  aps:3.4,  nze:3.4  },
  { year:"2026", steps:4.2,  aps:5.2,  nze:6.8  },
  { year:"2028", steps:5.8,  aps:8.5,  nze:12.8 },
  { year:"2030", steps:7.8,  aps:13.2, nze:20.0 },
  { year:"2035", steps:9.8,  aps:20.8, nze:34.5 },
  { year:"2040", steps:11.2, aps:27.8, nze:44.5 },
  { year:"2045", steps:12.8, aps:35.5, nze:52.0 },
  { year:"2050", steps:14.2, aps:43.5, nze:58.5 },
];

// ── HISTORICAL INVESTMENT IN CANADIAN H2 PIPELINE ─────────────────────
// Cumulative announced investment by project stage at year-end ($B CAD)
// Reflects boom (2022-23) → rationalization (2024-25) → stabilization (2026)
// Source: IEA Production & Infrastructure DB June 2026; NRCan tracking
const HISTORICAL_INVEST_PHASE = [
  { year:"2021", announced:8.2,  feasibility:3.8,  feed:1.8, fid:2.4, operational:0.8 },
  { year:"2022", announced:28.4, feasibility:12.6, feed:4.2, fid:3.8, operational:1.4 },
  { year:"2023", announced:64.2, feasibility:18.4, feed:8.6, fid:5.2, operational:2.1 },
  { year:"2024", announced:48.8, feasibility:22.6, feed:9.4, fid:6.8, operational:3.2 },
  { year:"2025", announced:32.4, feasibility:21.8, feed:3.8, fid:7.4, operational:3.1 },
  { year:"2026", announced:15.2, feasibility:21.8, feed:2.4, fid:7.8, operational:3.1 },
];

const SCENARIO_COLORS = { steps:"#94A3B8", aps:"#3B82F6", nze:"#16A34A" };
const SCENARIO_LABELS = { steps:"Stated Policies (STEPS)", aps:"Announced Pledges (APS)", nze:"Net Zero (NZE)" };


const FORECAST_DATA = [
  { year:"2025", greenH2:0.4,  blueH2:2.8, ammonia:0.10, saf:0.05, efuels:0.01 },
  { year:"2026", greenH2:0.7,  blueH2:3.0, ammonia:0.18, saf:0.09, efuels:0.02 },
  { year:"2027", greenH2:1.2,  blueH2:3.4, ammonia:0.40, saf:0.18, efuels:0.05 },
  { year:"2028", greenH2:2.0,  blueH2:3.8, ammonia:0.80, saf:0.30, efuels:0.12 },
  { year:"2029", greenH2:2.9,  blueH2:4.3, ammonia:1.20, saf:0.45, efuels:0.20 },
  { year:"2030", greenH2:3.8,  blueH2:4.9, ammonia:1.80, saf:0.60, efuels:0.30 },
  { year:"2032", greenH2:6.1,  blueH2:5.5, ammonia:3.10, saf:1.10, efuels:0.70 },
  { year:"2035", greenH2:9.2,  blueH2:6.1, ammonia:5.40, saf:2.10, efuels:1.40 },
];

// Investment by project development phase ($B)
// INVESTMENT_BY_PHASE — IEA June 2026 basis
// Active pipeline: 108 tracked − 12 cancelled − 16 dormant = 80 active
// Natural H2 exploration (20 projects) excluded from $ investment (pre-commercial)
// Values $B CAD estimated; major revisions from Burin/Nujio'qonik cancellations
const INVESTMENT_BY_PHASE = [
  { phase:"Announced",    projects:34, value:15.2, color:"#94A3B8", desc:"Pre-feasibility, concept-stage, and exploration projects (incl. 20 natural H₂)" },
  { phase:"Feasibility",  projects:24, value:21.8, color:C.blueM,   desc:"Technical and economic feasibility studies actively underway" },
  { phase:"FEED",         projects:2,  value:2.4,  color:C.blue,    desc:"Front-End Engineering & Design or procurement underway" },
  { phase:"FID/Const.",   projects:7,  value:7.8,  color:C.amber,   desc:"Final Investment Decision taken; capital committed; construction active" },
  { phase:"Demo",         projects:4,  value:0.3,  color:C.teal,    desc:"Commercial demonstration scale; technology validation" },
  { phase:"Operational",  projects:9,  value:3.1,  color:C.green,   desc:"Fully operational and actively producing hydrogen" },
];

// Investment by technology + phase matrix
const INVEST_TECH_PHASE = [
  { tech:"Green H2",       announced:7.4,  feasibility:9.8,  feed:0.8, fid:3.2, construction:0.1, operational:0.8 },
  { tech:"Blue H2",        announced:3.2,  feasibility:6.4,  feed:1.2, fid:4.2, construction:0.1, operational:1.8 },
  { tech:"Low-carbon NH3", announced:2.8,  feasibility:4.2,  feed:0.3, fid:0.2, construction:0.0, operational:0.4 },
  { tech:"SAF",            announced:1.4,  feasibility:0.9,  feed:0.1, fid:0.2, construction:0.0, operational:0.1 },
  { tech:"E-fuels",        announced:0.4,  feasibility:0.5,  feed:0.0, fid:0.0, construction:0.1, operational:0.0 },
  { tech:"Natural H2",     announced:0.0,  feasibility:0.0,  feed:0.0, fid:0.0, construction:0.0, operational:0.0 },
];

// Investment by province + phase
// INVEST_PROVINCE — revised post-IEA June 2026 (Burin/Nujio'qonik cancelled; NS/NL reduced)
const INVEST_PROVINCE = [
  { province:"AB", announced:2.8, feasibility:7.8, feed:0.8, fid:6.2, construction:0.1, operational:2.4, total:20.1 },
  { province:"BC", announced:2.2, feasibility:4.8, feed:0.6, fid:0.8, construction:0.1, operational:0.6, total:9.1  },
  { province:"NS", announced:0.4, feasibility:3.8, feed:0.6, fid:0.0, construction:0.0, operational:0.3, total:5.1  },
  { province:"QC", announced:1.8, feasibility:2.6, feed:0.4, fid:0.6, construction:0.1, operational:0.4, total:5.9  },
  { province:"ON", announced:0.6, feasibility:1.0, feed:0.0, fid:0.2, construction:0.0, operational:0.3, total:2.1  },
  { province:"NL", announced:1.2, feasibility:1.8, feed:0.0, fid:0.0, construction:0.0, operational:0.0, total:3.0  },
  { province:"SK", announced:0.8, feasibility:0.4, feed:0.0, fid:0.0, construction:0.0, operational:0.1, total:1.3  },
  { province:"NB", announced:0.4, feasibility:0.4, feed:0.0, fid:0.0, construction:0.0, operational:0.0, total:0.8  },
];

// Timeline: quarterly investment activity
const INVEST_TIMELINE = [
  { q:"Q1 '23", greenH2:0.18, blueH2:0.62, ammonia:0.08, saf:0.02, efuels:0.00 },
  { q:"Q2 '23", greenH2:0.22, blueH2:0.71, ammonia:0.10, saf:0.03, efuels:0.00 },
  { q:"Q3 '23", greenH2:0.31, blueH2:0.84, ammonia:0.12, saf:0.04, efuels:0.01 },
  { q:"Q4 '23", greenH2:0.38, blueH2:0.93, ammonia:0.15, saf:0.04, efuels:0.01 },
  { q:"Q1 '24", greenH2:0.42, blueH2:1.12, ammonia:0.18, saf:0.05, efuels:0.01 },
  { q:"Q2 '24", greenH2:0.58, blueH2:1.28, ammonia:0.22, saf:0.06, efuels:0.02 },
  { q:"Q3 '24", greenH2:0.72, blueH2:1.41, ammonia:0.28, saf:0.08, efuels:0.02 },
  { q:"Q4 '24", greenH2:0.94, blueH2:1.63, ammonia:0.34, saf:0.09, efuels:0.03 },
  { q:"Q1 '25", greenH2:1.12, blueH2:1.78, ammonia:0.38, saf:0.11, efuels:0.04 },
  { q:"Q2 '25", greenH2:1.38, blueH2:1.94, ammonia:0.44, saf:0.13, efuels:0.05 },
  { q:"Q3 '25", greenH2:1.62, blueH2:2.08, ammonia:0.52, saf:0.15, efuels:0.06 },
  { q:"Q4 '25", greenH2:1.91, blueH2:2.24, ammonia:0.58, saf:0.18, efuels:0.07 },
];

// TECH_MIX — share of total tracked projects by technology (IEA June 2026 basis)
const TECH_MIX = [
  { name:"Green H2",    value:44, color:C.teal  },   // 47/108 projects
  { name:"Low-C NH3",  value:19, color:C.amber  },   // 21/108
  { name:"Natural H2", value:19, color:"#B45309"},   // 20/108
  { name:"Blue H2",    value:12, color:C.blue   },   // 13/108
  { name:"SAF",        value:4,  color:C.green  },   // 4/108
  { name:"E-fuels",    value:3,  color:C.coral  },   // 3/108
];

const DEMAND_SIGNALS = [
  { buyer:"Air Canada",      type:"SAF offtake",       volume:"50M L/yr",   timeline:"2028–38",  status:"RFP open",    urgency:"High",   source:"Air Canada Sustainability Report 2024", url:"https://www.aircanada.com/ca/en/aco/home/about/sustainability.html" },
  { buyer:"Germany (NRGHY)", type:"Green NH3 export",  volume:"200 ktpa",   timeline:"2028–40",  status:"MOU signed",  urgency:"High",   source:"NRCan Canada-Germany H2 Alliance",     url:"https://natural-resources.canada.ca/our-natural-resources/energy-sources-distribution/clean-fuels/hydrogen/canadas-national-hydrogen-strategy/23485" },
  { buyer:"Toronto Transit", type:"Fuel cell buses",   volume:"120 buses",  timeline:"2026–30",  status:"RFP Q3 2026", urgency:"High",   source:"TTC Zero Emission Bus Program",         url:"https://www.ttc.ca/news/2024/February/TTC-approved-to-move-forward-with-zero-emissions-bus-procurement" },
  { buyer:"BC Ferries",      type:"Green H2 fuel",     volume:"5,000 kg/d", timeline:"2027+",    status:"Feasibility", urgency:"Medium", source:"BC Ferries Electrification Plan",       url:"https://www.bcferries.com/our-company/environment/electrification" },
  { buyer:"Teck Resources",  type:"Blue H2 mining",    volume:"15k kg/d",   timeline:"2027+",    status:"Feasibility", urgency:"Medium", source:"Teck Sustainability Report 2024",       url:"https://www.teck.com/responsibility/sustainability/" },
  { buyer:"Japan (JECO)",    type:"Liquid H2 export",  volume:"100 ktpa",   timeline:"2030+",    status:"Pre-MOU",     urgency:"Low",    source:"NRCan Canada-Japan H2 Cooperation",    url:"https://natural-resources.canada.ca/our-natural-resources/energy-sources-distribution/clean-fuels/hydrogen/canadas-national-hydrogen-strategy/23485" },
];

const POLICIES = [
  { title:"Clean Hydrogen Investment Tax Credit",   jurisdiction:"Federal",      value:"15–40% capex",     deadline:"Dec 2034", isNew:true,  source:"Canada Revenue Agency",             url:"https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/corporations/business-tax-credits/clean-economy-itc/clean-hydrogen-itc.html" },
  { title:"Geological Survey of Canada — Natural H₂ Mapping Program", jurisdiction:"Federal", value:"Multi-year database", deadline:"Ongoing", isNew:true, source:"Geological Survey of Canada", url:"https://natural-resources.canada.ca/our-natural-resources/minerals-mining/minerals-mining-research/geological-survey-canada" },
  { title:"Clean Fuel Regulations — Credit System", jurisdiction:"Federal",      value:"$80–350/t CO₂e",   deadline:"Ongoing",  isNew:false, source:"Environment & Climate Change Canada", url:"https://www.canada.ca/en/environment-climate-change/services/managing-pollution/energy-production/fuel-regulations/clean-fuel-regulations.html" },
  { title:"Canada-Germany H2 Alliance",             jurisdiction:"Federal/Intl", value:"EU market access",  deadline:"Jan 2027", isNew:true,  source:"Natural Resources Canada",           url:"https://natural-resources.canada.ca/our-natural-resources/energy-sources-distribution/clean-fuels/hydrogen/canadas-national-hydrogen-strategy/23485" },
  { title:"Alberta H2 Innovation Fund ($57M)",      jurisdiction:"Alberta",      value:"Up to $5M/project", deadline:"Q3 2026",  isNew:false, source:"Alberta Innovates",                  url:"https://albertainnovates.ca/programs/hydrogen-centre-of-excellence/" },
  { title:"BC H2 & Fuel Cell Support Program",      jurisdiction:"BC",           value:"Up to $2M",         deadline:"Q2 2026",  isNew:false, source:"CleanBC / BC Ministry of Energy",    url:"https://www.cleanbc.gov.bc.ca/hydrogen" },
  { title:"ACOA Green H2 Stream",                   jurisdiction:"Atlantic",     value:"Up to $10M",        deadline:"Sep 2026", isNew:true,  source:"Atlantic Canada Opportunities Agency", url:"https://www.canada.ca/en/atlantic-canada-opportunities.html" },
];

const NEWS_ITEMS = [
  { date:"Jun 23",  headline:"Vema Hydrogen drills first natural hydrogen pilot wells in Quebec — North America's earliest active onshore H₂ geological campaign", tag:"Tech",   source:"Hydrogen Fuel News",          url:"https://www.hydrogenfuelnews.com/hydrogen-production-advances-as-vema-hydrogen-begins-natural-hydrogen-drilling-in-quebec/8576295/" },
  { date:"May 19",  headline:"University of Ottawa: massive natural hydrogen reserves found beneath Northern Ontario, Quebec, Nunavut — 50%+ of Canada's rocks are prospective", tag:"Tech", source:"ScienceDaily",            url:"https://www.sciencedaily.com/releases/2026/05/260519224317.htm" },
  { date:"Jan 2026",headline:"Max Power Mining confirms Canada's first natural hydrogen drilling discovery at Lawson well, Saskatchewan — 2,278m deep", tag:"Tech",   source:"GeoExpro",                    url:"https://geoexpro.com/canadas-first-hydrogen-exploration-well/" },
  { date:"May 22",  headline:"Canada-Germany H2 shipment timeline revised to 2028 amid infrastructure delays", tag:"Export",  source:"Globe and Mail",              url:"https://www.theglobeandmail.com/business/industry-news/energy-and-resources/article-canada-germany-hydrogen/" },
  { date:"May 15",  headline:"Alberta expands $57M hydrogen innovation fund — applications open Q3 2026",      tag:"Funding", source:"Alberta Innovates",           url:"https://albertainnovates.ca/programs/hydrogen-centre-of-excellence/" },
  { date:"May 10",  headline:"Air Canada SAF procurement RFP now open — 50M L/yr, 10-year offtake framework",  tag:"Signal",  source:"Air Canada Sustainability",   url:"https://www.aircanada.com/ca/en/aco/home/about/sustainability.html" },
  { date:"May 20",  headline:"NRCan awards $42M to three BC green hydrogen projects under Clean Fuel Fund",    tag:"Policy",  source:"Natural Resources Canada",    url:"https://www.canada.ca/en/natural-resources-canada/news/2024/05/canada-invests-in-green-hydrogen.html" },
];

const GOV_AGENCIES = [
  { name:"Natural Resources Canada (NRCan)", type:"Federal",           mandate:"Energy policy, hydrogen strategy, FLCAM methodology, international partnerships", programs:["Hydrogen Strategy","Clean Fuel Fund","FLCAM"], url:"https://natural-resources.canada.ca/our-natural-resources/energy-sources-distribution/clean-fuels/hydrogen/canadas-national-hydrogen-strategy/23485" },
  { name:"NRC IRAP",                          type:"Federal R&D",       mandate:"Technology development grants for early-stage companies",                         programs:["IRAP grants","Industrial research"],           url:"https://nrc.canada.ca/en/support-technology-innovation/nrc-industrial-research-assistance-program" },
  { name:"SDTC",                              type:"Federal cleantech",  mandate:"Commercial-scale clean technology demonstration",                                 programs:["SD Tech Fund","NextGen"],                      url:"https://www.sdtc.ca/en/" },
  { name:"Alberta Innovates",                 type:"Provincial — AB",   mandate:"Research, innovation, and technology commercialisation in Alberta",               programs:["H2 Innovation Fund ($57M)","TIER"],            url:"https://albertainnovates.ca/programs/hydrogen-centre-of-excellence/" },
  { name:"CleanBC / BC Ministry of Energy",   type:"Provincial — BC",   mandate:"Clean energy transition and hydrogen industry support in BC",                     programs:["H2 Support Program","CleanBC grants"],         url:"https://www.cleanbc.gov.bc.ca/hydrogen" },
  { name:"ACOA",                              type:"Regional — ATL",    mandate:"Green hydrogen and ammonia export project development",                           programs:["Green H2 Stream ($10M)","Business Scale-up"],  url:"https://www.canada.ca/en/atlantic-canada-opportunities.html" },
];

const ESG_DATA = [
  { name:"Nel Hydrogen",    esg:81, ghg:3.5,   taxonomy:"Green", ticker:"NEL" },
  { name:"Ballard Power",   esg:72, ghg:9.6,   taxonomy:"Green", ticker:"BLDP" },
  { name:"Ekona Power",     esg:79, ghg:0.4,   taxonomy:"Green", ticker:"PRV" },
  { name:"Enbridge Gas",    esg:55, ghg:4690,  taxonomy:"Amber", ticker:"ENB" },
  { name:"Air Products",    esg:65, ghg:7300,  taxonomy:"Amber", ticker:"APD" },
  { name:"Cenovus Energy",  esg:48, ghg:9020,  taxonomy:"Amber", ticker:"CVE" },
];

const CI_DATA = [
  { name:"Natural H₂ — geological", ci:0.2,  fill:"#B45309" },
  { name:"PEM — dedicated wind",    ci:0.4,  fill:C.teal },
  { name:"ATR + CCS 97%",           ci:0.6,  fill:C.tealM },
  { name:"SMR + CCS 90%",        ci:1.8,  fill:C.amber },
  { name:"PEM — BC hydro grid",  ci:2.1,  fill:C.amberM },
  { name:"e-SAF — dedicated RE", ci:4.2,  fill:C.green },
  { name:"PEM — Alberta grid",   ci:8.4,  fill:C.coral },
  { name:"SMR no CCS",           ci:9.4,  fill:C.red },
  { name:"Bio-SAF agri residue", ci:12.4, fill:C.purple },
];

const TAXONOMY = [
  { sector:"Green H2 — electrolysis + renewable power",  cls:"Green", criteria:"CI ≤ 3 kg CO₂e/kg H₂; renewable electricity source verified" },
  { sector:"Blue H2 — SMR/ATR + CCS ≥ 90%",            cls:"Amber", criteria:"CI ≤ 4 kg CO₂e/kg H₂; capture rate and permanence verified" },
  { sector:"SAF — bio-based (eligible feedstocks)",      cls:"Green", criteria:"Lifecycle GHG reduction ≥ 65% vs jet fuel; CORSIA eligible" },
  { sector:"SAF — power-to-liquid (dedicated RE)",       cls:"Green", criteria:"Renewable electricity; lifecycle CI ≤ 5 g CO₂e/MJ" },
  { sector:"Low-carbon ammonia (green H2 feedstock)",    cls:"Green", criteria:"Green H2 verified; CI ≤ 0.5 t CO₂e/t NH₃" },
  { sector:"Grey H2 — SMR without CCS",                  cls:"Red",   criteria:"CI > 8 kg CO₂e/kg H₂; not aligned with net-zero" },
  { sector:"Natural (geological) H₂ — direct extraction",cls:"Green", criteria:"CI < 1 kg CO₂e/kg H₂ (estimated); depends on extraction method and transport" },
];

// ── HELPERS ───────────────────────────────────────────────────────────
const techColor  = t=>({"Green H2":C.teal,"Blue H2":C.blue,"Low-carbon ammonia":C.amber,"SAF":C.green,"E-fuels":C.coral,"Natural H2":"#B45309","Turquoise H2":C.purple}[t]||C.slateM);
const techBg     = t=>({"Green H2":C.tealL,"Blue H2":C.blueL,"Low-carbon ammonia":C.amberL,"SAF":C.greenL,"E-fuels":C.coralL,"Natural H2":"#FEF3C7","Turquoise H2":C.purpleL}[t]||C.bg);
const stageColor = s=>({
  "Pre-feasibility":  ["#EEF2FF","#4338CA"],
  "Feasibility":      [C.amberL, C.amber],
  "Feasibility study":[C.amberL, C.amber],
  "Development":      [C.tealL,  C.teal],
  "Construction":     ["#FFF7ED","#EA580C"],
  "FID/Construction": ["#FFF7ED","#C2410C"],
  "Operational":      ["#F0FDF4","#15803D"],
  "Procurement":      ["#F0FDF4", C.green],
  "Demo":             ["#FDF4FF","#9333EA"],
  "DEMO":             ["#FDF4FF","#9333EA"],
  "FEED":             [C.blueL,  C.blue],
  "FID":              [C.amberL, "#D97706"],
  "Concept":          ["#F0F4FF","#6366F1"],
  "Dormant":          ["#F8FAFC","#64748B"],
  "Cancelled":        ["#FEE2E2","#DC2626"],
  "Commercial validation":["#F0FDF4","#15803D"],
  "Exploration drilling":["#FEF3C7","#B45309"],
  "Exploration started": ["#FFFBEB","#D97706"],
  "Early stage":         ["#F8FAFC","#64748B"],
}[s]||[C.bg,C.slateM]);
const taxColor   = t=>({"Green":{bg:C.greenL,c:C.green},"Amber":{bg:C.amberL,c:C.amber},"Red":{bg:C.redL,c:C.red}}[t]||{bg:C.bg,c:C.slateM});
const urgColor   = u=>({"High":{bg:C.tealL,c:C.teal},"Medium":{bg:C.amberL,c:C.amber},"Low":{bg:"#F1F5F9",c:C.slateM}}[u]);

const SourceLink = ({ source, url, style = {} }) => (
  <a href={url} target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:11, color:C.blue, textDecoration:"none", fontWeight:500, marginTop:3, ...style }}
    onMouseEnter={e => e.currentTarget.style.textDecoration="underline"}
    onMouseLeave={e => e.currentTarget.style.textDecoration="none"}>
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
    {source}
  </a>
);
const Badge=({label,bg,color,size=11,style={}})=>(
  <span style={{fontSize:size,fontWeight:500,padding:"2px 8px",borderRadius:4,background:bg||C.tealL,color:color||C.teal,whiteSpace:"nowrap",display:"inline-block",...style}}>{label}</span>
);
const Card=({children,style={}})=>(
  <div style={{background:C.white,border:`0.5px solid ${C.border}`,borderRadius:12,padding:"14px 16px",...style}}>{children}</div>
);
const PanelCard=({children,style={}})=>(
  <div style={{background:C.panelBg,border:`0.5px solid ${C.border}`,borderRadius:10,padding:"12px 14px",backdropFilter:"blur(8px)",overflow:"hidden",...style}}>{children}</div>
);
const SLabel=({text})=>(
  <p style={{margin:"0 0 8px",fontSize:12,fontWeight:700,color:C.slateM,letterSpacing:"0.06em",textTransform:"uppercase"}}>{text}</p>
);
const KpiCard=({label,value,sub,color=C.teal,bg=C.tealL})=>(
  <div style={{background:bg,borderRadius:10,padding:"10px 12px",overflow:"hidden"}}>
    <p style={{margin:"0 0 2px",fontSize:10,color,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</p>
    <p style={{margin:"0 0 1px",fontSize:18,fontWeight:700,color,whiteSpace:"nowrap"}}>{value}</p>
    {sub&&<p style={{margin:0,fontSize:11,color:color+"99",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sub}</p>}
  </div>
);
const ChartTip=({active,payload,label,unit=""})=>{
  if(!active||!payload?.length) return null;
  return(
    <div style={{background:C.white,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px 12px",boxShadow:"0 4px 16px rgba(0,0,0,0.12)"}}>
      <p style={{margin:"0 0 5px",fontSize:13,fontWeight:600,color:C.slate}}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{margin:"2px 0",fontSize:12,color:p.color||C.slateM}}>
          <span style={{display:"inline-block",width:7,height:7,borderRadius:2,background:p.color,marginRight:5}}/>
          {p.name}: <strong>{typeof p.value==="number"?p.value.toFixed(2):p.value}{unit}</strong>
        </p>
      ))}
    </div>
  );
};

// ── POWER BI-STYLE CHART WRAPPERS ─────────────────────────────────────

// Rich tooltip with % change and total
const RichTooltip = ({ active, payload, label, unit = "", showTotal = false }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (Number(p.value) || 0), 0);
  return (
    <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 6px 24px rgba(0,0,0,0.14)", minWidth: 160 }}>
      <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: C.slate, borderBottom: `0.5px solid ${C.border}`, paddingBottom: 5 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3, gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
            <span style={{ fontSize: 10, color: C.slateM }}>{p.name}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: p.color }}>{typeof p.value === "number" ? p.value.toFixed(2) : p.value}{unit}</span>
        </div>
      ))}
      {showTotal && payload.length > 1 && (
        <div style={{ borderTop: `0.5px solid ${C.border}`, marginTop: 5, paddingTop: 5, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.slate }}>Total</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.slate }}>{total.toFixed(2)}{unit}</span>
        </div>
      )}
    </div>
  );
};

// Phase tooltip for investment funnel
const PhaseTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 6px 24px rgba(0,0,0,0.14)", maxWidth: 220 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: C.slate }}>{d.phase}</span>
      </div>
      <p style={{ margin: "0 0 2px", fontSize: 11, color: C.slateM }}>{d.desc}</p>
      <div style={{ marginTop: 7, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <div style={{ background: C.bg, borderRadius: 6, padding: "5px 8px" }}>
          <p style={{ margin: "0 0 1px", fontSize: 8, color: C.slateM, textTransform: "uppercase", fontWeight: 700 }}>Capital</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: d.color }}>${d.value}B</p>
        </div>
        <div style={{ background: C.bg, borderRadius: 6, padding: "5px 8px" }}>
          <p style={{ margin: "0 0 1px", fontSize: 8, color: C.slateM, textTransform: "uppercase", fontWeight: 700 }}>Projects</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: d.color }}>{d.projects}</p>
        </div>
      </div>
    </div>
  );
};

// Interactive legend with toggle
function ToggleLegend({ series, active, onToggle, style = {} }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, ...style }}>
      {series.map(s => {
        const isOn = active.includes(s.key);
        return (
          <button key={s.key} onClick={() => onToggle(s.key)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 12, border: `1px solid ${isOn ? s.color : C.border}`, background: isOn ? s.color + "18" : C.white, cursor: "pointer", fontSize: 10, color: isOn ? s.color : C.slateL, fontWeight: isOn ? 600 : 400, transition: "all 0.15s" }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: isOn ? s.color : C.slateL }} />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

// Stat chip for chart summaries
const StatChip = ({ label, value, sub, color, bg, onClick, active }) => (
  <div onClick={onClick} style={{ background: active ? color + "22" : bg || C.bg, borderRadius: 9, padding: "9px 12px", cursor: onClick ? "pointer" : "default", border: `1px solid ${active ? color : C.border}`, transition: "all 0.15s" }}>
    <p style={{ margin: "0 0 2px", fontSize: 9, color: active ? color : C.slateM, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
    <p style={{ margin: "0 0 1px", fontSize: 17, fontWeight: 700, color: active ? color : C.slate }}>{value}</p>
    {sub && <p style={{ margin: 0, fontSize: 9, color: active ? color : C.slateL }}>{sub}</p>}
  </div>
);

// ── BASE MAP COMPONENT ────────────────────────────────────────────────
function BaseMap({ children, mapRef, containerRef, onMapReady, onStyleReload, styleUrl = "mapbox://styles/mapbox/light-v11" }) {
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    let map = null;
    let initialized = false;   // true after first "load" event

    const initMap = () => {
      if (map || !containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width === 0 || height === 0) return;

      map = new mapboxgl.Map({
        container: containerRef.current,
        style: styleUrl,
        center: [-96, 60],
        zoom: 3.1,
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.on("load", () => {
        initialized = true;
        map.resize();
        mapRef.current = map;
        onMapReady && onMapReady(map);
      });

      // style.load fires on every style swap (and on initial load).
      // We only call onStyleReload after the first init so we don't
      // double-fire on startup.
      map.on("style.load", () => {
        if (initialized && onStyleReload) {
          onStyleReload();
        }
      });
    };

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      if (!map) { initMap(); }
      else if (initialized) { map.resize(); }
    });

    ro.observe(containerRef.current);
    initMap();

    return () => {
      ro.disconnect();
      if (map) { map.remove(); }
      mapRef.current = null;
    };
  }, []);

  // Style changes after init — just call setStyle; style.load will fire
  // and onStyleReload will increment styleKey in the parent view,
  // which re-runs useProjectLayer to re-add layers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(styleUrl);
  }, [styleUrl]);

  return (
    <div style={{ position:"absolute", inset:0 }}>
      <div ref={containerRef} style={{ position:"absolute", inset:0 }} />
      {children}
    </div>
  );
}

// ── ADD PROJECT MARKERS TO MAP ────────────────────────────────────────
// ── PROJECT LAYER (Mapbox GL native circles — WebGL rendered) ─────────
// Using GL circle layers instead of HTML markers because:
// - WebGL renders at exact geographic coordinates at every zoom level
// - No DOM positioning or CSS transform issues
// - Handles 100+ points efficiently with no drift or "squeezing"
// - circle-radius/color expressions drive size and styling declaratively

const NS_SRC    = "ns-projects";
const NS_LAYERS = ["ns-halo", "ns-dots", "ns-urgent"];

const GL_TECH_COLOR = ["match", ["get", "tech"],
  "Green H2",          "#0D7A6B",
  "Blue H2",           "#185FA5",
  "Low-carbon ammonia","#854F0B",
  "SAF",               "#3B6D11",
  "E-fuels",           "#993C1D",
  "Natural H2",        "#B45309",   // gold hydrogen
  "#94A3B8"
];

// Logarithmic size scale: 0 kt → 8px, 1 → 10, 10 → 13, 50 → 17, 200 → 21, 500 → 25, 1000 → 30
// Zoom-aware radius: outer interpolation by zoom level,
// inner by production capacity (kt H2/yr).
// Dots scale with zoom so they're readable at every level.
const CAP_EXPR = ["coalesce", ["get", "capKt"], 0];
const GL_RADIUS = [
  "interpolate", ["linear"], ["zoom"],
  3,  ["interpolate", ["linear"], CAP_EXPR, 0,4,  1,5,  10,6,  50,8,  200,10, 500,13, 1000,16],
  5,  ["interpolate", ["linear"], CAP_EXPR, 0,5,  1,6,  10,8,  50,10, 200,13, 500,17, 1000,21],
  7,  ["interpolate", ["linear"], CAP_EXPR, 0,6,  1,8,  10,10, 50,13, 200,17, 500,22, 1000,28],
  10, ["interpolate", ["linear"], CAP_EXPR, 0,8,  1,10, 10,13, 50,17, 200,21, 500,26, 1000,32],
];

function buildGeoJSON(projects, selectedId, highlightIds) {
  return {
    type: "FeatureCollection",
    features: projects
      .filter(p => p.lng != null && p.lat != null && !isNaN(p.lng) && !isNaN(p.lat))
      .map(p => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        properties: {
          id:       p.id,
          tech:     p.tech,
          capKt:    (p.cap_kt != null && p.cap_kt > 0) ? p.cap_kt : 0,
          selected: p.id === selectedId,
          dim:      highlightIds !== null && !highlightIds.includes(p.id),
          urgent:   !!(p.urgent),
        }
      }))
  };
}

function useProjectLayer(mapRef, mapReady, projects, selectedId, onSelect, highlightIds = null, styleKey = 0) {
  const onSelectRef   = useRef(onSelect);
  const selectedIdRef = useRef(selectedId);
  const projectsRef   = useRef(projects);
  useEffect(() => { onSelectRef.current   = onSelect;   }, [onSelect]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { projectsRef.current   = projects;   }, [projects]);

  // ── Setup GL layers once after map loads ────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const geojson = buildGeoJSON(projects, selectedId, highlightIds);

    // Remove any stale layers/source from a previous mount before re-adding
    NS_LAYERS.forEach(id => { try { if (map.getLayer(id)) map.removeLayer(id); } catch {} });
    try { if (map.getSource(NS_SRC)) map.removeSource(NS_SRC); } catch {}

    map.addSource(NS_SRC, { type: "geojson", data: geojson, generateId: false });

    // 1. Selection halo ring
    map.addLayer({
      id: "ns-halo", type: "circle", source: NS_SRC,
      filter: ["==", ["get", "selected"], true],
      paint: {
        "circle-radius":                   ["+", GL_RADIUS, 6],
        "circle-color":                    "rgba(0,0,0,0)",
        "circle-stroke-color":             GL_TECH_COLOR,
        "circle-stroke-width":             3,

      }
    });

    // 2. Main project dots — viewport alignment so size stays consistent on zoom
    // Red = cancelled, grey = dormant, tech colour otherwise
    map.addLayer({
      id: "ns-dots", type: "circle", source: NS_SRC,
      paint: {
        "circle-radius":                  GL_RADIUS,
        "circle-color": ["case",
          ["==", ["get","cancelled"], true], "#EF4444",
          ["==", ["get","dormant"],   true], "#94A3B8",
          GL_TECH_COLOR],
        "circle-stroke-color":            "#ffffff",
        "circle-stroke-width":            ["case", ["get", "selected"], 3, 1.5],
        "circle-opacity":                 ["case", ["get", "dim"], 0.18, 0.92],
        "circle-stroke-opacity":          ["case", ["get", "dim"], 0.18, 1],

      }
    });

    // 3. Urgent amber dot
    map.addLayer({
      id: "ns-urgent", type: "circle", source: NS_SRC,
      filter: ["all", ["==", ["get", "urgent"], true], ["!", ["get", "dim"]]],
      paint: {
        "circle-radius":                  4,
        "circle-color":                   "#EF9F27",
        "circle-stroke-color":            "#ffffff",
        "circle-stroke-width":            1.5,
        "circle-translate":               [8, -8],
      }
    });

    // ── Click handler (uses ref so it's never stale) ──────────────────
    const handleClick = (e) => {
      if (!e.features?.length) return;
      const clickedId = e.features[0].properties.id;
      const project   = projectsRef.current.find(p => p.id === clickedId);
      if (project) {
        onSelectRef.current(selectedIdRef.current === clickedId ? null : project);
      }
    };
    const handleEnter = () => { map.getCanvas().style.cursor = "pointer"; };
    const handleLeave = () => { map.getCanvas().style.cursor = ""; };

    map.on("click",      "ns-dots", handleClick);
    map.on("mouseenter", "ns-dots", handleEnter);
    map.on("mouseleave", "ns-dots", handleLeave);

    return () => {
      try { map.off("click",      "ns-dots", handleClick); } catch {}
      try { map.off("mouseenter", "ns-dots", handleEnter); } catch {}
      try { map.off("mouseleave", "ns-dots", handleLeave); } catch {}
      NS_LAYERS.forEach(id => { try { if (map.getLayer(id)) map.removeLayer(id); } catch {} });
      try { if (map.getSource(NS_SRC)) map.removeSource(NS_SRC); } catch {}
    };
  }, [mapReady, styleKey]); // Re-run after style reload to restore layers

  // ── Update GeoJSON data whenever selection / highlight changes ──────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    try {
      const src = map.getSource(NS_SRC);
      if (src) src.setData(buildGeoJSON(projects, selectedId, highlightIds));
    } catch {}
  }, [mapReady, selectedId, JSON.stringify(highlightIds)]);
}

// ── MAP LEGEND ────────────────────────────────────────────────────────
function MapLegend({ items, style = {} }) {
  return (
    <div style={{ position:"absolute", bottom:36, left:12, zIndex:10, display:"flex", flexDirection:"column", gap:6, pointerEvents:"none", ...style }}>
      <div style={{ background:"rgba(255,255,255,0.95)", borderRadius:8, padding:"8px 12px", boxShadow:"0 2px 10px rgba(0,0,0,0.12)" }}>
        <p style={{ margin:"0 0 5px", fontSize:10, fontWeight:700, color:C.slateM, textTransform:"uppercase", letterSpacing:"0.04em" }}>Technology</p>
        {items.map(([label, color]) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:color }} />
            <span style={{ fontSize:11, color:C.slateM }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ background:"rgba(255,255,255,0.95)", borderRadius:8, padding:"8px 12px", boxShadow:"0 2px 10px rgba(0,0,0,0.12)" }}>
        <p style={{ margin:"0 0 6px", fontSize:10, fontWeight:700, color:C.slateM, textTransform:"uppercase", letterSpacing:"0.04em" }}>Dot size = production capacity</p>
        {[[10,"< 1 kt H₂/yr"],[16,"~10 kt H₂/yr"],[22,"~100 kt H₂/yr"],[30,"~1,000 kt H₂/yr"]].map(([sz, label]) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
            <div style={{ width:sz, height:sz, borderRadius:"50%", background:"#94A3B8", border:"1.5px solid white", flexShrink:0 }} />
            <span style={{ fontSize:10, color:C.slateM }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PROJECT DETAIL PANEL ──────────────────────────────────────────────
function buildValueChain(project) {
  // Map project data to a value chain diagram
  const tech = project.tech || "";
  const energy = project.energySource || (
    tech === "Green H2" || tech === "Low-carbon ammonia" || tech === "SAF" || tech === "E-fuels"
      ? "Renewable energy (wind / hydro / solar)"
      : tech === "Blue H2" ? "Natural gas" 
      : tech === "Natural H2" ? "Geological formation (Precambrian rocks / ophiolites)"
      : "Various"
  );
  const production = tech === "Blue H2" ? "SMR / ATR + Carbon Capture (CCUS)"
    : tech === "Green H2" ? "Water electrolysis (PEM / ALK)"
    : tech === "Low-carbon ammonia" ? "Electrolysis → Haber-Bosch synthesis"
    : tech === "SAF" ? "Power-to-liquid (H2 + CO₂ → SAF)"
    : tech === "E-fuels" ? "Power-to-liquid (H2 + CO₂ → e-fuel)"
    : tech === "Natural H2" ? "Geological H₂ extraction / stimulated serpentinisation"
    : "Hydrogen production";

  const endUse = tech === "Natural H2"
    ? (project.stage === "Exploration drilling" || project.stage === "Exploration started"
       ? "Pre-commercial — exploration and resource assessment"
       : "Early stage — no end-use confirmed")
    : project.gaps?.length
    ? project.gaps.includes("Offtake agreement") ? "Offtake TBD — seeking buyer"
      : "Industrial / export"
    : project.stage === "Operational" ? "Industrial / grid supply" : "Under development";

  return [
    { step:1, label:"Energy source",    value:energy,                 color:C.green    },
    { step:2, label:"Production method",value:production,             color:C.teal     },
    { step:3, label:"H₂ type",          value:tech,                   color:techColor(tech) },
    { step:4, label:"Storage / export", value:tech.includes("ammonia") ? "NH₃ liquefaction + export" : "Compression / liquefaction", color:C.blue },
    { step:5, label:"End use",          value:endUse,                 color:C.amber    },
  ];
}

function ProjectPanel({ project, onClose }) {
  if (!project) return null;
  const [sb, sc] = stageColor(project.stage);
  const [activeTab, setActiveTab] = useState("overview");

  // Find full OEM records for this project
  const oemRecords = OEMS.filter(o => (project.oems || []).includes(o.name));
  const valueChain = buildValueChain(project);

  return (
    <div style={{ position:"absolute", top:12, right:12, width:300, zIndex:20, animation:"slideIn 0.2s ease", maxHeight:"calc(100vh - 80px)", display:"flex", flexDirection:"column" }}>
      <PanelCard style={{ padding:0, overflow:"hidden", display:"flex", flexDirection:"column" }}>

        {/* Header */}
        <div style={{ padding:"12px 14px 10px", borderBottom:`0.5px solid ${C.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap", flex:1 }}>
              <Badge label={project.province} bg="#F1F5F9" color={C.slateM} />
              <Badge label={project.tech} bg={techBg(project.tech)} color={techColor(project.tech)} />
              <span style={{ fontSize:12, padding:"2px 7px", borderRadius:4, background:sb, color:sc }}>{project.stage}</span>
              {project.urgent && <span style={{ fontSize:11, fontWeight:700, padding:"2px 6px", borderRadius:3, background:C.teal, color:C.white }}>ACTIVE</span>}
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", fontSize:16, cursor:"pointer", color:C.slateM, marginLeft:6, flexShrink:0 }}>✕</button>
          </div>
          <p style={{ margin:"0 0 4px", fontSize:15, fontWeight:700, color:C.slate, lineHeight:1.4 }}>{project.name}</p>
          <p style={{ margin:0, fontSize:13, color:C.slateM, lineHeight:1.5 }}>{project.desc}</p>
        </div>

        {/* Tab bar */}
        <div style={{ display:"flex", borderBottom:`0.5px solid ${C.border}`, flexShrink:0 }}>
          {[["overview","Overview"],["details","Details"],["valuechain","Value chain"]].map(([id,label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{ flex:1, padding:"7px 4px", border:"none", borderBottom:activeTab===id?`2px solid ${C.teal}`:"2px solid transparent", background:"none", cursor:"pointer", fontSize:12, fontWeight:activeTab===id?700:400, color:activeTab===id?C.teal:C.slateM, whiteSpace:"nowrap" }}>{label}</button>
          ))}
        </div>

        {/* Scrollable body */}
        <div style={{ overflow:"auto", padding:"10px 14px 14px", flex:1 }}>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (<>
          {/* Key stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:12 }}>
            <div style={{ background:C.tealL, borderRadius:7, padding:"7px 9px" }}>
              <p style={{ margin:"0 0 1px", fontSize:10, color:C.teal, fontWeight:700, textTransform:"uppercase" }}>Capacity</p>
              <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.teal }}>{project.cap_kt != null ? `${project.cap_kt < 1 ? project.cap_kt.toFixed(2) : Math.round(project.cap_kt)} kt H₂/yr` : project.value ? `$${project.value}M` : "—"}</p>
            </div>
            <div style={{ background:C.blueL, borderRadius:7, padding:"7px 9px" }}>
              <p style={{ margin:"0 0 1px", fontSize:10, color:C.blue, fontWeight:700, textTransform:"uppercase" }}>Province</p>
              <p style={{ margin:0, fontSize:14, fontWeight:700, color:C.blue }}>{project.province}</p>
            </div>
            <div style={{ background:"#EEF2FF", borderRadius:7, padding:"7px 9px" }}>
              <p style={{ margin:"0 0 1px", fontSize:10, color:"#4338CA", fontWeight:700, textTransform:"uppercase" }}>Gaps</p>
              <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#4338CA" }}>{(project.gaps||[]).length || "—"}</p>
            </div>
          </div>

          {/* Stakeholder gaps */}
          {(project.gaps||[]).length > 0 && (
            <div style={{ marginBottom:12 }}>
              <p style={{ margin:"0 0 6px", fontSize:12, fontWeight:700, color:C.amber, textTransform:"uppercase", letterSpacing:"0.04em" }}>Stakeholder gaps — looking for</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {(project.gaps||[]).map(g => <span key={g} style={{ fontSize:12, padding:"4px 10px", borderRadius:6, background:C.amberL, color:C.amber, border:`0.5px solid ${C.amberM}`, fontWeight:500 }}>{g}</span>)}
              </div>
            </div>
          )}

          {/* Technology partners */}
          {oemRecords.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <p style={{ margin:"0 0 6px", fontSize:12, fontWeight:700, color:C.blue, textTransform:"uppercase", letterSpacing:"0.04em" }}>Technology partners</p>
              <div style={{ display:"grid", gap:5 }}>
                {oemRecords.map(o => (
                  <a key={o.id} href={o.url} target="_blank" rel="noreferrer"
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:7, background:C.blueL, textDecoration:"none" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#D0E8FA"}
                    onMouseLeave={e=>e.currentTarget.style.background=C.blueL}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:"0 0 1px", fontSize:13, fontWeight:600, color:C.blue }}>{o.name}</p>
                      <p style={{ margin:0, fontSize:11, color:C.slateM, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.type} · {o.hq}</p>
                    </div>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.blueM} strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                ))}
              </div>
            </div>
          )}
          <button style={{ width:"100%", padding:"10px 0", background:C.teal, color:C.white, border:"none", borderRadius:8, fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:6 }}>Express Interest</button>
          <SourceLink source={project.source} url={project.url} style={{ display:"flex", justifyContent:"center" }} />
          </>)}

          {/* ── DETAILS TAB ── */}
          {activeTab === "details" && (<>
          {[
            ["Investment",          project.investment,         "$",   C.teal  ],
            ["Energy source",       project.energySource,       "",    C.green ],
            ["Ownership",           project.ownership,          "",    C.blue  ],
            ["Production cost",     project.productionCost,     "",    C.amber ],
            ["Operational emissions",project.operationalEmissions,"",  "#166534"],
            ["Capacity",            project.cap_kt != null ? `${project.cap_kt < 1 ? project.cap_kt.toFixed(2) : Math.round(project.cap_kt)} kt H₂/yr` : "—", "", C.teal],
            ["Technology",          project.tech,               "",    techColor(project.tech)],
            ["Province",            project.province,           "",    C.slateM],
            ["Stage",               project.stage,              "",    C.slateM],
            ["Coordinates",         project.lat ? `${project.lat.toFixed(4)}°N, ${Math.abs(project.lng).toFixed(4)}°W` : "—", "", C.slateM],
          ].map(([label, value, prefix, color]) => value && value !== "—" ? (
            <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"7px 0", borderBottom:`0.5px solid ${C.border}` }}>
              <span style={{ fontSize:12, color:C.slateM, fontWeight:500, flexShrink:0, marginRight:8 }}>{label}</span>
              <span style={{ fontSize:12, fontWeight:600, color, textAlign:"right" }}>{prefix}{value}</span>
            </div>
          ) : null)}
          {project.iea && (
            <div style={{ marginTop:10, background:"#EEF2FF", borderRadius:7, padding:"7px 10px", display:"flex", alignItems:"center", gap:7 }}>
              <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4, background:"#4338CA", color:"#fff" }}>IEA</span>
              <p style={{ margin:0, fontSize:11, color:C.slateM }}>IEA Global Hydrogen Production Projects Database, Sep 2025</p>
            </div>
          )}
          <div style={{ marginTop:10 }}>
            <SourceLink source={project.source} url={project.url} style={{ display:"flex" }} />
          </div>
          </>)}

          {/* ── VALUE CHAIN TAB ── */}
          {activeTab === "valuechain" && (<>
          <p style={{ margin:"0 0 12px", fontSize:12, color:C.slateM }}>Hydrogen value chain pathway for this project:</p>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {valueChain.map((step, i) => (
              <div key={step.step} style={{ display:"flex", alignItems:"stretch" }}>
                <div style={{ width:3, background:step.color, flexShrink:0, borderRadius: i===0?"3px 3px 0 0": i===valueChain.length-1?"0 0 3px 3px":"0" }}/>
                <div style={{ flex:1, padding:"10px 12px", background:i%2===0?C.bg:C.white, borderRadius:6, margin:"2px 0 2px 6px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:22, height:22, borderRadius:"50%", background:step.color+"22", border:`2px solid ${step.color}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:step.color }}>{step.step}</span>
                    </div>
                    <div>
                      <p style={{ margin:"0 0 1px", fontSize:10, color:step.color, fontWeight:700, textTransform:"uppercase" }}>{step.label}</p>
                      <p style={{ margin:0, fontSize:12, color:C.slate, fontWeight:500 }}>{step.value}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ecosystem stakeholders */}
          {(project.gaps||[]).length > 0 && (
            <div style={{ marginTop:12 }}>
              <p style={{ margin:"0 0 8px", fontSize:12, fontWeight:700, color:C.amber, textTransform:"uppercase" }}>Partners being sought</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {(project.gaps||[]).map(g => <span key={g} style={{ fontSize:12, padding:"4px 10px", borderRadius:6, background:C.amberL, color:C.amber, fontWeight:500 }}>{g}</span>)}
              </div>
            </div>
          )}
          {oemRecords.length > 0 && (
            <div style={{ marginTop:12 }}>
              <p style={{ margin:"0 0 8px", fontSize:12, fontWeight:700, color:C.blue, textTransform:"uppercase" }}>Confirmed ecosystem participants</p>
              {oemRecords.map(o => (
                <a key={o.id} href={o.url} target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", borderRadius:7, background:C.blueL, textDecoration:"none", marginBottom:5 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:o.color }}/>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:"0 0 1px", fontSize:12, fontWeight:600, color:C.blue }}>{o.name}</p>
                    <p style={{ margin:0, fontSize:10, color:C.slateM }}>{o.type} · {o.hq}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
          </>)}
        </div>
      </PanelCard>
    </div>
  );
}

// ── OEM DETAIL PANEL ──────────────────────────────────────────────────
function OEMPanel({ oem, onClose }) {
  if (!oem) return null;
  const oemProjects = PROJECTS.filter(p => oem.projects.includes(p.id));
  return (
    <div style={{ position:"absolute", top:12, right:12, width:360, zIndex:20 }}>
      <PanelCard>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, minWidth:0 }}>
              <div style={{ width:10, height:10, borderRadius:3, background:oem.color, flexShrink:0 }} />
              <a href={oem.url} target="_blank" rel="noreferrer" style={{ margin:0, fontSize:13, fontWeight:700, color:C.slate, textDecoration:"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}
                onMouseEnter={e=>e.currentTarget.style.color=C.blue}
                onMouseLeave={e=>e.currentTarget.style.color=C.slate}>
                {oem.name} ↗
              </a>
              {oem.verified && <span style={{ fontSize:10, fontWeight:700, padding:"1px 5px", borderRadius:3, background:C.tealL, color:C.teal, flexShrink:0 }}>✓</span>}
            </div>
            <p style={{ margin:0, fontSize:12, color:C.slateM, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{oem.hq} · {oem.region}</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:16, cursor:"pointer", color:C.slateM }}>✕</button>
        </div>
        <Badge label={oem.type} bg={C.tealL} color={C.teal} style={{ marginBottom:8 }} />
        <p style={{ margin:"8px 0 10px", fontSize:13, color:C.slateM, lineHeight:1.5 }}>{oem.desc}</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:12 }}>
          {oem.products.map(p => (
            <span key={p} style={{ fontSize:11, padding:"2px 7px", borderRadius:4, background:"#F1F5F9", color:C.slateM, wordBreak:"break-word", maxWidth:"100%" }}>{p}</span>
          ))}
        </div>
        <p style={{ margin:"0 0 6px", fontSize:12, fontWeight:700, color:C.blue, textTransform:"uppercase", letterSpacing:"0.04em" }}>Projects on map ({oemProjects.length})</p>
        <div style={{ display:"grid", gap:5 }}>
          {oemProjects.map(p => {
            const [sb, sc] = stageColor(p.stage);
            return (
              <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 8px", background:C.bg, borderRadius:6 }}>
                <span style={{ fontSize:13, color:C.slate, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginRight:6 }}>{p.name}</span>
                <span style={{ fontSize:11, padding:"2px 7px", borderRadius:4, background:sb, color:sc, flexShrink:0, whiteSpace:"nowrap", fontWeight:600 }}>{p.stage}</span>
              </div>
            );
          })}
        </div>
      </PanelCard>
    </div>
  );
}

// ── FLOATING CHART PANEL ──────────────────────────────────────────────
function FloatingChart({ title, children, style = {} }) {
  return (
    <div style={{ position:"absolute", zIndex:10, ...style }}>
      <PanelCard style={{ padding:"10px 12px", overflow:"hidden" }}>
        <p style={{ margin:"0 0 10px", fontSize:13, fontWeight:700, color:C.slateM, textTransform:"uppercase", letterSpacing:"0.04em", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{title}</p>
        {children}
      </PanelCard>
    </div>
  );
}

// ── VIEW: OVERVIEW (intelligence dashboard) ─────────────────────────
function OverviewView({ mapStyle, setMapStyle }) {
  const [search,    setSearch]    = useState("");
  const [techTab,   setTechTab]   = useState("All");
  const [typeTab,   setTypeTab]   = useState("All");
  const [sortCol,   setSortCol]   = useState("name");
  const [sortAsc,   setSortAsc]   = useState(true);

  // All projects including infrastructure
  const allProjects = [
    ...PROJECTS.map(p => ({ ...p, projType:"Production" })),
    ...INFRA_PROJECTS.map(p => ({ ...p, projType:"Infrastructure" })),
  ];
  const naturalH2Count = allProjects.filter(p => p.tech === "Natural H2").length;

  const filtered = allProjects.filter(p =>
    (techTab === "All" || p.tech === techTab) &&
    (typeTab === "All" || p.projType === typeTab) &&
    (search === "" || p.name.toLowerCase().includes(search.toLowerCase()) ||
     (p.province || "").toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => {
    let va = a[sortCol] ?? ""; let vb = b[sortCol] ?? "";
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    return sortAsc ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
  });

  const SortTh = ({ col, label, align="left" }) => (
    <th onClick={() => { if (sortCol===col) setSortAsc(a=>!a); else { setSortCol(col); setSortAsc(true); } }}
      style={{ padding:"8px 10px", fontSize:11, fontWeight:700, color:C.slateM, textTransform:"uppercase", letterSpacing:"0.04em", textAlign:align, whiteSpace:"nowrap", cursor:"pointer", userSelect:"none", background:C.bg, borderBottom:`1.5px solid ${C.border}`, position:"sticky", top:0, zIndex:1 }}>
      {label} {sortCol===col ? (sortAsc ? "↑" : "↓") : ""}
    </th>
  );

  const capFmt = p => p.cap_kt != null && p.cap_kt > 0
    ? (p.cap_kt < 1 ? `${p.cap_kt.toFixed(2)} kt/yr` : `${Math.round(p.cap_kt)} kt/yr`)
    : p.tech === "Natural H2" ? "Exploration" : "—";

  return (
    <div style={{ height:"100%", overflow:"auto", background:C.bg }}>
      <div style={{ maxWidth:1360, margin:"0 auto", padding:"18px 22px" }}>

        {/* ── KPI Strip ─────────────────────────────────────────────── */}
        <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
          {[
            { label:"Active pipeline",      value:"$50.6B",   sub:`${allProjects.length} projects tracked`, color:C.teal,    bg:C.tealL   },
            { label:"Federal ITC to 2035",  value:"$17.7B",   sub:"Clean H2 ITC",                          color:C.blue,    bg:C.blueL   },
            { label:"Active signals",        value:"12",       sub:"May 2026",                              color:C.amber,   bg:C.amberL  },
            { label:"Natural H₂ projects",  value:String(naturalH2Count), sub:"IEA Jun 2026 geological DB",color:"#B45309", bg:"#FEF3C7" },
            { label:"Canada H2 CAGR",       value:"+69.6%",   sub:"2021–23 (CHA 2024)",                   color:C.green,   bg:"#F0FDF4" },
          ].map(k => (
            <div key={k.label} style={{ flex:"1 1 160px", background:k.bg, borderRadius:10, padding:"10px 14px", border:`0.5px solid ${k.color}22` }}>
              <p style={{ margin:"0 0 2px", fontSize:10, fontWeight:700, color:k.color, textTransform:"uppercase", letterSpacing:"0.05em", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{k.label}</p>
              <p style={{ margin:"0 0 1px", fontSize:20, fontWeight:700, color:k.color }}>{k.value}</p>
              <p style={{ margin:0, fontSize:11, color:k.color+"99", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{k.sub}</p>
            </div>
          ))}
          {/* Map style switcher */}
          <div style={{ display:"flex", alignItems:"center", gap:8, background:C.white, borderRadius:10, padding:"10px 14px", border:`0.5px solid ${C.border}`, flexShrink:0 }}>
            <span style={{ fontSize:10, fontWeight:700, color:C.slateM, textTransform:"uppercase", whiteSpace:"nowrap" }}>Map view</span>
            <select value={mapStyle} onChange={e => setMapStyle(e.target.value)} style={{...ddStyle(C.teal), fontSize:11, minWidth:140}}>
              <option value="2d">🗺️ 2D flat</option>
              <option value="globe">🌐 Globe</option>
              <option value="satellite">🛰️ Satellite</option>
            </select>
          </div>
        </div>

        {/* ── Projects Tracked Table ────────────────────────────────── */}
        <div style={{ background:C.white, borderRadius:12, boxShadow:"0 1px 8px rgba(0,0,0,0.06)", border:`0.5px solid ${C.border}`, marginBottom:16, overflow:"hidden" }}>
          {/* Table header toolbar */}
          <div style={{ padding:"12px 14px", borderBottom:`0.5px solid ${C.border}`, display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            <div>
              <p style={{ margin:"0 0 1px", fontSize:13, fontWeight:700, color:C.slate }}>
                Projects tracked — IEA June 2026
                <span style={{ marginLeft:8, fontSize:12, fontWeight:400, color:C.slateM }}>({filtered.length} of {allProjects.length} shown)</span>
              </p>
              <p style={{ margin:0, fontSize:11, color:C.slateM }}>Source: IEA Hydrogen Production & Infrastructure Projects Database, June 2026 · NRCan Geological H₂ Database</p>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", gap:8, flexWrap:"wrap" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / province…"
                style={{ padding:"5px 10px", borderRadius:7, border:`0.5px solid ${C.border}`, fontSize:12, color:C.slate, background:C.bg, width:180, outline:"none", fontFamily:"inherit" }} />
              <select value={typeTab} onChange={e => setTypeTab(e.target.value)} style={{...ddStyle(C.blue), fontSize:11}}>
                <option value="All">All types</option>
                <option value="Production">Production</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
              <select value={techTab} onChange={e => setTechTab(e.target.value)} style={{...ddStyle(C.teal), fontSize:11}}>
                <option value="All">All technologies</option>
                {["Green H2","Blue H2","Natural H2","Low-carbon ammonia","SAF","E-fuels"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {/* Scrollable table */}
          <div style={{ overflow:"auto", maxHeight:360 }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  <SortTh col="name"     label="Project name" />
                  <SortTh col="province" label="Province" align="center" />
                  <SortTh col="projType" label="Type" />
                  <SortTh col="tech"     label="Technology" />
                  <SortTh col="cap_kt"   label="Scale" align="right" />
                  <SortTh col="stage"    label="Stage" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const [sb, sc] = stageColor(p.stage);
                  const tc = techColor(p.tech);
                  return (
                    <tr key={p.id} style={{ background: i%2===0 ? C.white : C.bg, borderBottom:`0.5px solid ${C.border}44` }}>
                      <td style={{ padding:"6px 10px", fontSize:12, color:C.slate, maxWidth:260, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={p.name}>{p.name}</td>
                      <td style={{ padding:"6px 10px", fontSize:12, color:C.slateM, textAlign:"center", fontWeight:600 }}>{p.province}</td>
                      <td style={{ padding:"6px 10px", fontSize:11 }}>
                        <span style={{ padding:"2px 6px", borderRadius:4, background: p.projType==="Infrastructure" ? C.blueL : p.tech==="Natural H2" ? "#FEF3C7" : C.tealL, color: p.projType==="Infrastructure" ? C.blue : p.tech==="Natural H2" ? "#B45309" : C.teal, fontWeight:600 }}>{p.projType}</span>
                      </td>
                      <td style={{ padding:"6px 10px" }}>
                        <span style={{ fontSize:11, padding:"2px 6px", borderRadius:4, background:techBg(p.tech), color:tc, fontWeight:600, whiteSpace:"nowrap" }}>{p.tech}</span>
                      </td>
                      <td style={{ padding:"6px 10px", fontSize:12, color:C.slateM, textAlign:"right", whiteSpace:"nowrap" }}>{capFmt(p)}</td>
                      <td style={{ padding:"6px 10px" }}>
                        <span style={{ fontSize:11, padding:"2px 7px", borderRadius:4, background:sb, color:sc, fontWeight:600, whiteSpace:"nowrap" }}>{p.stage}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Chart Row: Market Potential + Demand Forecast ─────────── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>

          {/* Canada H2 Market Potential */}
          <div style={{ background:C.white, borderRadius:12, padding:"14px 16px", boxShadow:"0 1px 8px rgba(0,0,0,0.06)", border:`0.5px solid ${C.border}` }}>
            <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:C.slate }}>Canada H₂ market potential ($B CAD/yr)</p>
            <p style={{ margin:"0 0 10px", fontSize:11, color:C.slateM }}>Source: NRCan H₂ Strategy Progress Report 2024 (>$50B by 2050) · IEA WEO 2024</p>
            <div style={{ display:"flex", gap:12, marginBottom:8 }}>
              {[["steps","STEPS","#94A3B8"],["aps","APS","#3B82F6"],["nze","NZE","#16A34A"]].map(([k,l,c]) => (
                <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:20, height:2.5, background:c }} />
                  <span style={{ fontSize:10, color:C.slateM, fontWeight:600 }}>{l}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={270}>
              <LineChart data={CA_MARKET_SCENARIOS} margin={{ top:4, right:10, left:-10, bottom:20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                <XAxis dataKey="year" tick={{ fontSize:12, fill:C.slateL }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:12, fill:C.slateL }} axisLine={false} tickLine={false}
                  label={{ value:"$B CAD/yr", angle:-90, position:"insideLeft", offset:16, fontSize:10, fill:C.slateL }}/>
                <Tooltip content={<RichTooltip unit="$B CAD" showTotal={false} />}/>
                <Line type="monotone" dataKey="steps" name="Stated Policies (STEPS)" stroke="#94A3B8" strokeWidth={2} dot={{r:3}} strokeDasharray="5 3"/>
                <Line type="monotone" dataKey="aps"   name="Announced Pledges (APS)" stroke="#3B82F6" strokeWidth={2.5} dot={{r:3}}/>
                <Line type="monotone" dataKey="nze"   name="Net Zero (NZE)"           stroke="#16A34A" strokeWidth={2.5} dot={{r:3}} strokeDasharray="3 2"/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* H2 & Derivatives Demand Forecast */}
          <div style={{ background:C.white, borderRadius:12, padding:"14px 16px", boxShadow:"0 1px 8px rgba(0,0,0,0.06)", border:`0.5px solid ${C.border}` }}>
            <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:C.slate }}>H₂ & derivatives demand forecast (Mt H₂-eq/yr)</p>
            <p style={{ margin:"0 0 10px", fontSize:11, color:C.slateM }}>Source: IEA Global Hydrogen Review 2025 (Canadian end-use extrapolation)</p>
            <div style={{ display:"flex", gap:12, marginBottom:8 }}>
              {[["steps","STEPS","#94A3B8"],["aps","APS","#3B82F6"],["nze","NZE","#16A34A"]].map(([k,l,c]) => (
                <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:20, height:2.5, background:c, borderRadius:1 }} />
                  <span style={{ fontSize:10, color:C.slateM, fontWeight:600 }}>{l}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={270}>
              <LineChart data={H2_DEMAND_SCENARIOS} margin={{ top:4, right:10, left:-10, bottom:20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                <XAxis dataKey="year" tick={{ fontSize:12, fill:C.slateL }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:12, fill:C.slateL }} axisLine={false} tickLine={false}
                  label={{ value:"Mt H₂-eq/yr", angle:-90, position:"insideLeft", offset:16, fontSize:10, fill:C.slateL }}/>
                <Tooltip content={<RichTooltip unit=" Mt H₂-eq/yr" showTotal={false} />}/>
                <Line type="monotone" dataKey="steps" name="Stated Policies (STEPS)" stroke="#94A3B8" strokeWidth={2} dot={{r:3}} strokeDasharray="5 3"/>
                <Line type="monotone" dataKey="aps"   name="Announced Pledges (APS)" stroke="#3B82F6" strokeWidth={2.5} dot={{r:3}}/>
                <Line type="monotone" dataKey="nze"   name="Net Zero (NZE)"           stroke="#16A34A" strokeWidth={2.5} dot={{r:3}} strokeDasharray="3 2"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Historical Investment by Phase ────────────────────────── */}
        <div style={{ background:C.white, borderRadius:12, padding:"14px 16px", boxShadow:"0 1px 8px rgba(0,0,0,0.06)", border:`0.5px solid ${C.border}` }}>
          <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:C.slate }}>Historical Canadian H₂ investment pipeline ($B CAD — cumulative announced by stage)</p>
          <p style={{ margin:"0 0 10px", fontSize:11, color:C.slateM }}>
            Boom 2022–23 driven by large export projects (Nujio'qonik, Burin Peninsula, Bear Head). Pipeline rationalized 2024–26 following project cancellations and dormancy. Source: IEA Production & Infrastructure DB June 2026
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={HISTORICAL_INVEST_PHASE} margin={{ top:4, right:10, left:-8, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
              <XAxis dataKey="year" tick={{ fontSize:12, fill:C.slateL }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:12, fill:C.slateL }} axisLine={false} tickLine={false}
                label={{ value:"$B CAD", angle:-90, position:"insideLeft", offset:16, fontSize:10, fill:C.slateL }}/>
              <Tooltip content={<RichTooltip unit="$B" showTotal />}/>
              <Legend wrapperStyle={{ fontSize:11, paddingTop:4 }}/>
              <Bar dataKey="operational"  name="Operational"     fill="#16A34A" stackId="a"/>
              <Bar dataKey="fid"          name="FID/Construction" fill={C.amber}  stackId="a"/>
              <Bar dataKey="feed"         name="FEED"            fill={C.blue}   stackId="a"/>
              <Bar dataKey="feasibility"  name="Feasibility"     fill={C.blueM}  stackId="a"/>
              <Bar dataKey="announced"    name="Announced"       fill="#CBD5E1"  stackId="a" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}


// ── VIEW: PROJECT MAP ─────────────────────────────────────────────────
function ProjectMapView({ styleUrl }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [techFilter, setTechFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [provinceFilter, setProvinceFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedProject, setSelectedProject] = useState(null);
  const [styleKey, setStyleKey] = useState(0);

  const techs = ["All", "Green H2", "Blue H2", "Low-carbon ammonia", "SAF", "E-fuels", "Natural H2"];
  const stages = ["All", "Pre-feasibility", "Feasibility", "Development", "FID/Construction", "Construction", "Operational", "Demo", "Dormant", "Cancelled", "Concept", "Exploration drilling", "Exploration started", "Early stage"];

  // Combine production + infrastructure based on type filter
  const ALL_PROJECTS = typeFilter === "infrastructure"
    ? INFRA_PROJECTS
    : typeFilter === "production"
      ? PROJECTS
      : [...PROJECTS, ...INFRA_PROJECTS];

  // Hide cancelled projects from map by default
  const [showCancelled, setShowCancelled] = useState(false);

  const filtered = ALL_PROJECTS.filter(p =>
    (showCancelled || (p.stage !== "Cancelled")) &&
    (techFilter === "All" || p.tech === techFilter) &&
    (stageFilter === "All" || p.stage === stageFilter) &&
    (provinceFilter === "All" || p.province === provinceFilter)
  );
  // When a project is selected from the list, highlight ONLY that project
  const filteredIds = selectedProject
    ? [selectedProject.id]
    : filtered.map(p => p.id);
  
  // Province counts always computed from tech+stage filtered set (before province filter)
  // so the strip always shows all province options even when one is selected
  const allTechStageFiltered = ALL_PROJECTS.filter(p =>
    (techFilter === "All" || p.tech === techFilter) &&
    (stageFilter === "All" || p.stage === stageFilter)
  );
  const provinceCounts = Object.entries(
    allTechStageFiltered.reduce((acc, p) => { acc[p.province] = (acc[p.province]||0)+1; return acc; }, {})
  ).sort((a,b) => b[1]-a[1]);

  useProjectLayer(mapRef, mapReady, ALL_PROJECTS, selectedProject?.id, setSelectedProject, filteredIds, styleKey);

  return (
    <div style={{ position:"absolute", inset:0 }}>
      <BaseMap mapRef={mapRef} containerRef={containerRef} onMapReady={() => setMapReady(true)}
        onStyleReload={() => setStyleKey(k => k + 1)} styleUrl={styleUrl} />

      {/* Filter panel — top left */}
      <div style={{ position:"absolute", top:12, left:12, zIndex:10, width:240 }}>
        <PanelCard>
          <div style={{ display:"grid", gap:8 }}>
            <div>
              <SLabel text="Project type" />
              <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setSelectedProject(null); }} style={ddStyle("#7C3AED")}>
                <option value="All">All projects</option>
                <option value="production">Production</option>
                <option value="infrastructure">Infrastructure</option>
              </select>
            </div>
            <div>
              <SLabel text="Technology" />
              <select value={techFilter} onChange={e => { setTechFilter(e.target.value); setSelectedProject(null); }} style={ddStyle(C.teal)}>
                {techs.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 8px", background:C.bg, borderRadius:7, border:`0.5px solid ${C.border}`, cursor:"pointer" }} onClick={() => setShowCancelled(v => !v)}>
              <div style={{ width:14, height:14, borderRadius:3, border:`1.5px solid ${showCancelled?"#DC2626":C.border}`, background:showCancelled?"#DC2626":"white", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {showCancelled && <span style={{ color:"white", fontSize:10, lineHeight:1 }}>✓</span>}
              </div>
              <span style={{ fontSize:12, color:showCancelled?"#DC2626":C.slateM }}>Show cancelled</span>
            </div>
            <div>
              <SLabel text="Project stage" />
              <select value={stageFilter} onChange={e => { setStageFilter(e.target.value); setSelectedProject(null); }} style={ddStyle(C.blue)}>
                {stages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </PanelCard>

        {/* Project list */}
        <PanelCard style={{ marginTop:8, maxHeight:280, overflow:"auto" }}>
          <SLabel text={`${filtered.length} projects`} />
          {filtered.map(p => (
            <div key={p.id} onClick={() => {
              setSelectedProject(p.id === selectedProject?.id ? null : p);
              if (mapRef.current) mapRef.current.flyTo({ center:[p.lng,p.lat], zoom:5.5, duration:800 });
            }} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 8px", borderRadius:6, marginBottom:3, cursor:"pointer", background:selectedProject?.id===p.id?C.tealL:C.bg, transition:"background 0.12s" }}
              onMouseEnter={e => { if(selectedProject?.id!==p.id) e.currentTarget.style.background=C.tealL+"55"; }}
              onMouseLeave={e => { if(selectedProject?.id!==p.id) e.currentTarget.style.background=C.bg; }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, flex:1, minWidth:0 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:techColor(p.tech), flexShrink:0 }} />
                <span style={{ fontSize:13, color:C.slate, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</span>
              </div>
              {p.urgent && <div style={{ width:6, height:6, borderRadius:"50%", background:C.amberM, flexShrink:0, marginLeft:4 }} />}
            </div>
          ))}
        </PanelCard>
      </div>


      {/* Province strip — bottom centre, clickable to filter */}
      <div style={{ position:"absolute", bottom:36, left:"50%", transform:"translateX(-50%)", zIndex:10, maxWidth:"calc(100% - 280px)" }}>
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:2 }}>
          {/* "All" reset chip */}
          {provinceFilter !== "All" && (
            <div onClick={() => setProvinceFilter("All")} style={{ background:C.teal, borderRadius:8, padding:"7px 12px", textAlign:"center", flexShrink:0, cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,0.18)", border:"2px solid white", transition:"all 0.15s" }}>
              <p style={{ margin:"0 0 1px", fontSize:12, fontWeight:700, color:"white" }}>✕ Clear</p>
              <p style={{ margin:0, fontSize:11, color:"rgba(255,255,255,0.85)", fontWeight:600 }}>Show all</p>
            </div>
          )}
          {provinceCounts.map(([prov, count]) => {
            const isActive = provinceFilter === prov;
            return (
              <div key={prov} onClick={() => setProvinceFilter(isActive ? "All" : prov)}
                style={{ background: isActive ? C.teal : "rgba(255,255,255,0.97)", borderRadius:8, padding:"7px 12px", textAlign:"center", flexShrink:0, cursor:"pointer", backdropFilter:"blur(6px)", boxShadow: isActive ? "0 3px 12px rgba(13,122,107,0.35)" : "0 2px 6px rgba(0,0,0,0.1)", border: isActive ? `2px solid ${C.tealD}` : "2px solid transparent", transition:"all 0.15s" }}>
                <p style={{ margin:"0 0 1px", fontSize:14, fontWeight:700, color: isActive ? "white" : C.slate }}>{prov}</p>
                <p style={{ margin:0, fontSize:12, fontWeight:600, color: isActive ? "rgba(255,255,255,0.9)" : C.teal }}>{count} project{count!==1?"s":""}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project detail */}
      {selectedProject && <ProjectPanel project={selectedProject} onClose={() => setSelectedProject(null)} />}

      <MapLegend items={[["Green H2",C.teal],["Blue H2",C.blue],["Low-C NH3",C.amber],["SAF",C.green],["E-fuels",C.coral],["Natural H2","#B45309"]]} />
    </div>
  );
}

// ── VIEW: MARKET INSIGHTS ─────────────────────────────────────────────
// ── FORECAST PANEL ────────────────────────────────────────────────────
// ── CANADA H2 MARKET POTENTIAL PANEL ─────────────────────────────────
// Sources: NRCan H2 Strategy Progress Report 2024, CER Market Snapshot
// Sep 2025, IEA Canada H2 Strategy, CHA 2024 Sector Profile
function CAMarketPanel({ compact = false }) {
  const [view, setView] = useState("production");
  const h = compact ? 260 : 380;

  const SCENARIO_COLORS = {
    actual:        { color:"#0D7A6B", label:"Actual / Announced (Mt/yr)" },
    low:           { color:"#94A3B8", label:"Low scenario (Mt/yr)"       },
    reference:     { color:"#185FA5", label:"Reference scenario (Mt/yr)" },
    transformative:{ color:"#854F0B", label:"Transformative scenario (Mt/yr)" },
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
        <SLabel text="View" />
        <select value={view} onChange={e => setView(e.target.value)} style={ddStyle(C.blue)}>
          <option value="production">Production volume (Mt H₂/yr)</option>
          <option value="revenue">Revenue potential ($B CAD)</option>
        </select>
      </div>

      {view === "production" && (
        <div>
          {/* Legend */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:8 }}>
            {Object.entries(SCENARIO_COLORS).map(([k,s]) => (
              <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:10, height:k==="actual"?10:2, borderRadius:k==="actual"?3:0, background:s.color, flexShrink:0 }}/>
                <span style={{ fontSize:11, color:C.slateM }}>{s.label}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={h}>
            <ComposedChart data={CA_H2_MARKET_DATA} margin={{ top:4, right:8, left:-10, bottom:30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
              <XAxis dataKey="year" tick={{ fontSize:13, fill:C.slateL }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:13, fill:C.slateL }} axisLine={false} tickLine={false}
                label={{ value:"Mt H₂/yr", angle:-90, position:"insideLeft", offset:18, fontSize:11, fill:C.slateL }}/>
              <Tooltip content={<RichTooltip unit=" Mt H₂/yr" showTotal={false}/>}/>
              <Bar dataKey="actual" name="Actual / Announced" fill="#0D7A6B" radius={[3,3,0,0]} opacity={0.9}/>
              <Line type="monotone" dataKey="low"            name="Low scenario"            stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 3" dot={{ r:3 }}/>
              <Line type="monotone" dataKey="reference"      name="Reference scenario"      stroke="#185FA5" strokeWidth={2.5} dot={{ r:3 }}/>
              <Line type="monotone" dataKey="transformative" name="Transformative scenario" stroke="#854F0B" strokeWidth={2} strokeDasharray="3 2" dot={{ r:3 }}/>
            </ComposedChart>
          </ResponsiveContainer>
          <p style={{ margin:"5px 0 0", fontSize:11, color:C.slateL }}>
            Source: NRCan H2 Strategy Progress Report 2024 · CER Market Snapshot Sep 2025 · Scenarios reflect NRCan modelling (3–12% of Canada energy demand by 2050)
          </p>
        </div>
      )}

      {view === "revenue" && (
        <div>
          <ResponsiveContainer width="100%" height={h}>
            <AreaChart data={CA_H2_REVENUE_DATA} margin={{ top:4, right:8, left:-10, bottom:30 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#185FA5" stopOpacity={0.7}/>
                  <stop offset="95%" stopColor="#185FA5" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
              <XAxis dataKey="year" tick={{ fontSize:13, fill:C.slateL }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:13, fill:C.slateL }} axisLine={false} tickLine={false}
                label={{ value:"$B CAD", angle:-90, position:"insideLeft", offset:18, fontSize:11, fill:C.slateL }}/>
              <Tooltip content={<RichTooltip unit="$B CAD" showTotal={false}/>}/>
              <Area type="monotone" dataKey="revenue" name="Revenue potential" stroke="#185FA5" fill="url(#revGrad)" strokeWidth={2.5} activeDot={{ r:5 }}/>
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ background:C.blueL, borderRadius:8, padding:"9px 12px", marginTop:8 }}>
            <p style={{ margin:0, fontSize:12, color:C.blue, lineHeight:1.55 }}>
              <strong>NRCan 2050 target:</strong> CAD $50B+ revenues · 350,000 jobs · 3-12% of Canada's energy demand from H2
              · <SourceLink source="NRCan Hydrogen Strategy" url="https://natural-resources.canada.ca/energy-sources/clean-fuels/hydrogen-strategy" style={{ display:"inline-flex" }}/>
            </p>
          </div>
          <p style={{ margin:"5px 0 0", fontSize:11, color:C.slateL }}>
            Source: NRCan Hydrogen Strategy Progress Report 2024 · IEA Canada H2 Strategy · CHA 2024 Sector Profile
          </p>
        </div>
      )}
    </div>
  );
}


// ── HISTORICAL INVESTMENT BY TECHNOLOGY (2021–2026, $B CAD) ──────────
// Cumulative announced investment by tech type at year-end
// 2022-23 surge from large green NH3 export projects; correction 2024-26
const HIST_INVEST_TECH = [
  { year:"2021", greenH2:3.2,  blueH2:2.4,  ammonia:1.2, saf:0.4, efuels:0.2, natH2:0.0 },
  { year:"2022", greenH2:12.4, blueH2:8.6,  ammonia:20.2,saf:1.4, efuels:0.4, natH2:0.0 },
  { year:"2023", greenH2:28.4, blueH2:18.6, ammonia:26.4,saf:2.8, efuels:0.8, natH2:0.0 },
  { year:"2024", greenH2:20.4, blueH2:13.2, ammonia:12.8,saf:2.4, efuels:0.6, natH2:0.1 },
  { year:"2025", greenH2:16.4, blueH2:10.8, ammonia:8.4, saf:2.2, efuels:0.4, natH2:0.3 },
  { year:"2026", greenH2:14.2, blueH2:8.4,  ammonia:5.4, saf:1.8, efuels:0.3, natH2:0.8 },
];

// ── PROVINCE INVESTMENT HISTORY (2021–2026, $B CAD) ─────────────────
// Year-end cumulative announced pipeline by province
// NL/NS inflated 2022-23 by Nujio'qonik/Burin/Bear Head (cancelled 2024-25)
const PROVINCE_INVEST_HISTORY = [
  { year:"2021", AB:4.8,  BC:2.1,  QC:0.8, ON:0.6, NS:0.4, NL:0.3,  SK:0.1, NB:0.1 },
  { year:"2022", AB:18.4, BC:7.4,  QC:2.4, ON:1.2, NS:8.6, NL:18.4, SK:0.2, NB:0.4 },
  { year:"2023", AB:36.2, BC:12.4, QC:4.8, ON:2.6, NS:14.8,NL:32.6, SK:0.4, NB:0.8 },
  { year:"2024", AB:28.4, BC:9.8,  QC:4.2, ON:2.2, NS:8.4, NL:14.2, SK:0.8, NB:0.6 },
  { year:"2025", AB:22.4, BC:8.2,  QC:4.0, ON:2.1, NS:6.2, NL:6.8,  SK:1.2, NB:0.8 },
  { year:"2026", AB:20.1, BC:9.1,  QC:5.9, ON:2.1, NS:5.1, NL:3.0,  SK:1.3, NB:0.8 },
];

// Province geo-centre points for pie chart placement
const PROVINCE_CENTERS = {
  BC: { lng:-125.0, lat:54.8 },
  AB: { lng:-115.0, lat:55.5 },
  SK: { lng:-106.0, lat:54.5 },
  MB: { lng:-97.5,  lat:55.5 },
  ON: { lng:-85.0,  lat:50.0 },
  QC: { lng:-71.5,  lat:52.0 },
  NB: { lng:-66.5,  lat:46.8 },
  NS: { lng:-63.0,  lat:45.2 },
  NL: { lng:-57.0,  lat:52.0 },
};

// ── PROVINCE TECH INVESTMENT MIX (% of total by tech, per province) ──
// Estimated from IEA project data and known project portfolios
const PROVINCE_TECH_PCT = {
  AB: { blueH2:0.52, greenH2:0.28, ammonia:0.14, saf:0.03, efuels:0.02, natH2:0.01 },
  BC: { greenH2:0.70, blueH2:0.02, ammonia:0.04, saf:0.12, efuels:0.04, natH2:0.08 },
  QC: { greenH2:0.56, blueH2:0.02, ammonia:0.12, efuels:0.18, saf:0.08, natH2:0.04 },
  ON: { greenH2:0.74, blueH2:0.18, ammonia:0.04, saf:0.02, efuels:0.02, natH2:0.00 },
  NS: { ammonia:0.80, greenH2:0.14, blueH2:0.02, saf:0.02, efuels:0.02, natH2:0.00 },
  NL: { ammonia:0.86, greenH2:0.10, blueH2:0.02, saf:0.01, efuels:0.01, natH2:0.00 },
  SK: { greenH2:0.40, blueH2:0.08, natH2:0.44, ammonia:0.04, efuels:0.02, saf:0.02 },
  NB: { greenH2:0.48, ammonia:0.44, blueH2:0.04, saf:0.02, efuels:0.02, natH2:0.00 },
  MB: { greenH2:0.88, blueH2:0.04, efuels:0.04, saf:0.02, ammonia:0.02, natH2:0.00 },
};

// ── PROVINCE PHASE PCT (investment distribution by pipeline phase) ────
const PROV_PHASE_PCT = {
  AB: { announced:0.12, feasibility:0.25, feed:0.04, fid:0.36, construction:0.06, operational:0.17 },
  BC: { announced:0.22, feasibility:0.38, feed:0.05, fid:0.10, construction:0.10, operational:0.15 },
  NS: { announced:0.20, feasibility:0.60, feed:0.06, fid:0.05, construction:0.04, operational:0.05 },
  NL: { announced:0.26, feasibility:0.56, feed:0.08, fid:0.04, construction:0.03, operational:0.03 },
  QC: { announced:0.14, feasibility:0.34, feed:0.08, fid:0.12, construction:0.12, operational:0.20 },
  ON: { announced:0.10, feasibility:0.28, feed:0.06, fid:0.14, construction:0.14, operational:0.28 },
  SK: { announced:0.36, feasibility:0.38, feed:0.02, fid:0.03, construction:0.04, operational:0.17 },
  NB: { announced:0.28, feasibility:0.48, feed:0.05, fid:0.06, construction:0.05, operational:0.08 },
  MB: { announced:0.18, feasibility:0.42, feed:0.04, fid:0.08, construction:0.10, operational:0.18 },
};

// Province colours for bottom chart grouping
const PROV_COLORS = {
  AB:"#3B82F6", BC:C.teal, QC:"#7C3AED", ON:"#0891B2",
  NS:C.amber, NL:C.coral, SK:"#16A34A", NB:"#64748B", MB:"#EC4899",
};


// ── PROVINCE TECH DISTRIBUTION BY YEAR (% of investment) ─────────────
// Reflects market dynamics: NL/NS ammonia-heavy 2022-23 (Nujio'qonik,
// Burin, Bear Head) then contracting. Natural H2 emerging AB/BC/SK 2025+
const PROV_TECH_HIST = [
  // ── 2021 ──
  { year:"2021", prov:"AB",  greenH2:0.26, blueH2:0.52, ammonia:0.16, saf:0.04, efuels:0.02, natH2:0.00 },
  { year:"2021", prov:"BC",  greenH2:0.67, blueH2:0.19, ammonia:0.05, saf:0.05, efuels:0.00, natH2:0.04 },
  { year:"2021", prov:"QC",  greenH2:0.38, blueH2:0.25, ammonia:0.12, saf:0.00, efuels:0.25, natH2:0.00 },
  { year:"2021", prov:"ON",  greenH2:0.60, blueH2:0.40, ammonia:0.00, saf:0.00, efuels:0.00, natH2:0.00 },
  { year:"2021", prov:"NS",  greenH2:0.25, blueH2:0.00, ammonia:0.75, saf:0.00, efuels:0.00, natH2:0.00 },
  { year:"2021", prov:"NL",  greenH2:0.33, blueH2:0.00, ammonia:0.67, saf:0.00, efuels:0.00, natH2:0.00 },
  { year:"2021", prov:"SK",  greenH2:0.00, blueH2:1.00, ammonia:0.00, saf:0.00, efuels:0.00, natH2:0.00 },
  { year:"2021", prov:"NB",  greenH2:0.50, blueH2:0.50, ammonia:0.00, saf:0.00, efuels:0.00, natH2:0.00 },
  // ── 2022 ──
  { year:"2022", prov:"AB",  greenH2:0.23, blueH2:0.47, ammonia:0.21, saf:0.05, efuels:0.02, natH2:0.00 },
  { year:"2022", prov:"BC",  greenH2:0.73, blueH2:0.16, ammonia:0.05, saf:0.03, efuels:0.00, natH2:0.03 },
  { year:"2022", prov:"QC",  greenH2:0.33, blueH2:0.33, ammonia:0.17, saf:0.00, efuels:0.17, natH2:0.00 },
  { year:"2022", prov:"ON",  greenH2:0.55, blueH2:0.37, ammonia:0.00, saf:0.00, efuels:0.00, natH2:0.08 },
  { year:"2022", prov:"NS",  greenH2:0.07, blueH2:0.00, ammonia:0.81, saf:0.02, efuels:0.00, natH2:0.10 },
  { year:"2022", prov:"NL",  greenH2:0.13, blueH2:0.00, ammonia:0.87, saf:0.00, efuels:0.00, natH2:0.00 },
  { year:"2022", prov:"SK",  greenH2:0.00, blueH2:1.00, ammonia:0.00, saf:0.00, efuels:0.00, natH2:0.00 },
  { year:"2022", prov:"NB",  greenH2:0.25, blueH2:0.25, ammonia:0.50, saf:0.00, efuels:0.00, natH2:0.00 },
  // ── 2023 ──
  { year:"2023", prov:"AB",  greenH2:0.24, blueH2:0.50, ammonia:0.20, saf:0.04, efuels:0.02, natH2:0.00 },
  { year:"2023", prov:"BC",  greenH2:0.79, blueH2:0.11, ammonia:0.05, saf:0.03, efuels:0.02, natH2:0.00 },
  { year:"2023", prov:"QC",  greenH2:0.42, blueH2:0.17, ammonia:0.12, saf:0.12, efuels:0.17, natH2:0.00 },
  { year:"2023", prov:"ON",  greenH2:0.54, blueH2:0.31, ammonia:0.00, saf:0.04, efuels:0.04, natH2:0.07 },
  { year:"2023", prov:"NS",  greenH2:0.09, blueH2:0.00, ammonia:0.89, saf:0.02, efuels:0.00, natH2:0.00 },
  { year:"2023", prov:"NL",  greenH2:0.15, blueH2:0.00, ammonia:0.85, saf:0.00, efuels:0.00, natH2:0.00 },
  { year:"2023", prov:"SK",  greenH2:0.00, blueH2:1.00, ammonia:0.00, saf:0.00, efuels:0.00, natH2:0.00 },
  { year:"2023", prov:"NB",  greenH2:0.25, blueH2:0.25, ammonia:0.50, saf:0.00, efuels:0.00, natH2:0.00 },
  // ── 2024 ──
  { year:"2024", prov:"AB",  greenH2:0.23, blueH2:0.50, ammonia:0.19, saf:0.04, efuels:0.02, natH2:0.02 },
  { year:"2024", prov:"BC",  greenH2:0.76, blueH2:0.12, ammonia:0.04, saf:0.04, efuels:0.02, natH2:0.02 },
  { year:"2024", prov:"QC",  greenH2:0.38, blueH2:0.19, ammonia:0.14, saf:0.14, efuels:0.15, natH2:0.00 },
  { year:"2024", prov:"ON",  greenH2:0.55, blueH2:0.27, ammonia:0.00, saf:0.05, efuels:0.04, natH2:0.09 },
  { year:"2024", prov:"NS",  greenH2:0.10, blueH2:0.00, ammonia:0.86, saf:0.02, efuels:0.00, natH2:0.02 },
  { year:"2024", prov:"NL",  greenH2:0.15, blueH2:0.00, ammonia:0.82, saf:0.00, efuels:0.01, natH2:0.02 },
  { year:"2024", prov:"SK",  greenH2:0.00, blueH2:0.75, ammonia:0.00, saf:0.00, efuels:0.00, natH2:0.25 },
  { year:"2024", prov:"NB",  greenH2:0.34, blueH2:0.33, ammonia:0.33, saf:0.00, efuels:0.00, natH2:0.00 },
  // ── 2025 ──
  { year:"2025", prov:"AB",  greenH2:0.21, blueH2:0.48, ammonia:0.14, saf:0.05, efuels:0.02, natH2:0.10 },
  { year:"2025", prov:"BC",  greenH2:0.76, blueH2:0.10, ammonia:0.02, saf:0.05, efuels:0.02, natH2:0.05 },
  { year:"2025", prov:"QC",  greenH2:0.40, blueH2:0.15, ammonia:0.10, saf:0.20, efuels:0.10, natH2:0.05 },
  { year:"2025", prov:"ON",  greenH2:0.48, blueH2:0.29, ammonia:0.00, saf:0.05, efuels:0.00, natH2:0.18 },
  { year:"2025", prov:"NS",  greenH2:0.07, blueH2:0.00, ammonia:0.87, saf:0.03, efuels:0.00, natH2:0.03 },
  { year:"2025", prov:"NL",  greenH2:0.18, blueH2:0.00, ammonia:0.76, saf:0.00, efuels:0.03, natH2:0.03 },
  { year:"2025", prov:"SK",  greenH2:0.00, blueH2:0.67, ammonia:0.00, saf:0.00, efuels:0.00, natH2:0.33 },
  { year:"2025", prov:"NB",  greenH2:0.25, blueH2:0.25, ammonia:0.38, saf:0.00, efuels:0.00, natH2:0.12 },
  // ── 2026 ──
  { year:"2026", prov:"AB",  greenH2:0.24, blueH2:0.47, ammonia:0.14, saf:0.07, efuels:0.02, natH2:0.06 },
  { year:"2026", prov:"BC",  greenH2:0.64, blueH2:0.09, ammonia:0.02, saf:0.04, efuels:0.01, natH2:0.20 },
  { year:"2026", prov:"QC",  greenH2:0.41, blueH2:0.10, ammonia:0.07, saf:0.20, efuels:0.10, natH2:0.12 },
  { year:"2026", prov:"ON",  greenH2:0.48, blueH2:0.29, ammonia:0.00, saf:0.05, efuels:0.00, natH2:0.18 },
  { year:"2026", prov:"NS",  greenH2:0.08, blueH2:0.00, ammonia:0.86, saf:0.04, efuels:0.00, natH2:0.02 },
  { year:"2026", prov:"NL",  greenH2:0.20, blueH2:0.00, ammonia:0.67, saf:0.00, efuels:0.07, natH2:0.06 },
  { year:"2026", prov:"SK",  greenH2:0.00, blueH2:0.46, ammonia:0.00, saf:0.00, efuels:0.00, natH2:0.54 },
  { year:"2026", prov:"NB",  greenH2:0.25, blueH2:0.50, ammonia:0.13, saf:0.00, efuels:0.00, natH2:0.12 },
];


// SVG pie chart with % labels on slices > 8%
function makePieSVG(slices, size=76) {
  const cx = size/2, cy = size/2, r = size/2 - 4;
  let angle = -Math.PI/2;
  const paths = []; const labels = [];
  slices.forEach(({ color, pct }) => {
    const end = angle + pct * 2 * Math.PI;
    const x1 = cx + r*Math.cos(angle), y1 = cy + r*Math.sin(angle);
    const x2 = cx + r*Math.cos(end),   y2 = cy + r*Math.sin(end);
    const large = pct > 0.5 ? 1 : 0;
    const d = pct >= 0.9999
      ? `M${cx},${cy} m${-r},0 a${r},${r} 0 1,1 ${2*r},0 a${r},${r} 0 1,1 ${-2*r},0`
      : `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`;
    paths.push(`<path d="${d}" fill="${color}" stroke="white" stroke-width="1.5"/>`);
    // % label for slices > 8%
    if (pct > 0.08) {
      const midAngle = angle + pct * Math.PI;
      const lr = r * 0.65;
      const tx = cx + lr*Math.cos(midAngle);
      const ty = cy + lr*Math.sin(midAngle);
      const pctStr = Math.round(pct*100) + "%";
      labels.push(`<text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="${pct > 0.2 ? 10 : 8}" font-weight="700" font-family="sans-serif" style="paint-order:stroke" stroke="rgba(0,0,0,0.3)" stroke-width="2">${pctStr}</text>`);
    }
    angle = end;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25))">${paths.join("")}${labels.join("")}</svg>`;
}

// Province pie markers — investment % by tech for selected year (year-specific via PROV_TECH_HIST)
function useProvincePieMarkers(mapRef, mapReady, styleKey, selectedYear) {
  const markersRef = useRef([]);

  // camelCase key → color (techColor() expects display names, so map keys directly)
  const KEY_COLOR = {
    greenH2: "#0D7A6B",  // C.teal
    blueH2:  "#185FA5",  // C.blue
    ammonia: "#854F0B",  // C.amber
    saf:     "#3B6D11",  // C.green
    efuels:  "#993C1D",  // C.coral
    natH2:   "#B45309",  // gold
  };
  const TECH_KEY_LABELS = { greenH2:"Green H2", blueH2:"Blue H2", ammonia:"Low-C NH3", saf:"SAF", efuels:"E-fuels", natH2:"Natural H2" };

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Get province totals for selected year
    const yearRow = PROVINCE_INVEST_HISTORY.find(d => d.year === selectedYear)
                 || PROVINCE_INVEST_HISTORY[PROVINCE_INVEST_HISTORY.length - 1];

    Object.entries(PROVINCE_CENTERS).forEach(([prov, center]) => {
      const totalInvest = yearRow[prov] || 0;
      if (totalInvest < 0.05) return;

      // Year-specific tech % from PROV_TECH_HIST; fallback to PROVINCE_TECH_PCT
      const techRow = PROV_TECH_HIST.find(d => d.year === selectedYear && d.prov === prov)
                    || null;
      const techPct = techRow || PROVINCE_TECH_PCT[prov];
      if (!techPct) return;

      const TECH_KEYS_PIE = ["greenH2","blueH2","ammonia","saf","efuels","natH2"];
      const slices = TECH_KEYS_PIE
        .filter(k => (techPct[k]||0) > 0.01)
        .sort((a,b) => (techPct[b]||0) - (techPct[a]||0))
        .map(k => ({
          color:   KEY_COLOR[k],
          pct:     techPct[k] || 0,
          label:   TECH_KEY_LABELS[k],
          invest:  (totalInvest * (techPct[k]||0)).toFixed(1),
        }));

      const el = document.createElement("div");
      el.style.cssText = "cursor:pointer;user-select:none;";
      const svg = makePieSVG(slices, 76);
      const totalFmt = totalInvest >= 1 ? `$${totalInvest.toFixed(1)}B` : `$${(totalInvest*1000).toFixed(0)}M`;
      const label = `<div style="position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.96);border-radius:4px;padding:1px 6px;font-size:9px;font-weight:700;color:#334155;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.15);font-family:inherit;">${prov} ${totalFmt}</div>`;
      el.innerHTML = `<div style="position:relative;width:76px;height:76px;">${svg}${label}</div>`;
      el.title = slices.map(s=>`${s.label}: ${Math.round(s.pct*100)}% ($${s.invest}B)`).join(', ');

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([center.lng, center.lat]).addTo(map);
      markersRef.current.push(marker);
    });

    return () => { markersRef.current.forEach(m => m.remove()); markersRef.current = []; };
  }, [mapReady, styleKey, selectedYear]);
}


function ForecastPanel({ compact = false }) {
  const SERIES = [
    { key:"greenH2", label:"Green H2",   color:C.teal  },
    { key:"blueH2",  label:"Blue H2",    color:C.blue  },
    { key:"ammonia", label:"Low-C NH3",  color:C.amber },
    { key:"saf",     label:"SAF",        color:C.green },
    { key:"efuels",  label:"E-fuels",    color:C.coral },
  ];
  const ALL_KEYS = SERIES.map(s => s.key);
  const [fuelFilter, setFuelFilter] = useState("all");
  const [viewMode,   setViewMode]   = useState("fuels"); // fuels | scenarios

  const activeSeries = fuelFilter === "all" ? ALL_KEYS : [fuelFilter];
  const h = compact ? 260 : 380;

  return (
    <div>
      {/* View toggle: Fuel breakdown | Scenario comparison */}
      <div style={{ display:"flex", gap:6, marginBottom:10 }}>
        {[["fuels","Fuel breakdown"],["scenarios","STEPS / APS / NZE"]].map(([v,l]) => (
          <button key={v} onClick={()=>setViewMode(v)} style={{ flex:1, padding:"5px 8px", border:`1px solid ${viewMode===v?C.teal:C.border}`, borderRadius:7, background:viewMode===v?C.tealL:"white", color:viewMode===v?C.teal:C.slateM, fontSize:12, fontWeight:viewMode===v?700:400, cursor:"pointer" }}>{l}</button>
        ))}
      </div>

      {viewMode === "fuels" && (<>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <SLabel text="Show fuels" />
          <select value={fuelFilter} onChange={e => setFuelFilter(e.target.value)} style={{...ddStyle(C.teal), minWidth:150, fontSize:12}}>
            <option value="all">All fuels</option>
            {SERIES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={FORECAST_DATA} margin={{ top:4, right:8, left:-12, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
            <XAxis dataKey="year" tick={{ fontSize:12, fill:C.slateL }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:12, fill:C.slateL }} axisLine={false} tickLine={false}
              label={{ value:"Mtpa", angle:-90, position:"insideLeft", offset:18, fontSize:11, fill:C.slateL }}/>
            <Tooltip content={<RichTooltip unit=" Mtpa" showTotal />}/>
            <Legend wrapperStyle={{ fontSize:12, paddingTop:6 }}/>
            {SERIES.filter(s => activeSeries.includes(s.key)).map((s, i, arr) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} stackId="a"
                radius={i === arr.length-1 ? [3,3,0,0] : undefined}/>
            ))}
          </BarChart>
        </ResponsiveContainer>
        <p style={{ margin:"5px 0 0", fontSize:11, color:C.slateL }}>Source: IEA Global Hydrogen Review 2025 · NRCan</p>
      </>)}

      {viewMode === "scenarios" && (<>
        <div style={{ display:"flex", gap:14, marginBottom:8 }}>
          {[["steps","STEPS","#94A3B8"],["aps","APS","#3B82F6"],["nze","NZE","#16A34A"]].map(([k,l,c])=>(
            <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:18, height:2.5, background:c, borderRadius:1 }}/><span style={{ fontSize:10, fontWeight:700, color:C.slateM }}>{l}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={h}>
          <LineChart data={H2_DEMAND_SCENARIOS} margin={{ top:4, right:10, left:-10, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
            <XAxis dataKey="year" tick={{ fontSize:12, fill:C.slateL }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:12, fill:C.slateL }} axisLine={false} tickLine={false}
              label={{ value:"Mt H₂-eq/yr", angle:-90, position:"insideLeft", offset:16, fontSize:10, fill:C.slateL }}/>
            <Tooltip content={<RichTooltip unit=" Mt H₂-eq/yr" showTotal={false}/>}/>
            <Line type="monotone" dataKey="steps" name="Stated Policies (STEPS)" stroke="#94A3B8" strokeWidth={2} dot={{r:3}} strokeDasharray="5 3"/>
            <Line type="monotone" dataKey="aps"   name="Announced Pledges (APS)" stroke="#3B82F6" strokeWidth={2.5} dot={{r:3}}/>
            <Line type="monotone" dataKey="nze"   name="Net Zero (NZE)"           stroke="#16A34A" strokeWidth={2.5} dot={{r:3}} strokeDasharray="3 2"/>
          </LineChart>
        </ResponsiveContainer>
        <p style={{ margin:"5px 0 0", fontSize:11, color:C.slateL }}>Source: IEA GHR 2025 · IEA WEO 2024 · NRCan H₂ Strategy Progress Report 2024</p>
      </>)}
    </div>
  );
}

// ── INVESTMENT PANEL ──────────────────────────────────────────────────
function InvestmentPanel({ compact = false }) {
  const [view, setView] = useState("phase"); // phase | tech

  const PHASE_KEYS = ["announced","feasibility","feed","fid","construction","operational"];
  const PHASE_COLORS = { announced:"#94A3B8", feasibility:C.blueM, feed:C.blue, fid:C.amber, construction:C.teal, operational:C.green };
  const PHASE_LABELS = { announced:"Announced", feasibility:"Feasibility", feed:"FEED", fid:"FID", construction:"Construction", operational:"Operational" };

  const h = compact ? 260 : 380;

  return (
    <div>
      {/* View selector */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
        <SLabel text="View" />
        <select value={view} onChange={e => setView(e.target.value)} style={ddStyle(C.blue)}>
          <option value="phase">📊 Phase funnel (2021–2026)</option>
          <option value="tech">🔬 By technology (2021–2026)</option>
        </select>
      </div>

      {/* ── Phase funnel — historical stacked area ── */}
      {view === "phase" && (
        <div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:8 }}>
            {PHASE_KEYS.map(k => (
              <div key={k} style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:10, height:10, borderRadius:3, background:PHASE_COLORS[k], flexShrink:0 }}/>
                <span style={{ fontSize:11, color:C.slateM }}>{PHASE_LABELS[k]}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={h}>
            <AreaChart data={HISTORICAL_INVEST_PHASE} margin={{ top:4, right:8, left:-10, bottom:0 }}>
              <defs>
                {PHASE_KEYS.map(k => (
                  <linearGradient key={k} id={`gph-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={PHASE_COLORS[k]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={PHASE_COLORS[k]} stopOpacity={0.3}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
              <XAxis dataKey="year" tick={{ fontSize:12, fill:C.slateL }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:12, fill:C.slateL }} axisLine={false} tickLine={false}
                label={{ value:"$B CAD", angle:-90, position:"insideLeft", offset:16, fontSize:10, fill:C.slateL }}/>
              <Tooltip content={<RichTooltip unit="$B" showTotal/>}/>
              {PHASE_KEYS.map(k => (
                <Area key={k} type="monotone" dataKey={k} name={PHASE_LABELS[k]} stroke={PHASE_COLORS[k]} fill={`url(#gph-${k})`} stackId="a" strokeWidth={1.5}/>
              ))}
            </AreaChart>
          </ResponsiveContainer>
          <p style={{ margin:"5px 0 0", fontSize:11, color:C.slateL }}>Cumulative announced pipeline by phase at year-end · Source: IEA Production & Infrastructure DB June 2026 · NRCan</p>
        </div>
      )}

      {/* ── By technology — historical stacked area ── */}
      {view === "tech" && (
        <div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:8 }}>
            {[["greenH2","Green H2",C.teal],["blueH2","Blue H2",C.blue],["ammonia","Low-C NH3",C.amber],["saf","SAF",C.green],["efuels","E-fuels",C.coral],["natH2","Natural H2","#B45309"]].map(([k,l,c])=>(
              <div key={k} style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:10, height:10, borderRadius:3, background:c }}/>
                <span style={{ fontSize:11, color:C.slateM }}>{l}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={h}>
            <AreaChart data={HIST_INVEST_TECH} margin={{ top:4, right:8, left:-10, bottom:0 }}>
              <defs>
                {[["greenH2",C.teal],["blueH2",C.blue],["ammonia",C.amber],["saf",C.green],["efuels",C.coral],["natH2","#B45309"]].map(([k,c]) => (
                  <linearGradient key={k} id={`gpt-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={c} stopOpacity={0.3}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
              <XAxis dataKey="year" tick={{ fontSize:12, fill:C.slateL }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:12, fill:C.slateL }} axisLine={false} tickLine={false}
                label={{ value:"$B CAD", angle:-90, position:"insideLeft", offset:16, fontSize:10, fill:C.slateL }}/>
              <Tooltip content={<RichTooltip unit="$B" showTotal/>}/>
              <Area type="monotone" dataKey="greenH2" name="Green H2"    stroke={C.teal}    fill={`url(#gpt-greenH2)`} stackId="a" strokeWidth={1.5}/>
              <Area type="monotone" dataKey="blueH2"  name="Blue H2"     stroke={C.blue}    fill={`url(#gpt-blueH2)`}  stackId="a" strokeWidth={1.5}/>
              <Area type="monotone" dataKey="ammonia" name="Low-C NH3"   stroke={C.amber}   fill={`url(#gpt-ammonia)`}  stackId="a" strokeWidth={1.5}/>
              <Area type="monotone" dataKey="saf"     name="SAF"         stroke={C.green}   fill={`url(#gpt-saf)`}     stackId="a" strokeWidth={1.5}/>
              <Area type="monotone" dataKey="efuels"  name="E-fuels"     stroke={C.coral}   fill={`url(#gpt-efuels)`}  stackId="a" strokeWidth={1.5}/>
              <Area type="monotone" dataKey="natH2"   name="Natural H2"  stroke="#B45309"  fill={`url(#gpt-natH2)`}   stackId="a" strokeWidth={1.5}/>
            </AreaChart>
          </ResponsiveContainer>
          <p style={{ margin:"5px 0 0", fontSize:11, color:C.slateL }}>Cumulative pipeline by technology at year-end · Source: IEA Production & Infrastructure DB June 2026</p>
        </div>
      )}
    </div>
  );
}

function MarketView({ styleUrl }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [activePanel, setActivePanel] = useState("forecast");
  const [styleKey, setStyleKey] = useState(0);
  const [selectedPieYear, setSelectedPieYear] = useState("2026");
  const [provView,   setProvView]   = useState("phase"); // phase | tech
  const [selSeries,  setSelSeries]  = useState(null);    // highlighted phase/tech key
  const [provFilter, setProvFilter] = useState("All");   // province filter for bottom strip

  const PIE_YEARS = ["2021","2022","2023","2024","2025","2026"];
  const PHASE_KEYS_INV = ["announced","feasibility","feed","fid","construction","operational"];
  const PHASE_COLS = { announced:"#94A3B8", feasibility:C.blueM, feed:C.blue, fid:C.amber, construction:C.teal, operational:"#16A34A" };
  const PHASE_LABS = { announced:"Announced", feasibility:"Feasibility", feed:"FEED", fid:"FID", construction:"Construction", operational:"Operational" };
  const TECH_KEYS  = ["greenH2","blueH2","ammonia","saf","efuels","natH2"];
  const TECH_COLS  = { greenH2:C.teal, blueH2:C.blue, ammonia:C.amber, saf:C.green, efuels:C.coral, natH2:"#B45309" };
  const TECH_LABS  = { greenH2:"Green H2", blueH2:"Blue H2", ammonia:"Low-C NH3", saf:"SAF", efuels:"E-fuels", natH2:"Natural H2" };

  // Build bottom-strip chart data:
  // "All" → province × year combos (48 bars: 6 years × 8 provinces, X = "2021|AB" etc.)
  // Specific prov → year series for that province (X = year)
  const PROVS_LIST = ["AB","BC","QC","ON","NS","NL","SK","NB"];
  const buildHistData = (prov) => {
    const keys = provView === "phase" ? PHASE_KEYS_INV : TECH_KEYS;
    if (prov === "All") {
      // Return one row per province per year, X key = "YEAR|PROV"
      return PROVINCE_INVEST_HISTORY.flatMap(yearRow =>
        PROVS_LIST.map(p => {
          const total = yearRow[p] || 0;
          const pctMap = provView === "phase"
            ? (PROV_PHASE_PCT[p]||{})
            : (PROV_TECH_HIST.find(d => d.year===yearRow.year && d.prov===p) || PROVINCE_TECH_PCT[p] || {});
          const row = { xKey: `${yearRow.year}|${p}`, year: yearRow.year, province: p };
          keys.forEach(k => { row[k] = parseFloat(((pctMap[k]||0) * total).toFixed(2)); });
          return row;
        })
      );
    }
    // Single province: X = year
    return PROVINCE_INVEST_HISTORY.map(yearRow => {
      const total = yearRow[prov] || 0;
      const pctMap = provView === "phase"
        ? (PROV_PHASE_PCT[prov]||{})
        : (PROV_TECH_HIST.find(d => d.year===yearRow.year && d.prov===prov) || PROVINCE_TECH_PCT[prov] || {});
      const row = { xKey: yearRow.year, year: yearRow.year, province: prov };
      keys.forEach(k => { row[k] = parseFloat(((pctMap[k]||0) * total).toFixed(2)); });
      return row;
    });
  };

  // Province pie charts (investment %, selected year)
  useProvincePieMarkers(mapRef, mapReady, styleKey, selectedPieYear);

  const panels = [["forecast","Demand forecast"],["camarket","CA H2 Market Potential"]];

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>

      {/* ── LEFT — analytics panels ── */}
      <div style={{ width:460, flexShrink:0, display:"flex", flexDirection:"column", background:C.bg, borderRight:`1px solid ${C.border}`, overflow:"hidden" }}>

        {/* KPI strip */}
        <div style={{ padding:"10px 12px", borderBottom:`0.5px solid ${C.border}`, display:"flex", gap:8, flexShrink:0 }}>
          <div style={{ flex:1, background:"rgba(232,245,242,0.97)", borderRadius:8, padding:"7px 10px", overflow:"hidden" }}>
            <p style={{ margin:"0 0 1px", fontSize:9, fontWeight:700, color:C.teal, textTransform:"uppercase", whiteSpace:"nowrap" }}>Active pipeline</p>
            <p style={{ margin:0, fontSize:16, fontWeight:700, color:C.teal }}>$50.6B</p>
          </div>
          <div style={{ flex:1, background:"rgba(230,241,251,0.97)", borderRadius:8, padding:"7px 10px", overflow:"hidden" }}>
            <p style={{ margin:"0 0 1px", fontSize:9, fontWeight:700, color:C.blue, textTransform:"uppercase", whiteSpace:"nowrap" }}>Federal ITC 2035</p>
            <p style={{ margin:0, fontSize:16, fontWeight:700, color:C.blue }}>$17.7B</p>
          </div>
          <div style={{ flex:1, background:"rgba(234,243,222,0.97)", borderRadius:8, padding:"7px 10px", overflow:"hidden" }}>
            <p style={{ margin:"0 0 1px", fontSize:9, fontWeight:700, color:C.green, textTransform:"uppercase", whiteSpace:"nowrap" }}>H2 CAGR</p>
            <p style={{ margin:0, fontSize:16, fontWeight:700, color:C.green }}>+69.6%</p>
          </div>
        </div>

        {/* Scrollable chart area */}
        <div style={{ flex:1, overflow:"auto", padding:"10px 12px" }}>

          {/* Demand forecast or CA H2 market — tabbed */}
          <div style={{ marginBottom:14 }}>
            <div style={{ display:"flex", borderBottom:`0.5px solid ${C.border}`, marginBottom:10 }}>
              {panels.map(([id, label]) => (
                <button key={id} onClick={() => setActivePanel(id)} style={{ padding:"6px 12px", border:"none", borderBottom:activePanel===id?`2px solid ${C.teal}`:"2px solid transparent", background:"none", cursor:"pointer", fontSize:12, fontWeight:activePanel===id?700:400, color:activePanel===id?C.teal:C.slateM, marginBottom:-1 }}>{label}</button>
              ))}
            </div>
            {activePanel === "forecast"  && <ForecastPanel compact />}
            {activePanel === "camarket" && <CAMarketPanel compact />}
          </div>

          {/* Investment flows — historical */}
          <div>
            <p style={{ margin:"0 0 8px", fontSize:12, fontWeight:700, color:C.slateM, textTransform:"uppercase", letterSpacing:"0.04em" }}>Investment flows (2021–2026)</p>
            <InvestmentPanel compact />
          </div>

        </div>
      </div>

      {/* ── RIGHT — map with province pies + bottom strip ── */}
      <div style={{ flex:1, position:"relative", overflow:"hidden", display:"flex", flexDirection:"column" }}>

        {/* Map area */}
        <div style={{ flex:1, position:"relative" }}>
          <BaseMap mapRef={mapRef} containerRef={containerRef} onMapReady={() => setMapReady(true)}
            onStyleReload={() => setStyleKey(k => k + 1)} styleUrl={styleUrl} />

          {/* Map legend + year picker — top right */}
          <div style={{ position:"absolute", top:12, right:12, zIndex:10, background:"rgba(255,255,255,0.96)", borderRadius:9, padding:"9px 13px", boxShadow:"0 2px 10px rgba(0,0,0,0.12)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ fontSize:10, fontWeight:700, color:C.slateM, textTransform:"uppercase", whiteSpace:"nowrap" }}>Pie year</span>
              <select value={selectedPieYear} onChange={e => setSelectedPieYear(e.target.value)} style={{...ddStyle(C.teal), fontSize:11, minWidth:70, padding:"3px 6px"}}>
                {PIE_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <p style={{ margin:"0 0 5px", fontSize:9, fontWeight:700, color:C.slateM, textTransform:"uppercase", letterSpacing:"0.04em" }}>Investment % by tech</p>
            {[["Green H2",C.teal],["Blue H2",C.blue],["Low-C NH3",C.amber],["SAF",C.green],["E-fuels",C.coral],["Natural H2","#B45309"]].map(([l,c]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                <div style={{ width:9, height:9, borderRadius:"50%", background:c }}/><span style={{ fontSize:10, color:C.slateM }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom strip — historical investment by year, province selector, phase/tech toggle */}
        <div style={{ height:380, background:"rgba(255,255,255,0.97)", borderTop:`1px solid ${C.border}`, padding:"8px 12px", flexShrink:0, display:"flex", flexDirection:"column" }}>
          {/* Controls row */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexShrink:0, flexWrap:"wrap" }}>
            <p style={{ margin:0, fontSize:11, fontWeight:700, color:C.slateM, textTransform:"uppercase", letterSpacing:"0.04em", whiteSpace:"nowrap" }}>H₂ investment pipeline by provinces</p>
            {/* View: Phase | Tech */}
            <div style={{ display:"flex", gap:4 }}>
              {[["phase","Phase funnel"],["tech","By technology"]].map(([v,l]) => (
                <button key={v} onClick={()=>{setProvView(v);setSelSeries(null);}} style={{ padding:"3px 9px", border:`1px solid ${provView===v?C.teal:C.border}`, borderRadius:5, background:provView===v?C.tealL:"white", color:provView===v?C.teal:C.slateM, fontSize:11, fontWeight:provView===v?700:400, cursor:"pointer" }}>{l}</button>
              ))}
            </div>
            {/* Province filter */}
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ fontSize:11, color:C.slateM, whiteSpace:"nowrap" }}>Province:</span>
              <select value={provFilter} onChange={e=>{setProvFilter(e.target.value);setSelSeries(null);}} style={{...ddStyle(C.blue), fontSize:11, padding:"3px 8px"}}>
                <option value="All">All provinces</option>
                {["AB","BC","QC","ON","NS","NL","SK","NB"].map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {selSeries && <button onClick={()=>setSelSeries(null)} style={{ padding:"3px 8px", border:`1px solid ${C.border}`, borderRadius:5, fontSize:10, cursor:"pointer", color:C.slateM, marginLeft:"auto" }}>✕ Clear selection</button>}
          </div>

          {/* Legend — clickable to highlight/isolate */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:6, flexShrink:0 }}>
            {(provView==="phase" ? PHASE_KEYS_INV : TECH_KEYS).map(k => {
              const col = provView==="phase" ? PHASE_COLS[k] : TECH_COLS[k];
              const lab = provView==="phase" ? PHASE_LABS[k] : TECH_LABS[k];
              const isActive = !selSeries || selSeries===k;
              return (
                <div key={k} onClick={()=>setSelSeries(selSeries===k?null:k)} style={{ display:"flex", alignItems:"center", gap:4, cursor:"pointer", opacity:isActive?1:0.32, transition:"opacity 0.15s" }}>
                  <div style={{ width:10, height:10, borderRadius:3, background:col, flexShrink:0 }}/><span style={{ fontSize:10, color:C.slateM, fontWeight:isActive?700:400 }}>{lab}</span>
                </div>
              );
            })}
          </div>

          {/* Stacked bar chart: province×year when All, or year for single province */}
          <div style={{ flex:1, minHeight:0, overflowX:"auto" }}>
            {(() => {
              const chartData = buildHistData(provFilter);
              // Width: enough room per bar (18px each min, 48 bars for All)
              const minW = provFilter === "All" ? Math.max(640, chartData.length * 18) : 400;
              // Custom X tick: for "All" show province + year marker at first-of-year
              const XTick = ({ x, y, payload }) => {
                const val = payload?.value || '';
                if (provFilter === "All") {
                  const [yr, pv] = val.split('|');
                  const isFirst = pv === 'AB';
                  return (
                    <g>
                      {isFirst && <line x1={x-9} y1={y-26} x2={x-9} y2={y+2} stroke={C.border} strokeWidth={1}/>}
                      {isFirst && <text x={x+60} y={y-16} textAnchor="middle" fontSize={9} fill={C.slateL} fontFamily="inherit">{yr}</text>}
                      <text x={x} y={y+10} textAnchor="middle" fontSize={9} fontWeight={600} fill={C.slateM} fontFamily="inherit">{pv}</text>
                    </g>
                  );
                }
                return <text x={x} y={y+10} textAnchor="middle" fontSize={11} fontWeight={600} fill={C.slateM} fontFamily="inherit">{val}</text>;
              };
              return (
                <BarChart width={minW} height={270} data={chartData} margin={{ top:4, right:8, left:0, bottom:28 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="xKey" tick={<XTick/>} axisLine={false} tickLine={false} interval={0} height={36}/>
                  <YAxis tick={{ fontSize:10, fill:C.slateL }} axisLine={false} tickLine={false} width={34}
                    label={{ value:"$B", angle:-90, position:"insideLeft", offset:12, fontSize:10, fill:C.slateL }}/>
                  <Tooltip
                    labelFormatter={v => provFilter==="All" ? v.replace("|"," · ") : `Year: ${v}`}
                    content={<RichTooltip unit="$B" showTotal/>}/>
                  {(provView==="phase" ? PHASE_KEYS_INV : TECH_KEYS).map((k,i,arr) => {
                    const col = provView==="phase" ? PHASE_COLS[k] : TECH_COLS[k];
                    const lab = provView==="phase" ? PHASE_LABS[k] : TECH_LABS[k];
                    const isActive = !selSeries || selSeries===k;
                    return (
                      <Bar key={k} dataKey={k} name={lab} stackId="a" fill={col}
                        fillOpacity={isActive ? 0.88 : 0.12}
                        radius={i===arr.length-1 ? [3,3,0,0] : undefined}
                        onClick={() => setSelSeries(selSeries===k ? null : k)}
                        cursor="pointer"/>
                    );
                  })}
                </BarChart>
              );
            })()}
          </div>
          <p style={{ margin:"2px 0 0", fontSize:10, color:C.slateL, flexShrink:0 }}>
            {provFilter==="All" ? "Each province shown for each year — scroll right to see all · " : `${provFilter} province, 2021–2026 · `}
            Click legend or bars to isolate · Source: IEA DB June 2026
          </p>
        </div>
      </div>
    </div>
  );
}

// ── VIEW: ECOSYSTEM ───────────────────────────────────────────────────
function EcosystemView({ styleUrl }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [styleKey, setStyleKey] = useState(0);
  const [selectedOEM, setSelectedOEM] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState("oems");

  const highlightIds = selectedOEM ? selectedOEM.projects : null;

  useProjectLayer(
    mapRef, mapReady, PROJECTS,
    selectedProject?.id,
    p => { setSelectedProject(p); setSelectedOEM(null); },
    highlightIds, styleKey
  );

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>

      {/* LEFT — directory panel */}
      <div style={{ width:380, flexShrink:0, display:"flex", flexDirection:"column", background:C.bg, borderRight:`1px solid ${C.border}`, overflow:"hidden" }}>
        <div style={{ padding:"10px 12px", borderBottom:`0.5px solid ${C.border}`, flexShrink:0 }}>
          <select value={activeTab} onChange={e => setActiveTab(e.target.value)} style={{...ddStyle(C.teal), width:"100%", minWidth:"unset"}}>
            <option value="oems">Technology OEMs</option>
            <option value="industry">Industry & Developers</option>
            <option value="endusers">End-users</option>
          </select>
        </div>
        <div style={{ overflow:"auto", flex:1, padding:"8px 10px" }}>
            {activeTab === "oems" && OEMS.map(o => (
              <div key={o.id} onClick={() => {
                if (selectedOEM?.id === o.id) { setSelectedOEM(null); }
                else { setSelectedOEM(o); setSelectedProject(null); }
              }} style={{ padding:"8px 10px", borderRadius:8, marginBottom:5, cursor:"pointer", background:selectedOEM?.id===o.id?C.tealL:C.bg, border:`0.5px solid ${selectedOEM?.id===o.id?C.tealM:C.border}`, transition:"all 0.15s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:600, color:C.slate, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{o.name}</p>
                  {selectedOEM?.id === o.id && <span style={{ fontSize:10, padding:"1px 5px", borderRadius:3, background:C.teal, color:C.white, flexShrink:0 }}>{o.projects.length} proj.</span>}
                </div>
                <p style={{ margin:0, fontSize:11, color:C.slateM, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.hq} · {o.type}</p>
              </div>
            ))}
            {activeTab === "industry" && INDUSTRY_MEMBERS.map(m => (
              <div key={m.id} style={{ padding:"8px 10px", borderRadius:8, marginBottom:5, background:C.bg, border:`0.5px solid ${C.border}` }}>
                <p style={{ margin:"0 0 4px", fontSize:13, fontWeight:600, color:C.slate, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:5 }}>
                  <span style={{ fontSize:10, padding:"2px 7px", borderRadius:4, background:C.blueL, color:C.blue, whiteSpace:"nowrap", overflow:"hidden", maxWidth:"100%", textOverflow:"ellipsis" }}>{m.type}</span>
                  <span style={{ fontSize:10, padding:"2px 7px", borderRadius:4, background:C.tealL, color:C.teal, whiteSpace:"nowrap", overflow:"hidden", maxWidth:"100%", textOverflow:"ellipsis" }}>{m.role}</span>
                </div>
                <p style={{ margin:"0 0 5px", fontSize:11, color:C.slateM, lineHeight:1.45 }}>{m.desc}</p>
                <SourceLink source={m.hq} url={m.url} />
              </div>
            ))}
            {activeTab === "endusers" && END_USERS.map(u => (
              <div key={u.id} style={{ padding:"8px 10px", borderRadius:8, marginBottom:5, background:C.bg, border:`0.5px solid ${C.border}` }}>
                <p style={{ margin:"0 0 4px", fontSize:13, fontWeight:600, color:C.slate, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.name}</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:5 }}>
                  <span style={{ fontSize:10, padding:"2px 7px", borderRadius:4, background:C.amberL, color:C.amber, whiteSpace:"nowrap", overflow:"hidden", maxWidth:"100%", textOverflow:"ellipsis" }}>{u.type}</span>
                  <span style={{ fontSize:10, padding:"2px 7px", borderRadius:4, background:C.blueL, color:C.blue, whiteSpace:"nowrap", overflow:"hidden", maxWidth:"100%", textOverflow:"ellipsis" }}>{u.role}</span>
                </div>
                <p style={{ margin:"0 0 5px", fontSize:11, color:C.slateM, lineHeight:1.45 }}>{u.desc}</p>
                <SourceLink source={u.hq} url={u.url} />
              </div>
            ))}

        </div>
      </div>

      {/* RIGHT — map */}
      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
        <BaseMap mapRef={mapRef} containerRef={containerRef} onMapReady={() => setMapReady(true)}
          onStyleReload={() => setStyleKey(k => k + 1)} styleUrl={styleUrl} />

        {/* How-to hint */}
        {!selectedOEM && !selectedProject && (
          <div style={{ position:"absolute", top:12, right:12, zIndex:10, width:200 }}>
            <PanelCard style={{ padding:"9px 12px" }}>
              <p style={{ margin:"0 0 3px", fontSize:12, fontWeight:700, color:C.slate }}>How to explore</p>
              <p style={{ margin:0, fontSize:11, color:C.slateM, lineHeight:1.5 }}>
                <strong>Select an OEM</strong> to highlight their projects on the map.<br/>
                <strong>Click a pin</strong> to open project details.
              </p>
            </PanelCard>
          </div>
        )}

        {/* OEM detail or project detail */}
        {selectedOEM && !selectedProject && <OEMPanel oem={selectedOEM} onClose={() => setSelectedOEM(null)} />}
        {selectedProject && <ProjectPanel project={selectedProject} onClose={() => setSelectedProject(null)} />}

        <MapLegend items={selectedOEM ? [["Highlighted — "+selectedOEM.name, selectedOEM.color],["Other projects","#CBD5E1"]] : [["Green H2",C.teal],["Blue H2",C.blue],["Low-C NH3",C.amber],["SAF",C.green],["Natural H2","#B45309"]]} />
      </div>
    </div>
  );
}

// ── VIEW: SUSTAINABLE CAPITAL (standalone, no map) ────────────────────
function CapitalView() {
  const [tab, setTab] = useState("esg");
  const tabs = [["esg","ESG & GHG"],["ci","Carbon intensity"],["taxonomy","Transition taxonomy"]];

  return (
    <div style={{ height:"100%", overflow:"auto", padding:"20px 24px" }}>
      <div style={{ maxWidth:900, margin:"0 auto" }}>
        <h2 style={{ margin:"0 0 4px", fontSize:18, fontWeight:700, color:C.slate }}>Sustainable Capital Insights</h2>
        <p style={{ margin:"0 0 18px", fontSize:15, color:C.slateM }}>ESG performance, GHG emissions, carbon intensity, and transition taxonomy for Canadian H2 ecosystem companies</p>

        {/* Tabs */}
        <div style={{ marginBottom:20 }}>
          <select value={tab} onChange={e => setTab(e.target.value)} style={{...ddStyle(C.green), fontSize:14, minWidth:220}}>
            {tabs.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>

        {tab === "esg" && (
          <div style={{ display:"grid", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {[
                { label:"Avg ESG score",  value:Math.round(ESG_DATA.reduce((s,c)=>s+c.esg,0)/ESG_DATA.length)+"/100", color:C.green, bg:C.greenL },
                { label:"Green-aligned",  value:ESG_DATA.filter(c=>c.taxonomy==="Green").length+" companies",          color:C.teal,  bg:C.tealL  },
                { label:"Transitioning",  value:ESG_DATA.filter(c=>c.taxonomy==="Amber").length+" companies",          color:C.amber, bg:C.amberL },
              ].map(s => (
                <div key={s.label} style={{ background:s.bg, borderRadius:9, padding:"10px 12px" }}>
                  <p style={{ margin:"0 0 2px", fontSize:11, color:s.color, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em" }}>{s.label}</p>
                  <p style={{ margin:0, fontSize:16, fontWeight:700, color:s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
            <Card>
              <SLabel text="ESG score vs GHG emissions — hover for company details" />
              <ResponsiveContainer width="100%" height={520}>
                <ScatterChart margin={{ top:8, right:16, left:-8, bottom:20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis type="number" dataKey="ghg" name="GHG" tick={{ fontSize:13, fill:C.slateL }} axisLine={false} tickLine={false} label={{ value:"GHG emissions (kt CO\u2082e)", position:"insideBottom", offset:-14, fontSize:13, fill:C.slateL }} />
                  <YAxis type="number" dataKey="esg" name="ESG" domain={[40,90]} tick={{ fontSize:13, fill:C.slateL }} axisLine={false} tickLine={false} label={{ value:"ESG score", angle:-90, position:"insideLeft", offset:20, fontSize:13, fill:C.slateL }} />
                  <Tooltip cursor={{ strokeDasharray:"3 3" }} content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    const tc = taxColor(d.taxonomy);
                    const scoreC = d.esg >= 70 ? C.green : d.esg >= 55 ? C.amberM : C.red;
                    return (
                      <div style={{ background:C.white, border:`0.5px solid ${C.border}`, borderRadius:10, padding:"10px 14px", boxShadow:"0 6px 24px rgba(0,0,0,0.14)" }}>
                        <p style={{ margin:"0 0 6px", fontSize:15, fontWeight:700, color:C.slate }}>{d.name} <span style={{ fontSize:13, color:C.slateM }}>({d.ticker})</span></p>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:6 }}>
                          <div style={{ background:C.bg, borderRadius:6, padding:"5px 8px" }}>
                            <p style={{ margin:"0 0 1px", fontSize:10, color:C.slateM, textTransform:"uppercase", fontWeight:700 }}>ESG score</p>
                            <p style={{ margin:0, fontSize:14, fontWeight:700, color:scoreC }}>{d.esg}/100</p>
                          </div>
                          <div style={{ background:C.bg, borderRadius:6, padding:"5px 8px" }}>
                            <p style={{ margin:"0 0 1px", fontSize:10, color:C.slateM, textTransform:"uppercase", fontWeight:700 }}>GHG</p>
                            <p style={{ margin:0, fontSize:14, fontWeight:700, color:C.green }}>{d.ghg < 100 ? d.ghg : (d.ghg/1000).toFixed(1)+"k"} kt CO\u2082e</p>
                          </div>
                        </div>
                        <Badge label={d.taxonomy} bg={tc.bg} color={tc.c} />
                      </div>
                    );
                  }} />
                  <ReferenceLine y={65} stroke={C.border} strokeDasharray="6 3" label={{ value:"Score threshold 65", position:"insideTopRight", fontSize:12, fill:C.slateL }}/>
                  <Scatter data={ESG_DATA.filter(d => d.taxonomy === "Green")}  name="Green \u2014 aligned"       fill={C.green}/>
                  <Scatter data={ESG_DATA.filter(d => d.taxonomy === "Amber")}  name="Amber \u2014 transitioning" fill={C.amberM}/>
                  <Legend wrapperStyle={{ fontSize:12, paddingTop:6 }} />
                </ScatterChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <SLabel text="ESG score comparison \u2014 radial view" />
              <ResponsiveContainer width="100%" height={480}>
                <RadialBarChart innerRadius="20%" outerRadius="90%" data={ESG_DATA.map(c=>({ ...c, fill: c.esg>=70?C.green:c.esg>=55?C.amberM:C.red }))} startAngle={180} endAngle={-180}>
                  <RadialBar dataKey="esg" background={{ fill:C.bg }} cornerRadius={4}>
                    {ESG_DATA.map((c,i) => <Cell key={i} fill={c.esg>=70?C.green:c.esg>=55?C.amberM:C.red}/>)}
                  </RadialBar>
                  <Tooltip formatter={(v, n, p) => [v+"/100", p.payload.name]}/>
                  <Legend iconSize={8} wrapperStyle={{ fontSize:13 }} formatter={(value, entry) => `${entry.payload.name} (${entry.payload.esg})`}/>
                </RadialBarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab === "ci" && (
          <div style={{ display:"grid", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
              {[["40% ITC","CI \u2264 0.75 kg","#16A34A","#F0FDF4"],["25% ITC","CI \u2264 2.0 kg","#84CC16","#F7FEE7"],["EU RFNBO","CI \u2264 3.4 kg",C.amberM,C.amberL],["15% ITC","CI \u2264 4.0 kg","#FB923C","#FFF7ED"]].map(([t,v,c,bg])=>(
                <div key={t} style={{ background:bg, borderRadius:8, padding:"8px 10px", borderLeft:`3px solid ${c}` }}>
                  <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:c }}>{t}</p>
                  <p style={{ margin:0, fontSize:11, color:C.slateM }}>{v}</p>
                </div>
              ))}
            </div>
            <Card>
              <SLabel text="Carbon intensity by production pathway \u2014 hover bars for ITC qualification details" />
              <ResponsiveContainer width="100%" height={520}>
                <BarChart data={CI_DATA} layout="vertical" margin={{ top:4, right:16, left:160, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                  <XAxis type="number" domain={[0,14]} tick={{ fontSize:13, fill:C.slateL }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize:13, fill:C.slateM }} axisLine={false} tickLine={false} width={160} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    const itc40 = d.ci<=0.75, itc25 = d.ci<=2.0&&!itc40, itc15 = d.ci<=4.0&&!itc25&&!itc40, eu = d.ci<=3.4;
                    return (
                      <div style={{ background:C.white, border:`0.5px solid ${C.border}`, borderRadius:10, padding:"10px 14px", boxShadow:"0 6px 24px rgba(0,0,0,0.14)", minWidth:200 }}>
                        <p style={{ margin:"0 0 6px", fontSize:14, fontWeight:700, color:C.slate }}>{d.name}</p>
                        <p style={{ margin:"0 0 8px", fontSize:14, fontWeight:700, color:d.fill }}>{d.ci} kg CO\u2082e/kg H\u2082</p>
                        <div style={{ display:"grid", gap:3 }}>
                          {[["Canada 40% ITC",itc40,"#16A34A"],["Canada 25% ITC",itc25,"#84CC16"],["Canada 15% ITC",itc15,"#FB923C"],["EU RFNBO",eu,C.amberM]].map(([label, qualifies, c])=>(
                            <div key={label} style={{ display:"flex", alignItems:"center", gap:7, padding:"3px 7px", borderRadius:5, background:qualifies?C.greenL:"#FFF1F2" }}>
                              <span style={{ fontSize:13, color:qualifies?C.green:C.red, fontWeight:700 }}>{qualifies?"\u2713":"\u2717"}</span>
                              <span style={{ fontSize:12, color:C.slate }}>{label}</span>
                              {qualifies && <span style={{ fontSize:13, fontWeight:700, color:c, marginLeft:"auto" }}>Qualifies</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }}/>
                  <ReferenceLine x={0.75} stroke="#16A34A" strokeDasharray="4 2" strokeWidth={2} label={{ value:"40% ITC", position:"insideTopRight", fontSize:10, fill:"#16A34A" }} />
                  <ReferenceLine x={2.0}  stroke="#84CC16" strokeDasharray="4 2" strokeWidth={2} label={{ value:"25% ITC", position:"insideTopRight", fontSize:10, fill:"#84CC16" }} />
                  <ReferenceLine x={3.4}  stroke={C.amberM} strokeDasharray="4 2" strokeWidth={2} label={{ value:"EU RFNBO", position:"insideTopRight", fontSize:10, fill:C.amberM }} />
                  <ReferenceLine x={4.0}  stroke="#FB923C" strokeDasharray="4 2" strokeWidth={2} label={{ value:"15% ITC", position:"insideTopRight", fontSize:10, fill:"#FB923C" }} />
                  <Bar dataKey="ci" name="Carbon intensity (kg CO\u2082e/kg)" radius={[0,4,4,0]}>
                    {CI_DATA.map((e, i) => <Cell key={i} fill={e.fill}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop:10, background:C.greenL, borderRadius:8, padding:"9px 12px", fontSize:13, color:C.greenD }}>
                <strong>ITC value at stake:</strong> For a $100M project, navigating the correct CI tier is worth up to $25M. Hover each bar to see exact qualification status.
              </div>
            </Card>
          </div>
        )}

        {tab === "taxonomy" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
              {[["Green","Net-zero aligned. Eligible for green finance and preferential capital.",C.green,C.greenL],["Amber","Credible transition in progress. Conditional eligibility with time-bound commitment.",C.amber,C.amberL],["Red","Not aligned. Ineligible under EU Taxonomy and Canada Green Bond Framework.",C.red,C.redL]].map(([l,d,c,bg])=>(
                <div key={l} style={{ background:bg, borderRadius:10, padding:"14px 16px" }}>
                  <p style={{ margin:"0 0 5px", fontSize:16, fontWeight:700, color:c }}>{l}</p>
                  <p style={{ margin:0, fontSize:14, color:c+"CC", lineHeight:1.5 }}>{d}</p>
                </div>
              ))}
            </div>
            <div style={{ display:"grid", gap:8 }}>
              {TAXONOMY.map(t => {
                const tc = taxColor(t.cls);
                return (
                  <Card key={t.sector} style={{ display:"flex", gap:14, alignItems:"flex-start", padding:"12px 16px" }}>
                    <div style={{ width:34, height:34, borderRadius:17, background:tc.bg, border:`2px solid ${tc.c}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:tc.c }}>{t.cls[0]}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:"0 0 3px", fontSize:15, fontWeight:600, color:C.slate }}>{t.sector}</p>
                      <p style={{ margin:0, fontSize:14, color:C.slateM }}>{t.criteria}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SIDEBAR NAV ───────────────────────────────────────────────────────
const SIDEBAR_NAV = [
  { id:"overview",   label:"Overview",           icon:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { id:"ecosystem",  label:"Ecosystem",           icon:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { id:"market",     label:"Market insights",     icon:"M3 17l4-8 4 4 4-6 4 10H3z" },
  { id:"map",        label:"Project map",          icon:"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" },
  { id:"newspolicy", label:"  Policy & News",       icon:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2l6 6M16 13H8M16 17H8M10 9H8" },
  { id:"needsboard", label:"  Needs board",         icon:"M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0-2-2h2a2 2 0 0 0 2 2m-3 7h6m-6 4h6" },
  { id:"capital",    label:"Sustainable capital", icon:"M12 3L2 9l10 6 10-6-10-6zM2 15l10 6 10-6M2 12l10 6 10-6" },
  { id:"health",     label:"Platform health",     icon:"M22 12h-4l-3 9L9 3l-3 9H2" },
];

// ── MAIN APP ──────────────────────────────────────────────────────────
const MAP_STYLES = {
  "2d":        "mapbox://styles/mapbox/light-v11",
  "globe":     "mapbox://styles/mapbox/outdoors-v12",
  "satellite": "mapbox://styles/mapbox/satellite-streets-v12",
};

// ═══════════════════════════════════════════════════════════════════════
// PLATFORM AUTO-UPDATE SYSTEM
// Daily  : news, policies, needs-board signals (24-hr localStorage cache)
// Quarterly: full market audit — projects, OEMs, policy, market data
// Powered by claude-sonnet-4-6 via /api/claude Vercel proxy (requires ANTHROPIC_API_KEY env var)
// ═══════════════════════════════════════════════════════════════════════

// ── Typed localStorage helpers ────────────────────────────────────────
const store = {
  get:    k     => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):null; } catch { return null; } },
  save:   (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} },
  del:    k     => { try { localStorage.removeItem(k); } catch {} },
  stamp:  k     => store.save("_ts_"+k, Date.now()),
  ageStr: k     => {
    const ts = store.get("_ts_"+k);
    if (!ts) return null;
    const h = Math.floor((Date.now()-ts)/3600000);
    const d = Math.floor(h/24);
    return d>0?`${d} day${d>1?"s":""} ago`: h>0?`${h}h ago`:"Just now";
  },
  isStale:(k,h) => { const ts=store.get("_ts_"+k); return !ts||(Date.now()-ts)>h*3600000; },
};

// ── Multi-turn Claude API with web_search tool ────────────────────────
// Handles tool_use rounds until stop_reason === "end_turn"
async function claudeFetch(system, user, onProgress) {
  // Calls /api/claude — a Vercel serverless function that holds the API key.
  // Requires ANTHROPIC_API_KEY set in Vercel → Settings → Environment Variables.
  const API_ENDPOINT = "/api/claude";

  const messages = [{ role:"user", content:user }];

  for (let round=0; round<8; round++) {
    onProgress?.(`Searching web… step ${round+1}`);

    let res;
    try {
      res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model:      "claude-sonnet-4-6",   // current stable model
          max_tokens: 4000,
          system,
          tools: [{ type:"web_search_20250305", name:"web_search" }],
          messages,
        }),
      });
    } catch (networkErr) {
      throw new Error(
        "Network error reaching /api/claude. " +
        "Make sure ANTHROPIC_API_KEY is set in Vercel environment variables. " +
        "Details: " + networkErr.message
      );
    }

    if (!res.ok) {
      let errText = "";
      try { errText = (await res.json()).error || ""; } catch {}
      if (res.status === 500 && errText.includes("ANTHROPIC_API_KEY")) {
        throw new Error(
          "API key not configured. Add ANTHROPIC_API_KEY in Vercel → Settings → Environment Variables, then redeploy."
        );
      }
      throw new Error(`API returned HTTP ${res.status}: ${errText}`);
    }

    const d = await res.json();
    if (d.error) throw new Error(d.error.message || "API error");

    if (d.stop_reason === "end_turn") {
      const text = (d.content || []).filter(b => b.type === "text").map(b => b.text).join("");
      // Try to find a JSON object anywhere in the response
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("Claude returned no JSON. Response was: " + text.slice(0, 200));
      return JSON.parse(m[0]);
    }

    if (d.stop_reason === "tool_use") {
      messages.push({ role:"assistant", content:d.content });
      const toolResults = (d.content || [])
        .filter(b => b.type === "tool_use")
        .map(b => ({ type:"tool_result", tool_use_id:b.id, content:"Search executed." }));
      if (!toolResults.length) break;
      messages.push({ role:"user", content:toolResults });
    } else {
      break;
    }
  }
  throw new Error("API call did not complete");
}

// ── Prompt templates ──────────────────────────────────────────────────
const _today = () => new Date().toLocaleDateString("en-CA",{year:"numeric",month:"long",day:"numeric"});

const DAILY_SYS = () =>
`You are a Canadian clean energy market intelligence agent with live web search access. Today is ${_today()}.
IMPORTANT: Return ONLY a valid JSON object — no markdown fences, no prose outside the JSON.`;

const DAILY_USER = () =>
`Search the web for the latest Canadian hydrogen market information published in the past 14 days and return as a single JSON object:
{
  "news": [
    {"date":"Mon DD","headline":"Full headline","tag":"Export|Policy|Funding|OEM|Signal|Tech","source":"Publication","url":"https://..."}
  ],
  "policies": [
    {"title":"Full policy name","jurisdiction":"Federal|AB|BC|NS|ON|QC|NB|NL|SK|Atlantic","value":"Incentive value or description","deadline":"Date or Ongoing","isNew":true,"source":"Issuing body","url":"https://..."}
  ],
  "needs": [
    {"org":"Organisation name","type":"RFP|EOI|CFP|RFI|RFQ","title":"Full procurement title","tech":"Technology or service type","deadline":"Date or status","contact":"email or url","posted":"Mon YYYY","status":"Open|Closed|Active","url":"https://official-source-url","desc":"2-3 sentence description of the procurement"}
  ],
  "fetchedAt":"${new Date().toISOString()}",
  "summary":"One sentence summary of key developments"
}
Rules: 3-5 items per category maximum. Every URL must be real and publicly accessible. Only include items you found through web search with verified sources.`;

const QUARTERLY_SYS = () =>
`You are a senior Canadian hydrogen market intelligence analyst with live web search access.
Today is ${_today()}.
Your task: conduct a comprehensive quarterly data audit of the Hydrogen Atlas platform by checking the latest IEA Hydrogen Production and Infrastructure Projects Database (June 2026 edition) and other authoritative sources for Canadian hydrogen projects.
IMPORTANT: Return ONLY a valid JSON object — no markdown fences, no text outside the JSON braces.`;

const QUARTERLY_USER = () =>
`Conduct a comprehensive quarterly data audit for the Hydrogen Atlas Canadian hydrogen intelligence platform. Follow these steps in order:

STEP 1 — IEA DATABASE (highest priority):
Search for the IEA Hydrogen Production and Infrastructure Projects Database June 2026 update at https://www.iea.org/data-and-statistics/data-product/hydrogen-production-and-infrastructure-projects-database
Check for: any Canadian project status changes, new Canadian projects added, projects removed or cancelled, capacity revisions. Also check the IEA Global Hydrogen Review 2025 for Canada-specific data.

STEP 2 — CANADIAN PROJECT STATUS CHANGES:
Search for news on each of these projects individually and report any status changes, FID decisions, capacity changes, or cancellations:
- Quest CCS (Shell, Fort Saskatchewan AB) — currently Operational
- Linde ATR+CCS (Fort Saskatchewan AB) — currently Construction
- Bear Head Energy / World Energy GH2 (NS) — currently Feasibility
- Burin Peninsula / Foresight Energy (NL) — currently Feasibility
- Point Tupper / EverWind Fuels (NS) — currently Feasibility
- ATCO Heartland Hydrogen Hub (AB) — currently Feasibility
- Tse'khene TETH (BC) — currently Feasibility
- Nujio'qonik / World Energy GH2 (NL) — currently Feasibility
- Niagara Hydrogen Centre / Atura Power (ON) — currently Construction
- Ekona Gold Creek demo (BC) — currently Demo
- Recyclage Carbone Varennes (QC) — currently Construction

STEP 3 — NEW CANADIAN PROJECTS:
Search for any new Canadian hydrogen projects announced or reaching FID in the past 90 days not already in the list above.

STEP 4 — INFRASTRUCTURE UPDATES:
Check for updates to Canadian H2 infrastructure: FortisBC blending, Enbridge H2 blending, HTEC fuelling network, Point Tupper terminal, Bécancour hub.

STEP 5 — OEM & ECOSYSTEM NEWS:
Search for major announcements from: Ballard Power, Ekona Power, HTEC, Aurora Hydrogen, Cellcentric Canada, Hydra Energy, Ayrton Energy.

STEP 6 — NATURAL HYDROGEN:
Search for updates on Canadian natural (geological) hydrogen exploration: Max Power Mining (Lawson project, SK), Vema Hydrogen (Quebec EMH project), Primary Hydrogen (BC/ON/NL), QIMC, Rev Exploration (AB), and the Geological Survey of Canada's mapping program. Report any new drilling results, new licences, or discoveries.

STEP 7 — MARKET & POLICY:
Check for updates from NRCan, CHA, CER on Canadian hydrogen policy, incentives, or market data published in the past 90 days.

Return ONLY this JSON object (no markdown, no text outside braces):
{
  "findings": [
    {
      "id": "unique-kebab-slug",
      "category": "projectStatus|newProject|infrastructure|oemUpdate|marketData|policy",
      "priority": "high|medium|low",
      "title": "Concise finding (max 80 chars)",
      "detail": "2-3 sentences: what changed, what the source says, why it matters for Hydrogen Atlas.",
      "currentValue": "What Hydrogen Atlas currently shows",
      "suggestedUpdate": "Specific update recommended (e.g. change stage from X to Y, add project Z with these fields)",
      "source": "Publication or body name",
      "url": "https://verified-source-url"
    }
  ],
  "iea_database_checked": true,
  "iea_database_version":"June 2026 (loaded)",
  "summary": "3-4 sentence executive summary of key findings for Hydrogen Atlas.",
  "dataConfidence": "high|medium|low",
  "auditDate": "${new Date().toISOString().split("T")[0]}",
  "totalFindings": 0
}`;

// ── useAutoUpdate hook ────────────────────────────────────────────────
function useAutoUpdate() {
  const [status,      setStatus]      = useState("idle"); // idle | loading | success | error
  const [progress,    setProgress]    = useState("");
  const [dailyData,   setDailyData]   = useState(() => store.get("au_daily"));
  const [auditLog,    setAuditLog]    = useState(() => store.get("au_quarterly") || []);
  const [appliedIds,  setAppliedIds]  = useState(() => store.get("au_applied")   || []);
  const [lastDailyTs, setLastDailyTs] = useState(() => store.ageStr("au_daily"));
  const [lastAuditTs, setLastAuditTs] = useState(() => store.ageStr("au_quarterly"));

  const dailyStale = store.isStale("au_daily",    24);
  const auditStale = store.isStale("au_quarterly", 24*90);

  // Daily refresh — news, policies, needs signals
  const runDaily = useCallback(async () => {
    if (status==="loading") return;
    setStatus("loading"); setProgress("Initialising daily update…");
    try {
      const data = await claudeFetch(DAILY_SYS(), DAILY_USER(), setProgress);
      store.save("au_daily", data); store.stamp("au_daily");
      setDailyData(data);
      setLastDailyTs(store.ageStr("au_daily"));
      setStatus("success"); setProgress("Daily update complete ✓");
      setTimeout(() => setProgress(""), 3000);
    } catch(e) {
      setStatus("error");
      setProgress("Daily update failed: " + e.message);
    }
  }, [status]);

  // Quarterly audit — full platform review
  const runQuarterly = useCallback(async () => {
    if (status==="loading") return;
    setStatus("loading"); setProgress("Starting quarterly audit…");
    try {
      const data = await claudeFetch(QUARTERLY_SYS(), QUARTERLY_USER(), setProgress);
      // Attach metadata and correct totalFindings
      data.totalFindings = (data.findings||[]).length;
      const entry = { ...data, ranAt: new Date().toISOString() };
      const newLog = [entry, ...(store.get("au_quarterly")||[])].slice(0,5); // keep 5 audits
      store.save("au_quarterly", newLog); store.stamp("au_quarterly");
      setAuditLog(newLog);
      setLastAuditTs(store.ageStr("au_quarterly"));
      setStatus("success"); setProgress("Quarterly audit complete ✓");
      setTimeout(() => setProgress(""), 3000);
    } catch(e) {
      setStatus("error");
      setProgress("Quarterly audit failed: " + e.message);
    }
  }, [status]);

  // Mark a finding as "reviewed & applied"
  const applyFinding = useCallback((id) => {
    const next = [...new Set([...appliedIds, id])];
    store.save("au_applied", next);
    setAppliedIds(next);
  }, [appliedIds]);

  const undoFinding = useCallback((id) => {
    const next = appliedIds.filter(x=>x!==id);
    store.save("au_applied", next);
    setAppliedIds(next);
  }, [appliedIds]);

  // Clear all cached data (reset to hardcoded defaults)
  const clearAll = useCallback(() => {
    ["au_daily","_ts_au_daily","au_quarterly","_ts_au_quarterly","au_applied"]
      .forEach(k=>store.del(k));
    setDailyData(null); setAuditLog([]); setAppliedIds([]);
    setLastDailyTs(null); setLastAuditTs(null);
    setStatus("idle"); setProgress("");
  }, []);

  // Auto-check on mount — show stale indicator but don't auto-fetch
  // (to avoid unexpected API calls and costs)
  useEffect(() => {
    // Re-check timestamps when component mounts (handles page refresh)
    setLastDailyTs(store.ageStr("au_daily"));
    setLastAuditTs(store.ageStr("au_quarterly"));
  }, []);

  return {
    status, progress,
    dailyData, auditLog, appliedIds,
    lastDailyTs, lastAuditTs, dailyStale, auditStale,
    runDaily, runQuarterly, applyFinding, undoFinding, clearAll,
  };
}

// ── RefreshHeader component — used inside Policy & News + Needs Board ─
function RefreshHeader({ title, lastUpdate, isStale, loading, progress, onRefresh, accentColor = C.teal }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, gap:12, flexWrap:"wrap" }}>
      <div>
        <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:C.slate }}>{title}</h2>
        {lastUpdate ? (
          <span style={{ fontSize:12, color: isStale ? C.amber : C.slateM }}>
            {isStale ? "⚠ " : "✓ "}Updated {lastUpdate}
            {isStale ? " — refresh recommended" : ""}
          </span>
        ) : (
          <span style={{ fontSize:12, color:C.slateM }}>Using built-in data — click Refresh to get live updates</span>
        )}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        {loading && <span style={{ fontSize:12, color:accentColor }}>{progress}</span>}
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", background:loading?"#F1F5F9":accentColor, color:loading?C.slateM:C.white, border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:loading?"not-allowed":"pointer", transition:"all 0.15s" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation:loading?"spin 1s linear infinite":"none" }}>
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          {loading ? "Updating…" : "Refresh now"}
        </button>
      </div>
    </div>
  );
}


// ── VIEW: POLICY & NEWS (news-article layout) ─────────────────────────
function NewsPolicyView({ updateCtx }) {
  const [tab, setTab] = useState("news");

  // Use live-refreshed data when available, fall back to built-in data
  const liveNews     = updateCtx?.dailyData?.news;
  const livePolicies = updateCtx?.dailyData?.policies;
  const displayNews     = liveNews     || NEWS_ITEMS;
  const displayPolicies = livePolicies || POLICIES;
  const isLoading = updateCtx?.status === "loading";

  return (
    <div style={{ height:"100%", overflow:"auto", background:C.bg }}>
      <div style={{ maxWidth:900, margin:"0 auto", padding:"24px 28px" }}>

        <RefreshHeader
          title="Policy & News"
          lastUpdate={updateCtx?.lastDailyTs}
          isStale={updateCtx?.dailyStale}
          loading={isLoading}
          progress={updateCtx?.progress}
          onRefresh={updateCtx?.runDaily}
          accentColor={C.teal}
        />

        {/* Tab selector */}
        <div style={{ display:"flex", gap:0, marginBottom:24, borderBottom:`2px solid ${C.border}` }}>
          {[["news","📰 Latest news"],["policy","📋 Policy tracker"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding:"9px 20px", border:"none", borderBottom:tab===id?`3px solid ${C.teal}`:"3px solid transparent", background:"none", cursor:"pointer", fontSize:14, fontWeight:tab===id?700:400, color:tab===id?C.teal:C.slateM, marginBottom:-2, transition:"all 0.15s" }}>{label}</button>
          ))}
        </div>

        {/* NEWS TAB — article layout */}
        {tab === "news" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:28 }}>
              {/* Featured story */}
              <div style={{ gridColumn:"1 / -1", background:C.white, borderRadius:12, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.07)", border:`0.5px solid ${C.border}` }}>
                <div style={{ background:`linear-gradient(135deg, ${C.teal}22, ${C.blue}11)`, padding:"20px 24px 16px" }}>
                  <Badge label="Featured" bg={C.teal} color={C.white} size={10} style={{ marginBottom:10 }} />
                  <h2 style={{ margin:"0 0 8px", fontSize:20, fontWeight:700, color:C.slate, lineHeight:1.35 }}>{displayNews[0]?.headline || NEWS_ITEMS[0].headline}</h2>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <Badge label={displayNews[0]?.tag || NEWS_ITEMS[0].tag} bg={NEWS_ITEMS[0].tag==="Policy"?C.tealL:NEWS_ITEMS[0].tag==="Funding"?C.blueL:C.amberL} color={NEWS_ITEMS[0].tag==="Policy"?C.teal:NEWS_ITEMS[0].tag==="Funding"?C.blue:C.amber} size={10} />
                    <span style={{ fontSize:12, color:C.slateM }}>{displayNews[0]?.date || NEWS_ITEMS[0].date}, 2026</span>
                    <SourceLink source={displayNews[0]?.source || NEWS_ITEMS[0].source} url={displayNews[0]?.url || NEWS_ITEMS[0].url} />
                  </div>
                </div>
              </div>

              {/* Remaining articles */}
              {displayNews.slice(1).map((n, i) => (
                <div key={i} style={{ background:C.white, borderRadius:10, padding:"16px 18px", boxShadow:"0 1px 8px rgba(0,0,0,0.06)", border:`0.5px solid ${C.border}` }}>
                  <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                    <Badge label={n.tag} bg={n.tag==="Policy"?C.tealL:n.tag==="Funding"?C.blueL:C.amberL} color={n.tag==="Policy"?C.teal:n.tag==="Funding"?C.blue:C.amber} size={10} />
                    <span style={{ fontSize:12, color:C.slateM }}>{n.date}, 2026</span>
                  </div>
                  <p style={{ margin:"0 0 10px", fontSize:14, fontWeight:600, color:C.slate, lineHeight:1.45 }}>{n.headline}</p>
                  <SourceLink source={n.source} url={n.url} />
                </div>
              ))}
            </div>

            {/* Market signals feed */}
            <div style={{ background:C.white, borderRadius:12, padding:"18px 22px", boxShadow:"0 1px 8px rgba(0,0,0,0.06)", border:`0.5px solid ${C.border}` }}>
              <h3 style={{ margin:"0 0 14px", fontSize:16, fontWeight:700, color:C.slate }}>📡 Active market signals</h3>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {DEMAND_SIGNALS.map((s,i) => {
                  const uc = urgColor(s.urgency);
                  return (
                    <div key={i} style={{ background:C.bg, borderRadius:8, padding:"12px 14px", border:`0.5px solid ${C.border}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.slate }}>{s.buyer}</p>
                        <Badge label={s.urgency} bg={uc.bg} color={uc.c} size={10} />
                      </div>
                      <p style={{ margin:"0 0 6px", fontSize:12, color:C.slateM }}>{s.type} · {s.volume} · {s.timeline}</p>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <Badge label={s.status} bg={s.status.includes("open")||s.status.includes("signed")?C.tealL:"#F1F5F9"} color={s.status.includes("open")||s.status.includes("signed")?C.teal:C.slateM} size={9} />
                        <SourceLink source={s.source} url={s.url} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* POLICY TAB — article layout */}
        {tab === "policy" && (
          <div>
            <div style={{ display:"grid", gap:16 }}>
              {displayPolicies.map((p, i) => (
                <div key={i} style={{ background:C.white, borderRadius:10, padding:"18px 22px", boxShadow:"0 1px 8px rgba(0,0,0,0.06)", border:`0.5px solid ${C.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:C.slate }}>{p.title}</h3>
                        {p.isNew && <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4, background:C.teal, color:C.white }}>NEW</span>}
                      </div>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        <Badge label={p.jurisdiction} bg={C.blueL} color={C.blue} size={10} />
                        <Badge label={p.value} bg={C.tealL} color={C.teal} size={10} />
                        <span style={{ fontSize:12, color:C.slateM }}>Deadline: {p.deadline}</span>
                      </div>
                    </div>
                    <SourceLink source={p.source} url={p.url} style={{ marginLeft:12, flexShrink:0 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── VIEW: NEEDS BOARD (RFP / Procurement signals) ─────────────────────
function NeedsBoardView({ updateCtx }) {
  const [showForm, setShowForm] = useState(false);
  const [postings] = useState([
    {
      org:"City of Mississauga — MiWay Transit",
      type:"RFI",
      title:"Request for Information — Hydrogen-as-a-Service (HaaS) fuel supply for 10 hydrogen fuel cell electric buses",
      tech:"H2 production, distribution & dispensing infrastructure",
      deadline:"Closed — submissions received July 2024",
      contact:"https://www.mississauga.ca/projects-and-strategies/city-projects/hydrogen-fuel-cell-electric-bus-pilot-project/",
      posted:"Jul 2024",
      status:"Closed",
      url:"https://www.mississauga.ca/projects-and-strategies/city-projects/hydrogen-fuel-cell-electric-bus-pilot-project/",
      desc:"Ontario's first municipal hydrogen fuel cell bus pilot. MiWay sought hydrogen supply partners under a HaaS model for 10 New Flyer XCelsior FC buses. Backed by $10M Federal Zero Emission Transit Fund. 9 submissions received and under evaluation. Partners: CUTRIC, New Flyer, Ballard Power Systems, Enbridge.",
    },
    {
      org:"Ontario IESO — Independent Electricity System Operator",
      type:"CFP",
      title:"2025 Hydrogen Innovation Fund — $30M Call for Applications (Stream 1: Grid Integration + Stream 2: Broader Applications)",
      tech:"H2 production, grid integration, transportation, heavy industry",
      deadline:"Closed — Feb 11, 2026 at 11:59 PM",
      contact:"hydrogeninnovationfund@ieso.ca",
      posted:"Nov 4, 2025",
      status:"Closed",
      url:"https://www.ieso.ca/Get-Involved/Innovation/Hydrogen-Innovation-Fund",
      desc:"$30M province-wide fund split equally across two streams: Stream 1 supports hydrogen integration with Ontario's electricity grid; Stream 2 supports broader applications including transportation, manufacturing, and heavy industry. Successful projects commence August 2026. Eligible: producers, users, Indigenous communities, municipalities, and industry groups.",
    },
    {
      org:"CUTRIC / Canadian Hydrogen Association / Government of Canada",
      type:"EOI",
      title:"Greater Toronto & Hamilton Area (GTHA) Hydrogen Fuel Options for Public Transit — Partner Engagement",
      tech:"H2 production, fuel supply, transit fleet integration",
      deadline:"Ongoing — planning through 2026",
      contact:"https://cutric-crituc.org/",
      posted:"Dec 2, 2025",
      status:"Active",
      url:"https://cutric-crituc.org/",
      desc:"$1.25M federal-backed planning initiative to assess hydrogen fuelling options for public transit agencies across the GTHA. Jointly announced by Minister Gregor Robertson, CHA, and CUTRIC. Seeks participation from transit agencies, hydrogen producers, infrastructure operators, and technology vendors across the region.",
    },
  ]);
  const TYPE_COLORS = { RFP:C.teal, EOI:C.blue, CFP:"#7C3AED", RFI:C.amber, RFQ:C.purple };
  const liveNeeds = updateCtx?.dailyData?.needs;
  const displayPostings = liveNeeds?.length ? liveNeeds : postings;
  const isLoading = updateCtx?.status === "loading";

  return (
    <div style={{ height:"100%", overflow:"auto", background:C.bg }}>
      <div style={{ maxWidth:900, margin:"0 auto", padding:"24px 28px" }}>
        <RefreshHeader
          title="Needs board"
          lastUpdate={updateCtx?.lastDailyTs}
          isStale={updateCtx?.dailyStale}
          loading={isLoading}
          progress={updateCtx?.progress}
          onRefresh={updateCtx?.runDaily}
          accentColor={C.blue}
        />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <p style={{ margin:0, fontSize:14, color:C.slateM }}>Post RFPs, EOIs, and procurement signals. Visible to all Hydrogen Atlas members.</p>
          <button onClick={() => setShowForm(true)} style={{ padding:"10px 18px", background:C.teal, color:C.white, border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
            + Post a need
          </button>
        </div>

        {/* Placeholder notice */}
        <div style={{ background:`linear-gradient(135deg, ${C.tealL}, ${C.blueL})`, borderRadius:12, padding:"16px 20px", marginBottom:20, border:`0.5px solid ${C.tealM}44` }}>
          <p style={{ margin:"0 0 4px", fontSize:14, fontWeight:700, color:C.slate }}>🚧 Coming soon — this feature is under development</p>
          <p style={{ margin:0, fontSize:12, color:C.slateM, lineHeight:1.5 }}>{liveNeeds?.length ? `Live procurement signals — last refreshed ${updateCtx?.lastDailyTs||"just now"}.` : "The Needs Board will allow public and private entities to post hydrogen-related procurement needs. Listings below are real, verified procurement signals. Click Refresh to check for new signals."}</p>
        </div>

        {/* Listings */}
        <div style={{ display:"grid", gap:14 }}>
          {displayPostings.map((post, i) => (
            <div key={i} style={{ background:C.white, borderRadius:12, padding:"18px 22px", boxShadow:"0 1px 8px rgba(0,0,0,0.07)", border:`0.5px solid ${C.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:5, background:(TYPE_COLORS[post.type]||C.teal)+"22", color:TYPE_COLORS[post.type]||C.teal, border:`1px solid ${TYPE_COLORS[post.type]||C.teal}44` }}>{post.type}</span>
                    <span style={{ fontSize:11, padding:"3px 9px", borderRadius:5, background:post.status==="Closed"?"#FEE2E2":post.status==="Active"?C.tealL:C.blueL, color:post.status==="Closed"?"#DC2626":post.status==="Active"?C.teal:C.blue, fontWeight:600 }}>{post.status}</span>
                    <span style={{ fontSize:12, color:C.slateL }}>Posted {post.posted}</span>
                  </div>
                  <h3 style={{ margin:"0 0 4px", fontSize:15, fontWeight:700, color:C.slate, lineHeight:1.4 }}>{post.title}</h3>
                  <p style={{ margin:0, fontSize:13, fontWeight:600, color:C.slateM }}>{post.org}</p>
                </div>
                <div style={{ textAlign:"right", marginLeft:16, flexShrink:0 }}>
                  <p style={{ margin:"0 0 4px", fontSize:11, color:C.slateM }}>Technology</p>
                  <p style={{ margin:"0 0 8px", fontSize:12, fontWeight:600, color:C.slate }}>{post.tech}</p>
                  <p style={{ margin:"0 0 2px", fontSize:11, color:C.slateM }}>Deadline</p>
                  <p style={{ margin:0, fontSize:12, fontWeight:700, color:C.amber }}>{post.deadline}</p>
                </div>
              </div>
              {post.desc && <p style={{ margin:"0 0 10px", fontSize:13, color:C.slateM, lineHeight:1.55 }}>{post.desc}</p>}
              <div style={{ borderTop:`0.5px solid ${C.border}`, paddingTop:10, display:"flex", gap:12, alignItems:"center" }}>
                <a href={post.url} target="_blank" rel="noreferrer" style={{ fontSize:12, color:C.blue, textDecoration:"none", fontWeight:500, display:"flex", alignItems:"center", gap:4 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  View official page
                </a>
                <button style={{ marginLeft:"auto", padding:"6px 14px", background:"none", border:`1px solid ${C.teal}`, color:C.teal, borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer" }}>Register interest</button>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <div style={{ background:C.white, borderRadius:14, padding:"22px 26px", maxWidth:500, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
                <div>
                  <p style={{ margin:"0 0 3px", fontSize:16, fontWeight:700, color:C.slate }}>Post a procurement need</p>
                  <p style={{ margin:0, fontSize:12, color:C.slateM }}>Visible to all Hydrogen Atlas members</p>
                </div>
                <button onClick={() => setShowForm(false)} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:C.slateM }}>✕</button>
              </div>
              <div style={{ background:C.amberL, borderRadius:8, padding:"10px 12px", marginBottom:16, border:`0.5px solid ${C.amberM}` }}>
                <p style={{ margin:0, fontSize:12, color:C.amber, fontWeight:600 }}>🚧 This feature is under development — submissions are not yet live.</p>
              </div>
              {[["Organisation name","Your organisation"],["Title","Describe what you need"],["Technology type","e.g. PEM electrolyser, fuel cell buses"],["Deadline","e.g. Sep 30, 2026"],["Contact email","For respondents to reach you"]].map(([label, placeholder]) => (
                <div key={label} style={{ marginBottom:10 }}>
                  <p style={{ margin:"0 0 4px", fontSize:11, fontWeight:700, color:C.slateM, textTransform:"uppercase" }}>{label}</p>
                  <input placeholder={placeholder} style={{ width:"100%", padding:"7px 10px", borderRadius:7, border:`0.5px solid ${C.border}`, fontSize:12, color:C.slate, background:C.white, boxSizing:"border-box", outline:"none", fontFamily:"inherit" }} />
                </div>
              ))}
              <button style={{ width:"100%", marginTop:6, padding:"10px 0", background:C.slateM, color:C.white, border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                Submit (coming soon)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ── VIEW: PLATFORM HEALTH (quarterly audit + data freshness dashboard) ─
function PlatformHealthView({ updateCtx }) {
  const { status, progress, lastDailyTs, lastAuditTs, dailyStale, auditStale,
          auditLog, appliedIds, runDaily, runQuarterly, applyFinding, undoFinding, clearAll } = updateCtx;

  const latestAudit = auditLog[0] || null;
  const isLoading = status === "loading";

  const PRIORITY_STYLE = {
    high:   { bg:"#FEE2E2", color:"#DC2626", label:"High priority" },
    medium: { bg:C.amberL,  color:C.amber,   label:"Medium" },
    low:    { bg:"#F1F5F9", color:C.slateM,  label:"Low" },
  };
  const CAT_ICON = {
    projectStatus:"📍", newProject:"🆕", oemUpdate:"🏭", marketData:"📊", policy:"📋",
  };

  return (
    <div style={{ height:"100%", overflow:"auto", background:C.bg }}>
      <div style={{ maxWidth:1000, margin:"0 auto", padding:"24px 28px" }}>

        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <h2 style={{ margin:"0 0 6px", fontSize:20, fontWeight:700, color:C.slate }}>Platform health & data updates</h2>
          <p style={{ margin:0, fontSize:14, color:C.slateM }}>Monitor data freshness, run live web searches, and review quarterly audit findings.</p>
        </div>

        {/* Setup instructions */}
        <div style={{ background:"#EEF2FF", borderRadius:10, padding:"12px 16px", marginBottom:20, border:"0.5px solid #C7D2FE" }}>
          <p style={{ margin:"0 0 6px", fontSize:13, fontWeight:700, color:"#4338CA" }}>⚙️ Setup required to enable live updates</p>
          <ol style={{ margin:0, paddingLeft:18, fontSize:12, color:"#4338CA", lineHeight:1.8 }}>
            <li>In your <strong>Vercel project</strong>, go to Settings → Environment Variables</li>
            <li>Add <code style={{ background:"#C7D2FE", padding:"1px 5px", borderRadius:3 }}>ANTHROPIC_API_KEY</code> with your Anthropic API key</li>
            <li>Redeploy the project (Vercel → Deployments → Redeploy)</li>
            <li>Return here and click <strong>Refresh now</strong> or <strong>Run quarterly audit now</strong></li>
          </ol>
          <p style={{ margin:"8px 0 0", fontSize:11, color:"#6366F1" }}>
            Get your API key at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={{ color:"#4338CA" }}>console.anthropic.com/settings/keys</a> · Uses claude-sonnet-4-6
          </p>
        </div>

        {/* Status bar */}
        {(isLoading || progress) && (
          <div style={{ background:isLoading?C.blueL:status==="error"?"#FEE2E2":C.tealL, borderRadius:10, padding:"10px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
            {isLoading && <div style={{ width:14, height:14, border:`2px solid ${C.blue}`, borderTop:"2px solid transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite", flexShrink:0 }}/>}
            <span style={{ fontSize:13, fontWeight:600, color:isLoading?C.blue:status==="error"?"#DC2626":C.teal }}>{progress}</span>
          </div>
        )}

        {/* Two-column grid: Daily + Quarterly */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>

          {/* Daily update card */}
          <div style={{ background:C.white, borderRadius:12, padding:"18px 22px", boxShadow:"0 1px 8px rgba(0,0,0,0.07)", border:`0.5px solid ${C.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div>
                <p style={{ margin:"0 0 3px", fontSize:15, fontWeight:700, color:C.slate }}>📰 Daily update</p>
                <p style={{ margin:0, fontSize:12, color:C.slateM }}>News · Policies · Procurement signals</p>
              </div>
              <div style={{ textAlign:"right" }}>
                {lastDailyTs ? (
                  <span style={{ fontSize:11, color:dailyStale?C.amber:C.green, fontWeight:600 }}>{dailyStale?"⚠ Stale":"✓ Fresh"}</span>
                ) : (
                  <span style={{ fontSize:11, color:C.slateM }}>Not yet run</span>
                )}
              </div>
            </div>
            <div style={{ background:C.bg, borderRadius:8, padding:"8px 12px", marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:12, color:C.slateM }}>Last updated</span>
                <span style={{ fontSize:12, fontWeight:600, color:C.slate }}>{lastDailyTs||"Never"}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                <span style={{ fontSize:12, color:C.slateM }}>Refresh interval</span>
                <span style={{ fontSize:12, fontWeight:600, color:C.slate }}>Every 24 hours</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                <span style={{ fontSize:12, color:C.slateM }}>Data scope</span>
                <span style={{ fontSize:12, fontWeight:600, color:C.slate }}>CA hydrogen news · policies · RFPs</span>
              </div>
            </div>
            <button onClick={runDaily} disabled={isLoading} style={{ width:"100%", padding:"9px 0", background:isLoading?"#F1F5F9":C.teal, color:isLoading?C.slateM:C.white, border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:isLoading?"not-allowed":"pointer" }}>
              {isLoading ? "Running…" : "🔄 Run daily update now"}
            </button>
          </div>

          {/* Quarterly audit card */}
          <div style={{ background:C.white, borderRadius:12, padding:"18px 22px", boxShadow:"0 1px 8px rgba(0,0,0,0.07)", border:`0.5px solid ${C.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div>
                <p style={{ margin:"0 0 3px", fontSize:15, fontWeight:700, color:C.slate }}>📊 Quarterly audit</p>
                <p style={{ margin:0, fontSize:12, color:C.slateM }}>Projects · OEMs · Market data · Policy</p>
              </div>
              <div style={{ textAlign:"right" }}>
                {lastAuditTs ? (
                  <span style={{ fontSize:11, color:auditStale?C.amber:C.green, fontWeight:600 }}>{auditStale?"⚠ Due":"✓ Current"}</span>
                ) : (
                  <span style={{ fontSize:11, color:C.slateM }}>Not yet run</span>
                )}
              </div>
            </div>
            <div style={{ background:C.bg, borderRadius:8, padding:"8px 12px", marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:12, color:C.slateM }}>Last audit</span>
                <span style={{ fontSize:12, fontWeight:600, color:C.slate }}>{lastAuditTs||"Never"}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                <span style={{ fontSize:12, color:C.slateM }}>Audit interval</span>
                <span style={{ fontSize:12, fontWeight:600, color:C.slate }}>Every 90 days</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                <span style={{ fontSize:12, color:C.slateM }}>Scope</span>
                <span style={{ fontSize:12, fontWeight:600, color:C.slate }}>80 projects · 19 OEMs · all data</span>
              </div>
            </div>
            <button onClick={runQuarterly} disabled={isLoading} style={{ width:"100%", padding:"9px 0", background:isLoading?"#F1F5F9":"#7C3AED", color:isLoading?C.slateM:C.white, border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:isLoading?"not-allowed":"pointer" }}>
              {isLoading ? "Running…" : "🔍 Run quarterly audit now"}
            </button>
          </div>
        </div>

        {/* Latest audit findings */}
        {latestAudit && (
          <div style={{ marginBottom:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div>
                <h3 style={{ margin:"0 0 3px", fontSize:16, fontWeight:700, color:C.slate }}>Latest audit findings</h3>
                <p style={{ margin:0, fontSize:12, color:C.slateM }}>Audited: {latestAudit.auditDate} · Confidence: {latestAudit.dataConfidence} · {(latestAudit.findings||[]).length} findings</p>
              </div>
            </div>

            {/* Summary */}
            {latestAudit.summary && (
              <div style={{ background:C.blueL, borderRadius:10, padding:"12px 16px", marginBottom:14, border:`0.5px solid ${C.blueM}44` }}>
                <p style={{ margin:0, fontSize:13, color:C.slate, lineHeight:1.6 }}>{latestAudit.summary}</p>
              </div>
            )}

            {/* Findings list */}
            <div style={{ display:"grid", gap:10 }}>
              {(latestAudit.findings||[]).map((f, i) => {
                const isApplied = appliedIds.includes(f.id);
                const ps = PRIORITY_STYLE[f.priority] || PRIORITY_STYLE.low;
                return (
                  <div key={f.id||i} style={{ background:C.white, borderRadius:10, padding:"14px 18px", border:`0.5px solid ${isApplied?C.teal:C.border}`, boxShadow:"0 1px 6px rgba(0,0,0,0.06)", opacity:isApplied?0.75:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:5 }}>
                          <span style={{ fontSize:14 }}>{CAT_ICON[f.category]||"📌"}</span>
                          <span style={{ fontSize:12, fontWeight:700, padding:"2px 8px", borderRadius:4, background:ps.bg, color:ps.color }}>{f.priority?.toUpperCase()}</span>
                          <Badge label={f.category} bg={C.bg} color={C.slateM} size={10} />
                        </div>
                        <p style={{ margin:"0 0 4px", fontSize:14, fontWeight:700, color:C.slate }}>{f.title}</p>
                        <p style={{ margin:"0 0 6px", fontSize:12, color:C.slateM, lineHeight:1.5 }}>{f.detail}</p>
                        {f.suggestedUpdate && (
                          <div style={{ background:"#F0FDF4", borderRadius:6, padding:"6px 10px", marginBottom:6 }}>
                            <p style={{ margin:0, fontSize:12, color:"#166534" }}><strong>Suggested update:</strong> {f.suggestedUpdate}</p>
                          </div>
                        )}
                        {f.url && <SourceLink source={f.source||"Source"} url={f.url} />}
                      </div>
                      <div style={{ marginLeft:12, flexShrink:0 }}>
                        {isApplied ? (
                          <button onClick={()=>undoFinding(f.id)} style={{ padding:"5px 12px", background:"none", border:`1px solid ${C.border}`, color:C.slateM, borderRadius:6, fontSize:12, cursor:"pointer" }}>Undo</button>
                        ) : (
                          <button onClick={()=>applyFinding(f.id)} style={{ padding:"5px 12px", background:C.teal, color:C.white, border:"none", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer" }}>✓ Mark reviewed</button>
                        )}
                      </div>
                    </div>
                    {isApplied && <p style={{ margin:0, fontSize:11, color:C.teal, fontWeight:600 }}>✓ Reviewed — flagged for implementation</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Audit history */}
        {auditLog.length > 1 && (
          <div style={{ background:C.white, borderRadius:12, padding:"16px 20px", marginBottom:20, boxShadow:"0 1px 6px rgba(0,0,0,0.06)", border:`0.5px solid ${C.border}` }}>
            <p style={{ margin:"0 0 10px", fontSize:14, fontWeight:700, color:C.slate }}>Audit history</p>
            {auditLog.slice(1).map((a, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:i<auditLog.length-2?`0.5px solid ${C.border}`:"none" }}>
                <span style={{ fontSize:13, color:C.slateM }}>{a.auditDate}</span>
                <span style={{ fontSize:13, color:C.slate }}>{(a.findings||[]).length} findings · confidence: {a.dataConfidence}</span>
              </div>
            ))}
          </div>
        )}

        {/* Danger zone */}
        <div style={{ background:"#FFF7F7", borderRadius:10, padding:"14px 18px", border:"0.5px solid #FECACA" }}>
          <p style={{ margin:"0 0 6px", fontSize:13, fontWeight:700, color:"#DC2626" }}>Reset cached data</p>
          <p style={{ margin:"0 0 10px", fontSize:12, color:C.slateM }}>Clears all locally cached updates. The platform will revert to its built-in data until the next refresh.</p>
          <button onClick={clearAll} style={{ padding:"7px 16px", background:"none", border:"1px solid #DC2626", color:"#DC2626", borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Clear all cached data
          </button>
        </div>

      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}


export default function App() {
  const [active, setActive] = useState("overview");
  const [mapStyle, setMapStyle] = useState("2d");
  const styleUrl = MAP_STYLES[mapStyle];
  const isMapView = ["overview","map","market","ecosystem"].includes(active);

  // Platform auto-update system (daily + quarterly)
  const updateCtx = useAutoUpdate();

  // Auto-suggest daily update if stale when user opens Policy & News or Needs Board
  useEffect(() => {
    if ((active === "newspolicy" || active === "needsboard") && updateCtx.dailyStale) {
      // Show stale indicator — user decides whether to refresh
    }
  }, [active]);

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", fontFamily:"'DM Sans',system-ui,sans-serif", color:C.slate }}>

      {/* SIDEBAR */}
      <div style={{ width:214, background:C.nav, display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"18px 18px 14px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <p style={{ margin:"0 0 2px", fontSize:17, fontWeight:700, color:C.white, letterSpacing:"-0.02em" }}>Hydrogen Atlas</p>
          <span style={{ fontSize:11, color:C.tealM, fontWeight:700, letterSpacing:"0.07em" }}>EARLY ACCESS · CANADA H2</span>
        </div>
        <nav style={{ flex:1, padding:"10px 8px" }}>
          {SIDEBAR_NAV.map(n => {
            const isAct = active === n.id;
            const showAlert = n.id==="health" && (updateCtx.dailyStale || updateCtx.auditStale);
            return (
              <button key={n.id} onClick={() => setActive(n.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 12px", border:"none", borderRadius:8, background:isAct?"rgba(13,122,107,0.2)":"transparent", cursor:"pointer", marginBottom:2, textAlign:"left", transition:"background 0.15s" }}
                onMouseEnter={e => !isAct && (e.currentTarget.style.background="rgba(255,255,255,0.05)")}
                onMouseLeave={e => !isAct && (e.currentTarget.style.background="transparent")}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isAct?C.tealM:"#64748B"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={n.icon}/>
                </svg>
                <span style={{ fontSize:15, fontWeight:isAct?600:400, color:isAct?C.tealM:"#94A3B8" }}>{n.label}</span>
                {isAct && <div style={{ width:5, height:5, borderRadius:"50%", background:C.tealM, marginLeft:"auto" }}/>}
                {showAlert && !isAct && <div style={{ width:7, height:7, borderRadius:"50%", background:C.amber, marginLeft:"auto", flexShrink:0 }} title="Data update available"/>}
              </button>
            );
          })}
        </nav>
        <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ margin:"0 0 1px", fontSize:12, color:"#475569" }}>Canadian H2 Market</p>
          <p style={{ margin:0, fontSize:11, color:"#334155" }}>Data: May 2026 · Pre-MVP</p>
        </div>
      </div>

      {/* MAIN AREA */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Top bar */}
        <div style={{ background:C.white, borderBottom:`0.5px solid ${C.border}`, padding:"0 20px", height:48, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <h1 style={{ margin:0, fontSize:16, fontWeight:600, color:C.slate }}>
              {{ overview:"Overview", map:"Project map", needsboard:"Needs board", market:"Market insights", newspolicy:"Policy & News", ecosystem:"Ecosystem", capital:"Sustainable capital", health:"Platform health" }[active]}
            </h1>
            <p style={{ margin:0, fontSize:12, color:C.slateL }}>Canadian Hydrogen & Its Derivatives Intelligence Platform</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ position:"relative" }}>
              <input placeholder="Search…" style={{ fontSize:14, padding:"6px 10px 6px 28px", borderRadius:7, border:`0.5px solid ${C.border}`, background:C.bg, width:200, outline:"none" }}/>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.slateL} strokeWidth="2" strokeLinecap="round" style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)" }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <div style={{ position:"relative", cursor:"pointer" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.slateM} strokeWidth="1.8" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <div style={{ position:"absolute", top:-2, right:-2, width:7, height:7, borderRadius:"50%", background:C.teal, border:`1.5px solid ${C.white}` }}/>
            </div>
            <div style={{ width:30, height:30, borderRadius:"50%", background:C.teal, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:C.white, cursor:"pointer" }}>U</div>
          </div>
        </div>

        {/* Content — map views fill all space, capital scrolls */}
        <div style={{ flex:1, overflow:"hidden", position:"relative" }}>
          {active === "overview"   && <OverviewView  mapStyle={mapStyle} setMapStyle={setMapStyle} styleUrl={styleUrl} />}
          {active === "map"        && <ProjectMapView styleUrl={styleUrl} />}
          {active === "market"     && <MarketView     styleUrl={styleUrl} />}
          {active === "newspolicy" && <NewsPolicyView updateCtx={updateCtx} />}
          {active === "needsboard" && <NeedsBoardView updateCtx={updateCtx} />}
          {active === "health"     && <PlatformHealthView updateCtx={updateCtx} />}
          {active === "ecosystem"  && <EcosystemView  styleUrl={styleUrl} />}
          {active === "capital"    && <CapitalView />}
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
      `}</style>
    </div>
  );
}
