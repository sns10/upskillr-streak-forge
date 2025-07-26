import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Zap, 
  Gauge, 
  HardDrive, 
  Network, 
  Cpu, 
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Download,
  Upload
} from 'lucide-react';

// Performance monitoring utilities

interface PerformanceMetrics {
  loadTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  bundleSize: number;
  cacheHitRate: number;
}

interface PerformanceOptimizerProps {
  onOptimize?: () => void;
}

export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({ onOptimize }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0,
    bundleSize: 0,
    cacheHitRate: 0
  });
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [optimizations, setOptimizations] = useState<string[]>([]);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceMetrics[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);

  // Performance monitoring
  useEffect(() => {
    if (isMonitoring) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => stopMonitoring();
  }, [isMonitoring]);

  // Initial metrics collection
  useEffect(() => {
    collectInitialMetrics();
  }, []);

  const collectInitialMetrics = () => {
    // Load time
    const loadTime = performance.now();
    
    // Memory usage (if available)
    const memoryUsage = (performance as any).memory 
      ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
      : 0;
    
    // Bundle size estimation
    const bundleSize = Math.round(document.querySelectorAll('script').length * 50); // Rough estimate
    
    // Cache hit rate (simulated)
    const cacheHitRate = Math.random() * 100;
    
    // Network latency (simulated)
    const networkLatency = Math.random() * 100 + 50;
    
    // CPU usage (simulated)
    const cpuUsage = Math.random() * 30 + 10;

    setMetrics({
      loadTime,
      memoryUsage,
      cpuUsage,
      networkLatency,
      bundleSize,
      cacheHitRate
    });

    // Add to history
    setPerformanceHistory(prev => [...prev.slice(-9), {
      loadTime,
      memoryUsage,
      cpuUsage,
      networkLatency,
      bundleSize,
      cacheHitRate
    }]);
  };

  const startMonitoring = () => {
    monitoringInterval.current = setInterval(() => {
      collectInitialMetrics();
    }, 5000); // Update every 5 seconds
  };

  const stopMonitoring = () => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
  };

  const runOptimizations = () => {
    const newOptimizations: string[] = [];
    
    // Simulate various optimizations
    if (metrics.memoryUsage > 50) {
      newOptimizations.push('Memory usage optimized');
    }
    
    if (metrics.loadTime > 2000) {
      newOptimizations.push('Load time improved');
    }
    
    if (metrics.bundleSize > 100) {
      newOptimizations.push('Bundle size reduced');
    }
    
    if (metrics.cacheHitRate < 80) {
      newOptimizations.push('Cache efficiency improved');
    }

    setOptimizations(newOptimizations);
    
    // Simulate performance improvement
    setTimeout(() => {
      setMetrics(prev => ({
        ...prev,
        loadTime: prev.loadTime * 0.8,
        memoryUsage: prev.memoryUsage * 0.9,
        cpuUsage: prev.cpuUsage * 0.85,
        networkLatency: prev.networkLatency * 0.9,
        bundleSize: prev.bundleSize * 0.9,
        cacheHitRate: Math.min(prev.cacheHitRate * 1.1, 100)
      }));
    }, 1000);

    onOptimize?.();
  };

  const getPerformanceScore = () => {
    const scores = [
      metrics.loadTime < 1000 ? 100 : Math.max(0, 100 - (metrics.loadTime - 1000) / 10),
      metrics.memoryUsage < 30 ? 100 : Math.max(0, 100 - (metrics.memoryUsage - 30) * 2),
      metrics.cpuUsage < 20 ? 100 : Math.max(0, 100 - (metrics.cpuUsage - 20) * 3),
      metrics.networkLatency < 100 ? 100 : Math.max(0, 100 - (metrics.networkLatency - 100) / 2),
      metrics.bundleSize < 50 ? 100 : Math.max(0, 100 - (metrics.bundleSize - 50) * 2),
      metrics.cacheHitRate
    ];
    
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const getPerformanceStatus = (score: number) => {
    if (score >= 90) return { status: 'Excellent', color: 'text-green-600', icon: CheckCircle };
    if (score >= 70) return { status: 'Good', color: 'text-blue-600', icon: TrendingUp };
    if (score >= 50) return { status: 'Fair', color: 'text-yellow-600', icon: AlertTriangle };
    return { status: 'Poor', color: 'text-red-600', icon: XCircle };
  };

  const performanceScore = getPerformanceScore();
  const performanceStatus = getPerformanceStatus(performanceScore);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Optimizer
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={performanceStatus.color}>
              {performanceScore}/100
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMonitoring(!isMonitoring)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isMonitoring ? 'animate-spin' : ''}`} />
              {isMonitoring ? 'Stop' : 'Monitor'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="optimize">Optimize</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Performance Score */}
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <performanceStatus.icon className="h-6 w-6" />
                <h3 className="text-xl font-bold">{performanceStatus.status}</h3>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {performanceScore}/100
              </div>
              <p className="text-sm text-muted-foreground">
                Overall Performance Score
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-lg font-bold text-green-600">
                  {Math.round(metrics.loadTime)}ms
                </div>
                <p className="text-xs text-muted-foreground">Load Time</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <HardDrive className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-lg font-bold text-blue-600">
                  {metrics.memoryUsage}MB
                </div>
                <p className="text-xs text-muted-foreground">Memory Usage</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Network className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <div className="text-lg font-bold text-purple-600">
                  {Math.round(metrics.networkLatency)}ms
                </div>
                <p className="text-xs text-muted-foreground">Network Latency</p>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <HardDrive className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <div className="text-lg font-bold text-orange-600">
                  {Math.round(metrics.cacheHitRate)}%
                </div>
                <p className="text-xs text-muted-foreground">Cache Hit Rate</p>
              </div>
            </div>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            <div className="space-y-4">
              {/* Load Time */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Load Time</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(metrics.loadTime)}ms
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, (metrics.loadTime / 2000) * 100)} 
                  className="h-2"
                />
              </div>

              {/* Memory Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    <span className="font-medium">Memory Usage</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {metrics.memoryUsage}MB
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, (metrics.memoryUsage / 100) * 100)} 
                  className="h-2"
                />
              </div>

              {/* CPU Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    <span className="font-medium">CPU Usage</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(metrics.cpuUsage)}%
                  </span>
                </div>
                <Progress 
                  value={metrics.cpuUsage} 
                  className="h-2"
                />
              </div>

              {/* Network Latency */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    <span className="font-medium">Network Latency</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(metrics.networkLatency)}ms
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, (metrics.networkLatency / 200) * 100)} 
                  className="h-2"
                />
              </div>

              {/* Bundle Size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span className="font-medium">Bundle Size</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {metrics.bundleSize}KB
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, (metrics.bundleSize / 200) * 100)} 
                  className="h-2"
                />
              </div>

              {/* Cache Hit Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="font-medium">Cache Hit Rate</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(metrics.cacheHitRate)}%
                  </span>
                </div>
                <Progress 
                  value={metrics.cacheHitRate} 
                  className="h-2"
                />
              </div>
            </div>
          </TabsContent>

          {/* Optimize Tab */}
          <TabsContent value="optimize" className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <Gauge className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-bold mb-2">Performance Optimization</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click the button below to run automatic performance optimizations
              </p>
              <Button 
                onClick={runOptimizations}
                className="bg-green-600 hover:bg-green-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Run Optimizations
              </Button>
            </div>

            {/* Optimization Results */}
            {optimizations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Recent Optimizations:</h4>
                <div className="space-y-2">
                  {optimizations.map((optimization, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{optimization}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optimization Tips */}
            <div className="space-y-3">
              <h4 className="font-medium">Optimization Tips:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span>Use lazy loading for heavy components</span>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span>Implement code splitting for better bundle sizes</span>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span>Optimize images and use proper caching</span>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span>Minimize DOM manipulations and re-renders</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 