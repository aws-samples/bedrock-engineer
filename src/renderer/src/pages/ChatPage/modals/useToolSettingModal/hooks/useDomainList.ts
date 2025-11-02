import { useState } from 'react'
import { validateDomain } from '../utils/domainValidation'

interface UseDomainListProps {
  initialDomains: string[]
  onUpdate: (domains: string[]) => void
}

interface UseDomainListReturn {
  domains: string[]
  newDomain: string
  error: boolean
  setNewDomain: (value: string) => void
  handleDomainChange: (value: string) => void
  addDomain: () => void
  removeDomain: (domain: string) => void
  clearAll: () => void
}

export const useDomainList = ({
  initialDomains,
  onUpdate
}: UseDomainListProps): UseDomainListReturn => {
  const [domains, setDomains] = useState<string[]>(initialDomains)
  const [newDomain, setNewDomain] = useState('')
  const [error, setError] = useState(false)

  const handleDomainChange = (value: string) => {
    setNewDomain(value)
    if (value && !validateDomain(value)) {
      setError(true)
    } else {
      setError(false)
    }
  }

  const addDomain = () => {
    const domain = newDomain.trim()
    if (domain && validateDomain(domain) && !domains.includes(domain)) {
      const updated = [...domains, domain]
      setDomains(updated)
      setNewDomain('')
      setError(false)
      onUpdate(updated)
    }
  }

  const removeDomain = (domain: string) => {
    const updated = domains.filter((d) => d !== domain)
    setDomains(updated)
    onUpdate(updated)
  }

  const clearAll = () => {
    setDomains([])
    onUpdate([])
  }

  return {
    domains,
    newDomain,
    error,
    setNewDomain,
    handleDomainChange,
    addDomain,
    removeDomain,
    clearAll
  }
}
