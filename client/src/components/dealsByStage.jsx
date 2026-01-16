// frontend/src/components/DealsByStage.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDealsByStage } from "../redux/dealSlice";
import { fetchStages } from "../redux/stageSlice";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const DealsByStage = () => {
  const dispatch = useDispatch();
  const { dealsByStage, loading: dealsLoading } = useSelector((state) => state.deals);
  const { items: stages, loading: stagesLoading } = useSelector((state) => state.stages);

  useEffect(() => {
    dispatch(fetchDealsByStage());
    dispatch(fetchStages());
  }, [dispatch]);

  if (dealsLoading || stagesLoading) return <p>Loading chart...</p>;

  // Create data by matching stage IDs with stage names
  const data = stages.map((stage) => {
    const stageData = dealsByStage?.find((d) => d._id === stage._id) || { count: 0 };
    return {
      name: stage.name,
      count: stageData.count || 0,
    };
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-6">
      <h2 className="text-xl font-semibold mb-4">Deals by Stage</h2>
      {data.every((d) => d.count === 0) ? (
        <p className="text-gray-500">No deals yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default DealsByStage;