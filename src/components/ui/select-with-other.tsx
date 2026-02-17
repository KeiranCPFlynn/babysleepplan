'use client'

import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Option {
  value: string
  label: string
}

interface SelectWithOtherProps {
  label: string
  description?: string
  options: Option[]
  value: string | undefined | null
  onChange: (value: string) => void
  placeholder?: string
  otherPlaceholder?: string
  error?: string
}

export function SelectWithOther({
  label,
  description,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  otherPlaceholder = 'Please specify...',
  error,
}: SelectWithOtherProps) {
  const normalizedOptions = useMemo(
    () => options.filter(option => option.value !== 'other'),
    [options]
  )

  // Check if current value is a custom "other" value (starts with "other: ", is "other", or isn't in options)
  const isOtherValue = useMemo(() => {
    if (!value) return false
    if (value === 'other') return true
    if (value.startsWith('other: ')) return true
    return !normalizedOptions.some(opt => opt.value === value)
  }, [value, normalizedOptions])

  const initialOtherText = useMemo(() => {
    if (!value) return ''
    if (value.startsWith('other: ')) return value.replace('other: ', '')
    if (isOtherValue) return value
    return ''
  }, [value, isOtherValue])

  const showOtherInput = isOtherValue
  const otherText = initialOtherText

  const handleSelectChange = (newValue: string) => {
    if (newValue === 'other') {
      // Keep the custom text if they already entered something
      onChange(otherText ? `other: ${otherText}` : 'other')
    } else {
      onChange(newValue)
    }
  }

  const handleOtherTextChange = (text: string) => {
    if (text) {
      onChange(`other: ${text}`)
    } else {
      onChange('')
    }
  }

  // Determine the select value to show
  const selectValue = showOtherInput ? 'other' : (value || undefined)

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={selectValue}
        onValueChange={handleSelectChange}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {normalizedOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
          <SelectItem value="other">Other (please specify)</SelectItem>
        </SelectContent>
      </Select>

      {showOtherInput && (
        <Input
          value={otherText}
          onChange={(e) => handleOtherTextChange(e.target.value)}
          placeholder={otherPlaceholder}
          className="mt-2"
        />
      )}

      {description && (
        <p className="text-sm text-slate-500">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
