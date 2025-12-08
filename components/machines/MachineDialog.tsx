'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Machine, MachineInput, createMachine, updateMachine } from '@/lib/api/stations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { modalVariants, shakeVariants } from '@/lib/animations';

interface MachineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  machine?: Machine | null;
  onSuccess: () => void;
}

const categories = ['Testing', 'Assembly', 'Inspection'];

export function MachineDialog({ isOpen, onClose, machine, onSuccess }: MachineDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [formData, setFormData] = useState<MachineInput>({
    code: '',
    name: '',
    description: '',
    category: 'Testing',
    typical_uph: 100,
    typical_cycle_time_sec: 36,
    operator_ratio: 1.0,
    triggers_if: [],
    required_for: [],
  });

  useEffect(() => {
    if (machine) {
      setFormData({
        code: machine.code,
        name: machine.name,
        description: machine.description || '',
        category: machine.category,
        typical_uph: machine.typical_uph,
        typical_cycle_time_sec: machine.typical_cycle_time_sec,
        operator_ratio: machine.operator_ratio,
        triggers_if: machine.triggers_if || [],
        required_for: machine.required_for || [],
      });
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        category: 'Testing',
        typical_uph: 100,
        typical_cycle_time_sec: 36,
        operator_ratio: 1.0,
        triggers_if: [],
        required_for: [],
      });
    }
    setError(false);
  }, [machine, isOpen]);

  useEffect(() => {
    if (formData.typical_uph > 0) {
      const cycleTime = Math.round(3600 / formData.typical_uph);
      setFormData(prev => ({ ...prev, typical_cycle_time_sec: cycleTime }));
    }
  }, [formData.typical_uph]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    try {
      if (machine) {
        await updateMachine(machine.id, formData);
        toast.success('Machine updated successfully', {
          description: `${formData.code} - ${formData.name}`,
        });
      } else {
        await createMachine(formData);
        toast.success('Machine created successfully', {
          description: `${formData.code} - ${formData.name}`,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(true);
      toast.error('Failed to save machine', {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValidCode = formData.code.length >= 2 && /^[A-Z0-9_]+$/.test(formData.code);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {machine ? 'Edit Machine' : 'Add New Machine'}
          </DialogTitle>
        </DialogHeader>

        <motion.form
          onSubmit={handleSubmit}
          animate={error ? 'shake' : ''}
          variants={shakeVariants}
          className="space-y-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="MBT"
                required
                disabled={isLoading || !!machine}
                className="font-mono"
              />
              {formData.code && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1 text-sm"
                >
                  {isValidCode ? (
                    <>
                      <Check className="w-3 h-3 text-success" />
                      <span className="text-success">Valid code format</span>
                    </>
                  ) : (
                    <span className="text-error">Use uppercase letters, numbers, and underscores</span>
                  )}
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Manual Bench Test"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Manual rework and bench-level testing station"
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as 'Testing' | 'Assembly' | 'Inspection' | 'Programming' })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="typical_uph">Typical UPH</Label>
              <Input
                id="typical_uph"
                type="number"
                value={formData.typical_uph}
                onChange={(e) => setFormData({ ...formData, typical_uph: parseInt(e.target.value) || 0 })}
                min="1"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="typical_cycle_time_sec">Cycle Time (s)</Label>
              <Input
                id="typical_cycle_time_sec"
                type="number"
                value={formData.typical_cycle_time_sec}
                onChange={(e) => setFormData({ ...formData, typical_cycle_time_sec: parseInt(e.target.value) || 0 })}
                min="1"
                disabled={isLoading}
                className="bg-slate-50"
              />
              <p className="text-xs text-slate-500">Auto-calculated from UPH</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Operator Ratio</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[formData.operator_ratio]}
                onValueChange={(value) => setFormData({ ...formData, operator_ratio: value[0] })}
                min={0.5}
                max={2}
                step={0.5}
                disabled={isLoading}
                className="flex-1"
              />
              <span className="text-sm font-medium w-20 text-right tabular-nums">
                {formData.operator_ratio} operator{formData.operator_ratio !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isValidCode}
              className="bg-gradient-to-r from-primary-600 to-primary-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>Save Machine</>
              )}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
