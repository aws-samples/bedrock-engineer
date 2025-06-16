import 'react-cmdk/dist/cmdk.css'
import CommandPalette, { filterItems, getItemIndex } from 'react-cmdk'
import { useEffect, useState } from 'react'
import { routes } from './routes'
import { useNavigate } from 'react-router'

const CmdK = () => {
  const [page] = useState<'root' | 'projects'>('root')
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const navigate = useNavigate()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey && e.key === 'k') {
        e.preventDefault()
        e.stopPropagation()

        setIsOpen((currentValue) => {
          return !currentValue
        })
      }

      if (e.metaKey) {
        try {
          if (e.key === ',') {
            navigate('/setting')
          }

          const id = Number(e.key)
          if (id > 0 && id <= routes.length) {
            navigate(routes[id - 1].href)
          }
        } catch (e) {
          console.log(e)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const items = routes.map((route) => {
    return {
      id: route.href,
      children: route.name,
      href: route.href,
      icon: () => route.icon({ className: 'text-xl' }),
      onClick: () => navigate(route.href)
    }
  })

  const filteredItems = filterItems(
    [
      {
        heading: '',
        id: 'home',
        items
      }
    ],
    search
  )

  return (
    <CommandPalette
      onChangeSearch={setSearch}
      onChangeOpen={setIsOpen}
      search={search}
      isOpen={isOpen}
      page={page}
    >
      <CommandPalette.Page id="root">
        {filteredItems.length ? (
          filteredItems.map((list) => (
            <CommandPalette.List key={list.id} heading={list.heading}>
              {list.items.map(({ id, ...rest }) => (
                <CommandPalette.ListItem
                  key={id}
                  index={getItemIndex(filteredItems, id)}
                  {...rest}
                />
              ))}
            </CommandPalette.List>
          ))
        ) : (
          <CommandPalette.FreeSearchAction />
        )}
      </CommandPalette.Page>

      <CommandPalette.Page id="projects">he</CommandPalette.Page>
    </CommandPalette>
  )
}

export default CmdK
