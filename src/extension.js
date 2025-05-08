const vscode = require('vscode');

function activate(context) {
    // 插件激活时的初始化函数
    // 获取配置项：状态栏位置、刷新间隔等
    const config = vscode.workspace.getConfiguration('rtSalaryCalc');
    const position = config.get('statusBarPosition') || 'right';
    // 创建主状态栏项（显示工资信息）
    let statusBarItem = vscode.window.createStatusBarItem(
        position === 'left' ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right, 
        100
    );
    let toggleStatusBarItem = vscode.window.createStatusBarItem(
        position === 'left' ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right, 
        99
    );
    let isActive = true;
    let lastEarned = 0;
    let lastRefreshInterval = config.get('refreshInterval') || 1000;
    // 由于后续代码存在重复声明 intervalId 的问题，这里保持声明不变，后续代码需避免重复声明
    let intervalId;
    
    function updateSalaryInfo() {
        // 更新实时工资信息的核心函数
        // console.log('Updating salary info at:', new Date().toISOString());
        const config = vscode.workspace.getConfiguration('rtSalaryCalc');
        const currentPosition = config.get('statusBarPosition') || 'right';
        const currentRefreshInterval = config.get('refreshInterval') || 1000;
        
        // 检查位置是否变更，若变更则重新创建statusBarItem
        if (statusBarItem.alignment !== (currentPosition === 'left' ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right)) {
            statusBarItem.dispose();
            toggleStatusBarItem.dispose();
            if (intervalId) {
                clearInterval(intervalId);
            }
            statusBarItem = vscode.window.createStatusBarItem(
                currentPosition === 'left' ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right, 
                100
            );
            toggleStatusBarItem = vscode.window.createStatusBarItem(
                currentPosition === 'left' ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right, 
                99
            );
            context.subscriptions.push(statusBarItem);
            context.subscriptions.push(toggleStatusBarItem);
            
            // 重新创建定时器
            intervalId = setInterval(() => {
                if (isActive) {
                    updateSalaryInfo();
                }
            }, currentRefreshInterval);
        }
        
        // 检查刷新间隔是否变更，若变更则重新设置定时器
        if (intervalId && currentRefreshInterval !== lastRefreshInterval) {
            clearInterval(intervalId);
            intervalId = setInterval(() => {
                if (isActive) {
                    updateSalaryInfo();
                }
            }, currentRefreshInterval);
            lastRefreshInterval = currentRefreshInterval;
        }
        
        const monthlySalary = config.get('monthlySalary');
        const workingDays = config.get('workingDaysPerMonth');
        const startHour = parseTimeToHour(config.get('defaultStartTime') || '9:00');
        const endHour = parseTimeToHour(config.get('endTime') || '18:00');
        const lunchStart = parseTimeToHour(config.get('lunchStart') || '12:00');
        const lunchEnd = parseTimeToHour(config.get('lunchEnd') || '13:00');
        
        // console.log('Config values:', {monthlySalary, workingDays, startHour, endHour, lunchStart, lunchEnd});
        
        if (!monthlySalary || !workingDays || !startHour || !endHour || !lunchStart || !lunchEnd) {
            console.log('Missing configuration values, skipping update');
            return;
        }
        
        // 计算每日工作小时数（扣除午休时间）
        const dailyHours = (endHour - startHour) - (lunchEnd - lunchStart);
        const totalWorkHours = workingDays * dailyHours;
        const totalWorkMinutes = totalWorkHours * 60;
        const perMinute = monthlySalary / totalWorkMinutes;
        
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, 0, 0);
        const todayLunchStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), lunchStart, 0, 0);
        const todayLunchEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), lunchEnd, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, 0, 0);
        
        let workedMinutes = 0;
        if (now >= todayStart && now <= todayEnd) {
            // 计算工作时间（扣除午休时间）
            if (now < todayLunchStart) {
                workedMinutes = (now - todayStart) / (1000 * 60);
            } else if (now >= todayLunchEnd) {
                workedMinutes = ((todayLunchStart - todayStart) + (now - todayLunchEnd)) / (1000 * 60);
            } else {
                workedMinutes = (todayLunchStart - todayStart) / (1000 * 60);
            }
        } else if (now > todayEnd) {
            workedMinutes = dailyHours * 60;
        }
        
        const earned = isActive ? workedMinutes * perMinute : lastEarned;
        lastEarned = earned;
        const drinkType = config.get('drinkType') || '奶茶';
        const drinkPrice = config.get('drinkPrice') || 15;
        const drinkMinutes = Math.ceil(drinkPrice / perMinute);
        
        const cupsEarned = (earned / drinkPrice).toFixed(2);
        statusBarItem.text = `¥${earned.toFixed(2)} | ${cupsEarned}/cup | ${dailyHours}h`;
        statusBarItem.tooltip = `已赚 ¥${earned.toFixed(2)} | 已获得${cupsEarned}杯${drinkType} | 每日工作${dailyHours}小时 | 每分钟 ¥${perMinute.toFixed(4)} | 一杯${drinkType}(¥${drinkPrice})需要工作${drinkMinutes}分钟`;
        statusBarItem.command = 'rt-salary-calc.configure';
        // console.log('Status bar updated with:', statusBarItem.text);
        statusBarItem.show();
        toggleStatusBarItem.text = isActive ? '⏸️' : '▶️';
        toggleStatusBarItem.tooltip = isActive ? '暂停工资计算器' : '启动工资计算器';
        toggleStatusBarItem.command = 'rt-salary-calc.toggle';
        toggleStatusBarItem.show();
    }
    
    // Initial update
    updateSalaryInfo();
    
    // 启动定时器：按配置的刷新间隔更新工资信息（默认1秒）
    // console.log('Starting salary calculator timer');
    intervalId = setInterval(() => {
        // console.log('Timer triggered at:', new Date().toISOString());
        if (isActive) {
            updateSalaryInfo();
        }
    }, config.get('refreshInterval') || 1000);
    
    // console.log('Timer interval ID:', intervalId);
    
    // 注册配置命令：打开VS Code设置界面配置插件参数
    let disposable = vscode.commands.registerCommand('rt-salary-calc.configure', () => {
        // vscode.window.showInformationMessage('请在设置中配置工资计算器参数');
        vscode.commands.executeCommand('workbench.action.openSettings', 'rtSalaryCalc');
    });
    
    // Register toggle command
    let toggleDisposable = vscode.commands.registerCommand('rt-salary-calc.toggle', () => {
        isActive = !isActive;
        if (isActive) {
            vscode.window.setStatusBarMessage('工资计算器已启动', 3000);
        } else {
            vscode.window.setStatusBarMessage('工资计算器已暂停', 3000);
        }
        updateSalaryInfo();
    });
    
    // Register start/end commands
    let startDisposable = vscode.commands.registerCommand('rt-salary-calc.start', () => {
        isActive = true;
        vscode.window.setStatusBarMessage('工资计算器已启动', 3000);
    });
    
    let endDisposable = vscode.commands.registerCommand('rt-salary-calc.end', () => {
        isActive = false;
        vscode.window.setStatusBarMessage('工资计算器已暂停', 3000);
    });
    
    context.subscriptions.push(disposable);
    context.subscriptions.push(startDisposable);
    context.subscriptions.push(endDisposable);
    context.subscriptions.push(statusBarItem);
    context.subscriptions.push(toggleStatusBarItem);
    context.subscriptions.push(toggleDisposable);
}

function parseTimeToHour(timeStr) {
    if (typeof timeStr === 'number') return timeStr;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};