/**
  * DannTeam
  * Instagram: @dannalwaysalone
  * Note: Jangan hapus watermark ! ketahuan? kena blacklist !
*/

const { Source, RunnerScraper, Hoster } = require("source-scraper-core");
const { PuppeteerRunner } = require("source-scraper-puppeteer-runner");
const cheerio = require("cheerio");
const u = require("url");

class NinexbuddySource extends Source {
    constructor(source) {
        super(source);
        this.quality = source.quality;
    }
}

function parseSourceQuality(raw) {
    const ar1 = /^([a-zA-Z\d]+)\s*-\s*(\d+)([a-zA-Z]+)?$/i.exec(raw);
    if (ar1 !== null && ar1.length >= 4)
        return {
            raw,
            description: ar1[1],
            value: Number(ar1[2]),
            unit: ar1[3]
        };
    const ar2 = /^(\d+)([a-zA-Z]+)\s*\(?([a-zA-Z\s]+)\)?$/i.exec(raw);
    if (ar2 !== null && ar2.length >= 3)
        return {
            raw,
            description: ar2[3],
            value: Number(ar2[1]),
            unit: ar2[2]
        };
}

function parseHosterName(raw) {
    const ar = /^(?:embed\s*-)?\s*([a-zA-Z\d.]+)$/i.exec(raw.trim());
    if (ar === null || ar.length < 2)
        return;
    return ar[ar.length - 1];
}

function isDefined(value) {
    return typeof value !== 'undefined';
}

class NinexbuddyScraper extends RunnerScraper {
    constructor() {
        super();
        this.name = 'ninexbuddy';
        this.domains = [];
        this.urlPattern = /.*/i;
        this.runner = new PuppeteerRunner();
        this.defaultOptions = {
            runnerOptions: {
                navigationOptions: {
                    waitUntil: 'networkidle0'
                }
            }
        };
    }

    transformUrl(url) {
        return `https://9xbuddy.com/process?url=${url}`;
    }

    async execWithArgs({ page, url: ninexbuddyUrl }) {
            const transformedUrl = this.transformUrl(ninexbuddyUrl);
            await page.goto(transformedUrl, { waitUntil: 'networkidle0' });
            const content = await page.content();
            const $ = cheerio.load(content);
        const isHoster = !!(await page.$('.playlist_el').catch(() => false));
        if (isHoster) {
            const items = await page.$$('.playlist_el .text-blue');
            const hosters = (await Promise.all(items.map(async (item) => {
                const urlPromise = item.getProperty('href').then(async (e) => e.jsonValue()).catch(() => undefined);
                const namePromise = item.getProperty('textContent').then(async (e) => e.jsonValue()).catch(() => undefined);
                const [url, name] = await Promise.all([urlPromise, namePromise]);
                const hosterUrl = u.parse(url, true).query.url;
                if (!hosterUrl)
                    return;
                const parsed = name ? parseHosterName(name) : undefined;
                if (!parsed)
                    return;
                return new Hoster({
                    url: hosterUrl,
                    name: parsed,
                });
            }))).filter(isDefined);
            return {
                ninexbuddyUrl,
                hosters
            };
        } else {
            const selector = '.tracking-wide.items-center.night-white';
            const items = await page.$$(selector);
            const sources = (await Promise.all(items.map(async (item) => {
                const formatPromise = item.$eval('.w-24.text-blue', e => e.textContent).catch(() => undefined);
                const qualityPromise = item.$eval('.w-1\\/2', e => e.textContent).catch(() => undefined);
                const urlPromise = item.$eval('.leading-normal.sm\\:leading-none', e => e.getAttribute('href')).catch(() => undefined);
                const [format, quality, url] = await Promise.all([formatPromise, qualityPromise, urlPromise]);
                if (!url)
                    return;
                return new NinexbuddySource({
                    url,
                    quality: quality ? parseSourceQuality(quality) : undefined,
                    type: format || undefined,
                    codec: undefined
                });
            }))).filter(isDefined);
            const poster = await page.$eval('img.shadow.border-2.border-grey-lighter.h-48', e => e.src).catch(() => undefined);
            return {
                ninexbuddyUrl,
                title: await page.title(),
                poster: poster && !poster.startsWith('data:image') ? poster : undefined,
                sources
            };
        }
    }
}

module.exports = {
    NinexbuddySource,
    NinexbuddyScraper
}