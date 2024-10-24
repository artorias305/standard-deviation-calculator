"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  X,
  Upload,
  Download,
  BarChart as BarChartIcon,
  LineChart,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

type DataPoint = {
  index: number;
  value: number;
};

type HistogramBin = {
  binStart: number;
  binEnd: number;
  frequency: number;
};

export default function StandardDeviationCalculator() {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [mean, setMean] = useState<number | null>(null);
  const [median, setMedian] = useState<number | null>(null);
  const [mode, setMode] = useState<number | null>(null);
  const [range, setRange] = useState<number | null>(null);
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [histogramData, setHistogramData] = useState<HistogramBin[]>([]);
  const [activeTab, setActiveTab] = useState<string>("bar");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addNumber = () => {
    const num = parseFloat(inputValue);
    if (!isNaN(num) && isFinite(num)) {
      const newNumbers = [...numbers, num];
      setNumbers(newNumbers);
      setInputValue("");
      inputRef.current?.focus();
      updateChartData(newNumbers);
    }
  };

  const deleteNumber = (index: number) => {
    const newNumbers = numbers.filter((_, i) => i !== index);
    setNumbers(newNumbers);
    updateChartData(newNumbers);
    resetResults();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (event.shiftKey || event.ctrlKey) {
        calculateStatistics();
      } else {
        addNumber();
      }
    }
  };

  const calculateStatistics = () => {
    if (numbers.length < 2) {
      alert("Please enter at least two numbers");
      return;
    }

    const sortedNumbers = [...numbers].sort((a, b) => a - b);
    const calculatedMean =
      numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDifferences = numbers.map((num) =>
      Math.pow(num - calculatedMean, 2)
    );
    const variance =
      squaredDifferences.reduce((sum, num) => sum + num, 0) /
      (numbers.length - 1);
    const standardDeviation = Math.sqrt(variance);

    setResult(standardDeviation);
    setMean(calculatedMean);
    setMedian(calculateMedian(sortedNumbers));
    setMode(calculateMode(numbers));
    setRange(sortedNumbers[sortedNumbers.length - 1] - sortedNumbers[0]);
    updateChartData(numbers, calculatedMean, standardDeviation);
  };

  const calculateMedian = (sortedArr: number[]): number => {
    const mid = Math.floor(sortedArr.length / 2);
    return sortedArr.length % 2 !== 0
      ? sortedArr[mid]
      : (sortedArr[mid - 1] + sortedArr[mid]) / 2;
  };

  const calculateMode = (arr: number[]): number => {
    const frequency: { [key: number]: number } = {};
    let maxFreq = 0;
    let mode = arr[0];

    arr.forEach((num) => {
      frequency[num] = (frequency[num] || 0) + 1;
      if (frequency[num] > maxFreq) {
        maxFreq = frequency[num];
        mode = num;
      }
    });

    return mode;
  };

  const updateChartData = (
    data: number[],
    calculatedMean?: number,
    standardDeviation?: number
  ) => {
    const chartData = data.map((value, index) => ({ index, value }));
    setChartData(chartData);

    if (calculatedMean !== undefined && standardDeviation !== undefined) {
      setMean(calculatedMean);
      setResult(standardDeviation);
    }

    // Update histogram data
    const histogramBins = calculateHistogramBins(data);
    setHistogramData(histogramBins);
  };

  const calculateHistogramBins = (data: number[]): HistogramBin[] => {
    if (data.length === 0) return [];

    const min = Math.min(...data);
    const max = Math.max(...data);

    // Ensure min and max are different to avoid division by zero
    if (min === max) {
      return [
        { binStart: min - 0.5, binEnd: max + 0.5, frequency: data.length },
      ];
    }

    const binCount = Math.min(Math.ceil(Math.sqrt(data.length)), 20); // Limit to 20 bins maximum
    const binWidth = (max - min) / binCount;

    const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
      binStart: min + i * binWidth,
      binEnd: min + (i + 1) * binWidth,
      frequency: 0,
    }));

    data.forEach((num) => {
      // Handle edge case where num is exactly equal to max
      const binIndex =
        num === max ? binCount - 1 : Math.floor((num - min) / binWidth);

      if (binIndex >= 0 && binIndex < binCount) {
        bins[binIndex].frequency++;
      }
    });

    return bins;
  };

  const resetResults = () => {
    setResult(null);
    setMean(null);
    setMedian(null);
    setMode(null);
    setRange(null);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const importedNumbers = content
          .split(",")
          .map(Number)
          .filter((num) => !isNaN(num));
        setNumbers(importedNumbers);
        updateChartData(importedNumbers);
        resetResults();
      };
      reader.readAsText(file);
    }
  };

  const handleFileExport = () => {
    const content = numbers.join(",");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "standard_deviation_data.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-3xl font-bold text-center">
          Standard Deviation Calculator
        </CardTitle>
        <CardDescription className="text-center text-lg">
          Enter numbers, visualize data, and calculate statistics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex space-x-2">
          <Input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            value={inputValue}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                setInputValue(value);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter a number and press Enter"
            className="flex-grow text-lg"
            ref={inputRef}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={addNumber} size="icon">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add number</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add number to list</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  size="icon"
                >
                  <Upload className="h-4 w-4" />
                  <span className="sr-only">Import data</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Import data from CSV</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".csv"
            className="hidden"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleFileExport}
                  size="icon"
                  disabled={numbers.length === 0}
                >
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Export data</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export data to CSV</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="bg-secondary p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Entered Numbers:</h3>
          <div className="flex flex-wrap gap-2">
            {numbers.map((num, index) => (
              <div
                key={index}
                className="flex items-center bg-primary text-primary-foreground rounded-full px-3 py-1"
              >
                <span className="mr-2">{num}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 rounded-full"
                  onClick={() => deleteNumber(index)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            ))}
          </div>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={calculateStatistics}
                className="w-full"
                size="lg"
              >
                Calculate Statistics
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Shortcut: Shift+Enter or Ctrl+Enter</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {result !== null &&
          mean !== null &&
          median !== null &&
          mode !== null &&
          range !== null && (
            <div className="bg-secondary p-4 rounded-lg text-center space-y-2">
              <h3 className="text-xl font-semibold">Results:</h3>
              <p className="text-lg">
                Mean: <span className="font-bold">{mean.toFixed(4)}</span>
              </p>
              <p className="text-lg">
                Median: <span className="font-bold">{median.toFixed(4)}</span>
              </p>
              <p className="text-lg">
                Mode: <span className="font-bold">{mode.toFixed(4)}</span>
              </p>
              <p className="text-lg">
                Range: <span className="font-bold">{range.toFixed(4)}</span>
              </p>
              <p className="text-lg">
                Standard Deviation:{" "}
                <span className="font-bold">{result.toFixed(4)}</span>
              </p>
            </div>
          )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bar">
              <BarChartIcon className="mr-2 h-4 w-4" />
              Bar Chart
            </TabsTrigger>
            <TabsTrigger value="histogram">
              <LineChart className="mr-2 h-4 w-4" />
              Histogram
            </TabsTrigger>
          </TabsList>
          <TabsContent value="bar">
            <ChartContainer
              config={{
                value: {
                  label: "Value",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px] mt-6"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" />
                  {mean !== null && (
                    <ReferenceLine
                      y={mean}
                      stroke="red"
                      strokeDasharray="3 3"
                    />
                  )}
                  {result !== null && mean !== null && (
                    <ReferenceArea
                      y1={mean - result}
                      y2={mean + result}
                      fill="yellow"
                      fillOpacity={0.2}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="histogram">
            <ChartContainer
              config={{
                frequency: {
                  label: "Frequency",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px] mt-6"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={histogramData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="binStart"
                    tickFormatter={(value) => value.toFixed(2)}
                    label={{
                      value: "Value",
                      position: "insideBottom",
                      offset: -5,
                    }}
                  />
                  <YAxis
                    label={{
                      value: "Frequency",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as HistogramBin;
                        return (
                          <div className="bg-background border border-border p-2 rounded shadow">
                            <p>
                              Range: {data.binStart.toFixed(2)} -{" "}
                              {data.binEnd.toFixed(2)}
                            </p>
                            <p>Frequency: {data.frequency}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="frequency" fill="var(--color-frequency)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
