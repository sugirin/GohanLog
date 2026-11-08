// Android 用のアイコン／起動画面の元画像を assets/android/ に作るスクリプト。
// assets/splash.png（オレンジのグラデーション＋白いロゴ）から白いロゴだけを抜き出し、
// アダプティブアイコンの前景・背景と、正方形の起動画面を合成する。
//
//   node scripts/make-android-assets.mjs
//   npx @capacitor/assets generate --android --assetPath assets/android
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const SRC = 'assets/splash.png'
const OUT = 'assets/android'
mkdirSync(OUT, { recursive: true })

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height } = info
const px = (x, y) => {
    const i = (y * width + x) * 4
    return [data[i], data[i + 1], data[i + 2]]
}

// 背景のグラデーション色（上端・下端の中央）
const top = px(Math.floor(width / 2), 4)
const bottom = px(Math.floor(width / 2), height - 5)

// ロゴは白っぽい部分。青チャンネルがオレンジ背景より大きく高いところをロゴとみなす。
const isLogo = (r, g, b) => b > 200 && r > 230 && g > 220
let minX = width, minY = height, maxX = 0, maxY = 0
for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const [r, g, b] = px(x, y)
        if (isLogo(r, g, b)) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
        }
    }
}
const pad = 8
minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad)
maxX = Math.min(width - 1, maxX + pad); maxY = Math.min(height - 1, maxY + pad)
const logoW = maxX - minX + 1
const logoH = maxY - minY + 1

// ロゴ部分を透過 PNG にする（背景の青チャンネルとの差を不透明度にする）
const logo = Buffer.alloc(logoW * logoH * 4)
for (let y = 0; y < logoH; y++) {
    for (let x = 0; x < logoW; x++) {
        const [r, g, b] = px(minX + x, minY + y)
        const t = (y + minY) / height
        const bgB = top[2] + (bottom[2] - top[2]) * t
        const alpha = Math.max(0, Math.min(1, (b - bgB) / (250 - bgB)))
        const o = (y * logoW + x) * 4
        logo[o] = 255; logo[o + 1] = 250; logo[o + 2] = 235
        logo[o + 3] = Math.round(alpha * 255)
    }
}
const logoPng = await sharp(logo, { raw: { width: logoW, height: logoH, channels: 4 } }).png().toBuffer()

const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')
const gradientSvg = (size) => Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
       <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0" stop-color="${hex(top)}"/><stop offset="1" stop-color="${hex(bottom)}"/>
       </linearGradient></defs>
       <rect width="100%" height="100%" fill="url(#g)"/>
     </svg>`,
)

// ロゴを size の正方形の中央に、幅 ratio で置いた透過画像
const centeredLogo = async (size, ratio) => {
    const w = Math.round(size * ratio)
    const resized = await sharp(logoPng).resize({ width: w }).toBuffer()
    return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: resized, gravity: 'center' }])
        .png()
        .toBuffer()
}

// アダプティブアイコン：@capacitor/assets が前景を 16.7% 内側に縮めて（inset）配置するので、
// 前景画像そのものが表示領域（円などでマスクされる部分）になる。ロゴが円に収まるよう幅 70% にする
const fg = await centeredLogo(1024, 0.70)
await sharp(fg).toFile(`${OUT}/icon-foreground.png`)
await sharp(gradientSvg(1024)).png().toFile(`${OUT}/icon-background.png`)
// 旧形式のアイコン（Android 7 以前）：背景＋ロゴを重ねた正方形
await sharp(gradientSvg(1024)).composite([{ input: await centeredLogo(1024, 0.62) }]).png().toFile(`${OUT}/icon-only.png`)
// 起動画面（Android 11 以前で使われる）：2732 の正方形、ロゴは小さめ
await sharp(gradientSvg(2732)).composite([{ input: await centeredLogo(2732, 0.3) }]).png().toFile(`${OUT}/splash.png`)

console.log('logo bbox', { minX, minY, logoW, logoH }, 'colors', hex(top), hex(bottom))
