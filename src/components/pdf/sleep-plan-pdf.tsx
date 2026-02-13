import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  Circle,
  Path,
} from '@react-pdf/renderer'

// Aggressively strip ALL problematic characters
function cleanText(text: string): string {
  if (!text) return ''

  // First, handle common broken emoji remnants (Latin-1 interpretations of UTF-8 bytes)
  let cleaned = text
    .replace(/ð/g, '')  // Common broken emoji remnant (U+00F0)
    .replace(/Ã/g, '')  // Another common one
    .replace(/â/g, '')
    .replace(/€/g, '')
    .replace(/™/g, '')
    .replace(/Â/g, '')
    .replace(/Ÿ/g, '')
    .replace(/¤/g, '')
    .replace(/¦/g, '')
    .replace(/§/g, '')
    .replace(/¨/g, '')
    .replace(/©/g, '')
    .replace(/ª/g, '')
    .replace(/«/g, '')
    .replace(/¬/g, '')
    .replace(/®/g, '')
    .replace(/¯/g, '')
    .replace(/°/g, '')
    .replace(/±/g, '')
    .replace(/²/g, '')
    .replace(/³/g, '')
    .replace(/´/g, '')
    .replace(/µ/g, '')
    .replace(/¶/g, '')
    .replace(/·/g, '')
    .replace(/¸/g, '')
    .replace(/¹/g, '')
    .replace(/º/g, '')
    .replace(/»/g, '')
    .replace(/¼/g, '')
    .replace(/½/g, '')
    .replace(/¾/g, '')
    .replace(/¿/g, '')

  // Remove all unicode outside basic ASCII + common extended latin
  cleaned = cleaned
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')  // All emoji blocks
    .replace(/[\u{2600}-\u{27BF}]/gu, '')    // Misc symbols & dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')    // Variation selectors
    .replace(/[\u{E000}-\u{F8FF}]/gu, '')    // Private use area
    .replace(/[\u{200B}-\u{200D}]/gu, '')    // Zero-width chars
    .replace(/[\u{2028}-\u{202F}]/gu, '')    // Line/paragraph separators
    .replace(/[\u{0080}-\u{00FF}]/gu, (char) => {
      // Only keep basic punctuation from this range
      const code = char.charCodeAt(0)
      if (code === 0x00A0) return ' ' // non-breaking space
      return '' // Remove everything else in Latin-1 supplement
    })
    .replace(/\s{2,}/g, ' ')
    .trim()

  return cleaned
}

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ],
})

// Soft, baby-friendly color palette
const colors = {
  // Primary pastels
  lavender: '#E8E0F0',
  lavenderDark: '#9B7BB8',
  softPink: '#FCE4EC',
  pinkAccent: '#F48FB1',
  mintGreen: '#E8F5E9',
  mintAccent: '#81C784',
  cream: '#FFF8E7',
  peach: '#FFCCBC',
  skyBlue: '#E3F2FD',
  blueAccent: '#64B5F6',

  // Text colors
  textDark: '#4A4A4A',
  textMedium: '#666666',
  textLight: '#888888',

  // UI colors
  white: '#FFFFFF',
  border: '#E0E0E0',

  // Accent for headers
  headerPurple: '#7E57C2',
  headerPink: '#EC407A',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 11,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 50,
    color: colors.textMedium,
    backgroundColor: colors.white,
  },
  // Decorative header
  headerContainer: {
    marginBottom: 30,
    marginHorizontal: -50,
    marginTop: -40,
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 50,
    backgroundColor: colors.lavender,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerDecoration: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerLabel: {
    fontSize: 10,
    color: colors.lavenderDark,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: colors.headerPurple,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textMedium,
    textAlign: 'center',
    lineHeight: 1.5,
  },
  // Welcome box
  welcomeBox: {
    backgroundColor: colors.cream,
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    borderWidth: 2,
    borderColor: colors.peach,
  },
  welcomeText: {
    fontSize: 12,
    color: colors.textMedium,
    lineHeight: 1.6,
    textAlign: 'center',
  },
  // Content area
  content: {
    flex: 1,
  },
  // Section heading - decorative card style
  sectionHeader: {
    backgroundColor: colors.skyBlue,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginTop: 24,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: colors.blueAccent,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.headerPurple,
  },
  // Subsection heading
  subsectionHeader: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.lavenderDark,
    marginTop: 18,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: colors.lavender,
  },
  // Small heading
  smallHeader: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.textDark,
    marginTop: 14,
    marginBottom: 8,
  },
  // Main title (h1)
  mainTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.headerPurple,
    marginBottom: 20,
    textAlign: 'center',
    paddingBottom: 15,
    borderBottomWidth: 3,
    borderBottomColor: colors.lavender,
  },
  // Paragraphs
  paragraph: {
    fontSize: 11,
    lineHeight: 1.8,
    marginBottom: 12,
    color: colors.textMedium,
  },
  bold: {
    fontWeight: 700,
    color: colors.textDark,
  },
  // Lists - softer style
  listContainer: {
    marginBottom: 14,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bulletPoint: {
    width: 20,
    fontSize: 11,
    color: colors.pinkAccent,
  },
  listContent: {
    flex: 1,
    fontSize: 11,
    lineHeight: 1.7,
    color: colors.textMedium,
  },
  // Numbered steps - card style
  stepCard: {
    backgroundColor: colors.mintGreen,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.mintAccent,
  },
  stepNumber: {
    fontWeight: 700,
    color: colors.mintAccent,
    fontSize: 12,
  },
  stepText: {
    fontSize: 11,
    lineHeight: 1.7,
    color: colors.textMedium,
  },
  // Tip boxes - friendly callouts
  tipBox: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 16,
    marginVertical: 14,
    borderWidth: 2,
    borderColor: colors.peach,
    borderStyle: 'dashed',
  },
  tipLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.pinkAccent,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tipText: {
    fontSize: 11,
    lineHeight: 1.7,
    color: colors.textMedium,
  },
  // Info boxes
  infoBox: {
    backgroundColor: colors.skyBlue,
    borderRadius: 12,
    padding: 16,
    marginVertical: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.blueAccent,
  },
  infoText: {
    fontSize: 11,
    lineHeight: 1.7,
    color: colors.textMedium,
  },
  // Heart/encouragement boxes
  heartBox: {
    backgroundColor: colors.softPink,
    borderRadius: 12,
    padding: 16,
    marginVertical: 14,
    borderWidth: 2,
    borderColor: colors.pinkAccent,
  },
  heartText: {
    fontSize: 11,
    lineHeight: 1.7,
    color: colors.textMedium,
  },
  // Warning boxes
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginVertical: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB74D',
  },
  warningText: {
    fontSize: 11,
    lineHeight: 1.7,
    color: colors.textMedium,
  },
  // Tables - softer look
  tableContainer: {
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableRowAlt: {
    backgroundColor: colors.cream,
  },
  tableHeader: {
    backgroundColor: colors.lavender,
  },
  tableCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 10,
    color: colors.textMedium,
  },
  tableCellHeader: {
    fontWeight: 700,
    color: colors.lavenderDark,
    fontSize: 10,
  },
  // Section divider - decorative
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.lavender,
  },
  dividerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pinkAccent,
  },
  // Page number
  pageNumber: {
    position: 'absolute',
    fontSize: 9,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colors.textLight,
  },
  // Footer decoration
  footer: {
    position: 'absolute',
    bottom: 45,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
})

// Decorative star SVG
function Star({ size = 12, color = colors.pinkAccent }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill={color}
      />
    </Svg>
  )
}

// Decorative moon SVG
function Moon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        fill={colors.lavenderDark}
      />
    </Svg>
  )
}

// Simple markdown parser types
type ParsedElement =
  | { type: 'h1' | 'h2' | 'h3' | 'h4'; content: string }
  | { type: 'paragraph'; content: string }
  | { type: 'ul' | 'ol'; items: string[] }
  | { type: 'blockquote'; content: string; variant: 'tip' | 'warning' | 'info' | 'heart' | 'default' }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'hr' }

function parseMarkdown(content: string): ParsedElement[] {
  const lines = content.split('\n')
  const elements: ParsedElement[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      i++
      continue
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push({ type: 'hr' })
      i++
      continue
    }

    // Headers
    const h1Match = trimmed.match(/^#\s+(.+)$/)
    if (h1Match) {
      elements.push({ type: 'h1', content: h1Match[1] })
      i++
      continue
    }

    const h2Match = trimmed.match(/^##\s+(.+)$/)
    if (h2Match) {
      elements.push({ type: 'h2', content: h2Match[1] })
      i++
      continue
    }

    const h3Match = trimmed.match(/^###\s+(.+)$/)
    if (h3Match) {
      elements.push({ type: 'h3', content: h3Match[1] })
      i++
      continue
    }

    const h4Match = trimmed.match(/^####\s+(.+)$/)
    if (h4Match) {
      elements.push({ type: 'h4', content: h4Match[1] })
      i++
      continue
    }

    // Table
    if (trimmed.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim())
        i++
      }

      if (tableLines.length >= 2) {
        const parseRow = (row: string) =>
          row.split('|').slice(1, -1).map((cell) => cell.trim())

        const headers = parseRow(tableLines[0])
        const rows = tableLines.slice(2).map(parseRow)
        elements.push({ type: 'table', headers, rows })
      }
      continue
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''))
        i++
      }

      const quoteContent = quoteLines.join(' ')
      let variant: 'tip' | 'warning' | 'info' | 'heart' | 'default' = 'default'

      if (/tip:/i.test(quoteContent)) {
        variant = 'tip'
      } else if (/good to know|warning/i.test(quoteContent)) {
        variant = 'warning'
      } else if (/remember|you.?ve got this|you can do/i.test(quoteContent)) {
        variant = 'heart'
      } else if (/short version|milestone/i.test(quoteContent)) {
        variant = 'info'
      }

      elements.push({ type: 'blockquote', content: quoteContent, variant })
      continue
    }

    // Unordered list
    if (/^[-*+]\s/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^[-*+]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*+]\s+/, ''))
        i++
      }
      elements.push({ type: 'ul', items })
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i++
      }
      elements.push({ type: 'ol', items })
      continue
    }

    // Paragraph
    const paragraphLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^[#>|]/.test(lines[i].trim()) &&
      !/^[-*+]\s/.test(lines[i].trim()) &&
      !/^\d+\.\s/.test(lines[i].trim()) &&
      !/^[-*_]{3,}$/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i].trim())
      i++
    }

    if (paragraphLines.length > 0) {
      elements.push({ type: 'paragraph', content: paragraphLines.join(' ') })
    }
  }

  return elements
}

// Render inline text with bold support
function renderInlineText(text: string): React.ReactNode[] {
  const cleanedText = cleanText(text)
  const parts: React.ReactNode[] = []
  let inBold = false
  let buffer = ''
  let i = 0

  while (i < cleanedText.length) {
    if (cleanedText.slice(i, i + 2) === '**') {
      if (buffer) {
        if (inBold) {
          parts.push(<Text key={parts.length} style={styles.bold}>{buffer}</Text>)
        } else {
          parts.push(buffer)
        }
        buffer = ''
      }
      inBold = !inBold
      i += 2
      continue
    }

    if (cleanedText[i] === '*' && cleanedText[i + 1] !== '*' && (i === 0 || cleanedText[i - 1] !== '*')) {
      i++
      continue
    }

    buffer += cleanedText[i]
    i++
  }

  if (buffer) {
    if (inBold) {
      parts.push(<Text key={parts.length} style={styles.bold}>{buffer}</Text>)
    } else {
      parts.push(buffer)
    }
  }

  return parts.length > 0 ? parts : [cleanedText]
}

interface SleepPlanPDFProps {
  babyName: string
  babyAge: string
  createdDate: string
  content: string
}

export function SleepPlanPDF({ babyName, babyAge, createdDate, content }: SleepPlanPDFProps) {
  const elements = parseMarkdown(content)
  const cleanName = cleanText(babyName)

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Decorative Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerDecoration}>
            <Star size={16} color={colors.pinkAccent} />
            <Moon size={24} />
            <Star size={16} color={colors.pinkAccent} />
          </View>
          <Text style={styles.headerLabel}>LunaCradle Sleep Plan</Text>
          <Text style={styles.headerTitle}>{cleanName}&apos;s Sleep Journey</Text>
          <Text style={styles.headerSubtitle}>
            {babyAge}{babyAge && createdDate ? '  ·  ' : ''}Created {createdDate}
          </Text>
        </View>

        {/* Welcome message */}
        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeText}>
            This plan was made especially for {cleanName} and your family.
            Take it one step at a time, trust your instincts, and remember — you&apos;re doing amazing!
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {elements.map((element, index) => {
            switch (element.type) {
              case 'h1':
                return (
                  <Text key={index} style={styles.mainTitle}>
                    {cleanText(element.content)}
                  </Text>
                )
              case 'h2':
                return (
                  <View key={index} style={styles.sectionHeader} wrap={false} minPresenceAhead={50}>
                    <Text style={styles.sectionHeaderText}>
                      {cleanText(element.content)}
                    </Text>
                  </View>
                )
              case 'h3':
                return (
                  <Text key={index} style={styles.subsectionHeader} minPresenceAhead={40}>
                    {cleanText(element.content)}
                  </Text>
                )
              case 'h4':
                return (
                  <Text key={index} style={styles.smallHeader} minPresenceAhead={30}>
                    {cleanText(element.content)}
                  </Text>
                )
              case 'paragraph':
                return (
                  <Text key={index} style={styles.paragraph}>
                    {renderInlineText(element.content)}
                  </Text>
                )
              case 'ul':
                return (
                  <View key={index} style={styles.listContainer}>
                    {element.items.map((item, itemIndex) => (
                      <View key={itemIndex} style={styles.listItem} wrap={false}>
                        <Text style={styles.bulletPoint}>♡</Text>
                        <Text style={styles.listContent}>{renderInlineText(item)}</Text>
                      </View>
                    ))}
                  </View>
                )
              case 'ol':
                return (
                  <View key={index} style={styles.listContainer}>
                    {element.items.map((item, itemIndex) => (
                      <View key={itemIndex} style={styles.stepCard} wrap={false}>
                        <Text style={styles.stepText}>
                          <Text style={styles.stepNumber}>Step {itemIndex + 1}: </Text>
                          {renderInlineText(item)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )
              case 'blockquote': {
                if (element.variant === 'tip') {
                  return (
                    <View key={index} style={styles.tipBox} wrap={false}>
                      <Text style={styles.tipLabel}>Helpful Tip</Text>
                      <Text style={styles.tipText}>{renderInlineText(element.content)}</Text>
                    </View>
                  )
                }
                if (element.variant === 'warning') {
                  return (
                    <View key={index} style={styles.warningBox} wrap={false}>
                      <Text style={styles.warningText}>{renderInlineText(element.content)}</Text>
                    </View>
                  )
                }
                if (element.variant === 'heart') {
                  return (
                    <View key={index} style={styles.heartBox} wrap={false}>
                      <Text style={styles.heartText}>{renderInlineText(element.content)}</Text>
                    </View>
                  )
                }
                return (
                  <View key={index} style={styles.infoBox} wrap={false}>
                    <Text style={styles.infoText}>{renderInlineText(element.content)}</Text>
                  </View>
                )
              }
              case 'table':
                return (
                  <View key={index} style={styles.tableContainer} wrap={false}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                      {element.headers.map((header, cellIndex) => (
                        <Text key={cellIndex} style={[styles.tableCell, styles.tableCellHeader]}>
                          {cleanText(header)}
                        </Text>
                      ))}
                    </View>
                    {element.rows.map((row, rowIndex) => (
                      <View
                        key={rowIndex}
                        style={[
                          styles.tableRow,
                          rowIndex % 2 === 1 ? styles.tableRowAlt : {},
                          rowIndex === element.rows.length - 1 ? styles.tableRowLast : {},
                        ]}
                      >
                        {row.map((cell, cellIndex) => (
                          <Text key={cellIndex} style={styles.tableCell}>
                            {cleanText(cell)}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>
                )
              case 'hr':
                return (
                  <View key={index} style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <View style={styles.dividerDot} />
                    <View style={styles.dividerLine} />
                  </View>
                )
              default:
                return null
            }
          })}
        </View>

        {/* Footer stars */}
        <View style={styles.footer} fixed>
          <Star size={8} color={colors.lavender} />
          <Star size={6} color={colors.pinkAccent} />
          <Star size={8} color={colors.lavender} />
        </View>

        {/* Page number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}
