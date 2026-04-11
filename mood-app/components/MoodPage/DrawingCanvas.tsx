'use client'

import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import styles from './DrawingCanvas.module.css'

const COLORS = [
  '#000000', '#ffffff', '#9ca3af', '#d1d5db',
  '#e53e3e', '#9b1c1c', '#f6820d', '#fbbf24',
  '#84cc16', '#15803d', '#38bdf8', '#1e3a8a',
  '#a855f7', '#ec4899', '#92400e', '#fef3c7',
]

const SIZES = [3, 7, 40]

export interface DrawingCanvasHandle {
  toDataURL: () => string
  loadImage: (dataUrl: string) => void
  clear: () => void
}

interface Props {
  brushSize: number
  brushShape: 'round' | 'square'
  color: string
  onBrushSizeChange: (size: number) => void
  onBrushShapeChange: (shape: 'round' | 'square') => void
  onColorChange: (color: string) => void
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas(
  { brushSize, brushShape, color, onBrushSizeChange, onBrushShapeChange, onColorChange },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const undoStack = useRef<ImageData[]>([])
  const [undoCount, setUndoCount] = useState(0)

  function getCtx() {
    return canvasRef.current!.getContext('2d')!
  }

  // Fill canvas white on mount
  useEffect(() => {
    const ctx = getCtx()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 500, 500)
  }, [])

  // Undo via Ctrl+Z
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (undoStack.current.length > 0) {
          const snapshot = undoStack.current.pop()!
          getCtx().putImageData(snapshot, 0, 0)
          setUndoCount(undoStack.current.length)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function pushUndo() {
    undoStack.current.push(getCtx().getImageData(0, 0, 500, 500))
    setUndoCount(undoStack.current.length)
  }

  function getPos(e: React.MouseEvent | React.TouchEvent): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scaleX = 500 / rect.width
    const scaleY = 500 / rect.height
    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function applyBrush(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = color
    const half = brushSize / 2
    if (brushShape === 'round') {
      ctx.beginPath()
      ctx.arc(x, y, half, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillRect(x - half, y - half, brushSize, brushSize)
    }
  }

  // Stamp the brush at every pixel along the segment from `from` to `to`
  // so fast mouse movement never produces gaps.
  function drawSegment(
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number }
  ) {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const steps = Math.max(1, Math.ceil(dist))
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      applyBrush(ctx, from.x + dx * t, from.y + dy * t)
    }
  }

  function handlePointerDown(e: React.MouseEvent) {
    isDrawing.current = true
    pushUndo()
    const pos = getPos(e)
    lastPos.current = pos
    applyBrush(getCtx(), pos.x, pos.y)
  }

  function handlePointerMove(e: React.MouseEvent) {
    if (!isDrawing.current || !lastPos.current) return
    const pos = getPos(e)
    drawSegment(getCtx(), lastPos.current, pos)
    lastPos.current = pos
  }

  function handlePointerUp() {
    isDrawing.current = false
    lastPos.current = null
  }

  function handleClear() {
    pushUndo()
    const ctx = getCtx()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 500, 500)
  }

  const loadImage = useCallback((dataUrl: string) => {
    const img = new Image()
    img.onload = () => {
      // Center-crop to 500×500
      const sw = img.naturalWidth
      const sh = img.naturalHeight
      const size = Math.min(sw, sh)
      const sx = (sw - size) / 2
      const sy = (sh - size) / 2
      const ctx = getCtx()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 500, 500)
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 500, 500)
      undoStack.current = []
      setUndoCount(0)
    }
    img.src = dataUrl
  }, [])

  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      loadImage(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  useImperativeHandle(ref, () => ({
    toDataURL: () => canvasRef.current!.toDataURL('image/jpeg', 0.85),
    loadImage,
    clear: handleClear,
  }))

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        {/* Undo */}
        <div className={styles.toolGroup}>
          <button
            type="button"
            className={styles.actionBtn}
            disabled={undoCount === 0}
            onClick={() => {
              if (undoStack.current.length > 0) {
                const snapshot = undoStack.current.pop()!
                getCtx().putImageData(snapshot, 0, 0)
                setUndoCount(undoStack.current.length)
              }
            }}
          >
            Undo
          </button>
        </div>

        {/* Brush size */}
        <div className={styles.toolGroup}>
          <span className={styles.toolLabel}>Size</span>
          {SIZES.map(size => (
            <button
              key={size}
              type="button"
              className={`${styles.sizeBtn} ${brushSize === size ? styles.active : ''}`}
              onClick={() => onBrushSizeChange(size)}
              aria-label={`Brush size ${size}px`}
            >
              <span
                className={styles.sizeDot}
                style={{ width: Math.min(size, 20), height: Math.min(size, 20) }}
              />
            </button>
          ))}
        </div>

        {/* Brush shape */}
        <div className={styles.toolGroup}>
          <span className={styles.toolLabel}>Shape</span>
          {(['round', 'square'] as const).map(shape => (
            <button
              key={shape}
              type="button"
              className={`${styles.shapeBtn} ${brushShape === shape ? styles.active : ''}`}
              onClick={() => onBrushShapeChange(shape)}
              aria-label={`${shape} brush`}
            >
              {shape === 'round' ? '●' : '■'}
            </button>
          ))}
        </div>

        {/* Colour palette */}
        <div className={styles.toolGroup}>
          <span className={styles.toolLabel}>Color</span>
          <div className={styles.palette}>
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                className={`${styles.colorBtn} ${color === c ? styles.activeColor : ''}`}
                style={{ background: c }}
                onClick={() => onColorChange(c)}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Upload */}
        <div className={styles.toolGroup}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleUploadClick}
          >
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={500}
          height={500}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={() => { handlePointerUp(); lastPos.current = null }}
        />
      </div>
    </div>
  )
})
