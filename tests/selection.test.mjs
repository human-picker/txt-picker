import { strict as assert } from 'node:assert'
import test from 'node:test'
import { normalizeCandidates, resolvePayload } from '../src/selection.ts'

const options = [
  { id: 'a', text: '[CORE ONLINE] 系统核心已接入' },
  { id: 'b', text: '[KERNEL AWAKENED] 内核已苏醒' }
]

test('accepts 2–9 unique candidates', () => {
  assert.equal(normalizeCandidates(options), options)
  assert.throws(() => normalizeCandidates([options[0]]), /between 2 and 9/)
  assert.throws(() => normalizeCandidates([...options, options[0]]), /unique/)
})

test('requires a pending decision and known candidate', () => {
  assert.deepEqual(resolvePayload({ status: 'pending', options }, 'a'), { option_id: 'a' })
  assert.throws(() => resolvePayload({ status: 'cancelled', options }, 'a'), /not pending/)
  assert.throws(() => resolvePayload({ status: 'pending', options }, 'c'), /Unknown/)
})

test('edits are explicit and bounded', () => {
  assert.deepEqual(resolvePayload({ status: 'pending', options }, 'b', '  最终标题  '), {
    option_id: 'b', text: '最终标题'
  })
  assert.deepEqual(resolvePayload({ status: 'pending', options }, 'b', options[1].text), { option_id: 'b' })
  assert.throws(() => resolvePayload({ status: 'pending', options }, 'b', '    '), /1–4000/)
  assert.throws(() => resolvePayload({ status: 'pending', options }, 'b', 'x'.repeat(4001)), /1–4000/)
})
