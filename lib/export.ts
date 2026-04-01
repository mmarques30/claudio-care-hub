import { toPng } from 'html-to-image'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export async function exportSlideAsPng(element: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(element, {
    width: element.offsetWidth,
    height: element.offsetHeight,
    pixelRatio: 1,
    cacheBust: true,
    style: {
      transform: 'none',
      transformOrigin: 'top left',
    },
  })

  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

export async function exportCarouselAsZip(
  elements: HTMLElement[],
  carouselName: string
): Promise<void> {
  const zip = new JSZip()

  for (let i = 0; i < elements.length; i++) {
    const dataUrl = await toPng(elements[i], {
      width: elements[i].offsetWidth,
      height: elements[i].offsetHeight,
      pixelRatio: 1,
      cacheBust: true,
      style: {
        transform: 'none',
        transformOrigin: 'top left',
      },
    })

    const data = dataUrl.split(',')[1]
    const filename = `slide-${String(i + 1).padStart(2, '0')}.png`
    zip.file(filename, data, { base64: true })
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const safeName = carouselName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase()
  saveAs(blob, `${safeName}.zip`)
}
