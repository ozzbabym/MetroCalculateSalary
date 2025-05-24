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
    
    // Инициализация приложения
    initTabs();
    initShiftTypeChange();
    initCalculators();
    
    // Добавляем первый интервал по умолчанию
    addWorkInterval();
    
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
            document.querySelector('.interval-start').value = shiftType.start;
            document.querySelector('.interval-end').value = shiftType.end;
        });
    }
    
    function initCalculators() {
        // Расчет смены
        document.getElementById('calculate-shift').addEventListener('click', calculateShift);
        
        // Расчет месяца
        document.getElementById('calculate-month').addEventListener('click', calculateMonthly);
        
        // Добавление интервала
        document.getElementById('add-interval').addEventListener('click', addWorkInterval);
        
        // Автоматически заполняем нормы для текущего месяца
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        if (WORKING_HOURS_NORMS[currentYear] && WORKING_HOURS_NORMS[currentYear][currentMonth]) {
            const norms = WORKING_HOURS_NORMS[currentYear][currentMonth];
            document.getElementById('planned-hours').value = norms.norm;
            document.getElementById('working-days').value = norms.workingDays;
            document.getElementById('weekend-days').value = norms.weekends;
        }
    }
    
    function addWorkInterval() {
        const container = document.getElementById('intervals-container');
        const intervalId = Date.now();
        const shiftType = document.getElementById('shift-type').value;
        const shiftData = SHIFT_TYPES[shiftType];
        
        const intervalHtml = `
            <div class="work-interval" data-id="${intervalId}">
                <div class="form-row">
                    <div class="form-group">
                        <label>Начало работы</label>
                        <input type="time" class="interval-start" value="${shiftData.start}">
                    </div>
                    <div class="form-group">
                        <label>Конец работы</label>
                        <input type="time" class="interval-end" value="${shiftData.end}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Время простоя (минуты)</label>
                        <input type="number" class="interval-break" value="0" min="0">
                    </div>
                    <div class="form-group">
                        <label>Отдых под землей (минуты)</label>
                        <input type="number" class="interval-underground" value="0" min="0">
                    </div>
                    <div class="form-group">
                        <label>Отдых на поверхности (минуты)</label>
                        <input type="number" class="interval-surface" value="0" min="0">
                    </div>
                    <div class="form-group">
                        <button class="remove-interval">Удалить</button>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', intervalHtml);
        
        // Добавляем обработчик удаления
        container.querySelector(`.work-interval[data-id="${intervalId}"] .remove-interval`)
            .addEventListener('click', function() {
                if (document.querySelectorAll('.work-interval').length > 1) {
                    this.closest('.work-interval').remove();
                } else {
                    alert('Должен быть хотя бы один интервал!');
                }
            });
    }
    
    function calculateShift() {
        const hourlyRate = parseFloat(document.getElementById('hourly-rate').value) || 0;
        const shiftType = document.getElementById('shift-type').value;
        const shiftData = SHIFT_TYPES[shiftType];
        
        let totalDuration = 0; // Общая длительность всех интервалов (в часах)
        let totalWorkTime = 0; // Чистое рабочее время (в часах)
        let totalBreakTime = 0; // Общее время простоя (в часах)
        let totalEarnings = 0; // Общий заработок
        
        const detailsTable = document.querySelector('#intervals-details tbody');
        detailsTable.innerHTML = '';
        
        // Обрабатываем каждый интервал
        document.querySelectorAll('.work-interval').forEach((interval, index) => {
            const startTime = interval.querySelector('.interval-start').value;
            const endTime = interval.querySelector('.interval-end').value;
            const breakTime = parseInt(interval.querySelector('.interval-break').value) || 0;
            const undergroundBreak = parseInt(interval.querySelector('.interval-underground').value) || 0;
            const surfaceBreak = parseInt(interval.querySelector('.interval-surface').value) || 0;
            
            // Расчет длительности интервала
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
            
            // Расчет заработка для интервала
            let earnings = workHours * hourlyRate * (1 + shiftData.bonus);
            
            // Доплаты за отдых
            earnings += (undergroundBreak / 60) * hourlyRate * 0.5; // 50% от ставки
            earnings += (surfaceBreak / 60) * hourlyRate * 0.3; // 30% от ставки
            
            // Суммируем показатели
            totalDuration += durationHours;
            totalWorkTime += workHours;
            totalBreakTime += totalBreakMinutes / 60;
            totalEarnings += earnings;
            
            // Добавляем строку в таблицу детализации
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>Интервал ${index + 1}</td>
                <td>${formatHours(workHours)}</td>
                <td>${formatHours(totalBreakMinutes / 60)}</td>
                <td>${earnings.toFixed(2)} ₽</td>
            `;
            detailsTable.appendChild(row);
        });
        
        // Отображение результатов
        document.getElementById('shift-duration').textContent = formatHours(totalDuration);
        document.getElementById('work-duration').textContent = formatHours(totalWorkTime);
        document.getElementById('break-duration').textContent = formatHours(totalBreakTime);
        document.getElementById('shift-earnings').textContent = totalEarnings.toFixed(2) + ' ₽';
        document.getElementById('average-rate').textContent = (totalEarnings / totalWorkTime).toFixed(2);
        
        document.getElementById('shift-result').classList.remove('hidden');
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
    
    // Вспомогательные функции
    function formatHours(hours) {
        const hoursFloor = Math.floor(hours);
        const minutes = Math.round((hours - hoursFloor) * 60);
        return `${hoursFloor} ч ${minutes} мин`;
    }
    
    function addDetailRow(table, label, value) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${label}</td>
            <td>${value.toFixed(2)} ₽</td>
        `;
        table.appendChild(row);
    }
});
