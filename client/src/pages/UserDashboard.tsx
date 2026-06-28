import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Plus, Settings, Bell, CreditCard, TrendingUp, Code, 
  Zap, Users, FileText, Calendar, Clock, ArrowRight 
} from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data
  const stats = [
    { label: 'المشاريع', value: 12, icon: Code, color: 'from-blue-500 to-blue-600' },
    { label: 'الأجيال', value: 234, icon: Zap, color: 'from-purple-500 to-purple-600' },
    { label: 'الفريق', value: 5, icon: Users, color: 'from-pink-500 to-pink-600' },
    { label: 'الرصيد', value: '1,250', icon: CreditCard, color: 'from-green-500 to-green-600' },
  ];

  const chartData = [
    { month: 'يناير', projects: 4, generations: 24 },
    { month: 'فبراير', projects: 3, generations: 13 },
    { month: 'مارس', projects: 2, generations: 9 },
    { month: 'أبريل', projects: 5, generations: 39 },
    { month: 'مايو', projects: 6, generations: 48 },
    { month: 'يونيو', projects: 12, generations: 234 },
  ];

  const pieData = [
    { name: 'React', value: 35 },
    { name: 'Next.js', value: 25 },
    { name: 'Vue', value: 20 },
    { name: 'أخرى', value: 20 },
  ];

  const COLORS = ['#3b82f6', '#a855f7', '#ec4899', '#f59e0b'];

  const recentActivity = [
    { id: 1, type: 'project', title: 'تم إنشاء مشروع React جديد', time: 'منذ ساعة', icon: Code },
    { id: 2, type: 'generation', title: 'تم توليد 50 سطر كود', time: 'منذ 3 ساعات', icon: Zap },
    { id: 3, type: 'team', title: 'تمت إضافة عضو جديد للفريق', time: 'منذ يوم', icon: Users },
    { id: 4, type: 'billing', title: 'تم تحديث خطة الاشتراك', time: 'منذ 3 أيام', icon: CreditCard },
  ];

  const upcomingTasks = [
    { id: 1, title: 'استكمال مشروع Dashboard', dueDate: '2026-06-30', priority: 'high' },
    { id: 2, title: 'مراجعة كود الفريق', dueDate: '2026-07-02', priority: 'medium' },
    { id: 3, title: 'تحديث التوثيق', dueDate: '2026-07-05', priority: 'low' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              مرحباً، {user?.name || 'مستخدم'}! 👋
            </h1>
            <p className="text-gray-400">إليك ملخص نشاطك اليوم</p>
          </div>
          <div className="flex gap-3">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
              <Plus className="w-4 h-4 ml-2" />
              مشروع جديد
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Line Chart */}
        <Card className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 lg:col-span-2">
          <h3 className="text-xl font-bold text-white mb-6">النشاط الشهري</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="projects" stroke="#3b82f6" strokeWidth={2} name="المشاريع" />
              <Line type="monotone" dataKey="generations" stroke="#a855f7" strokeWidth={2} name="الأجيال" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie Chart */}
        <Card className="backdrop-blur-xl bg-white/5 border border-white/10 p-6">
          <h3 className="text-xl font-bold text-white mb-6">أنواع المشاريع</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={{ fill: '#fff' }} outerRadius={80} fill="#8884d8" dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Activity and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="backdrop-blur-xl bg-white/5 border border-white/10 p-6">
          <h3 className="text-xl font-bold text-white mb-6">النشاط الأخير</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{activity.title}</p>
                    <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="backdrop-blur-xl bg-white/5 border border-white/10 p-6">
          <h3 className="text-xl font-bold text-white mb-6">المهام القادمة</h3>
          <div className="space-y-4">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  task.priority === 'high' ? 'bg-red-500' :
                  task.priority === 'medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                <div className="flex-1">
                  <p className="text-white font-medium">{task.title}</p>
                  <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {task.dueDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-6 hover:border-blue-500/40 transition cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-semibold mb-1">إنشاء مشروع</h4>
              <p className="text-gray-400 text-sm">ابدأ مشروع جديد الآن</p>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-400" />
          </div>
        </Card>

        <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-6 hover:border-purple-500/40 transition cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-semibold mb-1">الإعدادات</h4>
              <p className="text-gray-400 text-sm">تخصيص حسابك</p>
            </div>
            <ArrowRight className="w-5 h-5 text-purple-400" />
          </div>
        </Card>

        <Card className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 p-6 hover:border-green-500/40 transition cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-semibold mb-1">الفواتير</h4>
              <p className="text-gray-400 text-sm">إدارة الاشتراك</p>
            </div>
            <ArrowRight className="w-5 h-5 text-green-400" />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
