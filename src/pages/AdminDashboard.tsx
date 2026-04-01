import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Users2, DollarSign, AlertTriangle, CheckCircle, XCircle, Clock, BarChart3, Settings, LogOut, Bell, Download, Plus } from "lucide-react";

interface AdminStats {
  totalUsers: number; activeUsers: number; totalEvents: number; pendingEvents: number;
  totalGroups: number; pendingGroups: number; revenue: string; growth: string;
}
interface RecentActivity {
  id: number; type: "user" | "event" | "group" | "report"; action: string;
  target: string; timestamp: string; status: "pending" | "approved" | "rejected";
}
interface AlertItem {
  id: number; type: "warning" | "error" | "info"; message: string; count?: number; action: string;
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null);
  const navigate = useNavigate();

  const stats: AdminStats = {
    totalUsers: 12480, activeUsers: 8920, totalEvents: 342, pendingEvents: 3,
    totalGroups: 89, pendingGroups: 2, revenue: "$4,250", growth: "+15%"
  };

  const recentActivity: RecentActivity[] = [
    { id: 1, type: "event", action: "Event submitted", target: "Rooftop Sunset Social", timestamp: "2 min ago", status: "pending" },
    { id: 2, type: "user", action: "New user joined", target: "jane@example.com", timestamp: "15 min ago", status: "approved" },
    { id: 3, type: "report", action: "Content reported", target: "Spam Group #442", timestamp: "1 hour ago", status: "pending" },
    { id: 4, type: "group", action: "Group created", target: "Berlin Techno Lovers", timestamp: "2 hours ago", status: "approved" },
    { id: 5, type: "event", action: "Event updated", target: "Street Food Festival", timestamp: "3 hours ago", status: "approved" },
  ];

  const alerts: AlertItem[] = [
    { id: 1, type: "warning", message: "Events pending approval", count: 3, action: "Review now" },
    { id: 2, type: "error", message: "Users reported for spam", count: 2, action: "Moderate" },
    { id: 3, type: "info", message: "New feature available", count: 1, action: "View updates" },
  ];

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem("admin_auth_token");
        const userData = localStorage.getItem("admin_user");
        
        if (!token || !userData) { navigate("/admin-login"); return; }

        // ✅ Client-side role check (no backend call needed)
        const user = JSON.parse(userData);
        if (user.role?.toLowerCase() !== "admin") { navigate("/login"); return; }

        setAdminUser({ name: `${user.firstName || "Admin"} ${user.lastName || "User"}`, email: user.email || "admin@linkup254.com" });
      } catch (err) {
        console.error("Admin auth check failed:", err);
        localStorage.removeItem("admin_auth_token");
        localStorage.removeItem("admin_user");
        navigate("/admin-login");
      } finally { setLoading(false); }
    };
    checkAdmin();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("admin_auth_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user");
    navigate("/admin-login");
  };

  const StatCard = ({ title, value, subValue, icon: Icon, trend, color }: any) => (
    <Card className="border-border bg-card hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
            {trend && <span className={`text-xs font-medium ${trend.startsWith('+') ? 'text-green-600' : 'text-destructive'}`}>{trend} this week</span>}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}><Icon className="h-6 w-6 text-white" /></div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div><p className="text-muted-foreground">Loading admin dashboard...</p></div></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Settings className="h-5 w-5 text-primary" /></div>
            <div><h1 className="font-display font-bold text-lg">Eventora Admin</h1><p className="text-xs text-muted-foreground">Platform Management</p></div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="gap-2"><Bell className="h-4 w-4" /><span className="hidden sm:inline">Alerts</span>{alerts.filter(a => a.type !== "info").length > 0 && <span className="w-2 h-2 rounded-full bg-destructive"></span>}</Button>
            <div className="text-right hidden sm:block"><p className="text-sm font-medium">{adminUser?.name}</p><p className="text-xs text-muted-foreground">{adminUser?.email}</p></div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Logout</span></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h2 className="text-2xl font-display font-bold">Welcome back, {adminUser?.name?.split(" ")[0]} 👋</h2><p className="text-muted-foreground">Here's what's happening on Eventora today.</p></div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" />Export Report</Button>
            <Button size="sm" className="gap-2 bg-gradient-warm"><Plus className="h-4 w-4" />Create Event</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={stats.totalUsers.toLocaleString()} subValue={`${stats.activeUsers.toLocaleString()} active`} icon={Users} trend="+12%" color="bg-blue-500" />
          <StatCard title="Events" value={stats.totalEvents} subValue={`${stats.pendingEvents} pending approval`} icon={Calendar} trend="+8%" color="bg-green-500" />
          <StatCard title="Groups" value={stats.totalGroups} subValue={`${stats.pendingGroups} awaiting review`} icon={Users2} trend="+3%" color="bg-purple-500" />
          <StatCard title="Revenue" value={stats.revenue} subValue="This month" icon={DollarSign} trend={stats.growth} color="bg-amber-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border bg-card">
            <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-lg">Recent Activity</CardTitle><Button variant="ghost" size="sm" className="text-xs">View All</Button></div></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.type === "event" ? "bg-green-100 text-green-600" : item.type === "user" ? "bg-blue-100 text-blue-600" : item.type === "group" ? "bg-purple-100 text-purple-600" : "bg-amber-100 text-amber-600"}`}>
                      {item.type === "event" && <Calendar className="h-4 w-4" />}{item.type === "user" && <Users className="h-4 w-4" />}{item.type === "group" && <Users2 className="h-4 w-4" />}{item.type === "report" && <AlertTriangle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{item.action}</p><p className="text-xs text-muted-foreground truncate">{item.target}</p></div>
                    <div className="text-right flex-shrink-0"><span className="text-xs text-muted-foreground">{item.timestamp}</span><div className="mt-1">{item.status === "pending" && <Clock className="h-3 w-3 text-amber-500 inline" />}{item.status === "approved" && <CheckCircle className="h-3 w-3 text-green-500 inline" />}{item.status === "rejected" && <XCircle className="h-3 w-3 text-destructive inline" />}</div></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />Alerts</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg border ${alert.type === "error" ? "bg-destructive/10 border-destructive/30" : alert.type === "warning" ? "bg-amber-500/10 border-amber-500/30" : "bg-blue-500/10 border-blue-500/30"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div><p className="text-sm font-medium">{alert.message}</p>{alert.count && <span className="text-xs text-muted-foreground">({alert.count} items)</span>}</div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">{alert.action}</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-3"><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/admin/events")}><Calendar className="h-4 w-4" />Manage Events</Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/admin/users")}><Users className="h-4 w-4" />Manage Users</Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/admin/moderation")}><AlertTriangle className="h-4 w-4" />Content Moderation</Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/admin/analytics")}><BarChart3 className="h-4 w-4" />View Analytics</Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/admin/settings")}><Settings className="h-4 w-4" />Platform Settings</Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-lg">Platform Activity (Last 7 Days)</CardTitle><div className="flex gap-2"><Button variant="ghost" size="sm" className="text-xs">Users</Button><Button variant="ghost" size="sm" className="text-xs bg-muted">Events</Button><Button variant="ghost" size="sm" className="text-xs">Groups</Button></div></div></CardHeader>
          <CardContent><div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg bg-muted/30"><div className="text-center text-muted-foreground"><BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Chart component ready - connect to analytics API</p><p className="text-xs mt-1">Suggested: Recharts or Chart.js integration</p></div></div></CardContent>
        </Card>
      </main>

      <footer className="border-t border-border bg-card mt-8">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© 2026 Eventora Admin. All rights reserved.</p>
          <div className="flex gap-4"><a href="/admin/logs" className="hover:text-foreground">Audit Logs</a><a href="/admin/support" className="hover:text-foreground">Support</a><a href="/admin/docs" className="hover:text-foreground">Documentation</a></div>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;