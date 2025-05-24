document.addEventListener('DOMContentLoaded', function() {
    // Установка текущей даты по умолчанию
    const today = new Date();
    document.getElementById('shift-date').valueAsDate = today;
    
    // Нормы рабочих часов (примерные данные)
    const WORKING_HOURS_NORMS = {
        2025: {
            0: { norm: 136, workingDays: 21, weekends: 10 }, // Январь
            1: { norm: 128, workingDays: 20, weekends: 8 },  // Февраль
            2: { norm: 144, workingDays: 22, weekends: 9 },  // Март
            3: { norm: 144, workingDays: 22, weekends: 8 },  // Апрель
            4: { norm: 136, workingDays: 21, weekends: 10 }, // Май
            5: { norm: 144, workingDays: 22, weekends: 8 },  // Июнь
            6: { norm: 152, workingDays: 23, weekends: 8 },  // Июль
            7: { norm: 144, workingDays: 22, weekends: 9 },  // Август
            8: { norm: 144, workingDays: 22, weekends: 8 },  // Сентябрь
            9: { norm: 152, workingDays: 23, weekends: 8 },  // Октябрь
            10: { norm: 136, workingDays: 21, weekends: 9 }, // Ноябрь
            11: { norm: 136, workingDays: 21, weekends: 10 } // Декабрь
        }
    };
    
    // Типы смен с временными интервалами
    const SHIFT_TYPES = {
        'early': { name: 'Ранняя', start: '6:00', end: '14:00', className: 'shift-early', bonus: 0.1 },
        'day': { name: 'Дневная', start: '9:00', end: '17:00', className: 'shift-day', bonus: 0 },
        'evening': { name: 'Вечерняя', start: '17:00', end: '1:00', className: 'shift-evening', bonus: 0.2 },
        'night': { name: 'Ночная', start: '22:00', end: '6:00', className: 'shift-night', bonus: 0.4 },
        'holiday': { name: 'Праздничная', start: '9:00', end: '17:00', className: 'shift-holiday', bonus: 1.0 }
    };
    
    // Текущий месяц и год для календаря
    let currentYear = today.getFullYear();
    let currentMonth = today.getMonth();
    
    // Инициализация приложения
    initTabs();
    initShiftTypeChange();
    initCalculators();
    renderCalendar(currentYear, currentMonth);
    
    function initTabs() {
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
    }
    
    function initShiftTypeChange() {
        const shiftTypeSelect = document.getElementById('shift-type');
        shiftTypeSelect.addEventListener('change', function() {
            const shiftType = SHIFT_TYPES[this.value];
            document.getElementById('start-time').value = shiftType.start;
            document.getElementById('end-time').value = shiftType.end;
        });
    }
    
    function initCalculators() {
        // Расчет смены
        document.getElementById('calculate-shift').addEventListener('click', calculateShift);
        
        // Расчет месяца
        document.getElementById('calculate-month').addEventListener('click', calculateMonthly);
        
        // Навигация по календарю
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
        
        // Обновление времени при изменении
        document.getElementById('start-time').addEventListener('change', updateShiftDuration);
        document.getElementById('end-time').addEventListener('change', updateShiftDuration);
    }
    
    function calculateShift() {
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const hourlyRate = parseFloat(document.getElementById('hourly-rate').value) || 0;
        const breakTime = parseInt(document.getElementById('break-time').value) || 0;
        const undergroundBreak = parseInt(document.getElementById('underground-break').value) || 0;
        const surfaceBreak = parseInt(document.getElementById('surface-break').value) || 0;
        const shiftType = document.getElementById('shift-type').value;
        const shiftData = SHIFT_TYPES[shiftType];
        
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
        let earnings = workHours * hourlyRate * (1 + shiftData.bonus);
        
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
    }
    
    function calculateMonthly() {
        const baseHourlyRate = parseFloat(document.getElementById('base-hourly-rate').value) || 0;
        const plannedHours = parseFloat(document.getElementById('planned-hours').value) || 0;
        const actualHours = parseFloat(document.getElementById('actual-hours').value) || 0;
        const workingDays = parseInt(document.getElementById('working-days').value) || 0;
        const weekendDays = parseInt(document.getElementById('weekend-days').value) || 0;
        const earlyShifts = parseInt(document.getElementById('early-shifts').value) || 0;
        const dayShifts = parseInt(document.getElementById('day-shifts').value) || 0;
        const eveningShifts = parseInt(document.getElementById('evening-shifts').value) || 0;
        const nightShifts = parseInt(document.getElementById('night-shifts').value) || 0;
        const holidayHours = parseFloat(document.getElementById('holiday-hours').value) || 0;
        const overtimeHours = parseFloat(document.getElementById('overtime-hours').value) || 0;
        
        // Расчет базового заработка
        let baseEarnings = actualHours * baseHourlyRate;
        
        // Расчет доплат за разные типы смен
        const earlyHours = earlyShifts * 8; // Примерно 8 часов за раннюю смену
        const dayHours = dayShifts * 8;    // Примерно 8 часов за дневную смену
        const eveningHours = eveningShifts * 8; // Примерно 8 часов за вечернюю смену
        const nightHours = nightShifts * 8; // Примерно 8 часов за ночную смену
        
        const earlyBonus = earlyHours * baseHourlyRate * 0.1; // 10% доплата
        const eveningBonus = eveningHours * baseHourlyRate * 0.2; // 20% доплата
        const nightBonus = nightHours * baseHourlyRate * 0.4; // 40% доплата
        const holidayBonus = holidayHours * baseHourlyRate * 1.0; // 100% доплата
        
        // Расчет переработки (первые 2 часа 1.5, остальные 2)
        const overtimeFirst = Math.min(overtimeHours, 2) * baseHourlyRate * 0.5;
        const overtimeRest = Math.max(0, overtimeHours - 2) * baseHourlyRate * 1.0;
        const overtimeBonus = overtimeFirst + overtimeRest;
        
        // Премия (фиксированная 35%)
        const bonusPercent = 35;
        const bonusAmount = (baseEarnings + earlyBonus + eveningBonus + nightBonus + holidayBonus + overtimeBonus) * (bonusPercent / 100);
        
        // Итого
        const totalEarnings = baseEarnings + earlyBonus + eveningBonus + nightBonus + holidayBonus + overtimeBonus + bonusAmount;
        
        // Отображение результатов
        document.getElementById('total-hours').textContent = actualHours.toFixed(1) + ' ч';
        document.getElementById('line-hours').textContent = (earlyHours + dayHours + eveningHours).toFixed(1) + ' ч';
        document.getElementById('early-hours').textContent = earlyHours.toFixed(1) + ' ч';
        document.getElementById('evening-hours').textContent = eveningHours.toFixed(1) + ' ч';
        document.getElementById('night-hours').textContent = nightHours.toFixed(1) + ' ч';
        document.getElementById('holiday-hours-display').textContent = holidayHours.toFixed(1) + ' ч';
        document.getElementById('monthly-earnings').textContent = totalEarnings.toFixed(2) + ' ₽';
        document.getElementById('monthly-average-rate').textContent = (totalEarnings / actualHours).toFixed(2);
        
        // Заполнение таблицы детализации
        const detailsTable = document.querySelector('#monthly-details tbody');
        detailsTable.innerHTML = '';
        
        addDetailRow(detailsTable, 'Базовая оплата', baseEarnings);
        if (earlyBonus > 0) addDetailRow(detailsTable, 'Доплата за ранние смены', earlyBonus);
        if (eveningBonus > 0) addDetailRow(detailsTable, 'Доплата за вечерние смены', eveningBonus);
        if (nightBonus > 0) addDetailRow(detailsTable, 'Доплата за ночные смены', nightBonus);
        if (holidayBonus > 0) addDetailRow(detailsTable, 'Доплата за праздники', holidayBonus);
        if (overtimeBonus > 0) addDetailRow(detailsTable, 'Доплата за переработку', overtimeBonus);
        addDetailRow(detailsTable, `Премия (${bonusPercent}%)`, bonusAmount);
        
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
    
    function renderCalendar(year, month) {
        const calendarEl = document.getElementById('calendar-grid');
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
                
                const dayNumber = document.createElement('div');
                dayNumber.className = 'day-number';
                dayNumber.textContent = day;
                dayEl.appendChild(dayNumber);
                
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
                
                // Добавляем информацию о смене (примерные данные)
                if (day % 5 === 0) { // Ранняя смена
                    const shift = SHIFT_TYPES['early'];
                    dayEl.classList.add(shift.className);
                    
                    const shiftInfo = document.createElement('div');
                    shiftInfo.className = 'shift-info';
                    shiftInfo.textContent = `${shift.name} ${shift.start}-${shift.end}`;
                    dayEl.appendChild(shiftInfo);
                } else if (day % 4 === 0) { // Вечерняя смена
                    const shift = SHIFT_TYPES['evening'];
                    dayEl.classList.add(shift.className);
                    
                    const shiftInfo = document.createElement('div');
                    shiftInfo.className = 'shift-info';
                    shiftInfo.textContent = `${shift.name} ${shift.start}-${shift.end}`;
                    dayEl.appendChild(shiftInfo);
                } else if (day % 3 === 0) { // Ночная смена
                    const shift = SHIFT_TYPES['night'];
                    dayEl.classList.add(shift.className);
                    
                    const shiftInfo = document.createElement('div');
                    shiftInfo.className = 'shift-info';
                    shiftInfo.textContent = `${shift.name} ${shift.start}-${shift.end}`;
                    dayEl.appendChild(shiftInfo);
                } else if (day % 7 === 0) { // Праздничная смена
                    const shift = SHIFT_TYPES['holiday'];
                    dayEl.classList.add(shift.className);
                    
                    const shiftInfo = document.createElement('div');
                    shiftInfo.className = 'shift-info';
                    shiftInfo.textContent = `${shift.name} ${shift.start}-${shift.end}`;
                    dayEl.appendChild(shiftInfo);
                } else { // Обычная дневная смена
                    const shift = SHIFT_TYPES['day'];
                    dayEl.classList.add(shift.className);
                    
                    const shiftInfo = document.createElement('div');
                    shiftInfo.className = 'shift-info';
                    shiftInfo.textContent = `${shift.name} ${shift.start}-${shift.end}`;
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
        if (WORKING_HOURS_NORMS[year] && WORKING_HOURS_NORMS[year][month]) {
            const norms = WORKING_HOURS_NORMS[year][month];
            document.getElementById('planned-hours').value = norms.norm;
            document.getElementById('working-days').value = norms.workingDays;
            document.getElementById('weekend-days').value = norms.weekends;
        }
    }
});
