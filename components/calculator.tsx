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
  ZoomIn,
  ZoomOut,
  Edit,
  Moon,
  Sun,
  GripVertical,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";

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
  const [originalNumbers, setOriginalNumbers] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [mean, setMean] = useState<number | null>(null);
  const [median, setMedian] = useState<number | null>(null);
  const [mode, setMode] = useState<number | null>(null);
  const [range, setRange] = useState<number | null>(null);
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [histogramData, setHistogramData] = useState<HistogramBin[]>([]);
  const [activeTab, setActiveTab] = useState<string>("bar");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addNumber = () => {
    const num = parseFloat(inputValue);
    if (!isNaN(num) && isFinite(num)) {
      const newNumbers = [...numbers, num];
      setNumbers(newNumbers);
      setOriginalNumbers(newNumbers);
      setInputValue("");
      inputRef.current?.focus();
      updateChartData(newNumbers);
    }
  };

  const deleteNumber = (index: number) => {
    const newNumbers = numbers.filter((_, i) => i !== index);
    setNumbers(newNumbers);
    setOriginalNumbers(newNumbers);
    updateChartData(newNumbers);
    resetResults();
  };

  const editNumber = (index: number, newValue: number) => {
    const newNumbers = [...numbers];
    newNumbers[index] = newValue;
    setNumbers(newNumbers);
    setOriginalNumbers(newNumbers);
    updateChartData(newNumbers);
    resetResults();
    setEditingIndex(null);
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
        setOriginalNumbers(importedNumbers);
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

  const handleZoomChange = (newZoomLevel: number[]) => {
    setZoomLevel(newZoomLevel[0]);
  };

  const getYAxisDomain = (
    data: DataPoint[] | HistogramBin[],
    key: "value" | "frequency"
  ): [number, number] => {
    if (data.length === 0) return [0, 1];

    const maxValue = Math.max(
      ...data.map((item) => {
        if (key === "value" && "value" in item) {
          return item.value;
        } else if (key === "frequency" && "frequency" in item) {
          return item.frequency;
        }
        return 0;
      })
    );

    return [0, maxValue * (200 / zoomLevel)];
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newNumbers = Array.from(numbers);
    const [reorderedItem] = newNumbers.splice(result.source.index, 1);
    newNumbers.splice(result.destination.index, 0, reorderedItem);

    setNumbers(newNumbers);
    setOriginalNumbers(newNumbers);
    updateChartData(newNumbers);
    resetResults();
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const sortAscending = () => {
    const sortedNumbers = [...numbers].sort((a, b) => a - b);
    setNumbers(sortedNumbers);
    updateChartData(sortedNumbers);
    resetResults();
  };

  const sortDescending = () => {
    const sortedNumbers = [...numbers].sort((a, b) => b - a);
    setNumbers(sortedNumbers);
    updateChartData(sortedNumbers);
    resetResults();
  };

  const resetOrder = () => {
    setNumbers([...originalNumbers]);
    updateChartData(originalNumbers);
    resetResults();
  };

  const clearAllValues = () => {
    setNumbers([]);
    setOriginalNumbers([]);
    setInputValue("");
    updateChartData([]);
    resetResults();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-center">
          <CardTitle className="text-3xl font-bold">
            Standard Deviation Calculator
          </CardTitle>
          {mounted && (
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>
        <CardDescription className="text-lg">
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

        {mounted && (
          <div className="border rounded-lg p-4 bg-background">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Entered Numbers:</h3>
              <div className="flex space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={sortAscending}
                        size="sm"
                        variant="outline"
                      >
                        <ArrowUp className="h-4 w-4" />
                        <span className="sr-only">Sort Ascending</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sort Ascending</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={sortDescending}
                        size="sm"
                        variant="outline"
                      >
                        <ArrowDown className="h-4 w-4" />
                        <span className="sr-only">Sort Descending</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sort Descending</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={resetOrder} size="sm" variant="outline">
                        <RotateCcw className="h-4 w-4" />
                        <span className="sr-only">Reset Order</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset to Original Order</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={clearAllValues}
                        size="sm"
                        variant="outline"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Clear All</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear All Values</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="numbers">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                  >
                    {numbers.map((num, index) => (
                      <Draggable
                        key={index}
                        draggableId={`number-${index}`}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center justify-between bg-card hover:bg-accent transition-colors rounded-md px-3 py-2 border"
                          >
                            <span className="font-medium">{num}</span>
                            <div className="flex space-x-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 hover:bg-accent"
                                    onClick={() => {
                                      setEditingIndex(index);
                                      setEditingValue(num.toString());
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Number</DialogTitle>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label
                                        htmlFor="edit-number"
                                        className="text-right"
                                      >
                                        Number
                                      </Label>
                                      <Input
                                        id="edit-number"
                                        type="number"
                                        value={editingValue}
                                        onChange={(e) =>
                                          setEditingValue(e.target.value)
                                        }
                                        className="col-span-3"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end">
                                    <Button
                                      onClick={() => {
                                        const newValue =
                                          parseFloat(editingValue);
                                        if (!isNaN(newValue)) {
                                          editNumber(index, newValue);
                                        }
                                      }}
                                    >
                                      Save
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-accent"
                                onClick={() => deleteNumber(index)}
                              >
                                <X className="h-3 w-3" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

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

        <div className="flex items-center space-x-2">
          <ZoomOut className="h-4 w-4" />
          <Slider
            value={[zoomLevel]}
            onValueChange={handleZoomChange}
            min={10}
            max={200}
            step={10}
            className="flex-grow"
          />
          <ZoomIn className="h-4 w-4" />
          <span className="text-sm font-medium w-12 text-right">
            {zoomLevel}%
          </span>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-background">
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
                  <YAxis domain={getYAxisDomain(chartData, "value")} />
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
                    domain={getYAxisDomain(histogramData, "frequency")}
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
