export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      neutral: 'neutral'
    },
    icons: {},
    button: {
      slots: { base: 'font-medium cursor-pointer' }
    },
    selectMenu: {
      slots: { base: 'font-medium cursor-pointer', item: ['!pr-1.5'] }
    },
    dropdownMenu: {
      slots: {
        content: 'font-medium cursor-pointer max-w-[calc(100vw-2rem)]',
        itemLabel: 'whitespace-normal'
      }
    },
    modal: {
      slots: { footer: 'flex items-center gap-1.5 p-4 sm:px-6 justify-end flex-wrap shrink-0' }
    },
    input: { slots: { root: 'w-full' } },
    textarea: { slots: { root: 'w-full' } },
    badge: { slots: { base: 'text-xs' } },
    navigationMenu: { slots: { link: 'cursor-pointer', childLink: 'cursor-pointer' } },
    tabs: { slots: { trigger: 'cursor-pointer' } }
  }
})
