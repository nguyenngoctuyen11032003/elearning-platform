import { Fragment, type ReactNode } from "react"

type ScientificTextProps = {
  text?: string | number | null
  className?: string
  as?: "span" | "p" | "div"
}

const CHEMICAL_SEQUENCE_REGEX = /(?:\b[A-Z][a-z]?\b|\d+|[()+-])(?:\s+(?:\b[A-Z][a-z]?\b|\d+|[()+-])){2,}/g

function normalizeEscapedLineBreaks(value: string): string {
  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
}

function collapseScientificSpacing(value: string): string {
  return value.replace(CHEMICAL_SEQUENCE_REGEX, (match) => match.replace(/\s+/g, ""))
}

function renderChemicalToken(token: string, keyPrefix: string): ReactNode[] | null {
  let base = token
  let charge = ""

  const chargeMatch = token.match(/^(.*?)(\d*[+-]|[+-]\d*)$/)
  if (chargeMatch && chargeMatch[1] && /[A-Za-z)]/.test(chargeMatch[1])) {
    base = chargeMatch[1]
    charge = chargeMatch[2]
  }

  const nodes: ReactNode[] = []
  const elementRegex = /([A-Z][a-z]?)(\d*)/g
  let cursor = 0
  let index = 0

  for (const match of base.matchAll(elementRegex)) {
    const full = match[0]
    const symbol = match[1]
    const count = match[2]
    const start = match.index ?? 0

    if (start !== cursor) {
      return null
    }

    nodes.push(
      <Fragment key={`${keyPrefix}-el-${index}`}>
        {symbol}
        {count ? <sub>{count}</sub> : null}
      </Fragment>,
    )

    cursor += full.length
    index += 1
  }

  if (nodes.length === 0 || cursor !== base.length) {
    return null
  }

  if (charge) {
    nodes.push(
      <sup key={`${keyPrefix}-charge`}>{charge}</sup>,
    )
  }

  return nodes
}

function renderToken(token: string, keyPrefix: string): ReactNode {
  const powerMatch = token.match(/^(.+)\^([+-]?\d+[+-]?|[+-])$/)
  if (powerMatch) {
    const base = powerMatch[1]
    const exponent = powerMatch[2]
    return (
      <Fragment key={`${keyPrefix}-pow`}>
        {renderToken(base, `${keyPrefix}-base`)}
        <sup>{exponent}</sup>
      </Fragment>
    )
  }

  const subscriptMatch = token.match(/^(.+)_([A-Za-z0-9+-]+)$/)
  if (subscriptMatch) {
    const base = subscriptMatch[1]
    const subscript = subscriptMatch[2]
    return (
      <Fragment key={`${keyPrefix}-sub`}>
        {renderToken(base, `${keyPrefix}-base`)}
        <sub>{subscript}</sub>
      </Fragment>
    )
  }

  const chemical = renderChemicalToken(token, keyPrefix)
  if (chemical) {
    return <Fragment key={`${keyPrefix}-chem`}>{chemical}</Fragment>
  }

  return token
}

function renderScientificNodes(value: string): ReactNode[] {
  const normalized = collapseScientificSpacing(normalizeEscapedLineBreaks(value))
  const chunks = normalized.split(/(\s+)/)

  return chunks.map((chunk, index) => {
    if (!chunk) return null
    if (/^\s+$/.test(chunk)) return <Fragment key={`space-${index}`}>{chunk}</Fragment>
    return <Fragment key={`token-${index}`}>{renderToken(chunk, `token-${index}`)}</Fragment>
  })
}

export function ScientificText({ text, className, as = "span" }: ScientificTextProps) {
  const content = text == null ? "" : String(text)
  const Tag = as

  return <Tag className={className}>{renderScientificNodes(content)}</Tag>
}
