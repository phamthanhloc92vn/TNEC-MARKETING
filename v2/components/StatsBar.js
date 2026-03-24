'use client';

export default function StatsBar({ tasks }) {
  const total = tasks.length;
  const inProgress = tasks.filter(t => t.status === 'Đang xử lý').length;
  const pending = tasks.filter(t => t.status === 'Chờ duyệt').length;
  const completed = tasks.filter(t => t.status === 'Hoàn thành').length;

  const stats = [
    { label: 'Tổng công việc', value: total, icon: '📋', color: 'from-indigo-500 to-indigo-600' },
    { label: 'Đang thực hiện', value: inProgress, icon: '⏳', color: 'from-amber-500 to-orange-500' },
    { label: 'Chờ duyệt', value: pending, icon: '👁️', color: 'from-cyan-500 to-teal-500' },
    { label: 'Hoàn thành', value: completed, icon: '✅', color: 'from-emerald-500 to-green-500' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-200"
        >
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-lg mb-3 shadow-md`}>
            {stat.icon}
          </div>
          <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
