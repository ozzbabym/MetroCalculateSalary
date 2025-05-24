document.addEventListener('DOMContentLoaded', function() {
    // Установка текущей даты по умолчанию
    const today = new Date();
    document.getElementById('shift-date').valueAsDate = today;
    
    // Типы смен с временными интервалами
    const SHIFT_TYPES = {
        'early': { name: 'Ранняя', start: '06:00', end: '14:00', bonus: 0.1 },
        'day': { name: 'Дневная', start: '09:00', end: '17:00', bonus: 0 },
        'evening': { name: 'Вечерняя', start: '17:00', end: '01:00', bonus: 0.2 },
        'night': { name: 'Ночная', start: '22:00', end: '06:00', bonus: 0.4 },
        'holiday': { name: 'Праздничная', start: '09:00', end: '17:00', bonus: 1.0 }
    };
    
    // Инициализация приложения
    initTabs();
    initShiftTypeChange();
    initCalculators();
    
    // Добавляем первый интервал работы по умолчанию
    addWorkInterval();
    
    function initTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                this.classList.add('active');
                const tabId = this.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }
    
    function initShiftTypeChange() {
        const shiftTypeSelect = document.getElementById('shift-type');
        shiftTypeSelect.addEventListener('change', function() {
            // При изменении типа смены можно обновить что-то при необходимости
        });
    }
    
    function initCalculators() {
        document.getElementById('calculate-shift').addEventListener('click', calculateShift);
        document.getElementById('add-interval').addEventListener('click', addWorkInterval);
    }
    
    function addWorkInterval() {
        const container = document.getElementById('intervals-container');
        const intervalId = Date.now();
        const shiftType = document.getElementById('shift-type').value;
        const shiftData = SHIFT_TYPES[shiftType];
        
        const intervalHtml = `
            <div class="work-interval" data-id="${intervalId}">
                <div class="interval-row">
                    <div class="interval-group">
                        <label>Начало работы</label>
                        <input type="time" class="interval-start" value="${shiftData.start}">
                    </div>
                    <div class="interval-group">
                        <label>Конец работы</label>
                        <input type="time" class="interval-end" value="${shiftData.end}">
                    </div>
                </div>
                <button class="remove-interval">Удалить интервал</button>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', intervalHtml);
        
        container.querySelector(`.work-interval[data-id="${intervalId}"] .remove-interval`)
            .addEventListener('click', function() {
                if (document.querySelectorAll('.work-interval').length > 1) {
                    this.closest('.work-interval').remove();
                } else {
                    alert('Должен быть хотя бы один интервал работы!');
                }
            });
    }
    
    function calculateShift() {
        const hourlyRate = parseFloat(document.getElementById('hourly-rate').value) || 0;
        const shiftType = document.getElementById('shift-type').value;
        const shiftData = SHIFT_TYPES[shiftType];
        
        // Получаем границы смены
        const shiftStart = timeToMinutes(shiftData.start);
        const shiftEnd = timeToMinutes(shiftData.end) + (shiftData.end === '01:00' ? 24*60 : 0);
        
        // Собираем все интервалы работы
        const workIntervals = [];
        document.querySelectorAll('.work-interval').forEach((interval, index) => {
            const start = timeToMinutes(interval.querySelector('.interval-start').value);
            const end = timeToMinutes(interval.querySelector('.interval-end').value) + 
                        (interval.querySelector('.interval-end').value === '01:00' ? 24*60 : 0);
            
            if (start < end) {
                workIntervals.push({ start, end });
            }
        });
        
        // Сортируем интервалы по времени начала
        workIntervals.sort((a, b) => a.start - b.start);
        
        // Рассчитываем периоды простоя
        const breakIntervals = calculateBreakIntervals(shiftStart, shiftEnd, workIntervals);
        
        // Рассчитываем общее рабочее время и простои
        const totalWorkTime = sumIntervals(workIntervals);
        const totalBreakTime = sumIntervals(breakIntervals);
        const shiftDuration = shiftEnd - shiftStart;
        
        // Рассчитываем заработок
        const earnings = (totalWorkTime / 60) * hourlyRate * (1 + shiftData.bonus);
        
        // Отображаем результаты
        document.getElementById('shift-duration').textContent = formatMinutes(shiftDuration);
        document.getElementById('work-duration').textContent = formatMinutes(totalWorkTime);
        document.getElementById('break-duration').textContent = formatMinutes(totalBreakTime);
        document.getElementById('shift-earnings').textContent = earnings.toFixed(2) + ' ₽';
        document.getElementById('average-rate').textContent = (earnings / (totalWorkTime / 60)).toFixed(2);
        
        // Заполняем таблицы детализации
        fillIntervalsTable('work-intervals-details', workIntervals);
        fillIntervalsTable('break-intervals-details', breakIntervals);
        
        document.getElementById('shift-result').classList.remove('hidden');
    }
    
    function calculateBreakIntervals(shiftStart, shiftEnd, workIntervals) {
        const breaks = [];
        
        // Проверяем простой перед первым интервалом
        if (workIntervals.length > 0 && workIntervals[0].start > shiftStart) {
            breaks.push({
                start: shiftStart,
                end: workIntervals[0].start
            });
        }
        
        // Проверяем простои между интервалами
        for (let i = 1; i < workIntervals.length; i++) {
            if (workIntervals[i].start > workIntervals[i-1].end) {
                breaks.push({
                    start: workIntervals[i-1].end,
                    end: workIntervals[i].start
                });
            }
        }
        
        // Проверяем простой после последнего интервала
        if (workIntervals.length > 0 && workIntervals[workIntervals.length-1].end < shiftEnd) {
            breaks.push({
                start: workIntervals[workIntervals.length-1].end,
                end: shiftEnd
            });
        }
        
        // Если нет интервалов работы - вся смена считается простоем
        if (workIntervals.length === 0) {
            breaks.push({
                start: shiftStart,
                end: shiftEnd
            });
        }
        
        return breaks;
    }
    
    function sumIntervals(intervals) {
        return intervals.reduce((sum, interval) => sum + (interval.end - interval.start), 0);
    }
    
    function timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
    
    function formatMinutes(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours} ч ${minutes} мин`;
    }
    
    function fillIntervalsTable(tableId, intervals) {
        const tableBody = document.querySelector(`#${tableId} tbody`);
        tableBody.innerHTML = '';
        
        intervals.forEach((interval, index) => {
            const row = document.createElement('tr');
            const duration = interval.end - interval.start;
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formatTimeFromMinutes(interval.start)}</td>
                <td>${formatTimeFromMinutes(interval.end)}</td>
                <td>${formatMinutes(duration)}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    function formatTimeFromMinutes(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
});
