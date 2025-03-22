/**
 * 複数のクラス名を組み合わせるユーティリティ関数
 * tailwindcss の clsxとtwMergeをインスパイアした簡易版
 *
 * @param classes 結合したいクラス名（条件付きで追加できる）
 * @returns 結合されたクラス名の文字列
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ').trim()
}

export const sleep = (msec: number) => new Promise((resolve) => setTimeout(resolve, msec))
