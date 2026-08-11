import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Clock, Eye, Search, Calendar } from "lucide-react";
import { format, startOfDay, endOfDay, isBefore, isAfter, isWithinInterval } from "date-fns";

export default function AdminDashboard() {
  const { admin, loading: authLoading } = useAdminAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<string>("upcoming");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("all"); // 'all', 'collection', 'custom'

  const { data: orders, isLoading, error } = trpc.orders.list.useQuery(undefined, {
    enabled: !!admin,
  });

  const logoutMutation = trpc.adminAuth.logout.useMutation({
    onSuccess: async () => {
      await utils.adminAuth.me.invalidate();
      navigate("/admin/login");
    },
  });

  const allOrders = useMemo(() => {
    return [...(orders || [])].sort(
      (a, b) => new Date(a.fulfillmentDate).getTime() - new Date(b.fulfillmentDate).getTime()
    );
  }, [orders]);

  // Categorize orders by delivery date
  const ordersByDate = useMemo(() => {
    if (!allOrders) return { past: [], today: [], upcoming: [] };
    
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    
    return {
      past: allOrders.filter(o => isBefore(new Date(o.fulfillmentDate), todayStart)),
      today: allOrders.filter(o => isWithinInterval(new Date(o.fulfillmentDate), { start: todayStart, end: todayEnd })),
      upcoming: allOrders.filter(o => isAfter(new Date(o.fulfillmentDate), todayEnd)),
    };
  }, [allOrders]);

  // Filter orders based on search query
  const filteredOrders = useMemo(() => {
    const ordersToFilter = activeTab === "past" ? ordersByDate.past : 
                           activeTab === "today" ? ordersByDate.today : 
                           ordersByDate.upcoming;
    
    if (!searchQuery.trim()) return ordersToFilter;
    
    const query = searchQuery.toLowerCase();
    return ordersToFilter.filter(order => {
      const orderNumber = order.orderNumber || '';
      const customerName = order.customerName?.toLowerCase() || '';
      const customerPhone = order.customerPhone?.toLowerCase() || '';
      
      return orderNumber.toLowerCase().includes(query) || 
             customerName.includes(query) || 
             customerPhone.includes(query);
    });
  }, [ordersByDate, activeTab, searchQuery]);

  // Filter by which collection(s) an order's items belong to
  const displayOrders = useMemo(() => {
    if (orderTypeFilter === "all") return filteredOrders;
    if (orderTypeFilter === "collection") {
      return filteredOrders.filter(o => o.items?.some((i: any) => i.collection === "cny"));
    }
    return filteredOrders.filter(o => o.items?.some((i: any) => i.collection === "custom"));
  }, [filteredOrders, orderTypeFilter]);

  // Count orders by which collection(s) they contain
  const collectionCount = useMemo(() =>
    filteredOrders.filter(o => o.items?.some((i: any) => i.collection === "cny")).length,
    [filteredOrders]
  );
  const customCount = useMemo(() =>
    filteredOrders.filter(o => o.items?.some((i: any) => i.collection === "custom")).length,
    [filteredOrders]
  );

  // Early return after all hooks
  if (!authLoading && !admin) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_confirmation":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Confirmation</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case "delivered":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Delivered</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const OrderCard = ({ order }: { order: any }) => {
    const collections: string[] = Array.from(new Set((order.items || []).map((i: any) => i.collection)));

    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/admin/orders/${order.id}`)}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                {order.orderNumber || `JJA${order.id.toString().padStart(4, '0')}`}
                {collections.includes("cny") && <Badge variant="secondary" className="ml-2 text-xs">CNY Collection</Badge>}
                {collections.includes("custom") && <Badge variant="secondary" className="ml-2 text-xs">Custom</Badge>}
              </CardTitle>
              <CardDescription className="mt-1">{order.customerName}</CardDescription>
            </div>
            {order.paymentStatus === 'paid' ? (
              <Badge variant="default" className="bg-green-600">Paid</Badge>
            ) : order.paymentStatus === 'failed' ? (
              <Badge variant="destructive">Failed</Badge>
            ) : order.paymentStatus === 'refunded' ? (
              <Badge variant="secondary">Refunded</Badge>
            ) : (
              <Badge variant="outline">Pending</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items:</span>
              <span className="font-medium">
                {order.items?.length || 0} item(s)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">${order.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Date:</span>
              <span className="font-medium">{format(new Date(order.fulfillmentDate), 'MMM dd, yyyy')}</span>
            </div>
            {order.timeRange ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium">{order.timeRange}</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium">{format(new Date(order.fulfillmentDate), 'HH:mm')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method:</span>
              <span className="font-medium capitalize">{order.deliveryMethod}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Orders</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage customer orders and track progress</p>
          </div>
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            Logout
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordersByDate.upcoming.length}</div>
              <p className="text-xs text-muted-foreground">Future deliveries</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordersByDate.today.length}</div>
              <p className="text-xs text-muted-foreground">For delivery today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Past Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordersByDate.past.length}</div>
              <p className="text-xs text-muted-foreground">Completed deliveries</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number, customer name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={orderTypeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setOrderTypeFilter("all")}
            >
              All Orders ({filteredOrders.length})
            </Button>
            <Button
              variant={orderTypeFilter === "collection" ? "default" : "outline"}
              size="sm"
              onClick={() => setOrderTypeFilter("collection")}
            >
              Collection Orders ({collectionCount})
            </Button>
            <Button
              variant={orderTypeFilter === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setOrderTypeFilter("custom")}
            >
              Custom Orders ({customCount})
            </Button>
          </div>
        </div>

        {/* Orders Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming ({ordersByDate.upcoming.length})</TabsTrigger>
            <TabsTrigger value="today">Today ({ordersByDate.today.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({ordersByDate.past.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {displayOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No upcoming orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="today" className="mt-6">
            {displayOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No orders for today</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {displayOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No past orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
