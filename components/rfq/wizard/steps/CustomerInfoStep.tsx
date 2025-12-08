'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion } from 'framer-motion';

interface CustomerInfoStepProps {
  data: any;
  onChange: (data: any) => void;
}

const mockCustomers = [
  'XIAOMI',
  'TCL',
  'REALME',
  'OPPO',
  'VIVO',
  'SAMSUNG',
  'HUAWEI',
  'LENOVO',
];

const mockModels = [
  { id: 1, name: 'POCO-X6-PRO-MAIN', customer: 'XIAOMI' },
  { id: 2, name: 'REDMI-13-MAIN', customer: 'XIAOMI' },
  { id: 3, name: 'TCL-50XE-MAIN', customer: 'TCL' },
  { id: 4, name: 'REALME-C55-MAIN', customer: 'REALME' },
];

export function CustomerInfoStep({ data, onChange }: CustomerInfoStepProps) {
  const [formData, setFormData] = useState({
    customer: data?.customer || '',
    modelName: data?.modelName || '',
    referenceModel: data?.referenceModel || '',
    targetUPH: data?.targetUPH || '',
    targetVolume: data?.targetVolume || '',
    notes: data?.notes || '',
  });

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const filteredModels = mockModels.filter(
    (model) => !formData.customer || model.customer === formData.customer
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="customer">
          Customer <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.customer}
          onValueChange={(value) => handleChange('customer', value)}
        >
          <SelectTrigger id="customer" className="h-11">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <SelectValue placeholder="Search or select customer..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            {mockCustomers.map((customer) => (
              <SelectItem key={customer} value={customer}>
                {customer}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-slate-500 flex items-center gap-1">
          Don't see your customer?{' '}
          <Button variant="link" className="h-auto p-0 text-sm text-primary-600">
            <Plus className="w-3 h-3 mr-1" />
            Add New
          </Button>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="modelName">
          Model Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="modelName"
          placeholder="Enter new model name..."
          value={formData.modelName}
          onChange={(e) => handleChange('modelName', e.target.value)}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="referenceModel" className="flex items-center gap-2">
          Reference Model (Optional)
          <div className="group relative">
            <Info className="w-4 h-4 text-slate-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Select if this model is similar to an existing one
            </div>
          </div>
        </Label>
        <Select
          value={formData.referenceModel}
          onValueChange={(value) => handleChange('referenceModel', value)}
        >
          <SelectTrigger id="referenceModel" className="h-11">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <SelectValue placeholder="Search existing models for reference..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            {filteredModels.map((model) => (
              <SelectItem key={model.id} value={model.name}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-slate-500">
          Select if this model is similar to an existing one
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="targetUPH">Target UPH</Label>
          <Input
            id="targetUPH"
            type="number"
            placeholder="200"
            value={formData.targetUPH}
            onChange={(e) => handleChange('targetUPH', e.target.value)}
            className="h-11"
          />
          <p className="text-sm text-slate-500">units/hour</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetVolume">Target Volume</Label>
          <Input
            id="targetVolume"
            type="number"
            placeholder="10,000"
            value={formData.targetVolume}
            onChange={(e) => handleChange('targetVolume', e.target.value)}
            className="h-11"
          />
          <p className="text-sm text-slate-500">units/month</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any special requirements or notes..."
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );
}
