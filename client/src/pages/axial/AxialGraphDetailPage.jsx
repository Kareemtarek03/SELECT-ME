import React from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  Grid,
  Stack,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

// Piecewise Cubic Interpolation (Excel-compatible) - Same as backend
class PiecewiseCubicInterpolator {
  constructor(x, y) {
    this.x = [...x];
    this.y = [...y];
    this.n = x.length;

    // Calculate cubic coefficients for each segment
    this.segments = [];
    for (let i = 0; i < this.n - 1; i++) {
      const x0 = this.x[i];
      const x1 = this.x[i + 1];
      const y0 = this.y[i];
      const y1 = this.y[i + 1];

      const x0_cubed = Math.pow(x0, 3);
      const x1_cubed = Math.pow(x1, 3);

      // Excel's method: Y = aX³ + b
      const a = (y1 - y0) / (x1_cubed - x0_cubed);
      const b = y0 - a * x0_cubed;

      this.segments.push({
        xMin: Math.min(x0, x1),
        xMax: Math.max(x0, x1),
        c3: a,
        c0: b,
      });
    }
  }

  at(xi) {
    // Find the segment containing xi
    for (const seg of this.segments) {
      if (xi >= seg.xMin && xi <= seg.xMax) {
        return seg.c3 * Math.pow(xi, 3) + seg.c0;
      }
    }

    // Extrapolation using nearest segment
    const seg =
      xi < this.segments[0].xMin
        ? this.segments[0]
        : this.segments[this.segments.length - 1];
    return seg.c3 * Math.pow(xi, 3) + seg.c0;
  }
}

function generateCurveData(xData, yData, numSamples = 100) {
  if (!xData || !yData || xData.length < 2) return [];
  
  const interpolator = new PiecewiseCubicInterpolator(xData, yData);
  const result = [];
  const xMin = Math.min(...xData);
  const xMax = Math.max(...xData);
  const step = (xMax - xMin) / numSamples;
  
  for (let i = 0; i <= numSamples; i++) {
    const x = xMin + i * step;
    const y = interpolator.at(x);
    result.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(4)) });
  }
  
  return result;
}

export default function GraphDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { fan, units } = location.state || {};

  if (!fan || !fan.predictions) {
    return (
      <Box minH="calc(100vh - 80px)" display="flex" alignItems="center" justifyContent="center">
        <Box textAlign="center">
          <Heading size="lg" mb={4} color="gray.700">No Data Available</Heading>
          <Text color="gray.600" mb={6}>Unable to load fan data.</Text>
          <Button colorScheme="blue" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Box>
      </Box>
    );
  }

  const predictions = fan.predictions;

  // Get actual curve data from fan object (10 points each)
  const xData = fan.AirFlowNew || [];
  const staticPressureData = fan.StaticPressureNew || [];
  const velocityPressureData = fan.VelocityPressureNew || [];
  const fanInputPowerData = fan.FanInputPowerNew || [];
  const staticEfficiencyData = fan.FanStaticEfficiency || [];
  const totalEfficiencyData = fan.FanTotalEfficiency || [];

  // Prepare data for each curve using actual backend data
  const curves = [
    {
      name: "Static Pressure",
      color: "#3182ce",
      unit: units?.pressure || "Pa",
      xData: xData,
      yData: staticPressureData,
    },
    {
      name: "Fan Input Power",
      color: "#38a169",
      unit: units?.power || "kW",
      xData: xData,
      yData: fanInputPowerData,
    },
    {
      name: "Velocity Pressure",
      color: "#d69e2e",
      unit: units?.pressure || "Pa",
      xData: xData,
      yData: velocityPressureData,
    },
    {
      name: "Static Efficiency",
      color: "#805ad5",
      unit: "%",
      xData: xData,
      yData: staticEfficiencyData.map(v => v * 100), // Convert to percentage
    },
    {
      name: "Total Efficiency",
      color: "#e53e3e",
      unit: "%",
      xData: xData,
      yData: totalEfficiencyData.map(v => v * 100), // Convert to percentage
    },
  ];

  // Apply piecewise cubic interpolation to each curve (same as backend)
  const interpolatedCurves = curves.map((curve) => ({
    ...curve,
    data: generateCurveData(curve.xData, curve.yData, 100),
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label, curveName, unit, airflowUnit }) => {
    if (active && payload && payload.length) {
      return (
        <Box bg="white" p={3} border="2px" borderColor="gray.400" borderRadius="md" boxShadow="lg">
          <Text fontSize="sm" fontWeight="bold" mb={1}>{curveName}</Text>
          <Text fontSize="sm">Airflow: {label} {airflowUnit}</Text>
          <Text fontSize="sm" color="blue.600" fontWeight="semibold">
            Value: {payload[0].value.toFixed(2)} {unit}
          </Text>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box bg="gray.50" minH="calc(100vh - 80px)" py={8}>
      <Box maxW="1400px" mx="auto" px={6}>
        {/* Header */}
        <Box mb={6}>
          <Button
            variant="ghost"
            colorScheme="blue"
            onClick={() => navigate(-1)}
            mb={4}
          >
            ← Back to Results
          </Button>
          <Heading size="lg" color="gray.800" mb={2}>
            Performance Curves - {fan.FanModel || `Fan ${fan.Id}`}
          </Heading>
          <Text color="gray.600" fontSize="sm">
            Hover over each curve to see exact values at different positions
          </Text>
        </Box>

        {/* Graphs Grid */}
        <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
          {interpolatedCurves.map((curve, idx) => (
            <Box
              key={idx}
              bg="white"
              borderRadius="lg"
              boxShadow="md"
              p={6}
              border="1px"
              borderColor="gray.200"
            >
              <Heading size="md" mb={4} color="gray.800">
                {curve.name}
              </Heading>
              <Box h="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={curve.data}
                    margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="x"
                      label={{ value: `Airflow (${units?.airFlow || "CFM"})`, position: "insideBottom", offset: -10 }}
                      stroke="#4a5568"
                    />
                    <YAxis
                      label={{ 
                        value: `${curve.name} (${curve.unit})`, 
                        angle: -90, 
                        position: "insideLeft",
                        style: { textAnchor: "middle" }
                      }}
                      stroke="#4a5568"
                    />
                    <Tooltip
                      content={(props) => (
                        <CustomTooltip {...props} curveName={curve.name} unit={curve.unit} airflowUnit={units?.airFlow || "CFM"} />
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="y"
                      stroke={curve.color}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: curve.color }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          ))}
        </Grid>

        {/* Summary Card */}
        <Box
          mt={8}
          bg="white"
          borderRadius="lg"
          boxShadow="md"
          p={6}
          border="1px"
          borderColor="gray.200"
        >
          <Heading size="md" mb={4} color="gray.800">
            Prediction Summary
          </Heading>
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Static Pressure</Text>
              <Text fontSize="lg" fontWeight="bold" color="blue.600">
                {predictions.StaticPressurePred?.toFixed(2) || "-"} {units?.pressure || "Pa"}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Fan Input Power</Text>
              <Text fontSize="lg" fontWeight="bold" color="green.600">
                {predictions.FanInputPowerPred?.toFixed(2) || "-"} {units?.power || "kW"}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Velocity Pressure</Text>
              <Text fontSize="lg" fontWeight="bold" color="yellow.600">
                {predictions.VelocityPressurePred?.toFixed(2) || "-"} {units?.pressure || "Pa"}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Static Efficiency</Text>
              <Text fontSize="lg" fontWeight="bold" color="purple.600">
                {((predictions.FanStaticEfficiencyPred || 0) * 100).toFixed(2)}%
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Total Efficiency</Text>
              <Text fontSize="lg" fontWeight="bold" color="red.600">
                {((predictions.FanTotalEfficiencyPred || 0) * 100).toFixed(2)}%
              </Text>
            </Box>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
