import { test, expect } from '@jest/globals'
import { validateProxyAuth, convertToElectronProxyConfig } from '../proxy-utils'
import { ProxyConfiguration } from '../../api/bedrock/types'

test('validateProxyAuth - should return valid for complete proxy auth config', () => {
  const config: ProxyConfiguration = {
    enabled: true,
    host: 'proxy.example.com',
    port: 8080,
    protocol: 'http',
    username: 'user',
    password: 'pass'
  }

  const result = validateProxyAuth(config)
  expect(result.isValid).toBe(true)
  expect(result.warnings).toHaveLength(0)
})

test('validateProxyAuth - should return warning for incomplete auth config (username only)', () => {
  const config: ProxyConfiguration = {
    enabled: true,
    host: 'proxy.example.com',
    port: 8080,
    protocol: 'http',
    username: 'user'
    // password missing
  }

  const result = validateProxyAuth(config)
  expect(result.isValid).toBe(false)
  expect(result.warnings).toHaveLength(1)
  expect(result.warnings[0]).toBe(
    'Username and password must both be provided for proxy authentication'
  )
})

test('validateProxyAuth - should return warning for incomplete auth config (password only)', () => {
  const config: ProxyConfiguration = {
    enabled: true,
    host: 'proxy.example.com',
    port: 8080,
    protocol: 'http',
    password: 'pass'
    // username missing
  }

  const result = validateProxyAuth(config)
  expect(result.isValid).toBe(false)
  expect(result.warnings).toHaveLength(1)
  expect(result.warnings[0]).toBe(
    'Username and password must both be provided for proxy authentication'
  )
})

test('validateProxyAuth - should return valid for proxy without auth', () => {
  const config: ProxyConfiguration = {
    enabled: true,
    host: 'proxy.example.com',
    port: 8080,
    protocol: 'http'
    // no auth credentials
  }

  const result = validateProxyAuth(config)
  expect(result.isValid).toBe(true)
  expect(result.warnings).toHaveLength(0)
})

test('validateProxyAuth - should return valid for disabled proxy', () => {
  const config: ProxyConfiguration = {
    enabled: false,
    username: 'user'
    // incomplete config but disabled
  }

  const result = validateProxyAuth(config)
  expect(result.isValid).toBe(true)
  expect(result.warnings).toHaveLength(0)
})

test('convertToElectronProxyConfig - should convert proxy config to Electron format', () => {
  const config: ProxyConfiguration = {
    enabled: true,
    host: 'proxy.example.com',
    port: 8080,
    protocol: 'http',
    username: 'user',
    password: 'pass'
  }

  const result = convertToElectronProxyConfig(config)
  expect(result).toBe('http=proxy.example.com:8080;https=proxy.example.com:8080')
})

test('convertToElectronProxyConfig - should use default port when not specified', () => {
  const config: ProxyConfiguration = {
    enabled: true,
    host: 'proxy.example.com',
    protocol: 'http'
  }

  const result = convertToElectronProxyConfig(config)
  expect(result).toBe('http=proxy.example.com:8080;https=proxy.example.com:8080')
})

test('convertToElectronProxyConfig - should return null for disabled proxy', () => {
  const config: ProxyConfiguration = {
    enabled: false,
    host: 'proxy.example.com',
    port: 8080
  }

  const result = convertToElectronProxyConfig(config)
  expect(result).toBeNull()
})

test('convertToElectronProxyConfig - should return null when host is missing', () => {
  const config: ProxyConfiguration = {
    enabled: true,
    port: 8080
  }

  const result = convertToElectronProxyConfig(config)
  expect(result).toBeNull()
})

test('convertToElectronProxyConfig - should not include authentication in proxy rules', () => {
  const config: ProxyConfiguration = {
    enabled: true,
    host: 'proxy.example.com',
    port: 8080,
    username: 'user',
    password: 'secret'
  }

  const result = convertToElectronProxyConfig(config)
  // Authentication should not appear in the proxy rules string
  expect(result).not.toContain('user')
  expect(result).not.toContain('secret')
  expect(result).toBe('http=proxy.example.com:8080;https=proxy.example.com:8080')
})
