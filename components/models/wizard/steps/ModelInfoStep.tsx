'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Package, Tag, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCustomers, type Customer } from '@/lib/api/customers';

interface ModelInfoStepProps {
  data: {
    code?: string;
    name?: string;
    customerId?: string;
    status?: 'active' | 'inactive';
    boardTypes?: string[];
  };
  onChange: (data: any) => void;
}

const COMMON_BOARD_TYPES = ['T', 'B', 'MB', 'TB', 'MAIN', 'SUB', 'FLEX'];

export function ModelInfoStep({ data, onChange }: ModelInfoStepProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBoardType, setNewBoardType] = useState('');
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const customerData = await getCustomers();
        setCustomers(customerData);
      } catch (error) {
        console.error('Failed to load customers:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
  }, []);

  const validateCode = (code: string) => {
    if (!code) {
      setCodeError('Model code is required');
      return false;
    }
    if (!/^[A-Z0-9_-]+$/i.test(code)) {
      setCodeError('Only letters, numbers, underscores and dashes allowed');
      return false;
    }
    setCodeError('');
    return true;
  };

  const handleCodeChange = (value: string) => {
    const upperValue = value.toUpperCase();
    validateCode(upperValue);
    onChange({ ...data, code: upperValue });
  };

  const handleAddBoardType = (type: string) => {
    const normalizedType = type.toUpperCase().trim();
    if (!normalizedType) return;

    const currentTypes = data.boardTypes || [];
    if (!currentTypes.includes(normalizedType)) {
      onChange({ ...data, boardTypes: [...currentTypes, normalizedType] });
    }
    setNewBoardType('');
  };

  const handleRemoveBoardType = (type: string) => {
    const currentTypes = data.boardTypes || [];
    onChange({ ...data, boardTypes: currentTypes.filter(t => t !== type) });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Model Information
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Enter the basic information for the new model
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="customer" className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            Customer *
          </Label>
          <Select
            value={data.customerId || ''}
            onValueChange={(value) => onChange({ ...data, customerId: value })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={loading ? 'Loading...' : 'Select customer'} />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.code} - {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
            Status
          </Label>
          <Select
            value={data.status || 'active'}
            onValueChange={(value) => onChange({ ...data, status: value as 'active' | 'inactive' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="code" className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            Model Code *
          </Label>
          <Input
            id="code"
            value={data.code || ''}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="e.g., POCO-X7-PRO"
            className={codeError ? 'border-red-500' : ''}
          />
          {codeError && (
            <p className="text-sm text-red-500">{codeError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" />
            Model Name *
          </Label>
          <Input
            id="name"
            value={data.name || ''}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="e.g., Poco X7 Pro"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-slate-400" />
          Board Types *
        </Label>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Select the board types for this model (e.g., T for Top, B for Bottom)
        </p>

        <div className="flex flex-wrap gap-2">
          {COMMON_BOARD_TYPES.map((type) => {
            const isSelected = (data.boardTypes || []).includes(type);
            return (
              <motion.button
                key={type}
                type="button"
                onClick={() => isSelected ? handleRemoveBoardType(type) : handleAddBoardType(type)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {type}
                {isSelected && <span className="ml-1">✓</span>}
              </motion.button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Input
            value={newBoardType}
            onChange={(e) => setNewBoardType(e.target.value.toUpperCase())}
            placeholder="Add custom board type..."
            className="max-w-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddBoardType(newBoardType);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => handleAddBoardType(newBoardType)}
            disabled={!newBoardType.trim()}
          >
            Add
          </Button>
        </div>

        {(data.boardTypes || []).length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Selected board types:</p>
            <div className="flex flex-wrap gap-2">
              {data.boardTypes?.map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="px-3 py-1 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300"
                  onClick={() => handleRemoveBoardType(type)}
                >
                  {type} ×
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
