const WORKING_HOURS_NORMS = {
    // Примерные нормы часов (можно дополнить)
    2025: {
        1: { norm: 136, workingDays: 21, weekends: 10 },
        2: { norm: 128, workingDays: 20, weekends: 8 },
        3: { norm: 144, workingDays: 22, weekends: 9 },
        4: { norm: 144, workingDays: 22, weekends: 8 },
        5: { norm: 136, workingDays: 21, weekends: 10 },
        // ... остальные месяцы
    }
};

const SHIFT_TYPES = {
    'Ранняя': { start: '6:00', end: '14:00', className: 'shift-day' },
    'Дневная': { start: '9:00', end: '17:00', className: 'shift-day' },
    'Вечерняя': { start: '17:00', end: '1:00', className: 'shift-evening' },
    'Ночная': { start: '22:00', end: '6:00', className: 'shift-night' },
    'Праздничная': { start: '9:00', end: '17:00', className: 'shift-holiday' }
};
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('prev-month').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar(currentYear, currentMonth);
});

document.getElementById('next-month').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentYear, currentMonth);
});

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// Функция рендеринга календаря
function renderCalendar(year, month) {
    const calendarEl = document.getElementById('calendar');
    calendarEl.innerHTML = '';
    
    // Заголовки дней недели
    ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarEl.appendChild(dayHeader);
    });
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    // Заполняем календарь
    for (let i = 0; i < 42; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        if (i >= firstDay - 1 && i < firstDay + daysInMonth - 1) {
            const day = i - firstDay + 2;
            const date = new Date(year, month, day);
            
            dayEl.textContent = day;
            
            // Помечаем выходные
            if (date.getDay() === 0 || date.getDay() === 6) {
                dayEl.classList.add('weekend');
            }
            
            // Помечаем сегодня
            if (date.getDate() === today.getDate() && 
                date.getMonth() === today.getMonth() && 
                date.getFullYear() === today.getFullYear()) {
                dayEl.classList.add('today');
            }
            
            // Добавляем информацию о смене (примерная логика)
            if (Math.random() > 0.7) { // Для демонстрации
                const shiftType = Object.keys(SHIFT_TYPES)[Math.floor(Math.random() * 4)];
                const shift = SHIFT_TYPES[shiftType];
                
                dayEl.classList.add(shift.className);
                
                const shiftInfo = document.createElement('div');
                shiftInfo.className = 'shift-info';
                shiftInfo.textContent = `${shiftType} ${shift.start}-${shift.end}`;
                dayEl.appendChild(shiftInfo);
            }
        }
        
        calendarEl.appendChild(dayEl);
    }
    
    // Обновляем заголовок
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                       'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    document.getElementById('current-month-year').textContent = 
        `${monthNames[month]} ${year}`;
    
    // Автоматически заполняем нормы
    if (WORKING_HOURS_NORMS[year] && WORKING_HOURS_NORMS[year][month + 1]) {
        const norms = WORKING_HOURS_NORMS[year][month + 1];
        document.getElementById('planned-hours').value = norms.norm;
        document.getElementById('working-days').value = norms.workingDays;
        document.getElementById('weekend-days').value = norms.weekends;
    }
}
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
      const year = parseInt(document.getElementById('year-select').value);
    const month = parseInt(document.getElementById('month-select').value);
    
    let plannedHours = WORKING_HOURS_NORMS[year] && WORKING_HOURS_NORMS[year][month] 
        ? WORKING_HOURS_NORMS[year][month].norm 
        : 136; // Значение по умолчанию
    
    let workingDays = WORKING_HOURS_NORMS[year] && WORKING_HOURS_NORMS[year][month] 
        ? WORKING_HOURS_NORMS[year][month].workingDays 
        : 21; // Значение по умолчанию
    
    let weekendDays = WORKING_HOURS_NORMS[year] && WORKING_HOURS_NORMS[year][month] 
        ? WORKING_HOURS_NORMS[year][month].weekends 
        : 10; // Значение по умолчанию
    
    // Обновляем поля формы
    document.getElementById('planned-hours').value = plannedHours;
    document.getElementById('working-days').value = workingDays;
    document.getElementById('weekend-days').value = weekendDays;
    
    // Расчет премии (фиксированная ставка 35%)
    const bonusPercent = 35;
    const bonusAmount = (baseEarnings + eveningBonus + nightBonus + holidayBonus + overtimeBonus) * (bonusPercent / 100);
    
    // ... остальной расчет ...
}
}

function addDetailRow(table, label, value) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${label}</td>
        <td>${value.toFixed(2)} ₽</td>
    `;
    table.appendChild(row);
                                       }
