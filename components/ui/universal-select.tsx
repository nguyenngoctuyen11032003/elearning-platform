"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const EMPTY_SENTINEL = "__UNIVERSAL_SELECT_EMPTY__"

type OptionNode = {
  value: string
  label: string
  disabled?: boolean
}

type UniversalSelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "onChange"
> & {
  onChange?: (event: { target: { value: string; name?: string; id?: string } }) => void
  contentClassName?: string
  portalled?: boolean
}

const normalizeOptionValue = (value: string): string =>
  value === "" ? EMPTY_SENTINEL : value

const denormalizeOptionValue = (value: string): string =>
  value === EMPTY_SENTINEL ? "" : value

const parseOptionNodes = (children: React.ReactNode): OptionNode[] => {
  const nodes: OptionNode[] = []

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return

    const elementType = typeof child.type === "string" ? child.type.toLowerCase() : ""

    if (elementType === "option") {
      const rawValue = child.props.value ?? ""
      const label =
        typeof child.props.children === "string"
          ? child.props.children
          : String(child.props.children ?? rawValue)

      nodes.push({
        value: String(rawValue),
        label,
        disabled: Boolean(child.props.disabled),
      })
      return
    }

    if (elementType === "optgroup") {
      nodes.push(...parseOptionNodes(child.props.children))
    }
  })

  return nodes
}

export function UniversalSelect({
  children,
  value,
  defaultValue,
  onChange,
  name,
  id,
  className,
  contentClassName,
  portalled = false,
  disabled,
  title,
}: UniversalSelectProps) {
  const options = React.useMemo(() => parseOptionNodes(children), [children])

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = React.useState<string>(
    String(defaultValue ?? options[0]?.value ?? ""),
  )

  React.useEffect(() => {
    if (isControlled) return
    if (options.length === 0) return
    if (options.some((opt) => opt.value === internalValue)) return
    setInternalValue(options[0]?.value ?? "")
  }, [isControlled, internalValue, options])

  const currentValue = isControlled ? String(value ?? "") : internalValue
  const selected = options.find((option) => option.value === currentValue)
  const triggerValue = normalizeOptionValue(currentValue)

  const handleValueChange = (nextValueRaw: string) => {
    const nextValue = denormalizeOptionValue(nextValueRaw)
    if (!isControlled) {
      setInternalValue(nextValue)
    }

    onChange?.({
      target: {
        value: nextValue,
        name,
        id,
      },
    })
  }

  return (
    <>
      {name ? <input type="hidden" name={name} value={currentValue} /> : null}
      <Select value={triggerValue} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger id={id} className={className} title={title}>
          <SelectValue>{selected?.label ?? ""}</SelectValue>
        </SelectTrigger>
        <SelectContent className={contentClassName} portalled={portalled}>
          {options.map((option) => (
            <SelectItem
              key={`${option.value || "empty"}-${option.label}`}
              value={normalizeOptionValue(option.value)}
              disabled={option.disabled}
              className="text-foreground"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}
