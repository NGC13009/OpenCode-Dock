import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

/** 编译后本文件位于 out/test/，仓库根目录是上两级 */
const ROOT = path.resolve(__dirname, '..', '..');

const PACKAGE_NLS_EN = 'package.nls.json';
const PACKAGE_NLS_ZH = 'package.nls.zh-cn.json';
const BUNDLE_NLS_EN = 'l10n/bundle.l10n.json';
const BUNDLE_NLS_ZH = 'l10n/bundle.l10n.zh-cn.json';

/** 中日韩字符（用于确保英文默认文件里没有漏译的中文） */
const CJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

function readText(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readNls(relativePath: string): Record<string, string> {
  return JSON.parse(readText(relativePath)) as Record<string, string>;
}

function sortedKeys(record: Record<string, string>): string[] {
  return Object.keys(record).sort();
}

/** 抓出 package.json 原文中所有 %key% 占位符 */
function placeholders(manifest: string): string[] {
  return [...new Set([...manifest.matchAll(/%([^%]+)%/g)].map((match) => match[1]))];
}

const manifestText = readText('package.json');

test('package.json 的每个 %占位符% 在英文与中文 NLS 中都有定义', () => {
  const keys = placeholders(manifestText);
  assert.ok(keys.length > 0, 'package.json 中应当存在 %占位符%');
  const en = readNls(PACKAGE_NLS_EN);
  const zh = readNls(PACKAGE_NLS_ZH);
  for (const key of keys) {
    assert.ok(key in en, `${PACKAGE_NLS_EN} 缺少键: ${key}`);
    assert.ok(key in zh, `${PACKAGE_NLS_ZH} 缺少键: ${key}`);
  }
});

test('两份 package.nls 的键集合完全一致', () => {
  const en = readNls(PACKAGE_NLS_EN);
  const zh = readNls(PACKAGE_NLS_ZH);
  assert.deepEqual(sortedKeys(zh), sortedKeys(en));
});

test('英文为第一语言：英文 NLS 不含中日韩字符且无空值', () => {
  const en = readNls(PACKAGE_NLS_EN);
  for (const [key, value] of Object.entries(en)) {
    assert.ok(value.trim().length > 0, `${PACKAGE_NLS_EN} 的 ${key} 为空`);
    assert.ok(!CJK.test(value), `${PACKAGE_NLS_EN} 的 ${key} 含中日韩字符（疑似漏译）: ${value}`);
  }
});

test('声明了 l10n 目录且默认 bundle 存在', () => {
  assert.match(manifestText, /"l10n"\s*:\s*"\.\/l10n"/);
  assert.ok(existsSync(path.join(ROOT, BUNDLE_NLS_EN)), `${BUNDLE_NLS_EN} 不存在`);
});

test('两份 l10n bundle 的键集合完全一致，且英文 bundle 不含中日韩字符', () => {
  const en = readNls(BUNDLE_NLS_EN);
  const zh = readNls(BUNDLE_NLS_ZH);
  assert.deepEqual(sortedKeys(zh), sortedKeys(en));
  assert.ok(Object.keys(en).length > 0, `${BUNDLE_NLS_EN} 不应为空`);
  for (const [key, value] of Object.entries(en)) {
    assert.ok(value.trim().length > 0, `${BUNDLE_NLS_EN} 的 ${key} 为空`);
    assert.ok(!CJK.test(value), `${BUNDLE_NLS_EN} 的 ${key} 含中日韩字符: ${value}`);
  }
});

test('源码中 l10n.t 用到的字面量都在 bundle 中有对应键', () => {
  const en = readNls(BUNDLE_NLS_EN);
  const sources = readdirSync(path.join(ROOT, 'src')).filter((file) => file.endsWith('.ts'));
  const literals = sources.flatMap((file) =>
    [...readText(path.join('src', file)).matchAll(/l10n\.t\(\s*'([^']+)'/g)].map((match) => match[1]),
  );
  for (const literal of literals) {
    assert.ok(literal in en, `${BUNDLE_NLS_EN} 缺少运行时文案键: ${literal}`);
  }
});
