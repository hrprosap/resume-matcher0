import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ApplicationChart({ applications }) {
  // Pie chart data
  const scoreRanges = {
    Low: applications.filter(app => app.score < 5).length,
    Medium: applications.filter(app => app.score >= 5 && app.score <= 7).length, // Adjusted to include 7
    High: applications.filter(app => app.score > 7).length,
  };

  const pieData = Object.entries(scoreRanges).map(([range, count]) => ({ name: range, value: count }));
  const COLORS = ['#FF8042', '#FFBB28', '#00C49F'];

  // Bar chart data
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const barData = last7Days.map(date => ({
    date,
    count: applications.filter(app => app.timestamp.startsWith(date)).length,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-white">Application Score Distribution</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Low: &lt; 5 | Medium: 5 - 7 | High: &gt; 7
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-white">Applications Received (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
