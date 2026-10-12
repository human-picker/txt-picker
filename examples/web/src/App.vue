<script setup lang="ts">
import { ref } from 'vue'
import { HumanPickerClient, TxtPicker } from '../../../src/index.js'
import type { TextDecision, ResolveTextDecision } from '../../../src/index.js'

const token = ref('')
const decision = ref<TextDecision>({
  id: 'demo-local-preview', type: 'text', title: '选择系统事件标题', source: 'Pi Coding Agent',
  context: { project: 'Personal OS', summary: '数据库服务完成初始化。本次提交引入 SQLite 数据模型、迁移与活动日志。' },
  options: [
    { id: 'a', text: 'feat(storage): [DATA VAULT ONLINE] 本地数据核心已接入' },
    { id: 'b', text: 'feat(storage): [MEMORY CORE ONLINE] 记忆档案协议已激活' },
    { id: 'c', text: 'feat(storage): [STORAGE READY] 建立 SQLite 与活动日志持久化' }
  ],
  status: 'pending', selection: null, created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 3600000).toISOString()
})
const busy = ref(false)
const error = ref('')
const info = ref('DEMO / NO SERVER REQUIRED')
const remote = ref(false)
const makeClient = () => new HumanPickerClient({ baseUrl: '', token: token.value })

async function createRequest() {
  if (!token.value.trim()) { error.value = '需要 human-picker-server 启动时打印的 Bearer Token'; return }
  busy.value = true; error.value = ''
  try {
    decision.value = await makeClient().create({
      type: 'text', title: '选择系统事件标题', source: 'txt-picker demo',
      context: { project: 'Personal OS', summary: '来自 txt-picker 前端演示的请求。' },
      options: decision.value.options
    })
    remote.value = true
    info.value = 'CONNECTED / DECISION PERSISTED'
  } catch (err) { error.value = (err as Error).message }
  finally { busy.value = false }
}
async function confirm(payload: ResolveTextDecision) {
  busy.value = true; error.value = ''
  try {
    if (remote.value) {
      decision.value = await makeClient().confirm(decision.value.id, payload)
    } else {
      const original = decision.value.options.find(o => o.id === payload.option_id)!
      const text = payload.text ?? original.text
      decision.value = { ...decision.value, status: 'confirmed', selection: {
        option_id: payload.option_id, text, edited: text !== original.text
      } }
    }
    info.value = 'DECISION RECORDED / HUMAN APPROVED'
  } catch(err) { error.value = (err as Error).message }
  finally { busy.value = false }
}
async function cancel() {
  busy.value = true; error.value = ''
  try {
    decision.value = remote.value
      ? await makeClient().cancel(decision.value.id)
      : { ...decision.value, status: 'cancelled' }
    info.value = 'REQUEST CANCELLED'
  } catch(err){error.value = (err as Error).message}
  finally{busy.value = false}
}
function reset() {
  decision.value = { ...decision.value, id: crypto.randomUUID(), status: 'pending', selection: null }
  remote.value = false; info.value = 'DEMO / NO SERVER REQUIRED'; error.value = ''
}
async function copy(text: string) {
  try {await navigator.clipboard.writeText(text);info.value = 'COPIED TO CLIPBOARD'}
  catch{error.value = 'Clipboard access denied. Use a secure context or copy manually.'}
}
</script>

<template>
  <div class="demo">
    <header class="top"><div class="brand">human<span>-picker</span> / txt</div><div class="status">● HUMAN AUTHORITY: MAXIMUM</div></header>
    <section class="intro"><div class="eyebrow">DECISION INTERFACE // MODULE 001</div><h1>Words matter.<br/><em>You decide.</em></h1><p>AI 负责生成候选，你负责做出判断。<br/>选择、编辑、确认，然后让任务继续。</p></section>
    <div class="layout">
      <aside class="panel">
        <h2>CONNECTION / LOCAL</h2>
        <p>无需服务器即可预览交互。连接已运行的 human-picker-server 后，选择结果将通过 REST API 持久化。</p>
        <label class="label" for="token">SERVER ACCESS TOKEN</label>
        <input id="token" v-model="token" type="password" autocomplete="off" placeholder="Bearer Token" />
        <button :disabled="busy" @click="createRequest">CREATE REMOTE REQUEST ↗</button>
        <button class="secondary" :disabled="busy" @click="reset">RESET LOCAL DEMO ↺</button>
        <div class="hint">{{ info }}</div>
        <div v-if="error" class="error" role="alert">[ ERROR ] {{ error }}</div>
        <p>DEMO URL: <code>127.0.0.1:5175</code><br/>SERVER URL: <code>127.0.0.1:4173</code></p>
      </aside>
      <div class="stage">
        <div class="stage-title">INTERACTIVE PREVIEW // {{ remote ? 'LIVE SERVER' : 'LOCAL DEMO' }}</div>
        <TxtPicker :decision="decision" :busy="busy" @confirm="confirm" @cancel="cancel" @copy="copy" />
        <p class="below">No silent defaults. No commits are executed. Cancelling never means confirmation.</p>
      </div>
    </div>
  </div>
</template>
