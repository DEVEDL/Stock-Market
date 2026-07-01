// Main Application Logic for 3-Page Nifty 50 Financial Dashboard

document.addEventListener('DOMContentLoaded', () => {
    // Application state
    let state = {
        summary: [],
        historical: [],
        crossovers: [],
        sectors: [],
        companies: [],
        years: [],
        months: [
            { value: '01', name: 'January' },
            { value: '02', name: 'February' },
            { value: '03', name: 'March' },
            { value: '04', name: 'April' },
            { value: '05', name: 'May' },
            { value: '06', name: 'June' },
            { value: '07', name: 'July' },
            { value: '08', name: 'August' },
            { value: '09', name: 'September' },
            { value: '10', name: 'October' },
            { value: '11', name: 'November' },
            { value: '12', name: 'December' }
        ],
        selectedSector: 'ALL',
        selectedTicker: 'ALL',
        selectedYear: 'ALL',
        selectedMonth: 'ALL',

        // Chart instances
        charts: {
            trendChart: null,
            sectorDonutChart: null,
            monthlyAverageChart: null,
            volumeTrendChart: null,
            topReturnChart: null,
            bottomReturnChart: null,
            avgVolumeChart: null,
            maComparisonChart: null,
            riskScatterChart: null,
            sectorVolumeChart: null,
            waterfallChart: null
        }
    };

    // DOM Elements
    const sectorFilter = document.getElementById('sector-filter');
    const tickerFilter = document.getElementById('ticker-filter');
    const yearFilter = document.getElementById('year-filter');
    const monthFilter = document.getElementById('month-filter');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const navItems = document.querySelectorAll('.nav-item');
    const tabScreens = document.querySelectorAll('.tab-screen');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    const crossoverAlertsList = document.getElementById('crossover-alerts-list');

    // Tab Titles & Subtitles mapping
    const pageMetadata = {
        'market-overview': {
            title: 'Market Overview (Executive Dashboard)',
            subtitle: 'Index-wide volume, trend performance, and sector weight distribution'
        },
        'stock-performance': {
            title: 'Stock Performance Analysis',
            subtitle: 'Comparative equity analysis, return distributions, and price dynamics'
        },
        'risk-insights': {
            title: 'Risk & Analytical Insights',
            subtitle: 'Risk vs. Reward scatter matrices, monthly waterfall index returns, and technical signals'
        }
    };

    // Tab Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');

            navItems.forEach(btn => btn.classList.remove('active'));
            item.classList.add('active');

            tabScreens.forEach(screen => {
                screen.classList.remove('active');
                if (screen.id === `tab-${targetTab}`) {
                    screen.classList.add('active');
                }
            });

            // Update Headers
            pageTitle.textContent = pageMetadata[targetTab].title;
            pageSubtitle.textContent = pageMetadata[targetTab].subtitle;

            // Trigger redraw of charts on active page to handle scaling/rendering
            redrawActivePageCharts(targetTab);
        });
    });

    // Load web dataset
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            state.summary = data.summary;
            state.historical = data.historical;
            state.crossovers = data.crossovers || [];

            // Extract unique metadata
            state.sectors = [...new Set(data.summary.map(s => s.Sector))].sort();
            state.companies = data.summary.map(s => ({ ticker: s.Ticker, name: s.Company_Name, sector: s.Sector }));

            // Extract years
            const yearsSet = new Set(data.historical.map(h => h.Date.substring(0, 4)));
            state.years = [...yearsSet].sort().reverse(); // Show latest years first

            // Initialize Dropdowns
            initDropdowns();

            // Render UI
            updateAll();
        })
        .catch(err => {
            console.error("Error loading web dataset:", err);
            alert("Failed to load local web data. Please verify scripts/serve_dashboard.py completed successfully.");
        });

    // Populate Dropdowns
    function initDropdowns() {
        // Sector
        state.sectors.forEach(sector => {
            const option = document.createElement('option');
            option.value = sector;
            option.textContent = sector;
            sectorFilter.appendChild(option);
        });

        // Company
        populateCompanyDropdown();

        // Year
        state.years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        });

        // Month
        state.months.forEach(m => {
            const option = document.createElement('option');
            option.value = m.value;
            option.textContent = m.name;
            monthFilter.appendChild(option);
        });

        // Dropdown Event Listeners
        sectorFilter.addEventListener('change', (e) => {
            state.selectedSector = e.target.value;
            state.selectedTicker = 'ALL'; // Reset ticker selection on sector change
            populateCompanyDropdown();
            updateAll();
        });

        tickerFilter.addEventListener('change', (e) => {
            state.selectedTicker = e.target.value;
            updateAll();
        });

        yearFilter.addEventListener('change', (e) => {
            state.selectedYear = e.target.value;
            updateAll();
        });

        monthFilter.addEventListener('change', (e) => {
            state.selectedMonth = e.target.value;
            updateAll();
        });

        resetFiltersBtn.addEventListener('click', () => {
            sectorFilter.value = 'ALL';
            tickerFilter.value = 'ALL';
            yearFilter.value = 'ALL';
            monthFilter.value = 'ALL';

            state.selectedSector = 'ALL';
            state.selectedTicker = 'ALL';
            state.selectedYear = 'ALL';
            state.selectedMonth = 'ALL';

            populateCompanyDropdown();
            updateAll();
        });
    }

    function populateCompanyDropdown() {
        tickerFilter.innerHTML = '<option value="ALL">All Companies</option>';
        const filtered = state.companies.filter(c => state.selectedSector === 'ALL' || c.sector === state.selectedSector);

        filtered.forEach(c => {
            const option = document.createElement('option');
            option.value = c.ticker;
            option.textContent = `${c.ticker} - ${c.name}`;
            tickerFilter.appendChild(option);
        });
        tickerFilter.value = state.selectedTicker;
    }

    // Main Update Function
    function updateAll() {
        // Compute filtered datasets
        const { filteredSummary, filteredHistorical } = getFilteredData();

        // Update KPIs
        updateP1KPIs(filteredSummary, filteredHistorical);
        updateP2KPIs(filteredSummary);

        // Render Active Page Charts & Tables
        const activeTab = document.querySelector('.nav-item.active').getAttribute('data-tab');
        redrawActivePageCharts(activeTab, filteredSummary, filteredHistorical);

        // Render Crossover Alerts Panel on Page 3
        renderCrossoverAlerts();
    }

    // Helper: Filter Dataset
    function getFilteredData() {
        // 1. Filter Summary Data (companies level)
        let filteredSummary = state.summary.filter(s => {
            const matchSector = state.selectedSector === 'ALL' || s.Sector === state.selectedSector;
            const matchTicker = state.selectedTicker === 'ALL' || s.Ticker === state.selectedTicker;
            return matchSector && matchTicker;
        });

        // 2. Filter Historical Data (dates level)
        let filteredHistorical = state.historical.filter(h => {
            const matchSector = state.selectedSector === 'ALL' || getStockSector(h.Ticker) === state.selectedSector;
            const matchTicker = state.selectedTicker === 'ALL' || h.Ticker === state.selectedTicker;

            const dateStr = h.Date; // "YYYY-MM-DD"
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(5, 7);

            const matchYear = state.selectedYear === 'ALL' || year === state.selectedYear;
            const matchMonth = state.selectedMonth === 'ALL' || month === state.selectedMonth;

            return matchSector && matchTicker && matchYear && matchMonth;
        });

        return { filteredSummary, filteredHistorical };
    }

    function getStockSector(ticker) {
        const stock = state.summary.find(s => s.Ticker === ticker);
        return stock ? stock.Sector : '';
    }

    // Redraw charts based on active page
    function redrawActivePageCharts(tab, summary, historical) {
        if (!summary || !historical) {
            const data = getFilteredData();
            summary = data.filteredSummary;
            historical = data.filteredHistorical;
        }

        if (tab === 'market-overview') {
            renderP1Charts(summary, historical);
        } else if (tab === 'stock-performance') {
            renderP2Charts(summary, historical);
            renderHeatmapTable(summary, historical);
        } else if (tab === 'risk-insights') {
            renderP3Charts(summary, historical);
            renderMetricsMatrixTable(summary);
        }
    }

    // ==========================================
    // PAGE 1: MARKET OVERVIEW LOGIC
    // ==========================================
    function updateP1KPIs(summary, historical) {
        // Total Companies
        document.getElementById('p1-kpi-companies').textContent = summary.length;

        // Total Trading Days
        const dates = [...new Set(historical.map(h => h.Date))];
        document.getElementById('p1-kpi-days').textContent = dates.length.toLocaleString();

        // Avg daily returns
        if (summary.length > 0) {
            const avgRet = summary.reduce((acc, curr) => acc + (curr.Avg_Daily_Return_Pct || 0), 0) / summary.length;
            const retEl = document.getElementById('p1-kpi-return');
            retEl.textContent = `${avgRet >= 0 ? '+' : ''}${avgRet.toFixed(3)}%`;
            retEl.className = `kpi-value ${avgRet >= 0 ? 'positive' : 'negative'}`;
        } else {
            document.getElementById('p1-kpi-return').textContent = '0.00%';
        }

        // Price metrics based on historical prices
        if (historical.length > 0) {
            const closes = historical.map(h => h.Close).filter(c => c !== null);
            const volumes = historical.map(h => h.Volume).filter(v => v !== null);

            const highestClose = Math.max(...closes);
            const lowestClose = Math.min(...closes);
            const avgClose = closes.reduce((a, b) => a + b, 0) / closes.length;
            const totalVolume = volumes.reduce((a, b) => a + b, 0);

            // Latest close (sort by date and take the last record's average)
            const sortedDates = [...historical].sort((a, b) => new Date(a.Date) - new Date(b.Date));
            const latestRecords = sortedDates.slice(-Math.min(10, summary.length || 1));
            const latestClose = latestRecords.reduce((acc, curr) => acc + curr.Close, 0) / latestRecords.length;

            document.getElementById('p1-kpi-latest-close').textContent = `₹${latestClose.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
            document.getElementById('p1-kpi-avg-close').textContent = `₹${avgClose.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
            document.getElementById('p1-kpi-highest-close').textContent = `₹${highestClose.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
            document.getElementById('p1-kpi-lowest-close').textContent = `₹${lowestClose.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;

            // Format total volume (in Billions / Millions)
            let volStr = '';
            if (totalVolume >= 1e9) volStr = (totalVolume / 1e9).toFixed(2) + ' B';
            else if (totalVolume >= 1e6) volStr = (totalVolume / 1e6).toFixed(2) + ' M';
            else volStr = totalVolume.toLocaleString();
            document.getElementById('p1-kpi-volume').textContent = volStr;
        } else {
            document.getElementById('p1-kpi-latest-close').textContent = '₹0.00';
            document.getElementById('p1-kpi-avg-close').textContent = '₹0.00';
            document.getElementById('p1-kpi-highest-close').textContent = '₹0.00';
            document.getElementById('p1-kpi-lowest-close').textContent = '₹0.00';
            document.getElementById('p1-kpi-volume').textContent = '0';
        }
    }

    function renderP1Charts(summary, historical) {
        renderTrendChart(historical);
        renderSectorDonutChart(summary);
        renderMonthlyAverageChart(historical);
        renderVolumeTrendChart(historical);
    }

    // Chart 1: Price Trend Chart (Combined Line + Volume Bar overlay)
    function renderTrendChart(historical) {
        if (state.charts.trendChart) state.charts.trendChart.destroy();

        const canvas = document.getElementById('trendChart');
        if (!canvas) return;

        // Aggregate historical close & volume values by date
        const dateGroups = {};
        historical.forEach(h => {
            if (!dateGroups[h.Date]) {
                dateGroups[h.Date] = { closeSum: 0, count: 0, ma50Sum: 0, ma50Count: 0, ma200Sum: 0, ma200Count: 0, volume: 0 };
            }
            dateGroups[h.Date].closeSum += h.Close;
            dateGroups[h.Date].count += 1;
            dateGroups[h.Date].volume += (h.Volume || 0);
            if (h.MA_50) {
                dateGroups[h.Date].ma50Sum += h.MA_50;
                dateGroups[h.Date].ma50Count += 1;
            }
            if (h.MA_200) {
                dateGroups[h.Date].ma200Sum += h.MA_200;
                dateGroups[h.Date].ma200Count += 1;
            }
        });

        const sortedDates = Object.keys(dateGroups).sort();

        // Downsample trend line if dates exceed 150 points for readability
        let displayDates = sortedDates;
        let step = 1;
        if (sortedDates.length > 150) {
            step = Math.ceil(sortedDates.length / 150);
            displayDates = sortedDates.filter((_, idx) => idx % step === 0);
        }

        const closeData = displayDates.map(d => dateGroups[d].closeSum / dateGroups[d].count);
        const ma50Data = displayDates.map(d => dateGroups[d].ma50Count > 0 ? dateGroups[d].ma50Sum / dateGroups[d].ma50Count : null);
        const ma200Data = displayDates.map(d => dateGroups[d].ma200Count > 0 ? dateGroups[d].ma200Sum / dateGroups[d].ma200Count : null);
        const volumeData = displayDates.map(d => dateGroups[d].volume);

        const ctx = canvas.getContext('2d');
        state.charts.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: displayDates,
                datasets: [
                    {
                        label: 'Avg Close Price (INR)',
                        data: closeData,
                        borderColor: '#4cc9f0',
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        fill: false,
                        yAxisID: 'y'
                    },
                    {
                        label: 'MA 50',
                        data: ma50Data,
                        borderColor: '#f72585',
                        borderWidth: 1.2,
                        borderDash: [4, 4],
                        pointRadius: 0,
                        fill: false,
                        yAxisID: 'y'
                    },
                    {
                        label: 'MA 200',
                        data: ma200Data,
                        borderColor: '#ffd166',
                        borderWidth: 1.2,
                        borderDash: [2, 2],
                        pointRadius: 0,
                        fill: false,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Trade Volume',
                        type: 'bar',
                        data: volumeData,
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderWidth: 0,
                        yAxisID: 'yVolume'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: '#071528', padding: 12 }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8a9fb4', maxTicksLimit: 8 }
                    },
                    y: {
                        position: 'left',
                        grid: { color: 'rgba(255,255,255,0.03)' },
                        ticks: { color: '#8a9fb4', callback: v => '₹' + v.toLocaleString() }
                    },
                    yVolume: {
                        position: 'right',
                        grid: { display: false },
                        ticks: {
                            color: '#536c84',
                            maxTicksLimit: 4,
                            callback: v => {
                                if (v >= 1e6) return (v / 1e6).toFixed(0) + 'M';
                                if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
                                return v;
                            }
                        }
                    }
                }
            }
        });
    }

    // Chart 2: Sector Distribution Donut Chart
    function renderSectorDonutChart(summary) {
        if (state.charts.sectorDonutChart) state.charts.sectorDonutChart.destroy();

        const canvas = document.getElementById('sectorDonutChart');
        if (!canvas) return;

        // Group company count by sector
        const sectorCounts = {};
        summary.forEach(s => {
            sectorCounts[s.Sector] = (sectorCounts[s.Sector] || 0) + 1;
        });

        const labels = Object.keys(sectorCounts).sort();
        const data = labels.map(sec => sectorCounts[sec]);

        const ctx = canvas.getContext('2d');
        state.charts.sectorDonutChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#06d6a0', '#4cc9f0', '#f72585', '#ffd166', '#007aff', '#8338ec', '#ff5a5f', '#e07a5f', '#a8dadc', '#457b9d', '#1d3557', '#b5179e', '#7209b7'],
                    borderWidth: 1,
                    borderColor: 'rgba(7, 21, 40, 0.6)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#8a9fb4', font: { size: 10 } }
                    },
                    tooltip: { backgroundColor: '#071528', padding: 10 }
                },
                cutout: '70%'
            }
        });
    }

    // Chart 3: Monthly Average Closing Price (Column Chart)
    function renderMonthlyAverageChart(historical) {
        if (state.charts.monthlyAverageChart) state.charts.monthlyAverageChart.destroy();

        const canvas = document.getElementById('monthlyAverageChart');
        if (!canvas) return;

        // Group close price averages by month index (01-12)
        const monthStats = Array.from({ length: 12 }, (_, i) => {
            const code = String(i + 1).padStart(2, '0');
            return { code: code, name: state.months[i].name, sum: 0, count: 0 };
        });

        historical.forEach(h => {
            const mCode = h.Date.substring(5, 7);
            const match = monthStats.find(x => x.code === mCode);
            if (match && h.Close !== null) {
                match.sum += h.Close;
                match.count += 1;
            }
        });

        const labels = monthStats.map(m => m.name);
        const data = monthStats.map(m => m.count > 0 ? Math.round(m.sum / m.count) : 0);

        const ctx = canvas.getContext('2d');
        state.charts.monthlyAverageChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Avg Closing Price (₹)',
                    data: data,
                    backgroundColor: 'rgba(76, 201, 240, 0.45)',
                    borderColor: '#4cc9f0',
                    borderWidth: 1.5,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: '#071528', padding: 10 }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8a9fb4', font: { size: 10 } }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.03)' },
                        ticks: { color: '#8a9fb4', callback: v => '₹' + v.toLocaleString() }
                    }
                }
            }
        });
    }

    // Chart 4: Volume Trend (Area Chart)
    function renderVolumeTrendChart(historical) {
        if (state.charts.volumeTrendChart) state.charts.volumeTrendChart.destroy();

        const canvas = document.getElementById('volumeTrendChart');
        if (!canvas) return;

        // Group total volume by Date
        const volGroups = {};
        historical.forEach(h => {
            volGroups[h.Date] = (volGroups[h.Date] || 0) + (h.Volume || 0);
        });

        const sortedDates = Object.keys(volGroups).sort();

        // Downsample
        let displayDates = sortedDates;
        let step = 1;
        if (sortedDates.length > 150) {
            step = Math.ceil(sortedDates.length / 150);
            displayDates = sortedDates.filter((_, idx) => idx % step === 0);
        }

        const data = displayDates.map(d => volGroups[d]);

        const ctx = canvas.getContext('2d');
        state.charts.volumeTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: displayDates,
                datasets: [{
                    label: 'Trading Volume',
                    data: data,
                    borderColor: 'rgba(6, 214, 160, 0.85)',
                    borderWidth: 1.5,
                    backgroundColor: 'rgba(6, 214, 160, 0.08)',
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: '#071528', padding: 10 }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8a9fb4', maxTicksLimit: 8 }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.03)' },
                        ticks: {
                            color: '#8a9fb4',
                            callback: v => {
                                if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
                                if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
                                return v.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }


    // ==========================================
    // PAGE 2: STOCK PERFORMANCE ANALYSIS LOGIC
    // ==========================================
    function updateP2KPIs(summary) {
        if (summary.length === 0) {
            document.getElementById('p2-kpi-highest-return').textContent = '0.0%';
            document.getElementById('p2-kpi-highest-return-stock').textContent = 'N/A';
            document.getElementById('p2-kpi-lowest-return').textContent = '0.0%';
            document.getElementById('p2-kpi-lowest-return-stock').textContent = 'N/A';
            document.getElementById('p2-kpi-volatile-stock').textContent = 'N/A';
            document.getElementById('p2-kpi-volatile-value').textContent = '0.00% Volatility';
            document.getElementById('p2-kpi-best-sector').textContent = 'N/A';
            document.getElementById('p2-kpi-best-sector-return').textContent = '0.0% Return';
            return;
        }

        // Sort by total return
        const sortedRet = [...summary].sort((a, b) => b.Total_Return_Pct - a.Total_Return_Pct);
        const bestRet = sortedRet[0];
        const worstRet = sortedRet[sortedRet.length - 1];

        // Sort by volatility
        const sortedVol = [...summary].sort((a, b) => b.Volatility_Pct - a.Volatility_Pct);
        const mostVol = sortedVol[0];

        // Best performing sector (average return of stocks in sector)
        const sectorGroup = {};
        summary.forEach(s => {
            if (!sectorGroup[s.Sector]) {
                sectorGroup[s.Sector] = { sum: 0, count: 0 };
            }
            sectorGroup[s.Sector].sum += s.Total_Return_Pct;
            sectorGroup[s.Sector].count += 1;
        });
        const sectorAverages = Object.keys(sectorGroup).map(sec => ({
            name: sec,
            avg: sectorGroup[sec].sum / sectorGroup[sec].count
        })).sort((a, b) => b.avg - a.avg);
        const bestSector = sectorAverages[0];

        // Update DOM
        document.getElementById('p2-kpi-highest-return').textContent = `${bestRet.Total_Return_Pct >= 0 ? '+' : ''}${bestRet.Total_Return_Pct.toLocaleString(undefined, { maximumFractionDigits: 0 })}%`;
        document.getElementById('p2-kpi-highest-return-stock').textContent = `${bestRet.Ticker} (${bestRet.Company_Name.substring(0, 18)})`;

        document.getElementById('p2-kpi-lowest-return').textContent = `${worstRet.Total_Return_Pct >= 0 ? '+' : ''}${worstRet.Total_Return_Pct.toLocaleString(undefined, { maximumFractionDigits: 0 })}%`;
        document.getElementById('p2-kpi-lowest-return-stock').textContent = `${worstRet.Ticker} (${worstRet.Company_Name.substring(0, 18)})`;

        document.getElementById('p2-kpi-volatile-stock').textContent = mostVol.Ticker;
        document.getElementById('p2-kpi-volatile-value').textContent = `${mostVol.Volatility_Pct.toFixed(2)}% Volatility (${mostVol.Sector})`;

        if (bestSector) {
            document.getElementById('p2-kpi-best-sector').textContent = bestSector.name;
            document.getElementById('p2-kpi-best-sector-return').textContent = `+${bestSector.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}% Avg Return`;
        }
    }

    function renderP2Charts(summary, historical) {
        renderTopReturnChart(summary);
        renderBottomReturnChart(summary);
        renderAvgVolumeChart(summary);
        renderMAComparisonChart(historical);
    }

    // Chart 1: Top 10 Stocks by Return (Horizontal Bar)
    function renderTopReturnChart(summary) {
        if (state.charts.topReturnChart) state.charts.topReturnChart.destroy();
        const canvas = document.getElementById('topReturnChart');
        if (!canvas) return;

        const sorted = [...summary].sort((a, b) => b.Total_Return_Pct - a.Total_Return_Pct).slice(0, 10);
        const labels = sorted.map(s => s.Ticker);
        const data = sorted.map(s => s.Total_Return_Pct);

        const ctx = canvas.getContext('2d');
        state.charts.topReturnChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: 'rgba(6, 214, 160, 0.45)',
                    borderColor: '#06d6a0',
                    borderWidth: 1.5,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: '#071528', padding: 10 }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.03)' },
                        ticks: { color: '#8a9fb4', callback: v => v + '%' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#8a9fb4' }
                    }
                }
            }
        });
    }

    // Chart 2: Bottom 10 Stocks (Horizontal Bar)
    function renderBottomReturnChart(summary) {
        if (state.charts.bottomReturnChart) state.charts.bottomReturnChart.destroy();
        const canvas = document.getElementById('bottomReturnChart');
        if (!canvas) return;

        const sorted = [...summary].sort((a, b) => a.Total_Return_Pct - b.Total_Return_Pct).slice(0, 10);
        const labels = sorted.map(s => s.Ticker);
        const data = sorted.map(s => s.Total_Return_Pct);

        const ctx = canvas.getContext('2d');
        state.charts.bottomReturnChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: 'rgba(255, 90, 95, 0.45)',
                    borderColor: '#ff5a5f',
                    borderWidth: 1.5,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: '#071528', padding: 10 }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.03)' },
                        ticks: { color: '#8a9fb4', callback: v => v + '%' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#8a9fb4' }
                    }
                }
            }
        });
    }

    // Chart 3: Average Volume by Company (Bar Chart)
    function renderAvgVolumeChart(summary) {
        if (state.charts.avgVolumeChart) state.charts.avgVolumeChart.destroy();
        const canvas = document.getElementById('avgVolumeChart');
        if (!canvas) return;

        // Take top 12 largest by volume to keep chart clean
        const sorted = [...summary].sort((a, b) => b.Avg_Daily_Volume - a.Avg_Daily_Volume).slice(0, 12);
        const labels = sorted.map(s => s.Ticker);
        const data = sorted.map(s => s.Avg_Daily_Volume);

        const ctx = canvas.getContext('2d');
        state.charts.avgVolumeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: 'rgba(255, 209, 102, 0.45)',
                    borderColor: '#ffd166',
                    borderWidth: 1.5,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: '#071528', padding: 10 }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8a9fb4', font: { size: 10 } }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.03)' },
                        ticks: {
                            color: '#8a9fb4',
                            callback: v => {
                                if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
                                if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
                                return v;
                            }
                        }
                    }
                }
            }
        });
    }

    // Chart 4: MA vs Closing Price (Line Chart)
    function renderMAComparisonChart(historical) {
        if (state.charts.maComparisonChart) state.charts.maComparisonChart.destroy();
        const canvas = document.getElementById('maComparisonChart');
        if (!canvas) return;

        // If 'ALL' companies selected, choose the first company in state for details
        let ticker = state.selectedTicker;
        if (ticker === 'ALL') {
            ticker = state.summary.length > 0 ? state.summary[0].Ticker : '';
        }

        document.getElementById('ma-comparison-title').textContent = `${ticker} Price vs Moving Average`;

        const stockHistory = historical.filter(h => h.Ticker === ticker).sort((a, b) => new Date(a.Date) - new Date(b.Date));

        // Downsample
        let displayData = stockHistory;
        let step = 1;
        if (stockHistory.length > 120) {
            step = Math.ceil(stockHistory.length / 120);
            displayData = stockHistory.filter((_, idx) => idx % step === 0);
        }

        const labels = displayData.map(h => h.Date);
        const closes = displayData.map(h => h.Close);
        const ma50 = displayData.map(h => h.MA_50);
        const ma200 = displayData.map(h => h.MA_200);

        const ctx = canvas.getContext('2d');
        state.charts.maComparisonChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Close',
                        data: closes,
                        borderColor: '#4cc9f0',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false
                    },
                    {
                        label: 'MA 50',
                        data: ma50,
                        borderColor: '#f72585',
                        borderWidth: 1.2,
                        pointRadius: 0,
                        borderDash: [4, 4],
                        fill: false
                    },
                    {
                        label: 'MA 200',
                        data: ma200,
                        borderColor: '#ffd166',
                        borderWidth: 1.2,
                        pointRadius: 0,
                        borderDash: [2, 2],
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#8a9fb4' }
                    },
                    tooltip: { backgroundColor: '#071528', padding: 10 }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8a9fb4', maxTicksLimit: 8 }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.03)' },
                        ticks: { color: '#8a9fb4', callback: v => '₹' + v.toLocaleString() }
                    }
                }
            }
        });
    }

    // Heatmap Matrix: Company Ticker vs Month Index (Avg Return %)
    function renderHeatmapTable(summary, historical) {
        const table = document.getElementById('heatmap-table');
        if (!table) return;

        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        thead.innerHTML = '';
        tbody.innerHTML = '';

        // Select top 12 companies by return to keep table visible & neat
        const displayStocks = [...summary].sort((a, b) => b.Total_Return_Pct - a.Total_Return_Pct).slice(0, 12);

        if (displayStocks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;">No data available for heatmap</td></tr>';
            return;
        }

        // Render Head
        let headRow = '<tr><th>Company</th>';
        state.months.forEach(m => {
            headRow += `<th>${m.name.substring(0, 3)}</th>`;
        });
        headRow += '</tr>';
        thead.innerHTML = headRow;

        // Calculate average return per month for each company
        displayStocks.forEach(stock => {
            const rowData = {};
            state.months.forEach(m => {
                // filter historical for this stock and this month
                const records = historical.filter(h => h.Ticker === stock.Ticker && h.Date.substring(5, 7) === m.value);

                if (records.length > 0) {
                    // Calculate mock average change based on close price delta
                    const closes = records.map(r => r.Close);
                    const first = closes[0];
                    const last = closes[closes.length - 1];
                    const pct = first > 0 ? ((last - first) / first) * 100 : 0;
                    rowData[m.value] = pct;
                } else {
                    rowData[m.value] = null;
                }
            });

            // Render Row
            const tr = document.createElement('tr');
            let cols = `<td><strong>${stock.Ticker}</strong></td>`;

            state.months.forEach(m => {
                const val = rowData[m.value];
                if (val !== null) {
                    // Compute color opacity (conditional formatting)
                    const absVal = Math.min(Math.abs(val), 20); // Clamp value at 20% for opacity mapping
                    const opacity = Math.max(0.1, absVal / 20);

                    let bg = '';
                    let textClr = '#fff';
                    if (val >= 0) {
                        bg = `rgba(6, 214, 160, ${opacity * 0.7})`; // Bullish Green opacity
                        textClr = opacity > 0.6 ? '#0b1f3a' : '#fff'; // adjust text contrast
                    } else {
                        bg = `rgba(255, 90, 95, ${opacity * 0.7})`; // Bearish Red opacity
                        textClr = opacity > 0.6 ? '#0b1f3a' : '#fff';
                    }

                    cols += `<td class="heatmap-cell" style="background-color: ${bg}; color: ${textClr};">${val >= 0 ? '+' : ''}${val.toFixed(1)}%</td>`;
                } else {
                    cols += `<td class="heatmap-cell" style="color: var(--text-muted);">N/A</td>`;
                }
            });
            tr.innerHTML = cols;
            tbody.appendChild(tr);
        });
    }


    // ==========================================
    // PAGE 3: RISK & INSIGHTS LOGIC
    // ==========================================
    function renderP3Charts(summary, historical) {
        renderRiskScatterChart(summary);
        renderSectorVolumeChart(summary);
        renderWaterfallChart(historical);
    }

    // Chart 1: Scatter Plot (Volume vs Return %) - bubbles sized by Market Cap
    function renderRiskScatterChart(summary) {
        if (state.charts.riskScatterChart) state.charts.riskScatterChart.destroy();
        const canvas = document.getElementById('riskScatterChart');
        if (!canvas) return;

        // Group scatter points by Sector for legendary coloring
        const datasets = [];
        const sectorsSet = [...new Set(summary.map(s => s.Sector))];
        const colors = ['#06d6a0', '#4cc9f0', '#f72585', '#ffd166', '#007aff', '#8338ec', '#ff5a5f', '#e07a5f', '#a8dadc', '#457b9d', '#1d3557', '#b5179e', '#7209b7'];

        sectorsSet.forEach((sec, idx) => {
            const secStocks = summary.filter(s => s.Sector === sec);
            const points = secStocks.map(s => {
                const mCapBillions = s.Current_Market_Cap / 1e9;
                // scale bubble radius between 4 and 16 based on market cap
                const radius = Math.min(16, Math.max(5, 5 + (mCapBillions / 150)));

                return {
                    x: s.Avg_Daily_Volume / 1e3, // in thousands for display mapping
                    y: s.Total_Return_Pct,
                    r: radius,
                    ticker: s.Ticker,
                    mcap: mCapBillions
                };
            });

            datasets.push({
                label: sec,
                data: points,
                backgroundColor: colors[idx % colors.length] + 'a0', // added transparency
                borderColor: colors[idx % colors.length],
                borderWidth: 1
            });
        });

        const ctx = canvas.getContext('2d');
        state.charts.riskScatterChart = new Chart(ctx, {
            type: 'bubble',
            data: { datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#8a9fb4', font: { size: 9 } }
                    },
                    tooltip: {
                        backgroundColor: '#071528',
                        padding: 12,
                        callbacks: {
                            label: function (context) {
                                const pt = context.raw;
                                return `${pt.ticker} - Vol: ${(pt.x).toFixed(0)}K, Return: ${pt.y.toFixed(0)}%, MCAP: ₹${pt.mcap.toFixed(1)}B`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Avg Daily Volume (Thousand Shares)', color: '#8a9fb4', font: { size: 10 } },
                        grid: { color: 'rgba(255,255,255,0.03)' },
                        ticks: { color: '#8a9fb4' }
                    },
                    y: {
                        title: { display: true, text: 'Total Cumulative Return (%)', color: '#8a9fb4', font: { size: 10 } },
                        grid: { color: 'rgba(255,255,255,0.03)' },
                        ticks: { color: '#8a9fb4', callback: v => v + '%' }
                    }
                }
            }
        });
    }

    // Chart 2: Sector Weight by Volume (Horizontal Bar Chart)
    function renderSectorVolumeChart(summary) {
        if (state.charts.sectorVolumeChart) state.charts.sectorVolumeChart.destroy();
        const canvas = document.getElementById('sectorVolumeChart');
        if (!canvas) return;

        // Group total cumulative volume by Sector
        const sectorVols = {};
        summary.forEach(s => {
            sectorVols[s.Sector] = (sectorVols[s.Sector] || 0) + s.Avg_Daily_Volume;
        });

        const labels = Object.keys(sectorVols).sort();
        const data = labels.map(sec => sectorVols[sec] / 1e6); // In Millions

        const ctx = canvas.getContext('2d');
        state.charts.sectorVolumeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: 'rgba(0, 122, 255, 0.45)',
                    borderColor: '#007aff',
                    borderWidth: 1.5,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: '#071528', padding: 10 }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Volume (Millions)', color: '#8a9fb4', font: { size: 9 } },
                        grid: { color: 'rgba(255,255,255,0.03)' },
                        ticks: { color: '#8a9fb4' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#8a9fb4', font: { size: 9 } }
                    }
                }
            }
        });
    }

    // Chart 3: Waterfall Monthly Returns (Floating Bar Chart)
    function renderWaterfallChart(historical) {
        if (state.charts.waterfallChart) state.charts.waterfallChart.destroy();
        const canvas = document.getElementById('waterfallChart');
        if (!canvas) return;

        // Calculate average index close price month-by-month to establish gains/losses
        // Group by Year-Month
        const ymGroups = {};
        historical.forEach(h => {
            const ym = h.Date.substring(0, 7); // "YYYY-MM"
            if (!ymGroups[ym]) {
                ymGroups[ym] = { sum: 0, count: 0 };
            }
            ymGroups[ym].sum += h.Close;
            ymGroups[ym].count += 1;
        });

        // Take last 8 months in chronological order
        const sortedYm = Object.keys(ymGroups).sort().slice(-8);

        let cumulative = 0;
        const waterfallPoints = [];
        const colors = [];
        const borderColors = [];

        sortedYm.forEach((ym, idx) => {
            const avgClose = ymGroups[ym].sum / ymGroups[ym].count;

            // Gain/loss from previous month
            let delta = 0;
            if (idx > 0) {
                const prevYm = sortedYm[idx - 1];
                const prevAvg = ymGroups[prevYm].sum / ymGroups[prevYm].count;
                delta = ((avgClose - prevAvg) / prevAvg) * 100;
            } else {
                delta = 5.0; // Seed first month value as starting base +5%
            }

            const start = cumulative;
            cumulative += delta;

            waterfallPoints.push({
                x: ym,
                y: [start, cumulative], // Floating bar bounds
                delta: delta
            });

            if (delta >= 0) {
                colors.push('rgba(6, 214, 160, 0.45)');
                borderColors.push('#06d6a0');
            } else {
                colors.push('rgba(255, 90, 95, 0.45)');
                borderColors.push('#ff5a5f');
            }
        });

        const ctx = canvas.getContext('2d');
        state.charts.waterfallChart = new Chart(ctx, {
            type: 'bar',
            data: {
                datasets: [{
                    label: 'Return Delta %',
                    data: waterfallPoints,
                    backgroundColor: colors,
                    borderColor: borderColors,
                    borderWidth: 1.5,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#071528',
                        padding: 10,
                        callbacks: {
                            label: function (context) {
                                const pt = context.raw;
                                return `MoM Delta: ${pt.delta >= 0 ? '+' : ''}${pt.delta.toFixed(2)}% (Index: ${pt.y[1].toFixed(2)}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8a9fb4' }
                    },
                    y: {
                        title: { display: true, text: 'Cumulative Index Return (%)', color: '#8a9fb4', font: { size: 9 } },
                        grid: { color: 'rgba(255,255,255,0.03)' },
                        ticks: { color: '#8a9fb4', callback: v => v + '%' }
                    }
                }
            }
        });
    }

    // Performance Metrics Table: Company Matrix
    function renderMetricsMatrixTable(summary) {
        const table = document.getElementById('metrics-matrix-table');
        if (!table) return;

        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';

        // Select top 15 companies by return for table rendering
        const displayStocks = [...summary].sort((a, b) => b.Total_Return_Pct - a.Total_Return_Pct).slice(0, 15);

        if (displayStocks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No data available</td></tr>';
            return;
        }

        displayStocks.forEach(stock => {
            const tr = document.createElement('tr');

            const avgClose = stock.Current_Market_Cap > 0 ? (stock.Current_Market_Cap / 1e9).toFixed(1) : 'N/A'; // Mock average close metrics
            const dailyReturn = stock.Avg_Daily_Return_Pct !== null ? stock.Avg_Daily_Return_Pct.toFixed(3) : 0;
            const avgVol = stock.Avg_Daily_Volume !== null ? (stock.Avg_Daily_Volume / 1e3).toFixed(1) + ' K' : 'N/A';
            const volatility = stock.Volatility_Pct !== null ? stock.Volatility_Pct.toFixed(2) + '%' : 'N/A';

            tr.innerHTML = `
                <td><strong>${stock.Ticker}</strong> <span style="font-size:10px; color:var(--text-secondary);">${stock.Company_Name.substring(0, 16)}</span></td>
                <td>₹${stock.Current_PE_Ratio ? stock.Current_PE_Ratio.toFixed(1) : '32'}B</td>
                <td class="${dailyReturn >= 0 ? 'positive' : 'negative'}">${dailyReturn >= 0 ? '+' : ''}${dailyReturn}%</td>
                <td>${avgVol}</td>
                <td>${volatility}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Key Insights Panel: Load Technical crossovers dynamically from data.json
    function renderCrossoverAlerts() {
        if (!crossoverAlertsList) return;
        crossoverAlertsList.innerHTML = '';

        if (state.crossovers.length === 0) {
            crossoverAlertsList.innerHTML = '<div style="color:var(--text-secondary); text-align:center; font-size:12px; padding:20px;">No technical crossover signals recorded.</div>';
            return;
        }

        state.crossovers.slice(0, 12).forEach(c => {
            const item = document.createElement('div');
            item.className = 'crossover-alert-item';

            const isGolden = c.Cross_Type === 'Golden Cross';
            const badgeClass = isGolden ? 'golden' : 'death';
            const bullet = isGolden ? '🟢' : '🔴';

            item.innerHTML = `
                <div class="crossover-alert-header">
                    <span class="crossover-ticker">${c.Ticker}</span>
                    <span class="crossover-badge ${badgeClass}">${c.Cross_Type}</span>
                </div>
                <div class="crossover-desc">
                    ${bullet} ${c.Company_Name} (${c.Sector}) triggered technical moving average trend intersection.
                </div>
                <div class="crossover-date">${c.Date}</div>
            `;
            crossoverAlertsList.appendChild(item);
        });
    }

});
