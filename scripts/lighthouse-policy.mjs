export const limits = Object.freeze({ performance: 0.95, accessibility: 1, 'best-practices': 1, seo: 1, LCP: 2500, CLS: 0.05, TBT: 150 });
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

export function assessReports(reports) {
    if (reports.length !== 3) throw new Error('Exactly three Lighthouse reports are required.');
    const rows = reports.map(report => ({
        ...Object.fromEntries(['performance', 'accessibility', 'best-practices', 'seo'].map(name => [name, report.categories?.[name]?.score])),
        LCP: report.audits?.['largest-contentful-paint']?.numericValue,
        CLS: report.audits?.['cumulative-layout-shift']?.numericValue,
        TBT: report.audits?.['total-blocking-time']?.numericValue
    }));
    if (rows.some(row => Object.values(row).some(value => typeof value !== 'number' || !Number.isFinite(value)))) {
        throw new Error('Lighthouse returned missing or invalid metrics.');
    }
    const medians = Object.fromEntries(Object.keys(limits).map(key => [key, median(rows.map(row => row[key]))]));
    const failures = Object.entries(limits).filter(([key, limit]) => ['LCP', 'CLS', 'TBT'].includes(key)
        ? medians[key] > limit
        : (key === 'performance' ? medians[key] : Math.min(...rows.map(row => row[key]))) < limit);
    return { rows, medians, limits, passed: !failures.length, failures: failures.map(([metric]) => metric) };
}
