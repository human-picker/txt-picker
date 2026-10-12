<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { resolvePayload } from './selection.js'
import type { ResolveTextDecision, TextDecision } from './types.js'

const props = withDefaults(defineProps<{
  decision: TextDecision
  busy?: boolean
  accent?: string
}>(), { busy: false, accent: '#84f1d5' })

const emit = defineEmits<{
  confirm: [value: ResolveTextDecision]
  cancel: []
  copy: [text: string]
}>()
const activeId = ref<string | null>(null)
const draft = ref('')
const error = ref('')
const selected = computed(() => props.decision.options.find(o => o.id === activeId.value) ?? null)
const finalText = computed(() => draft.value.trim() || selected.value?.text || '')
const isPending = computed(() => props.decision.status === 'pending')
const heading = computed(() => ({
  pending: 'AWAITING DECISION', confirmed: 'DECISION RECORDED',
  cancelled: 'REQUEST CANCELLED', expired: 'REQUEST EXPIRED'
}[props.decision.status]))

function reset() {
  activeId.value = null
  draft.value = ''
  error.value = ''
}
watch(() => props.decision.id, reset)
watch(() => props.decision.status, () => { error.value = '' })

function pick(id: string) {
  if (!isPending.value || props.busy) return
  activeId.value = id
  draft.value = ''
  error.value = ''
}
function confirm() {
  if (!activeId.value || props.busy) return
  try {
    emit('confirm', resolvePayload(props.decision, activeId.value, draft.value ? draft.value : undefined))
    error.value = ''
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Invalid selection'
  }
}
function copy() {
  const text = props.decision.status === 'confirmed'
    ? props.decision.selection?.text
    : finalText.value
  if (text) emit('copy', text)
}
</script>

<template>
  <section class="txt-picker" :style="{ '--tp-accent': accent }" :aria-busy="busy">
    <header class="tp-header">
      <span class="tp-overline"><span class="tp-pulse"></span> HUMAN PICKER / TXT</span>
      <span class="tp-number">#{{ decision.id.slice(0, 8).toUpperCase() }}</span>
    </header>
    <div class="tp-heading">
      <div class="tp-kicker">{{ heading }}</div>
      <h2>{{ decision.title }}</h2>
      <p v-if="decision.context.summary">{{ decision.context.summary }}</p>
      <div class="tp-meta">
        <span>ORIGIN: {{ decision.source || 'UNKNOWN' }}</span>
        <span v-if="decision.context.project">PROJECT: {{ decision.context.project }}</span>
      </div>
    </div>

    <template v-if="isPending">
      <div class="tp-group-title"><span>SELECT AN EXPRESSION</span><span>{{ decision.options.length }} CANDIDATES</span></div>
      <div class="tp-options" role="radiogroup" aria-label="候选文本">
        <button
          v-for="(option, index) in decision.options"
          :key="option.id"
          type="button"
          class="tp-option"
          :class="{ 'tp-selected': activeId === option.id }"
          role="radio"
          :aria-checked="activeId === option.id"
          :disabled="busy"
          @click="pick(option.id)"
        >
          <span class="tp-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="tp-option-text">{{ option.text }}</span>
          <span class="tp-radio" aria-hidden="true">{{ activeId === option.id ? '◉' : '○' }}</span>
        </button>
      </div>
      <label class="tp-edit-label" :for="`tp-edit-${decision.id}`">REFINE YOUR WORDS <span>// OPTIONAL</span></label>
      <textarea
        :id="`tp-edit-${decision.id}`"
        v-model="draft"
        :disabled="!selected || busy"
        :placeholder="selected ? selected.text : '请先选择一项候选文本'"
        maxlength="4000"
        rows="3"
      ></textarea>
      <p v-if="error" class="tp-error" role="alert">[ VALIDATION ] {{ error }}</p>
      <div class="tp-actions">
        <button type="button" class="tp-primary" :disabled="!selected || busy" @click="confirm">
          {{ busy ? 'PROCESSING...' : 'CONFIRM SELECTION' }} <span>↗</span>
        </button>
        <div class="tp-subactions">
          <button type="button" :disabled="busy" @click="emit('cancel')">CANCEL REQUEST</button>
          <button type="button" :disabled="!selected || busy" @click="copy">COPY DRAFT</button>
        </div>
      </div>
    </template>
    <div v-else class="tp-terminal">
      <div class="tp-terminal-status">{{ heading }}</div>
      <p v-if="decision.selection" class="tp-terminal-output">{{ decision.selection.text }}</p>
      <p v-else>No selection was recorded.</p>
      <button v-if="decision.selection" type="button" class="tp-primary" @click="copy">COPY RESULT ↗</button>
    </div>
    <footer class="tp-footer"><span>AI PROPOSES.</span><strong>HUMAN DECIDES.</strong><span>AGENT CONTINUES.</span></footer>
  </section>
</template>

<style>
.txt-picker{--tp-accent:#84f1d5;color:#eaf4f3;background:#101a24;border:1px solid #31505b;position:relative;font-family:Inter,"Segoe UI",Arial,sans-serif;max-width:850px;min-width:0;box-sizing:border-box;box-shadow:0 18px 60px #02080d55}
.txt-picker *, .txt-picker *::before,.txt-picker *::after{box-sizing:border-box}
.txt-picker::before,.txt-picker::after{content:"";position:absolute;width:19px;height:19px;pointer-events:none}
.txt-picker::before{top:-1px;left:-1px;border-top:2px solid var(--tp-accent);border-left:2px solid var(--tp-accent)}
.txt-picker::after{right:-1px;bottom:-1px;border-right:2px solid var(--tp-accent);border-bottom:2px solid var(--tp-accent)}
.tp-header,.tp-heading,.tp-options,.tp-group-title,.tp-edit-label,.tp-actions,.tp-footer,.tp-terminal{margin-left:clamp(18px,4vw,38px);margin-right:clamp(18px,4vw,38px)}
.tp-header{display:flex;justify-content:space-between;gap:16px;padding:25px 0 17px;border-bottom:1px solid #2c414c}
.tp-overline,.tp-number,.tp-kicker,.tp-meta,.tp-group-title,.tp-edit-label,.tp-footer,.tp-terminal-status{font-size:11px;letter-spacing:1.6px;font-weight:700}
.tp-overline,.tp-kicker,.tp-terminal-status{color:var(--tp-accent)}
.tp-number,.tp-meta,.tp-group-title,.tp-footer{color:#89a2b1}
.tp-pulse{width:7px;height:7px;display:inline-block;background:var(--tp-accent);margin-right:8px;box-shadow:0 0 13px var(--tp-accent)}
.tp-heading{padding:29px 0 28px}
.tp-heading h2{font-size:clamp(24px,3vw,34px);letter-spacing:-.8px;line-height:1.22;margin:13px 0}
.tp-heading p{color:#acc0cb;line-height:1.65;margin:0 0 19px;font-size:14px}
.tp-meta{display:flex;flex-wrap:wrap;gap:8px 23px;font-size:10px;letter-spacing:1px;font-weight:500}
.tp-group-title{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #29424e;padding-bottom:13px;margin-bottom:12px}
.tp-options{display:grid;gap:10px}
.tp-option{background:#162631;border:1px solid #37515d;width:100%;min-width:0;display:grid;grid-template-columns:40px 1fr 24px;align-items:start;gap:10px;text-align:left;color:#e7f3f1;padding:19px 16px;cursor:pointer;font:inherit;transition:border-color .15s,background .15s}
.tp-option:hover:enabled{border-color:#629789;background:#19333b}.tp-option:focus-visible,.tp-primary:focus-visible,.tp-subactions button:focus-visible{outline:2px solid var(--tp-accent);outline-offset:3px}
.tp-option.tp-selected{border-color:var(--tp-accent);background:#173735;box-shadow:inset 3px 0 var(--tp-accent)}
.tp-index{font-size:12px;color:var(--tp-accent);font-family:monospace;font-weight:700}
.tp-option-text{font-size:14px;line-height:1.62;overflow-wrap:anywhere;white-space:pre-wrap}
.tp-radio{color:var(--tp-accent);font-size:21px;line-height:1}
.tp-edit-label{display:flex;gap:10px;justify-content:space-between;margin-top:26px;margin-bottom:10px;color:#dbece8}
.tp-edit-label span{color:#7897a6;font-weight:400}
.txt-picker textarea{display:block;width:calc(100% - clamp(36px,8vw,76px));margin:0 auto;min-height:84px;resize:vertical;background:#0e1923;color:#e8f6f2;border:1px solid #3b5661;padding:13px 15px;line-height:1.6;font:inherit;font-size:14px}
.txt-picker textarea:focus{outline:none;border-color:var(--tp-accent)}
.txt-picker textarea:disabled{opacity:.5}
.tp-actions{margin-top:19px;margin-bottom:29px}.tp-primary{display:flex;justify-content:space-between;align-items:center;gap:18px;width:100%;padding:16px 19px;border:0;background:var(--tp-accent);color:#091c1d;font-size:12px;font-weight:800;letter-spacing:1.5px;cursor:pointer}
.tp-primary span{font-size:19px}.tp-primary:disabled{opacity:.4;cursor:not-allowed}
.tp-subactions{display:flex;justify-content:space-between;gap:12px;margin-top:16px}.tp-subactions button{background:none;border:0;color:#9fb4c0;font-size:11px;font-weight:700;letter-spacing:1px;cursor:pointer;padding:5px 0}.tp-subactions button:disabled{opacity:.35;cursor:not-allowed}
.tp-footer{display:flex;justify-content:space-between;gap:7px;flex-wrap:wrap;margin-top:0;padding:18px 0 22px;border-top:1px solid #2b414d;font-size:10px;letter-spacing:.7px}.tp-footer strong{color:var(--tp-accent)}
.tp-error{color:#f4ac86;margin:8px clamp(18px,4vw,38px);font-size:12px}
.tp-terminal{padding:20px 0 27px}.tp-terminal-output{padding:24px 18px;background:#162e35;border-left:3px solid var(--tp-accent);line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere}
.tp-terminal .tp-primary{margin-top:20px}
@media(max-width:530px){.tp-footer{font-size:9px}.tp-option{grid-template-columns:25px 1fr 20px;padding:15px 10px}.tp-header{padding-top:18px}.tp-heading{padding-top:22px}}
@media(prefers-reduced-motion:reduce){.tp-option{transition:none}}
</style>
