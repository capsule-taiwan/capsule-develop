import { ref, watch, onBeforeUnmount, nextTick, type Ref } from 'vue'

/**
 * useAnchoredFloating - 把浮層 (下拉 / popover) 錨定在某元素下方的通用定位
 *
 * 這是專案內「下拉被 card / modal 吃掉」「popover 離 input 很遠」這兩個老問題的一勞永逸解。
 * 根因: 浮層用 `position: absolute` 會被 overflow 祖先 (BaseCard / modal 的捲動容器) 裁切;
 *       改 `position: fixed` 又會被 transform 祖先 (Nuxt UI modal 內容) 改變錨點而跑掉.
 * 解法 (與 CaseSearchSelect / BaseDatePicker 月份模式同一套, 已驗證可用):
 *   1. 浮層 Teleport 到 <body> → 逃出所有 overflow 裁切與 transform 祖先.
 *   2. 用 anchor 的 getBoundingClientRect() (viewport 座標) + position:fixed 定位 → 不受 transform 影響.
 *   3. 監聽 **capturing** scroll (`addEventListener('scroll', fn, true)`) → 連 modal 內部捲動容器的
 *      捲動都抓得到, 即時重算; 加上 resize.
 *
 * 用法:
 *   const anchorRef = ref<HTMLElement | null>(null)
 *   const open = ref(false)
 *   const { floatingStyle } = useAnchoredFloating(anchorRef, open)
 *   // template:
 *   //   <div ref="anchorRef">...trigger...</div>
 *   //   <Teleport to="body">
 *   //     <div v-if="open" :style="floatingStyle">...浮層內容...</div>
 *   //   </Teleport>
 */
export interface AnchoredFloatingOptions {
  /** anchor 與浮層的間距 px (預設 4) */
  gap?: number
  /** 浮層寬度是否對齊 anchor 寬度 (預設 true) */
  matchWidth?: boolean
  /** 最小寬度 px (預設 0); matchWidth 時取 max(anchorWidth, minWidth) */
  minWidth?: number
  /** z-index (預設 1000) */
  zIndex?: number
  /**
   * 下方空間不足時自動翻到 anchor 上方 (預設 false)。
   * 需同時提供 `floating` ref 才能量到浮層高度做判斷; 沒給就維持永遠往下開。
   * 用途: 靠近 viewport 底部的浮層 (例如表單下半部的 datepicker) 往下開會被畫面邊緣切掉。
   */
  flip?: boolean
  /** flip / 左右夾邊量測用的浮層元素 ref (Teleport 後的那顆 div) */
  floating?: Ref<HTMLElement | null>
}

/** 浮層貼齊 viewport 邊緣時保留的內距 px */
const VIEWPORT_MARGIN = 8

export function useAnchoredFloating(
  anchor: Ref<HTMLElement | null>,
  isOpen: Ref<boolean>,
  options: AnchoredFloatingOptions = {}
) {
  const { gap = 4, matchWidth = true, minWidth = 0, zIndex = 1000, flip = false, floating } = options
  const floatingStyle = ref<Record<string, string>>({})

  function update() {
    const el = anchor.value
    if (!el) return
    const r = el.getBoundingClientRect()
    const style: Record<string, string> = {
      position: 'fixed',
      zIndex: String(zIndex),
      // Reka/Nuxt UI modal 開啟時會把 document.body 設 pointer-events:none,
      // 浮層 Teleport 到 body 會繼承而「點不到也不能捲」; 這裡覆寫回 auto.
      pointerEvents: 'auto'
    }

    // 浮層尺寸 (flip / 夾邊用)。首次 nextTick 時元素已 render, 量得到內容高度。
    const floatRect = floating?.value?.getBoundingClientRect()
    const floatH = floatRect?.height ?? 0
    const floatW = floatRect?.width ?? (matchWidth ? r.width : minWidth)

    // ── 垂直: 預設往下; flip 開啟且下方塞不下、上方空間較多時翻到上方 ──
    const spaceBelow = window.innerHeight - r.bottom - gap
    const spaceAbove = r.top - gap
    const placeAbove = flip && floatH > 0 && spaceBelow < floatH && spaceAbove > spaceBelow
    style.top = placeAbove
      ? `${Math.max(VIEWPORT_MARGIN, r.top - gap - floatH)}px`
      : `${r.bottom + gap}px`

    // ── 水平: 靠右側開時夾回 viewport 內, 避免右緣被切 ──
    let left = r.left
    if (left + floatW > window.innerWidth - VIEWPORT_MARGIN) {
      left = Math.max(VIEWPORT_MARGIN, window.innerWidth - VIEWPORT_MARGIN - floatW)
    }
    style.left = `${left}px`

    if (matchWidth) style.width = `${Math.max(r.width, minWidth)}px`
    else if (minWidth) style.minWidth = `${minWidth}px`
    floatingStyle.value = style
  }

  function addListeners() {
    if (typeof window === 'undefined') return
    window.addEventListener('scroll', update, true)  // capture: 抓得到 modal 內部捲動容器
    window.addEventListener('resize', update)
  }
  function removeListeners() {
    if (typeof window === 'undefined') return
    window.removeEventListener('scroll', update, true)
    window.removeEventListener('resize', update)
  }

  watch(isOpen, (open) => {
    if (open) {
      nextTick(update)
      addListeners()
    } else {
      removeListeners()
    }
  })

  onBeforeUnmount(removeListeners)

  return { floatingStyle, update }
}
