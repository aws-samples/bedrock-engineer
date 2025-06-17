import { 
  extractDrawioXml, 
  mergeDrawioXml, 
  mergeDiagramContent,
  analyzeIncompleteContent,
  generateContinuePrompt
} from '../xmlParser'
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

describe('mergeDrawioXml', () => {
  const xmlTemplate1 = `<mxfile host="Electron" modified="2023-01-01T12:00:00.000Z" type="device">
  <diagram>
    <mxGraphModel>
    <root>
      <mxCell id="0"/>
      <mxCell id="1" parent="0"/>
      <mxCell id="cell1" value="First Cell" style="rounded=1;" vertex="1" parent="1"/>
    </root>
  </mxGraphModel>
  </diagram>
</mxfile>`

  const xmlTemplate2 = `<mxfile host="Electron" modified="2023-01-02T12:00:00.000Z" type="device">
  <diagram>
    <mxGraphModel>
    <root>
      <mxCell id="0"/>
      <mxCell id="1" parent="0"/>
      <mxCell id="cell2" value="Second Cell" style="rounded=1;" vertex="1" parent="1"/>
    </root>
  </mxGraphModel>
  </diagram>
</mxfile>`

  test('should merge two DrawIO XMLs correctly', () => {
    const result = mergeDrawioXml(xmlTemplate1, xmlTemplate2)

    // 結合されたXMLが両方のセルを含んでいることを確認
    expect(result).toContain('cell1')
    expect(result).toContain('cell2')
    expect(result).toContain('First Cell')
    expect(result).toContain('Second Cell')

    // XML構造が保持されていることを確認
    expect(result).toContain('<mxfile')
    expect(result).toContain('</mxfile>')
    expect(result).toContain('<mxGraphModel')
    expect(result).toContain('</mxGraphModel>')
  })

  test('should return new XML when previous XML is empty', () => {
    const result = mergeDrawioXml('', xmlTemplate2)
    expect(result).toBe(xmlTemplate2)
  })

  test('should return previous XML when new XML is empty', () => {
    const result = mergeDrawioXml(xmlTemplate1, '')
    expect(result).toBe(xmlTemplate1)
  })

  test('should handle duplicate IDs correctly', () => {
    const xmlWithDuplicate = `<mxfile host="Electron" modified="2023-01-02T12:00:00.000Z" type="device">
  <diagram>
    <mxGraphModel>
    <root>
      <mxCell id="0"/>
      <mxCell id="1" parent="0"/>
      <mxCell id="cell1" value="Duplicate Cell" style="rounded=1;" vertex="1" parent="1"/>
    </root>
  </mxGraphModel>
  </diagram>
</mxfile>`

    const result = mergeDrawioXml(xmlTemplate1, xmlWithDuplicate)

    // 重複したIDのセルは除外される
    const cell1Matches = (result.match(/id="cell1"/g) || []).length
    expect(cell1Matches).toBe(1)
  })
})

describe('mergeDiagramContent', () => {
  test('should merge diagram content with XML and explanations', () => {
    const previousContent = {
      xml: '<mxfile><diagram><mxGraphModel><root><mxCell id="cell1"/></root></mxGraphModel></diagram></mxfile>',
      explanation: 'This is the first part of the diagram.'
    }

    const newContent = {
      xml: '<mxfile><diagram><mxGraphModel><root><mxCell id="cell2"/></root></mxGraphModel></diagram></mxfile>',
      explanation: 'This is the second part of the diagram.'
    }

    const result = mergeDiagramContent(previousContent, newContent)

    expect(result.xml).toContain('cell1')
    expect(result.xml).toContain('cell2')
    expect(result.explanation).toContain('first part')
    expect(result.explanation).toContain('second part')
  })

  test('should handle empty previous content', () => {
    const previousContent = { xml: '', explanation: '' }
    const newContent = {
      xml: '<mxfile><diagram><mxGraphModel><root><mxCell id="cell1"/></root></mxGraphModel></diagram></mxfile>',
      explanation: 'New diagram explanation.'
    }

    const result = mergeDiagramContent(previousContent, newContent)

    expect(result.xml).toBe(newContent.xml)
    expect(result.explanation).toBe(newContent.explanation)
  })
})

describe('analyzeIncompleteContent', () => {
  test('should detect incomplete XML', () => {
    const incompleteXml = `<mxfile host="Electron" modified="2023-01-01T12:00:00.000Z" type="device">
  <diagram>
    <mxGraphModel>
    <root>
      <mxCell id="0"/>
      <mxCell id="1" parent="0"/>
      <mxCell id="cell1" value="Test" style="rounded=1;" vertex="1" parent="1"`
    
    const analysis = analyzeIncompleteContent(incompleteXml)
    
    expect(analysis.type).toBe('xml_incomplete')
    expect(analysis.xmlStatus).toBe('in_progress')
    expect(analysis.needsXmlContinuation).toBe(true)
    expect(analysis.unclosedTags).toContain('mxCell')
  })

  test('should detect incomplete explanation', () => {
    const completeXmlWithIncompleteExplanation = `<mxfile host="Electron" modified="2023-01-01T12:00:00.000Z" type="device">
  <diagram>
    <mxGraphModel>
    <root>
      <mxCell id="0"/>
      <mxCell id="1" parent="0"/>
      <mxCell id="cell1" value="Test" style="rounded=1;" vertex="1" parent="1"/>
    </root>
  </mxGraphModel>
  </diagram>
</mxfile>

This diagram shows a simple`
    
    const analysis = analyzeIncompleteContent(completeXmlWithIncompleteExplanation)
    
    expect(analysis.type).toBe('explanation_incomplete')
    expect(analysis.xmlStatus).toBe('complete')
    expect(analysis.explanationStatus).toBe('in_progress')
  })

  test('should detect complete content', () => {
    const completeContent = `<mxfile host="Electron" modified="2023-01-01T12:00:00.000Z" type="device">
  <diagram>
    <mxGraphModel>
    <root>
      <mxCell id="0"/>
      <mxCell id="1" parent="0"/>
      <mxCell id="cell1" value="Test" style="rounded=1;" vertex="1" parent="1"/>
    </root>
  </mxGraphModel>
  </diagram>
</mxfile>

This diagram shows a simple test cell.`
    
    const analysis = analyzeIncompleteContent(completeContent)
    
    expect(analysis.type).toBe('complete')
    expect(analysis.xmlStatus).toBe('complete')
    expect(analysis.explanationStatus).toBe('complete')
  })
})

describe('generateContinuePrompt', () => {
  test('should generate XML continuation prompt for incomplete XML', () => {
    const incompleteXml = `<mxfile host="Electron">
  <diagram>
    <mxGraphModel>
    <root>
      <mxCell id="0"/>
      <mxCell id="1" parent="0"/>
      <mxCell id="cell1"`
    
    const prompt = generateContinuePrompt(incompleteXml)
    
    expect(prompt).toContain('XMLの続きを出力してください')
    expect(prompt).toContain('説明文は不要です')
  })

  test('should generate explanation continuation prompt', () => {
    const completeXmlWithIncompleteExplanation = `<mxfile host="Electron">
  <diagram>
    <mxGraphModel>
    <root>
      <mxCell id="0"/>
      <mxCell id="1" parent="0"/>
    </root>
  </mxGraphModel>
  </diagram>
</mxfile>

This diagram`
    
    const prompt = generateContinuePrompt(completeXmlWithIncompleteExplanation)
    
    expect(prompt).toContain('説明文の続きを出力してください')
    expect(prompt).toContain('XMLは既に完成している')
  })

  test('should generate enhancement prompt for complete content', () => {
    const completeContent = `<mxfile host="Electron">
  <diagram>
    <mxGraphModel>
    <root>
      <mxCell id="0"/>
      <mxCell id="1" parent="0"/>
    </root>
  </mxGraphModel>
  </diagram>
</mxfile>

This is a complete diagram.`
    
    const prompt = generateContinuePrompt(completeContent)
    
    expect(prompt).toContain('さらに詳細化')
    expect(prompt).toContain('追加の要素')
  })
})
