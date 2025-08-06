export interface ChartColorSet {
  border: string
  background: string
}

export interface ChartColors {
  total: ChartColorSet
  input: ChartColorSet
  output: ChartColorSet
  cacheRead: ChartColorSet
  cacheWrite: ChartColorSet
}

export interface PieChartColors {
  backgroundColor: string[]
  borderColor: string[]
}

// ダークモード用の明るい色セット
const darkModeColors: ChartColors = {
  total: {
    border: 'rgba(45, 212, 191, 1)', // teal-400
    background: 'rgba(45, 212, 191, 0.2)'
  },
  input: {
    border: 'rgba(96, 165, 250, 1)', // blue-400
    background: 'rgba(96, 165, 250, 0.2)'
  },
  output: {
    border: 'rgba(251, 113, 133, 1)', // rose-400
    background: 'rgba(251, 113, 133, 0.2)'
  },
  cacheRead: {
    border: 'rgba(250, 204, 21, 1)', // yellow-400
    background: 'rgba(250, 204, 21, 0.2)'
  },
  cacheWrite: {
    border: 'rgba(192, 132, 252, 1)', // purple-400
    background: 'rgba(192, 132, 252, 0.2)'
  }
}

// ライトモード用の標準色セット
const lightModeColors: ChartColors = {
  total: {
    border: 'rgba(20, 184, 166, 1)', // teal-500
    background: 'rgba(20, 184, 166, 0.2)'
  },
  input: {
    border: 'rgba(59, 130, 246, 1)', // blue-500
    background: 'rgba(59, 130, 246, 0.2)'
  },
  output: {
    border: 'rgba(244, 63, 94, 1)', // rose-500
    background: 'rgba(244, 63, 94, 0.2)'
  },
  cacheRead: {
    border: 'rgba(234, 179, 8, 1)', // yellow-500
    background: 'rgba(234, 179, 8, 0.2)'
  },
  cacheWrite: {
    border: 'rgba(168, 85, 247, 1)', // purple-500
    background: 'rgba(168, 85, 247, 0.2)'
  }
}

// 円グラフ用のダークモード色
const darkModePieColors: PieChartColors = {
  backgroundColor: [
    'rgba(96, 165, 250, 0.8)', // ブルー (blue-400)
    'rgba(94, 234, 212, 0.8)', // ティール (teal-300)
    'rgba(250, 204, 21, 0.8)', // イエロー (yellow-400)
    'rgba(251, 146, 60, 0.8)' // オレンジ (orange-400)
  ],
  borderColor: [
    'rgba(147, 197, 253, 1)', // ブルー (blue-300)
    'rgba(153, 246, 228, 1)', // ティール (teal-200)
    'rgba(254, 240, 138, 1)', // イエロー (yellow-200)
    'rgba(254, 215, 170, 1)' // オレンジ (orange-200)
  ]
}

// 円グラフ用のライトモード色
const lightModePieColors: PieChartColors = {
  backgroundColor: [
    'rgba(54, 162, 235, 0.7)', // 青
    'rgba(75, 192, 192, 0.7)', // 緑
    'rgba(255, 206, 86, 0.7)', // 黄
    'rgba(255, 159, 64, 0.7)' // オレンジ
  ],
  borderColor: [
    'rgba(37, 99, 235, 1)', // ブルー (blue-600)
    'rgba(20, 184, 166, 1)', // ティール (teal-500)
    'rgba(234, 179, 8, 1)', // イエロー (yellow-500)
    'rgba(234, 88, 12, 1)' // オレンジ (orange-600)
  ]
}

export const getChartColors = (isDarkMode: boolean): ChartColors => {
  return isDarkMode ? darkModeColors : lightModeColors
}

export const getPieChartColors = (isDarkMode: boolean): PieChartColors => {
  return isDarkMode ? darkModePieColors : lightModePieColors
}

export const getTextColors = (isDarkMode: boolean) => ({
  legend: isDarkMode ? '#e2e8f0' : '#718096', // gray-200 : gray-500
  tooltip: {
    background: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)', // slate-800 : white
    title: isDarkMode ? '#f8fafc' : '#1e293b', // gray-50 : slate-800
    body: isDarkMode ? '#e2e8f0' : '#334155' // gray-200 : slate-700
  },
  grid: isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(203, 213, 225, 0.5)', // gray-400 : gray-300
  axis: isDarkMode ? '#cbd5e1' : '#64748b' // gray-300 : gray-500
})
