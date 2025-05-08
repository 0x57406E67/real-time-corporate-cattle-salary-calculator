# 实时工资计算器插件

## 功能
在VS Code状态栏实时显示当前工作时间的工资收入情况。

## 安装
1. 打包插件：`vsce package`
2. 在VS Code中通过"Install from VSIX"安装生成的.vsix文件

## 配置
在VS Code设置中搜索"Salary Calculator"，可配置以下参数：
- `rtSalaryCalc.monthlySalary`: 月薪（默认3000）
- `rtSalaryCalc.workingDaysPerMonth`: 每月工作天数（默认22）
- `rtSalaryCalc.defaultStartTime`: 默认上班时间（格式为HH:MM，默认'9:00'）
- `rtSalaryCalc.endTime`: 下班时间（格式为HH:MM，默认'18:00'）
- `rtSalaryCalc.lunchStart`: 午休开始时间（格式为HH:MM，默认'12:00'）
- `rtSalaryCalc.lunchEnd`: 午休结束时间（格式为HH:MM，默认'13:00'）
- `rtSalaryCalc.drinkType`: 饮料类型（默认奶茶）
- `rtSalaryCalc.drinkPrice`: 饮料价格（默认15）
- `rtSalaryCalc.statusBarPosition`: 状态栏显示位置（默认right，可选left）
- `rtSalaryCalc.refreshInterval`: 刷新间隔（毫秒，默认1000）

## 使用命令
- `rt-salary-calc.start`: 启动工资计算器
- `rt-salary-calc.end`: 暂停工资计算器
- `rt-salary-calc.toggle`: 切换工资计算器状态
- `rt-salary-calc.configure`: 打开配置界面

## 使用
安装后插件会自动运行，在状态栏显示实时工资信息（默认右侧，可在设置中修改）。

点击状态栏信息或使用命令"Configure Salary Calculator"可快速打开设置页面。

使用状态栏上的⏸️/▶️按钮或`rt-salary-calc.toggle`命令可暂停/恢复工资计算。