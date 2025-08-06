import { ChartOptions } from 'chart.js'
import { getTextColors } from './colorThemes'

// 円グラフのオプション
export const createPieChartOptions = (): ChartOptions<'pie'> => {
  const isDarkMode = document.documentElement.classList.contains('dark')
  const textColors = getTextColors(isDarkMode)

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          color: textColors.legend,
          font: {
            weight: 'bold' // 凡例フォントを太くして視認性アップ
          }
        }
      },
      tooltip: {
        backgroundColor: textColors.tooltip.background,
        titleColor: textColors.tooltip.title,
        bodyColor: textColors.tooltip.body,
        callbacks: {
          label: function (context) {
            const label = context.label || ''
            const value = context.raw as number
            return `${label}: ${value.toLocaleString()}`
          }
        }
      }
    }
  }
}

// 折れ線グラフのオプション
export const createLineChartOptions = (title?: string): ChartOptions<'line'> => {
  const isDarkMode = document.documentElement.classList.contains('dark')
  const textColors = getTextColors(isDarkMode)

  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: textColors.grid
        },
        ticks: {
          color: textColors.axis
        }
      },
      x: {
        grid: {
          color: textColors.grid
        },
        ticks: {
          color: textColors.axis
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          color: textColors.legend,
          font: {
            weight: 'bold'
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: textColors.tooltip.background,
        titleColor: textColors.tooltip.title,
        bodyColor: textColors.tooltip.body
      },
      title: {
        display: !!title,
        text: title || '',
        color: textColors.legend
      }
    }
  }
}

// 時間フォーマット関数
export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString()
}
