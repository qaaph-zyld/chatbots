'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  Mail, 
  Smartphone, 
  Slack, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  PauseCircle
} from 'lucide-react';

// Types for scheduled reports
type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';
type DeliveryMethod = 'email' | 'slack' | 'sms' | 'dashboard';
type ReportStatus = 'active' | 'paused' | 'failed';

interface ScheduledReport {
  id: string;
  name: string;
  reportId: string;
  reportName: string;
  frequency: ReportFrequency;
  deliveryMethods: DeliveryMethod[];
  recipients: string[];
  nextRun: string;
  lastRun: string | null;
  status: ReportStatus;
}

// Mock data for scheduled reports
const mockScheduledReports: ScheduledReport[] = [
  {
    id: 'sched-001',
    name: 'Weekly Performance Summary',
    reportId: 'rep-001',
    reportName: 'Performance Overview',
    frequency: 'weekly',
    deliveryMethods: ['email', 'dashboard'],
    recipients: ['team@example.com', 'manager@example.com'],
    nextRun: '2025-07-22',
    lastRun: '2025-07-15',
    status: 'active'
  },
  {
    id: 'sched-002',
    name: 'Monthly Customer Analysis',
    reportId: 'rep-002',
    reportName: 'Customer Retention Report',
    frequency: 'monthly',
    deliveryMethods: ['email', 'slack'],
    recipients: ['analytics@example.com'],
    nextRun: '2025-08-01',
    lastRun: '2025-07-01',
    status: 'active'
  },
  {
    id: 'sched-003',
    name: 'Daily Conversation Metrics',
    reportId: 'rep-003',
    reportName: 'Conversation Performance',
    frequency: 'daily',
    deliveryMethods: ['dashboard'],
    recipients: [],
    nextRun: '2025-07-20',
    lastRun: '2025-07-19',
    status: 'paused'
  },
  {
    id: 'sched-004',
    name: 'Quarterly Business Review',
    reportId: 'rep-004',
    reportName: 'Business Performance Summary',
    frequency: 'quarterly',
    deliveryMethods: ['email', 'slack', 'dashboard'],
    recipients: ['executives@example.com', 'board@example.com'],
    nextRun: '2025-09-30',
    lastRun: '2025-06-30',
    status: 'active'
  },
  {
    id: 'sched-005',
    name: 'Weekly Sales Report',
    reportId: 'rep-005',
    reportName: 'Sales Performance',
    frequency: 'weekly',
    deliveryMethods: ['email'],
    recipients: ['sales@example.com'],
    nextRun: '2025-07-22',
    lastRun: null,
    status: 'failed'
  }
];

// Mock data for available reports
const availableReports = [
  { id: 'rep-001', name: 'Performance Overview' },
  { id: 'rep-002', name: 'Customer Retention Report' },
  { id: 'rep-003', name: 'Conversation Performance' },
  { id: 'rep-004', name: 'Business Performance Summary' },
  { id: 'rep-005', name: 'Sales Performance' },
  { id: 'rep-006', name: 'Product Analysis' },
  { id: 'rep-007', name: 'Marketing Campaign Results' }
];

export function ScheduledReports() {
  // State for UI tabs
  const [activeTab, setActiveTab] = useState<'active' | 'create'>('active');
  
  // State for scheduled reports
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(mockScheduledReports);
  
  // State for new report form
  const [newReport, setNewReport] = useState({
    name: '',
    reportId: '',
    frequency: 'weekly' as ReportFrequency,
    deliveryMethods: ['email'] as DeliveryMethod[],
    recipients: [''] as string[],
    dayOfWeek: 'monday',
    timeOfDay: '09:00'
  });
  
  // Toggle delivery method
  const toggleDeliveryMethod = (method: DeliveryMethod) => {
    setNewReport(prev => {
      const isSelected = prev.deliveryMethods.includes(method);
      return {
        ...prev,
        deliveryMethods: isSelected
          ? prev.deliveryMethods.filter(m => m !== method)
          : [...prev.deliveryMethods, method]
      };
    });
  };
  
  // Add recipient field
  const addRecipient = () => {
    setNewReport(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };
  
  // Update recipient
  const updateRecipient = (index: number, value: string) => {
    setNewReport(prev => {
      const newRecipients = [...prev.recipients];
      newRecipients[index] = value;
      return {
        ...prev,
        recipients: newRecipients
      };
    });
  };
  
  // Remove recipient
  const removeRecipient = (index: number) => {
    setNewReport(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };
  
  // Create scheduled report
  const createScheduledReport = () => {
    // In a real implementation, this would call an API
    const reportName = availableReports.find(r => r.id === newReport.reportId)?.name || '';
    
    const newScheduledReport: ScheduledReport = {
      id: `sched-${Date.now()}`,
      name: newReport.name,
      reportId: newReport.reportId,
      reportName,
      frequency: newReport.frequency,
      deliveryMethods: newReport.deliveryMethods,
      recipients: newReport.recipients.filter(r => r.trim() !== ''),
      nextRun: '2025-07-26', // This would be calculated based on frequency
      lastRun: null,
      status: 'active'
    };
    
    setScheduledReports(prev => [...prev, newScheduledReport]);
    setActiveTab('active');
    
    // Reset form
    setNewReport({
      name: '',
      reportId: '',
      frequency: 'weekly',
      deliveryMethods: ['email'],
      recipients: [''],
      dayOfWeek: 'monday',
      timeOfDay: '09:00'
    });
  };
  
  // Toggle report status
  const toggleReportStatus = (id: string) => {
    setScheduledReports(prev => 
      prev.map(report => {
        if (report.id === id) {
          const newStatus: ReportStatus = report.status === 'active' ? 'paused' : 'active';
          return { ...report, status: newStatus };
        }
        return report;
      })
    );
  };
  
  // Delete report
  const deleteReport = (id: string) => {
    setScheduledReports(prev => prev.filter(report => report.id !== id));
  };
  
  // Get status badge
  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>
        );
      case 'paused':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <PauseCircle className="h-3 w-3" />
            Paused
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
    }
  };
  
  // Get delivery method icon
  const getDeliveryMethodIcon = (method: DeliveryMethod) => {
    switch (method) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'slack':
        return <Slack className="h-4 w-4" />;
      case 'sms':
        return <Smartphone className="h-4 w-4" />;
      case 'dashboard':
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };
  
  // Get frequency display
  const getFrequencyDisplay = (frequency: ReportFrequency) => {
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'quarterly':
        return 'Quarterly';
    }
  };
  
  return (
    <Card className="w-full" data-testid="scheduled-reports">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Scheduled Reports</CardTitle>
            <CardDescription>
              Automate report delivery and alerts to stakeholders
            </CardDescription>
          </div>
          
          <Button onClick={() => setActiveTab('create')}>
            <Plus className="h-4 w-4 mr-1" />
            New Schedule
          </Button>
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'active' | 'create')}
          className="mt-4"
        >
          <TabsList className="grid grid-cols-2 w-full sm:w-auto">
            <TabsTrigger value="active">Active Schedules</TabsTrigger>
            <TabsTrigger value="create">Create Schedule</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent>
        <TabsContent value="active" className="space-y-6 mt-0">
          {scheduledReports.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No scheduled reports found.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setActiveTab('create')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Schedule
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledReports.map(report => (
                <div 
                  key={report.id}
                  className="border rounded-lg p-4 transition-all hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(report.status)}
                        <Badge variant="secondary">
                          {getFrequencyDisplay(report.frequency)}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-lg">{report.name}</h3>
                      <p className="text-sm text-muted-foreground">Report: {report.reportName}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleReportStatus(report.id)}
                      >
                        {report.status === 'active' ? 'Pause' : 'Activate'}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteReport(report.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-3 gap-4 mt-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Delivery</h4>
                      <div className="flex flex-wrap gap-2">
                        {report.deliveryMethods.map(method => (
                          <Badge key={method} variant="outline" className="flex items-center gap-1">
                            {getDeliveryMethodIcon(method)}
                            <span className="capitalize">{method}</span>
                          </Badge>
                        ))}
                      </div>
                      {report.recipients.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {report.recipients.length} recipient{report.recipients.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Next Run</h4>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {report.nextRun}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Last Run</h4>
                      <div className="flex items-center gap-1 text-sm">
                        {report.lastRun ? (
                          <>
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {report.lastRun}
                          </>
                        ) : (
                          <span className="text-muted-foreground">Never run</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="create" className="mt-0">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="schedule-name">Schedule Name</Label>
                <Input 
                  id="schedule-name" 
                  value={newReport.name}
                  onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter schedule name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="report-select">Select Report</Label>
                <Select 
                  value={newReport.reportId}
                  onValueChange={(value) => setNewReport(prev => ({ ...prev, reportId: value }))}
                >
                  <SelectTrigger id="report-select">
                    <SelectValue placeholder="Select a report" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableReports.map(report => (
                      <SelectItem key={report.id} value={report.id}>
                        {report.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <Label>Frequency</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={newReport.frequency === 'daily' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewReport(prev => ({ ...prev, frequency: 'daily' }))}
                >
                  Daily
                </Button>
                <Button
                  variant={newReport.frequency === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewReport(prev => ({ ...prev, frequency: 'weekly' }))}
                >
                  Weekly
                </Button>
                <Button
                  variant={newReport.frequency === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewReport(prev => ({ ...prev, frequency: 'monthly' }))}
                >
                  Monthly
                </Button>
                <Button
                  variant={newReport.frequency === 'quarterly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewReport(prev => ({ ...prev, frequency: 'quarterly' }))}
                >
                  Quarterly
                </Button>
              </div>
            </div>
            
            {newReport.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label htmlFor="day-of-week">Day of Week</Label>
                <Select 
                  value={newReport.dayOfWeek}
                  onValueChange={(value) => setNewReport(prev => ({ ...prev, dayOfWeek: value }))}
                >
                  <SelectTrigger id="day-of-week">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {newReport.frequency === 'monthly' && (
              <div className="space-y-2">
                <Label htmlFor="day-of-month">Day of Month</Label>
                <Select 
                  value="1"
                  onValueChange={() => {}}
                >
                  <SelectTrigger id="day-of-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="time-of-day">Time of Day</Label>
              <Input 
                id="time-of-day" 
                type="time"
                value={newReport.timeOfDay}
                onChange={(e) => setNewReport(prev => ({ ...prev, timeOfDay: e.target.value }))}
              />
            </div>
            
            <div className="space-y-4">
              <Label>Delivery Methods</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="email-delivery"
                    checked={newReport.deliveryMethods.includes('email')}
                    onCheckedChange={() => toggleDeliveryMethod('email')}
                  />
                  <Label htmlFor="email-delivery" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="slack-delivery"
                    checked={newReport.deliveryMethods.includes('slack')}
                    onCheckedChange={() => toggleDeliveryMethod('slack')}
                  />
                  <Label htmlFor="slack-delivery" className="flex items-center gap-2">
                    <Slack className="h-4 w-4" />
                    Slack
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="sms-delivery"
                    checked={newReport.deliveryMethods.includes('sms')}
                    onCheckedChange={() => toggleDeliveryMethod('sms')}
                  />
                  <Label htmlFor="sms-delivery" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    SMS
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="dashboard-delivery"
                    checked={newReport.deliveryMethods.includes('dashboard')}
                    onCheckedChange={() => toggleDeliveryMethod('dashboard')}
                  />
                  <Label htmlFor="dashboard-delivery" className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Dashboard
                  </Label>
                </div>
              </div>
            </div>
            
            {(newReport.deliveryMethods.includes('email') || 
              newReport.deliveryMethods.includes('slack') || 
              newReport.deliveryMethods.includes('sms')) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Recipients</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={addRecipient}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Recipient
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {newReport.recipients.map((recipient, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input 
                        value={recipient}
                        onChange={(e) => updateRecipient(index, e.target.value)}
                        placeholder="Email, Slack channel, or phone number"
                        className="flex-1"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeRecipient(index)}
                        disabled={newReport.recipients.length === 1 && index === 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline"
                onClick={() => setActiveTab('active')}
              >
                Cancel
              </Button>
              <Button 
                onClick={createScheduledReport}
                disabled={!newReport.name || !newReport.reportId}
              >
                Create Schedule
              </Button>
            </div>
          </div>
        </TabsContent>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Reports will be delivered according to your timezone settings
        </p>
      </CardFooter>
    </Card>
  );
}
