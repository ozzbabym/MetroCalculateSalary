document.addEventListener('DOMContentLoaded', function() {
    // Переключение между вкладками
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Удаляем активный класс у всех кнопок и контента
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Добавляем активный класс к выбранной кнопке и контенту
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Установка текущей даты по умолчанию
    const today = new Date();
    document.getElementById('shift-date').valueAsDate = today;
    
    // Расчет смены
    document.getElementById('calculate-shift').addEventListener('click', calculateShift);
    
    // Расчет месяца
    document.getElementById('calculate-month').addEventListener('click', calculateMonthly);
    
    // Обновление времени при изменении
    document.getElementById('start-time').addEventListener('change', updateShiftDuration);
    document.getElementById('end-time').addEventListener('change', updateShiftDuration);
});

function calculateShift() {
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    const hourlyRate = parseFloat(document.getElementById('hourly-rate').value) || 0;
    const breakTime = parseInt(document.getElementById('break-time').value) || 0;
    const undergroundBreak = parseInt(document.getElementById('underground-break').value) || 0;
    const surfaceBreak = parseInt(document.getElementById('surface-break').value) || 0;
    const shiftType = document.getElementById('shift-type').value;
    
    // Расчет длительности смены
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    // Корректировка для ночных смен
    if (end < start) {
        end.setDate(end.getDate() + 1);
    }
    
    const durationMs = end - start;
    const durationHours = durationMs / (1000 * 60 * 60);
    
    // Расчет чистого рабочего времени
    const totalBreakMinutes = breakTime + undergroundBreak + surfaceBreak;
    const workHours = durationHours - (totalBreakMinutes / 60);
    
    // Расчет заработка
    let earnings = workHours * hourlyRate;
    
    // Доплаты за тип смены
    switch(shiftType) {
        case 'evening':
            earnings *= 1.2; // 20% доплата за вечер
            break;
        case 'night':
            earnings *= 1.4; // 40% доплата за ночь
            break;
        case 'holiday':
            earnings *= 2; // 100% доплата за праздник
            break;
    }
    
    // Доплата за отдых под землей (50% от ставки)
    earnings += (undergroundBreak / 60) * hourlyRate * 0.5;
    
    // Доплата за отдых на поверхности (30% от ставки)
    earnings += (surfaceBreak / 60) * hourlyRate * 0.3;
    
    // Отображение результатов
    const durationHoursFloor = Math.floor(durationHours);
    const durationMinutes = Math.round((durationHours - durationHoursFloor) * 60);
    
    const workHoursFloor = Math.floor(workHours);
    const workMinutes = Math.round((workHours - workHoursFloor) * 60);
    
    document.getElementById('shift-duration').textContent = `${durationHoursFloor} ч ${durationMinutes} мин`;
    document.getElementById('work-duration').textContent = `${workHoursFloor} ч ${workMinutes} мин`;
    document.getElementById('per-minute').textContent = (hourlyRate / 60).toFixed(2) + ' ₽/мин';
    document.getElementById('shift-earnings').textContent = earnings.toFixed(2) + ' ₽';
    document.getElementById('average-rate').textContent = (earnings / workHours).toFixed(2);
    
    document.getElementById('shift-result').classList.remove('hidden');
}

function updateShiftDuration() {
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    
    if (!startTime || !endTime) return;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    // Корректировка для ночных смен
    if (end < start) {
        end.setDate(end.getDate() + 1);
    }
    
    const durationMs = end - start;
    const durationHours = durationMs / (1000 * 60 * 60);
    
    const hours = Math.floor(durationHours);
    const minutes = Math.round((durationHours - hours) * 60);
    
    // Можно добавить отображение длительности где-нибудь
}

function calculateMonthly() {
    const baseHourlyRate = parseFloat(document.getElementById('base-hourly-rate').value) || 0;
    const plannedHours = parseFloat(document.getElementById('planned-hours').value) || 0;
    const actualHours = parseFloat(document.getElementById('actual-hours').value) || 0;
    const workingDays = parseInt(document.getElementById('working-days').value) || 0;
    const weekendDays = parseInt(document.getElementById('weekend-days').value) || 0;
    const eveningShifts = parseInt(document.getElementById('evening-shifts').value) || 0;
    const nightShifts = parseInt(document.getElementById('night-shifts').value) || 0;
    const holidayHours = parseFloat(document.getElementById('holiday-hours').value) || 0;
    const overtimeHours = parseFloat(document.getElementById('overtime-hours').value) || 0;
    const bonusPercent = parseInt(document.getElementById('bonus-percent').value) || 0;
    
    // Расчет базового заработка
    let baseEarnings = actualHours * baseHourlyRate;
    
    // Расчет доплат
    const eveningHours = eveningShifts * 4; // Примерно 4 вечерних часа за смену
    const nightHours = nightShifts * 6; // Примерно 6 ночных часов за смену
    
    const eveningBonus = eveningHours * baseHourlyRate * 0.2; // 20% доплата
    const nightBonus = nightHours * baseHourlyRate * 0.4; // 40% доплата
    const holidayBonus = holidayHours * baseHourlyRate * 1.0; // 100% доплата
    
    // Расчет переработки (первые 2 часа 1.5, остальные 2)
    const overtimeFirst = Math.min(overtimeHours, 2) * baseHourlyRate * 0.5;
    const overtimeRest = Math.max(0, overtimeHours - 2) * baseHourlyRate * 1.0;
    const overtimeBonus = overtimeFirst + overtimeRest;
    
    // Премия
    const bonusAmount = (baseEarnings + eveningBonus + nightBonus + holidayBonus + overtimeBonus) * (bonusPercent / 100);
    
    // Итого
    const totalEarnings = baseEarnings + eveningBonus + nightBonus + holidayBonus + overtimeBonus + bonusAmount;
    
    // Отображение результатов
    document.getElementById('total-hours').textContent = actualHours.toFixed(1) + ' ч';
    document.getElementById('line-hours').textContent = (actualHours - nightHours).toFixed(1) + ' ч';
    document.getElementById('evening-hours').textContent = eveningHours.toFixed(1) + ' ч';
    document.getElementById('night-hours').textContent = nightHours.toFixed(1) + ' ч';
    document.getElementById('monthly-earnings').textContent = totalEarnings.toFixed(2) + ' ₽';
    document.getElementById('monthly-average-rate').textContent = (totalEarnings / actualHours).toFixed(2);
    
    // Заполнение таблицы детализации
    const detailsTable = document.querySelector('#monthly-details tbody');
    detailsTable.innerHTML = '';
    
    addDetailRow(detailsTable, 'Базовая оплата', baseEarnings);
    if (eveningBonus > 0) addDetailRow(detailsTable, 'Доплата за вечер', eveningBonus);
    if (nightBonus > 0) addDetailRow(detailsTable, 'Доплата за ночь', nightBonus);
    if (holidayBonus > 0) addDetailRow(detailsTable, 'Доплата за праздники', holidayBonus);
    if (overtimeBonus > 0) addDetailRow(detailsTable, 'Доплата за переработку', overtimeBonus);
    if (bonusAmount > 0) addDetailRow(detailsTable, `Премия (${bonusPercent}%)`, bonusAmount);
    
    document.getElementById('monthly-result').classList.remove('hidden');
}

function addDetailRow(table, label, value) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${label}</td>
        <td>${value.toFixed(2)} ₽</td>
    `;
    table.appendChild(row);
                                       }
