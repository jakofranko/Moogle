'us strict'

/* global cursor */

function Moogle () {
  this.el = document.createElement('canvas')
  this.context = this.el.getContext('2d')
  this.ratio = window.devicePixelRatio
  this.cache = null

  this.install = function (host) {
    host.appendChild(this.el)
    window.addEventListener('mousedown', this.onMouseDown, false)
    window.addEventListener('mousemove', this.onMouseMove, false)
    window.addEventListener('mouseup', this.onMouseUp, false)
    window.addEventListener('keydown', this.onKeyDown, false)
    window.addEventListener('keyup', this.onKeyUp, false)
    window.addEventListener('contextmenu', this.onMouseUp, false)
    window.addEventListener('dragover', this.onDrag, false)
    window.addEventListener('drop', this.onDrop, false)
    window.addEventListener('paste', this.onPaste, false)
    this.context.strokeStyle = 'black'
    this.fit()
  }

  this.start = function () {
    this.fit()
    this.fill()
    this.update()
  }

  this.fit = function (size = { w: window.innerWidth, h: window.innerHeight }) {
    this.el.width = size.w
    this.el.height = size.h
    this.el.style.width = size.w + 'px'
    this.el.style.height = size.h + 'px'
  }

  this.fill = (color = 'white') => {
    this.context.save()
    this.context.fillStyle = color
    this.context.fillRect(0, 0, window.innerWidth, window.innerHeight)
    this.context.restore()
  }

  this.fix = () => {
    if (cursor.b.y < cursor.a.y) {
      const o = cursor.a.y
      cursor.a.y = cursor.b.y
      cursor.b.y = o
    }
    if (cursor.b.x < cursor.a.x) {
      const o = cursor.a.x
      cursor.a.x = cursor.b.x
      cursor.b.x = o
    }
    if (cursor.b.x - cursor.a.x < 5) {
      cursor.a.x = 0
    }
    if (cursor.b.y - cursor.a.y < 5) {
      cursor.a.y = 0
    }
  }

  this.update = (selection = true) => {
    this.fill()
    if (this.cache) {
      this.context.drawImage(this.cache, 0, 0)
    }
    if (selection === true) {
      this.guide()
    }
    document.title = `moogle(${cursor.b.x - cursor.a.x}x${cursor.b.y - cursor.a.y})`
  }

  this.draw = (file) => {
    const img = new Image()
    img.onload = () => {
      this.context.drawImage(img, 0, 0)
      this.cache = img
      cursor.a = { x: 0, y: 0 }
      cursor.b = { x: img.width, y: img.height }
      this.update()
    }
    img.src = URL.createObjectURL(file)
  }

  this.guide = () => {
    const center = parseInt(cursor.a.x + ((cursor.b.x - cursor.a.x) / 2))
    const middle = parseInt(cursor.a.y + ((cursor.b.y - cursor.a.y) / 2))
    this.context.save()
    this.context.beginPath()
    this.context.setLineDash([1, 1])
    this.context.moveTo(cursor.a.x - 0.5, 0)
    this.context.lineTo(cursor.a.x - 0.5, window.innerHeight)
    this.context.moveTo(cursor.b.x - 0.5, 0)
    this.context.lineTo(cursor.b.x - 0.5, window.innerHeight)
    this.context.moveTo(0, cursor.a.y - 0.5)
    this.context.lineTo(window.innerWidth, cursor.a.y - 0.5)
    this.context.moveTo(0, cursor.b.y - 0.5)
    this.context.lineTo(window.innerWidth, cursor.b.y - 0.5)
    this.context.moveTo(center - 0.5, middle - 5)
    this.context.lineTo(center - 0.5, middle + 5)
    this.context.moveTo(center - 5, middle - 0.5)
    this.context.lineTo(center + 5, middle - 0.5)
    this.context.stroke()
    this.context.restore()
  }

  this.crop = (w, h) => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const context = canvas.getContext('2d')
    context.drawImage(this.el, cursor.a.x, cursor.a.y, w, h, 0, 0, w, h)
    this.update()
    return canvas
  }

  this.select = (x, y, w, h) => {
    cursor.a.x = x
    cursor.a.y = y
    cursor.b.x = x + w
    cursor.b.y = y + h
    this.update()
  }

  // Events

  this.onMouseDown = (e) => {
    cursor.z = 1
    cursor.a.x = e.clientX
    cursor.a.y = e.clientY
    this.update()
    e.preventDefault()
  }

  this.onMouseMove = (e) => {
    if (cursor.z !== 1) { return }
    cursor.b.x = e.clientX
    cursor.b.y = e.clientY
    this.update()
    e.preventDefault()
  }

  this.onMouseUp = (e) => {
    cursor.z = 0
    cursor.b.x = e.clientX
    cursor.b.y = e.clientY
    this.fix()
    this.update()
    e.preventDefault()
  }

  this.onKeyDown = (e) => {

  }

  this.onKeyUp = (e) => {
    if (e.key === 's') {
      this.update(false)
      const crop = this.crop(cursor.b.x - cursor.a.x, cursor.b.y - cursor.a.y)
      grab(crop.toDataURL('image/png'), 'export.png')
    }
    if (e.key === 'e') {
      this.update(false)
      const crop = this.crop(cursor.b.x - cursor.a.x, cursor.b.y - cursor.a.y)
      grab(crop.toDataURL('image/jpeg'), 'export.jpg')
    }
  }

  this.onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    const filename = file.path ? file.path : file.name ? file.name : ''
    this.draw(file)
  }

  this.onDrag = (e) => {
    e.stopPropagation()
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  this.onPaste = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    for (const item of e.clipboardData.items) {
      if (item.type.indexOf('image') < 0) { continue }
      const file = item.getAsFile()
      this.draw(file)
    }
  }

  function grab (base64, name = 'export.png') {
    const link = document.createElement('a')
    link.setAttribute('href', base64)
    link.setAttribute('download', name)
    link.dispatchEvent(new MouseEvent(`click`, { bubbles: true, cancelable: true, view: window }))
  }
}
