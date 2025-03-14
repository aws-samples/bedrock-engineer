import { extractDrawioXml } from '../xmlParser'
import { describe, expect, test } from '@jest/globals'

describe('extractDrawioXml', () => {
  // 正常なmxfileタグを含むケース
  test('should extract XML between mxfile tags', () => {
    const content = `
      Here is the diagram you requested:

      <mxfile host="Electron" modified="2023-01-01T12:00:00.000Z" type="device">
        <diagram>
          <mxGraphModel>
            <root>
              <mxCell id="0"/>
              <mxCell id="1" parent="0"/>
            </root>
          </mxGraphModel>
        </diagram>
      </mxfile>

      I hope this helps!
    `

    const expected = `<mxfile host="Electron" modified="2023-01-01T12:00:00.000Z" type="device">
        <diagram>
          <mxGraphModel>
            <root>
              <mxCell id="0"/>
              <mxCell id="1" parent="0"/>
            </root>
          </mxGraphModel>
        </diagram>
      </mxfile>`

    expect(extractDrawioXml(content)).toBe(expected)
  })

  // コードブロック内のXMLを抽出するケース
  test('should extract XML from code block', () => {
    const content = `
      Here is the diagram XML:

      \`\`\`xml
      <mxfile host="Electron" modified="2023-01-01T12:00:00.000Z" type="device">
        <diagram>
          <mxGraphModel>
            <root>
              <mxCell id="0"/>
            </root>
          </mxGraphModel>
        </diagram>
      </mxfile>
      \`\`\`

      You can import this into draw.io
    `

    const expected = `<mxfile host="Electron" modified="2023-01-01T12:00:00.000Z" type="device">
        <diagram>
          <mxGraphModel>
            <root>
              <mxCell id="0"/>
            </root>
          </mxGraphModel>
        </diagram>
      </mxfile>`

    expect(extractDrawioXml(content)).toBe(expected)
  })

  // mxGraphModelタグのみを含むケース
  test('should wrap mxGraphModel with mxfile structure when only mxGraphModel is present', () => {
    const content = `
      Here's the diagram structure:

      <mxGraphModel>
        <root>
          <mxCell id="0"/>
          <mxCell id="1" parent="0"/>
        </root>
      </mxGraphModel>
    `

    const result = extractDrawioXml(content)

    // 日付は動的に生成されるため、部分的なマッチングを行う
    expect(result).toContain('<mxfile host="Electron" modified="')
    expect(result).toContain('type="device">')
    expect(result).toContain('<diagram>')
    expect(result).toContain('<mxGraphModel>')
    expect(result).toContain('<root>')
    expect(result).toContain('<mxCell id="0"/>')
    expect(result).toContain('<mxCell id="1" parent="0"/>')
    expect(result).toContain('</root>')
    expect(result).toContain('</mxGraphModel>')
    expect(result).toContain('</diagram>')
    expect(result).toContain('</mxfile>')
  })

  // XMLが含まれていないケース
  test('should return empty string when no XML is found', () => {
    const content = `
      I couldn't generate a diagram for your request.
      Please provide more details about what you need.
    `

    expect(extractDrawioXml(content)).toBe('')
  })

  // 空の入力に対するケース
  test('should handle empty input', () => {
    expect(extractDrawioXml('')).toBe('')
    expect(extractDrawioXml(undefined as unknown as string)).toBe('')
  })

  // 複数のXMLブロックが含まれるケース（最初のものを抽出すべき）
  test('should extract the first XML block when multiple are present', () => {
    const content = `
      Here are two diagrams:

      <mxfile host="Electron" modified="2023-01-01T12:00:00.000Z" type="device">
        <diagram>
          <mxGraphModel>
            <root>
              <mxCell id="0"/>
            </root>
          </mxGraphModel>
        </diagram>
      </mxfile>

      And another one:

      <mxfile host="Electron" modified="2023-01-02T12:00:00.000Z" type="device">
        <diagram>
          <mxGraphModel>
            <root>
              <mxCell id="0"/>
              <mxCell id="2" parent="0"/>
            </root>
          </mxGraphModel>
        </diagram>
      </mxfile>
    `

    const expected = `<mxfile host="Electron" modified="2023-01-01T12:00:00.000Z" type="device">
        <diagram>
          <mxGraphModel>
            <root>
              <mxCell id="0"/>
            </root>
          </mxGraphModel>
        </diagram>
      </mxfile>`

    expect(extractDrawioXml(content)).toBe(expected)
  })

  // 属性を含む複雑なmxfileタグ
  test('should handle mxfile tags with complex attributes', () => {
    const content = `
      <mxfile host="Electron" modified="2023-01-01T12:00:00.000Z" agent="Mozilla/5.0" etag="abc123" version="21.7.5" type="device">
        <diagram id="diagram-id" name="Page-1">
          <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100">
            <root>
              <mxCell id="0"/>
            </root>
          </mxGraphModel>
        </diagram>
      </mxfile>
    `

    expect(extractDrawioXml(content)).toBe(content.trim())
  })
})
