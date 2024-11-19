<template>
    <div class="dashboard-container">
      <!-- 数据概览卡片 -->
      <div class="overview-cards">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>总库存</span>
            </div>
          </template>
          <div class="stat-value">{{ statistics.totalInStock }}</div>
        </el-card>
  
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>已上架</span>
            </div>
          </template>
          <div class="stat-value">{{ statistics.totalListed }}</div>
        </el-card>
  
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>已销售</span>
            </div>
          </template>
          <div class="stat-value">{{ statistics.totalSold }}</div>
        </el-card>

        <el-card class="stat-card">
        <template #header>
          <div class="card-header">
            <span>总利润</span>
          </div>
        </template>
        <div class="stat-value" :class="{ 'profit': statistics.totalProfit > 0, 'loss': statistics.totalProfit < 0 }">
          ¥{{ formatNumber(statistics.totalProfit) }}
        </div>
      </el-card>
      </div>
  
      <!-- 年份选择器 -->
      <div class="year-selector">
        <el-select v-model="selectedYear" placeholder="选择年份" @change="handleYearChange">
          <el-option
            v-for="year in availableYears"
            :key="year"
            :label="year + '年'"
            :value="year">
          </el-option>
        </el-select>
      </div>
  
      <!-- 图表展示区域 -->
      <div class="charts-container">
        <!-- 月度账号统计图表 -->
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>月度账号统计图表</span>
            </div>
          </template>
          <v-chart class="chart" :option="accountChartOption" autoresize />
        </el-card>
  
        <!-- 月度利润统计图表 -->
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>月度利润统计图表</span>
            </div>
          </template>
          <v-chart class="chart" :option="profitChartOption" autoresize />
        </el-card>
      </div>
  
      <!-- 表格展示区域 -->
    <div class="tables-container">
      <!-- 月度账号统计表格 -->
      <el-card class="data-table">
        <template #header>
          <div class="card-header">
            <span>月度账号统计</span>
          </div>
        </template>
        <el-table 
          :data="formattedMonthlyStats" 
          style="width: 100%" 
          :stripe="true"
          :default-sort="{ prop: 'monthNum', order: 'ascending' }"
          height="400">
          <el-table-column 
            prop="monthLabel" 
            label="月份" 
            width="100"
            sortable
            fixed />
          <el-table-column 
            prop="inStock" 
            label="库存数量" 
            width="120"
            align="center" />
          <el-table-column 
            prop="listed" 
            label="上架数量" 
            width="120"
            align="center" />
          <el-table-column 
            prop="sold" 
            label="销售数量" 
            width="120"
            align="center" />
        </el-table>
      </el-card>

      <!-- 月度利润表格 -->
      <el-card class="data-table">
        <template #header>
          <div class="card-header">
            <span>月度利润统计</span>
          </div>
        </template>
        <el-table 
          :data="formattedMonthlyProfit" 
          style="width: 100%" 
          :stripe="true"
          :default-sort="{ prop: 'monthNum', order: 'ascending' }"
          height="400">
          <el-table-column 
            prop="monthLabel" 
            label="月份" 
            width="100"
            sortable
            fixed />
          <el-table-column 
            prop="totalCost" 
            label="总成本" 
            width="150"
            align="right">
            <template #default="scope">
              ¥{{ scope.row.totalCost?.toFixed(2) || '0.00' }}
            </template>
          </el-table-column>
          <el-table-column 
            prop="totalRevenue" 
            label="总收入" 
            width="150"
            align="right">
            <template #default="scope">
              ¥{{ scope.row.totalRevenue?.toFixed(2) || '0.00' }}
            </template>
          </el-table-column>
          <el-table-column 
            prop="netProfit" 
            label="净利润" 
            width="150"
            align="right">
            <template #default="scope">
              <span :class="{ 'profit': scope.row.netProfit > 0, 'loss': scope.row.netProfit < 0 }">
                ¥{{ scope.row.netProfit?.toFixed(2) || '0.00' }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import VChart from 'vue-echarts'
  import { use } from 'echarts/core'
  import { CanvasRenderer } from 'echarts/renderers'
  import { BarChart, LineChart } from 'echarts/charts'
  import {
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent
  } from 'echarts/components'
  
  // 注册 ECharts 必须的组件
  use([
    CanvasRenderer,
    BarChart,
    LineChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent
  ])
  // 格式化月度统计数据
const formattedMonthlyStats = computed(() => {
  const months = Array.from({ length: 12 }, (_, index) => {
    const monthNum = index + 1
    const monthStr = `${selectedYear.value}-${monthNum.toString().padStart(2, '0')}`
    const monthData = monthlyStats.value.find(item => item.month === monthStr) || {
      inStock: 0,
      listed: 0,
      sold: 0
    }
    
    return {
      monthNum,
      monthLabel: `${monthNum}月`,
      ...monthData
    }
  })
  return months
})

// 格式化月度利润数据
const formattedMonthlyProfit = computed(() => {
  const months = Array.from({ length: 12 }, (_, index) => {
    const monthNum = index + 1
    const monthStr = `${selectedYear.value}-${monthNum.toString().padStart(2, '0')}`
    const monthData = monthlyProfit.value.find(item => item.month === monthStr) || {
      totalCost: 0,
      totalRevenue: 0,
      netProfit: 0
    }
    
    return {
      monthNum,
      monthLabel: `${monthNum}月`,
      ...monthData
    }
  })
  return months
})
  // 统计数据
  const statistics = ref({
    totalInStock: 0,
    totalListed: 0,
    totalSold: 0
  })
  // 格式化数字
const formatNumber = (num) => {
  return (num || 0).toFixed(2)
}
  // 年份选择
  const selectedYear = ref(new Date().getFullYear())
  const availableYears = ref([])
  
  // 月度统计数据
  const monthlyStats = ref([])
  // 月度利润数据
  const monthlyProfit = ref([])
  
  // 格式化月份显示
  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-')
    return `${month}月`
  }
  
  // 加载可用年份
  const loadAvailableYears = async () => {
    try {
      const years = await window.electron.ipcRenderer.getAvailableYears()
      availableYears.value = years
      if (years.length > 0 && !years.includes(selectedYear.value)) {
        selectedYear.value = years[0]
      }
    } catch (error) {
      console.error('加载年份数据失败:', error)
      ElMessage.error('加载年份数据失败')
    }
  }
  
  // 加载统计数据
  const loadStatistics = async () => {
    try {
      const stats = await window.electron.ipcRenderer.getAccountStatistics()
      statistics.value = stats
    } catch (error) {
      console.error('加载统计数据失败:', error)
      ElMessage.error('加载统计数据失败')
    }
  }
  
  // 加载月度统计数据
  const loadMonthlyStats = async () => {
    try {
      const stats = await window.electron.ipcRenderer.getMonthlyStatistics(selectedYear.value)
      monthlyStats.value = stats
    } catch (error) {
      console.error('加载月度统计失败:', error)
      ElMessage.error('加载月度统计失败')
    }
  }
  
  // 加载月度利润数据
  const loadMonthlyProfit = async () => {
    try {
      const profit = await window.electron.ipcRenderer.getMonthlyProfit(selectedYear.value)
      monthlyProfit.value = profit
    } catch (error) {
      console.error('加载月度利润失败:', error)
      ElMessage.error('加载月度利润失败')
    }
  }
  
  // 处理年份变化
  const handleYearChange = async () => {
    await Promise.all([
      loadMonthlyStats(),
      loadMonthlyProfit()
    ])
  }
  
  // 账号统计图表配置
  const accountChartOption = computed(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['库存数量', '上架数量', '销售数量']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: monthlyStats.value.map(item => formatMonth(item.month))
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '库存数量',
        type: 'bar',
        stack: 'total',
        data: monthlyStats.value.map(item => item.inStock),
        color: '#409EFF'
      },
      {
        name: '上架数量',
        type: 'bar',
        stack: 'total',
        data: monthlyStats.value.map(item => item.listed),
        color: '#67C23A'
      },
      {
        name: '销售数量',
        type: 'bar',
        stack: 'total',
        data: monthlyStats.value.map(item => item.sold),
        color: '#E6A23C'
      }
    ]
  }))
  
  // 利润统计图表配置
  const profitChartOption = computed(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      }
    },
    legend: {
      data: ['总成本', '总收入', '净利润']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: monthlyProfit.value.map(item => formatMonth(item.month)),
      axisPointer: {
        type: 'shadow'
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '金额',
        axisLabel: {
          formatter: '¥{value}'
        }
      }
    ],
    series: [
      {
        name: '总成本',
        type: 'bar',
        data: monthlyProfit.value.map(item => item.totalCost),
        color: '#F56C6C'
      },
      {
        name: '总收入',
        type: 'bar',
        data: monthlyProfit.value.map(item => item.totalRevenue),
        color: '#67C23A'
      },
      {
        name: '净利润',
        type: 'line',
        data: monthlyProfit.value.map(item => item.netProfit),
        color: '#409EFF'
      }
    ]
  }))
  
  // 页面加载时执行
  onMounted(async () => {
    await loadAvailableYears()
    await loadStatistics()
    await loadMonthlyStats()
    await loadMonthlyProfit()
  })
  </script>
  
  <style scoped>
  .dashboard-container {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    height: calc(100vh - 84px); /* 减去头部导航的高度 */
    overflow-y: auto;
  }
  .overview-cards {
  display: flex;  /* 改为 flex 布局 */
  gap: 20px;
  width: 100%;
}

.stat-card {
  flex: 1;  /* 让每个卡片平均分配空间 */
  text-align: center;
  min-width: 200px;  /* 设置最小宽度 */
}

.stat-value {
  font-size: 32px;  /* 稍微调小字体以适应宽度 */
  font-weight: bold;
  color: #409EFF;
  padding: 10px 0;
}
  
  .year-selector {
    margin: 20px 0;
    display: flex;
    justify-content: flex-end;
  }
  
  .charts-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
 
  }
  
  .chart-card {
    height: 400px;
  }
  
  .chart {
    height: 100%;
  }
  
  .tables-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.data-table {
  width: 100%;
}
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .profit {
    color: #67C23A;
  }
  
  .loss {
    color: #F56C6C;
  }
  
  /* 表格样式优化 */
  :deep(.el-table) {
    --el-table-header-bg-color: #f5f7fa;
  }
  
  :deep(.el-table th) {
    font-weight: bold;
  }
  
  :deep(.el-table__row) {
    height: 50px;
  }
  
  /* 确保图表容器有足够的高度 */
  :deep(.el-card__body) {
    height: calc(100% - 60px);
    padding: 10px;
  }
  </style>