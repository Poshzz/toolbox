import { useEffect, useState } from 'react'
import { CheckRow, CopyButton, Field, Input, Segmented, Textarea } from '../../components/ui'

type Unit = 'paragraphs' | 'sentences' | 'words'

const WORDS =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum vestibulum curabitur praesent rhoncus vehicula blandit porttitor tincidunt lacinia fermentum malesuada eleifend pellentesque habitasse tristique integer posuere suspendisse ultrices finibus gravida sodales aliquam dignissim'.split(
    ' ',
  )

const FIRST = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'

const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)]
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

function makeSentence() {
  const n = randInt(8, 15)
  const words: string[] = []
  for (let i = 0; i < n; i++) words.push(pick())
  const s = words.join(' ')
  return s[0].toUpperCase() + s.slice(1) + '.'
}

function makeParagraph() {
  const n = randInt(3, 6)
  return Array.from({ length: n }, makeSentence).join(' ')
}

export default function LoremIpsum() {
  const [count, setCount] = useState(3)
  const [unit, setUnit] = useState<Unit>('paragraphs')
  const [startWithLorem, setStartWithLorem] = useState(true)
  const [version, setVersion] = useState(0)
  const [output, setOutput] = useState('')

  useEffect(() => {
    const n = Math.max(1, Math.min(count, 200))
    let result = ''
    if (unit === 'paragraphs') {
      result = Array.from({ length: n }, makeParagraph).join('\n\n')
      if (startWithLorem) result = FIRST + '\n\n' + result
    } else if (unit === 'sentences') {
      result = Array.from({ length: n }, makeSentence).join(' ')
      if (startWithLorem) result = FIRST + ' ' + result
    } else {
      const words: string[] = []
      for (let i = 0; i < n; i++) words.push(pick())
      result = words.join(' ')
      if (startWithLorem) result = 'Lorem ipsum ' + result
    }
    setOutput(result)
  }, [count, unit, startWithLorem, version])

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-wrap items-end gap-5 p-5 md:p-6">
        <Field label="จำนวน">
          <Input
            type="number"
            min={1}
            max={200}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
            className="w-28"
          />
        </Field>
        <div>
          <span className="label">หน่วย</span>
          <Segmented
            options={[
              { value: 'paragraphs', label: 'ย่อหน้า' },
              { value: 'sentences', label: 'ประโยค' },
              { value: 'words', label: 'คำ' },
            ]}
            value={unit}
            onChange={setUnit}
          />
        </div>
        <div className="pb-2">
          <CheckRow
            checked={startWithLorem}
            onChange={setStartWithLorem}
            label='ขึ้นต้นด้วย "Lorem ipsum…"'
          />
        </div>
        <button type="button" className="btn btn-rust ml-auto" onClick={() => setVersion((v) => v + 1)}>
          สุ่มใหม่ ↻
        </button>
      </div>

      <div className="card p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h3 className="label mb-0">
            ผลลัพธ์ <span className="ml-2 font-mono text-[11px] font-normal normal-case">{Array.from(output).length.toLocaleString()} ตัวอักษร</span>
          </h3>
          <CopyButton text={output} />
        </div>
        <Textarea value={output} readOnly className="mt-1.5 min-h-72" />
      </div>
    </div>
  )
}
