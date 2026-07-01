"use client";

import React, { useMemo } from "react";
import { useData } from "@/context/data-context";
import { PageHeader } from "@/components/page-header";
import collectionData from "@/data/collection_data.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { motion, AnimatePresence } from "framer-motion";
import { SearchX, FileSpreadsheet } from "lucide-react";
import { CollectionGlobalFilters } from "@/components/collection-global-filters";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

// Map short month names to numbers
const monthMap: Record<string, number> = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

// Convert collection JSON month format ("Apr-25", "Mar 2026") → "YYYY-MM"
const rawToYYYYMM = (rawMonth: string): string | null => {
  let mon = "",
    yy = "";
  if (rawMonth.includes("-")) {
    [mon, yy] = rawMonth.split("-");
  } else if (rawMonth.includes(" ")) {
    const parts = rawMonth.split(" ");
    mon = parts[0].substring(0, 3);
    yy = parts[1].substring(2, 4);
  } else {
    return null;
  }
  const mNum = monthMap[mon];
  if (!mNum) return null;
  return `20${yy}-${String(mNum).padStart(2, "0")}`;
};

export default function CollectionPage() {
  const { claims, cleanedClaims, filters, isLoading } = useData();

  // 1. Extract unique provider names from claims (respecting provider/doctor filter only)
  const providersFromClaims = useMemo(() => {
    if (filters.provider.length > 0) {
      return filters.provider;
    }
    const claimProviders = cleanedClaims.map((c: any) => c.doctorName as string);
    const collectionProviders = new Set<string>();
    collectionData.forEach((row: any) => {
      Object.keys(row).forEach((key) => {
        if (key !== "__EMPTY" && key !== "Total") {
          let niceName = key;
          if (key === "Bruce J Buckman,DPT") niceName = "Bruce J Buckman - PT";
          else if (key === "Peter J Berger,DC") niceName = "Peter J Berger - Chiro";
          else if (key === "Madison Smith") niceName = "Madison Lynn Smith - OT";
          else if (key === "Christian Gartner") niceName = "Christian S Gartner - PT";
          else if (key === "Jay Brecker") niceName = "Jay E Brecker - Chiro";
          else if (key === "Monroe Castro") niceName = "Monreo Castro - PT";
          else if (key === "BILLY FORD,MD") niceName = "Billy Ford - Pain Mgmt";
          else if (key === "DAVID ADIN,DO - PAIN MGMT") niceName = "David Adin - Pain Mgmt";
          else if (key === "SRIDHAR YALAMANCHILI,PT") niceName = "Sridhar Yalamanchili - PT";
          else if (key === "ANDY KOSER,PT") niceName = "Andy Koser - PT";
          else if (key === "MARIANNE DECASTRO,PT") niceName = "Marianne Decastro - PT";
          else if (key === "Micheal Kelly") niceName = "Michael Kelly - Chiro";
          collectionProviders.add(niceName);
        }
      });
    });
    return Array.from(new Set([...claimProviders, ...Array.from(collectionProviders)])).filter(Boolean);
  }, [cleanedClaims, filters.provider]);

  // 2. Extract all provider column keys from the collection JSON
  const availableCollectionKeys = useMemo(() => {
    if (!collectionData || collectionData.length === 0) return [];
    const keysSet = new Set<string>();
    collectionData.forEach((row: any) => {
      Object.keys(row).forEach((k) => {
        if (k !== "__EMPTY") keysSet.add(k);
      });
    });
    return Array.from(keysSet);
  }, []);

  // 3. Fuzzy-match claim provider names to collection JSON column keys
  const activeCollectionKeys = useMemo(() => {
    const matched = new Set<string>();
    console.log("providersFromClaims is", providersFromClaims);
    providersFromClaims.forEach((claimName) => {
      const cleanClaimBase = claimName
        .split(" - ")[0]
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, "")
        .trim();
      const claimWords = cleanClaimBase
        .split(" ")
        .filter(
          (w) =>
            w.length > 2 && !["dpt", "dc", "md", "do", "pt", "ot"].includes(w),
        );

      const match = availableCollectionKeys.find((k) => {
        const cleanKey = k
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, "")
          .trim();
        const keyWords = cleanKey
          .split(" ")
          .filter(
            (w) =>
              w.length > 2 &&
              !["dpt", "dc", "md", "do", "pt", "ot"].includes(w),
          );
        if (
          cleanClaimBase.includes(cleanKey) ||
          cleanKey.includes(cleanClaimBase)
        )
          return true;
        let matchCount = 0;
        claimWords.forEach((cw) => {
          if (keyWords.includes(cw)) matchCount++;
        });
        return matchCount >= 1;
      });

      console.log(`Matched claimName ${claimName} -> ${match}`);
      if (match) matched.add(match);
    });
    console.log("activeCollectionKeys ->", Array.from(matched));
    return Array.from(matched);
  }, [providersFromClaims, availableCollectionKeys]);

  // 4. Aggregate collection data — respects the global filters.month
  const {
    totalTillNow,
    year2025,
    year2026,
    quarterly,
    monthlyData,
    providerBreakdown,
  } = useMemo(() => {
    if (activeCollectionKeys.length === 0) {
      return {
        totalTillNow: 0,
        year2025: 0,
        year2026: 0,
        quarterly: [],
        monthlyData: [],
        providerBreakdown: [],
      };
    }

    let tNow = 0;
    let y2025 = 0;
    let y2026 = 0;

    const quartersMap: Record<string, number> = {
      "Q2 2025": 0,
      "Q3 2025": 0,
      "Q4 2025": 0,
      "Q1 2026": 0,
      "Q2 2026": 0,
    };

    const pMap: Record<string, number> = {};
    const mData: any[] = [];

    collectionData.forEach((row: any) => {
      const rawMonth = row["__EMPTY"]; // e.g. "Apr-25" or "Mar 2026"
      if (!rawMonth || String(rawMonth).toLowerCase() === "total") return;

      let mon = "";
      let yy = "";

      if (rawMonth.includes("-")) {
        [mon, yy] = rawMonth.split("-");
      } else if (rawMonth.includes(" ")) {
        const parts = rawMonth.split(" ");
        mon = parts[0].substring(0, 3);
        yy = parts[1].substring(2, 4);
      }

      const mNum = monthMap[mon];

      // Apply global month filter — convert JSON month to YYYY-MM for comparison
      if (filters.month.length > 0) {
        const rowKey = rawToYYYYMM(rawMonth);
        if (!rowKey || !filters.month.includes(rowKey)) return;
      }

      let monthlyAgg = 0;

      activeCollectionKeys.forEach((providerKey) => {
        const amount = Number(row[providerKey]) || 0;
        if (amount > 0) {
          monthlyAgg += amount;
          pMap[providerKey] = (pMap[providerKey] || 0) + amount;
        }
      });

      if (monthlyAgg > 0) {
        tNow += monthlyAgg;
        if (yy === "25") y2025 += monthlyAgg;
        if (yy === "26") y2026 += monthlyAgg;

        if (yy === "25") {
          if (mNum >= 4 && mNum <= 6) quartersMap["Q2 2025"] += monthlyAgg;
          if (mNum >= 7 && mNum <= 9) quartersMap["Q3 2025"] += monthlyAgg;
          if (mNum >= 10 && mNum <= 12) quartersMap["Q4 2025"] += monthlyAgg;
        } else if (yy === "26") {
          if (mNum >= 1 && mNum <= 3) quartersMap["Q1 2026"] += monthlyAgg;
          if (mNum >= 4 && mNum <= 6) quartersMap["Q2 2026"] += monthlyAgg;
        }

        mData.push({ month: rawMonth, collection: monthlyAgg });
      }
    });

    const qData = Object.keys(quartersMap)
      .map((k) => ({ quarter: k, amount: quartersMap[k] }))
      .filter((q) => q.amount > 0);

    const pData = Object.keys(pMap)
      .map((k) => ({ name: k, amount: pMap[k] }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalTillNow: tNow,
      year2025: y2025,
      year2026: y2026,
      quarterly: qData,
      monthlyData: mData,
      providerBreakdown: pData,
    };
  }, [activeCollectionKeys, filters.month]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }



  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="p-6 max-w-7xl mx-auto space-y-6 w-full relative">
          <div className="absolute top-6 left-2 md:hidden">
            <SidebarTrigger />
          </div>
          <PageHeader title="Provider Collection Details" />

          <CollectionGlobalFilters />

          {filters.provider.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-3 bg-primary/5 p-4 rounded-xl border border-primary/10"
            >
              <div className="text-sm font-medium text-primary mr-2 flex items-center">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Raw Data Reports ({filters.provider[0]}):
              </div>
              {[
                { name: "Jan 2026", file: "Jan_2026.xlsx" },
                { name: "Feb 2026", file: "Feb_2026.xlsx" },
                { name: "March 2026", file: "March_2026.xlsx" },
                { name: "April 2026", file: "April_2026.xlsx" },
                { name: "May 2026", file: "May_2026.xlsx" },
                { name: "June 2026", file: "June_2026.xlsx" },
              ].map((report) => (
                <a
                  key={report.name}
                  href={`/${report.file}`}
                  download
                  className="text-xs font-semibold bg-background hover:bg-primary/10 hover:text-primary text-foreground border border-border shadow-sm px-3 py-1.5 rounded-md transition-colors"
                >
                  {report.name}
                </a>
              ))}
            </motion.div>
          )}

      {activeCollectionKeys.length === 0 ? (
        <Card className="bg-destructive/5 border-destructive/20 h-40 flex flex-col items-center justify-center text-center">
          <SearchX className="h-8 w-8 text-destructive/50 mb-3" />
          <h3 className="font-bold text-destructive">
            No matching collection records found.
          </h3>
          <p className="text-sm text-destructive/70 mt-1 max-w-md">
            Try adjusting your filters or ensure your uploaded claims contain
            providers matching the internal collection report.
          </p>
        </Card>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="space-y-6"
          >
            {/* Summary Cards — 3 cols, no Current Quarter */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div variants={itemVariants}>
                <Card className="flex flex-col justify-center h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Collection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">
                      $
                      {totalTillNow.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeCollectionKeys.length} matching providers
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="flex flex-col justify-center h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      2025 Calendar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      $
                      {year2025.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      April – December
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="flex flex-col justify-center h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      2026 Calendar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      $
                      {year2026.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      January – June
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trend Area Chart */}
              <motion.div variants={itemVariants} className="h-full">
                <Card className="flex flex-col h-full">
                  <CardHeader>
                    <CardTitle>Monthly Gross Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 pb-4 min-h-[350px]">
                    <ChartContainer
                      config={{
                        collection: {
                          label: "Collection",
                          color: "var(--color-primary)",
                        },
                      }}
                      className="h-full w-full"
                    >
                      <AreaChart
                        data={monthlyData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="grossLineGradient"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop
                              offset="0%"
                              stopColor="var(--color-chart-1)"
                            />
                            <stop
                              offset="50%"
                              stopColor="var(--color-chart-2)"
                            />
                            <stop
                              offset="100%"
                              stopColor="var(--color-chart-5)"
                            />
                          </linearGradient>
                          <linearGradient
                            id="grossAreaGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="var(--color-chart-2)"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor="var(--color-chart-2)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          strokeOpacity={0.2}
                        />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                          style={{
                            fontSize: "12px",
                            fill: "var(--color-muted-foreground)",
                          }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                          tickFormatter={(val) => `$${val.toLocaleString()}`}
                          style={{
                            fontSize: "11px",
                            fill: "var(--color-muted-foreground)",
                          }}
                          domain={[
                            0,
                            (dataMax: number) => Math.ceil(dataMax * 1.1),
                          ]}
                        />
                        <ChartTooltip
                          cursor={{
                            fill: "var(--color-primary)",
                            opacity: 0.1,
                          }}
                          content={<ChartTooltipContent />}
                        />
                        <Area
                          type="monotone"
                          dataKey="collection"
                          stroke="url(#grossLineGradient)"
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#grossAreaGradient)"
                          dot={{
                            fill: "var(--color-background)",
                            stroke: "var(--color-chart-2)",
                            strokeWidth: 2,
                            r: 4,
                          }}
                          activeDot={{
                            r: 6,
                            fill: "var(--color-chart-5)",
                            stroke: "var(--color-background)",
                            strokeWidth: 2,
                          }}
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quarterly Bar Chart */}
              <motion.div variants={itemVariants} className="h-full">
                <Card className="flex flex-col h-full">
                  <CardHeader>
                    <CardTitle>Quarterly Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 pb-4 min-h-[350px]">
                    <ChartContainer
                      config={{
                        amount: {
                          label: "Quarterly",
                          color: "var(--color-chart-2)",
                        },
                      }}
                      className="h-full w-full"
                    >
                      <BarChart
                        data={quarterly}
                        margin={{ top: 30, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          strokeOpacity={0.2}
                        />
                        <XAxis
                          dataKey="quarter"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                          style={{
                            fontSize: "12px",
                            fill: "var(--color-muted-foreground)",
                          }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                          tickFormatter={(val) => `$${val.toLocaleString()}`}
                          style={{
                            fontSize: "11px",
                            fill: "var(--color-muted-foreground)",
                          }}
                          domain={[
                            0,
                            (dataMax: number) => Math.ceil(dataMax * 1.25),
                          ]}
                        />
                        <ChartTooltip
                          cursor={{
                            fill: "var(--color-chart-2)",
                            opacity: 0.1,
                          }}
                          content={<ChartTooltipContent />}
                        />
                        <Bar
                          dataKey="amount"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={60}
                        >
                          {quarterly.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill="var(--color-chart-2)"
                            />
                          ))}
                          <LabelList
                            dataKey="amount"
                            position="top"
                            content={(props: any) => {
                              const { x, y, width, value } = props;
                              if (value == null) return null;
                              return (
                                <text
                                  x={(x as number) + (width as number) / 2}
                                  y={(y as number) - 10}
                                  textAnchor="middle"
                                  fontSize={11}
                                  fill="var(--color-chart-2)"
                                  fontWeight="700"
                                >
                                  $
                                  {(value as number).toLocaleString(undefined, {
                                    maximumFractionDigits: 0,
                                  })}
                                </text>
                              );
                            }}
                          />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Provider Breakdown Bar Chart */}
              <motion.div
                variants={itemVariants}
                className="h-full lg:col-span-2"
              >
                <Card className="flex flex-col h-full">
                  <CardHeader>
                    <CardTitle>Collection by Provider</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 pb-4 min-h-[450px]">
                    <ChartContainer
                      config={{
                        amount: {
                          label: "Collection",
                          color: "var(--color-chart-3)",
                        },
                      }}
                      className="h-full w-full"
                    >
                      <BarChart
                        data={providerBreakdown}
                        layout="vertical"
                        margin={{ top: 5, right: 120, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={true}
                          vertical={false}
                          strokeOpacity={0.2}
                        />
                        <XAxis
                          type="number"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                          style={{ fill: "var(--color-muted-foreground)" }}
                          domain={[
                            0,
                            (dataMax: number) => Math.ceil(dataMax * 1.3),
                          ]}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={180}
                          tickLine={false}
                          axisLine={false}
                          style={{
                            fontSize: "11px",
                            fill: "var(--color-muted-foreground)",
                          }}
                        />
                        <ChartTooltip
                          cursor={{
                            fill: "var(--color-chart-3)",
                            opacity: 0.1,
                          }}
                          content={<ChartTooltipContent />}
                        />
                        <Bar
                          dataKey="amount"
                          radius={[0, 4, 4, 0]}
                          maxBarSize={40}
                        >
                          {providerBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`var(--color-chart-${(index % 5) + 1})`}
                            />
                          ))}
                          <LabelList
                            dataKey="amount"
                            position="right"
                            content={(props: any) => {
                              const { x, y, width, height, value } = props;
                              if (value == null) return null;
                              const pct = (
                                (value / totalTillNow) * 100 || 0
                              ).toFixed(1);
                              const rx = (x as number) + (width as number) + 10;
                              const ry =
                                (y as number) + (height as number) / 2 + 4;
                              return (
                                <text x={rx} y={ry} fontSize={11}>
                                  <tspan fill="#16a34a" fontWeight={700}>
                                    $
                                    {(value as number).toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )}
                                  </tspan>
                                  <tspan
                                    fill="var(--color-muted-foreground)"
                                    dx={8}
                                  >
                                    {`(${pct}%)`}
                                  </tspan>
                                </text>
                              );
                            }}
                          />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
