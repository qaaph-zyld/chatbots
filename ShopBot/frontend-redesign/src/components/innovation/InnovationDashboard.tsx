'use client';

import React, { useState } from 'react';
import { 
  useInnovationPipeline, 
  InnovationItem, 
  InnovationStage,
  InnovationPriority,
  InnovationCategory
} from '@/lib/innovation/InnovationPipeline';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const priorityColors: Record<InnovationPriority, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const categoryColors: Record<InnovationCategory, string> = {
  ui: 'bg-purple-100 text-purple-800',
  ux: 'bg-pink-100 text-pink-800',
  performance: 'bg-green-100 text-green-800',
  feature: 'bg-indigo-100 text-indigo-800',
  integration: 'bg-cyan-100 text-cyan-800',
  other: 'bg-gray-100 text-gray-800'
};

const stageNames: Record<InnovationStage, string> = {
  ideation: 'Ideation',
  validation: 'Validation',
  development: 'Development',
  testing: 'Testing',
  released: 'Released'
};

interface InnovationCardProps {
  innovation: InnovationItem;
  onEdit: (innovation: InnovationItem) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, stage: InnovationStage) => void;
}

const InnovationCard: React.FC<InnovationCardProps> = ({ innovation, onEdit, onDelete, onMove }) => {
  const nextStage = (): InnovationStage | null => {
    const stages: InnovationStage[] = ['ideation', 'validation', 'development', 'testing', 'released'];
    const currentIndex = stages.indexOf(innovation.stage);
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
  };

  const next = nextStage();

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{innovation.title}</CardTitle>
          <div className="flex space-x-1">
            <Badge className={priorityColors[innovation.priority]}>
              {innovation.priority}
            </Badge>
            <Badge className={categoryColors[innovation.category]}>
              {innovation.category}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-sm text-gray-500">
          Created {new Date(innovation.createdAt).toLocaleDateString()}
          {innovation.dueDate && ` • Due ${new Date(innovation.dueDate).toLocaleDateString()}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-2">{innovation.description}</p>
        <div className="flex items-center mt-2">
          <span className="text-xs text-gray-500 mr-2">Progress:</span>
          <Progress value={innovation.progress} className="h-2 flex-1" />
          <span className="text-xs text-gray-500 ml-2">{innovation.progress}%</span>
        </div>
        {innovation.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {innovation.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-1 flex justify-between">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(innovation)}>
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-red-500" onClick={() => onDelete(innovation.id)}>
            Delete
          </Button>
        </div>
        {next && (
          <Button size="sm" onClick={() => onMove(innovation.id, next)}>
            Move to {stageNames[next]}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

interface InnovationFormProps {
  innovation?: InnovationItem;
  onSubmit: (innovation: Omit<InnovationItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const InnovationForm: React.FC<InnovationFormProps> = ({ innovation, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(innovation?.title || '');
  const [description, setDescription] = useState(innovation?.description || '');
  const [priority, setPriority] = useState<InnovationPriority>(innovation?.priority || 'medium');
  const [category, setCategory] = useState<InnovationCategory>(innovation?.category || 'feature');
  const [tags, setTags] = useState(innovation?.tags.join(', ') || '');
  const [dueDate, setDueDate] = useState(innovation?.dueDate || '');
  const [assignedTo, setAssignedTo] = useState(innovation?.assignedTo || '');
  const [progress, setProgress] = useState(innovation?.progress.toString() || '0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tagArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    onSubmit({
      title,
      description,
      priority,
      category,
      tags: tagArray,
      dueDate: dueDate || undefined,
      assignedTo: assignedTo || undefined,
      progress: parseInt(progress, 10),
      stage: innovation?.stage || 'ideation',
      createdBy: innovation?.createdBy || 'current-user',
      status: innovation?.status || 'active'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as InnovationPriority)}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={(value) => setCategory(value as InnovationCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ui">UI</SelectItem>
              <SelectItem value="ux">UX</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="feature">Feature</SelectItem>
              <SelectItem value="integration">Integration</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate ? dueDate.split('T')[0] : ''}
            onChange={e => setDueDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="assignedTo">Assigned To</Label>
          <Input
            id="assignedTo"
            value={assignedTo}
            onChange={e => setAssignedTo(e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input
          id="tags"
          value={tags}
          onChange={e => setTags(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="progress">Progress (%)</Label>
        <Input
          id="progress"
          type="number"
          min="0"
          max="100"
          value={progress}
          onChange={e => setProgress(e.target.value)}
        />
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {innovation ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export function InnovationDashboard() {
  const {
    innovations,
    getInnovationsByStage,
    addInnovation,
    updateInnovation,
    deleteInnovation,
    moveInnovation
  } = useInnovationPipeline();
  
  const [activeTab, setActiveTab] = useState<InnovationStage>('ideation');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInnovation, setEditingInnovation] = useState<InnovationItem | null>(null);
  
  const handleAddInnovation = (innovation: Omit<InnovationItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    addInnovation(innovation);
    setIsDialogOpen(false);
  };
  
  const handleUpdateInnovation = (innovation: Omit<InnovationItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingInnovation) {
      updateInnovation(editingInnovation.id, innovation);
      setEditingInnovation(null);
      setIsDialogOpen(false);
    }
  };
  
  const handleEditInnovation = (innovation: InnovationItem) => {
    setEditingInnovation(innovation);
    setIsDialogOpen(true);
  };
  
  const handleDeleteInnovation = (id: string) => {
    if (confirm('Are you sure you want to delete this innovation?')) {
      deleteInnovation(id);
    }
  };
  
  const handleMoveInnovation = (id: string, stage: InnovationStage) => {
    moveInnovation(id, stage);
  };
  
  const stages: InnovationStage[] = ['ideation', 'validation', 'development', 'testing', 'released'];
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Innovation Pipeline</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingInnovation(null)}>
              Add New Innovation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingInnovation ? 'Edit Innovation' : 'Add New Innovation'}</DialogTitle>
              <DialogDescription>
                {editingInnovation 
                  ? 'Update the details of this innovation item.' 
                  : 'Create a new innovation item to track in the pipeline.'}
              </DialogDescription>
            </DialogHeader>
            <InnovationForm 
              innovation={editingInnovation || undefined} 
              onSubmit={editingInnovation ? handleUpdateInnovation : handleAddInnovation} 
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingInnovation(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="ideation" value={activeTab} onValueChange={(value) => setActiveTab(value as InnovationStage)}>
        <TabsList className="grid grid-cols-5 mb-6">
          {stages.map((stage) => (
            <TabsTrigger key={stage} value={stage} className="text-sm">
              {stageNames[stage]}
              <Badge className="ml-2 bg-gray-200 text-gray-700">
                {getInnovationsByStage(stage).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {stages.map((stage) => (
          <TabsContent key={stage} value={stage}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getInnovationsByStage(stage).length > 0 ? (
                getInnovationsByStage(stage).map((innovation) => (
                  <InnovationCard
                    key={innovation.id}
                    innovation={innovation}
                    onEdit={handleEditInnovation}
                    onDelete={handleDeleteInnovation}
                    onMove={handleMoveInnovation}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-10 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No innovations in this stage yet.</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => {
                      setEditingInnovation(null);
                      setIsDialogOpen(true);
                    }}
                  >
                    Add New Innovation
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Innovation Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Innovations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{innovations.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In Development</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{getInnovationsByStage('development').length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Released</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{getInnovationsByStage('released').length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{innovations.filter(i => i.priority === 'critical').length}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
